# BrainBytes Cloud Deployment Plan & Architecture (Railway.app & MongoDB Atlas)

This document serves as the comprehensive, professional deployment plan and cloud environment setup package for hosting the **BrainBytes AI Tutoring Platform**.

---

## 1. Introduction & End-User Problem Context

The **BrainBytes AI Tutoring Platform** is an AI-powered study companion optimized for Filipino students. Development and infrastructure decisions address specific local constraints:
- **Low-Latency Edge Routing:** Low RTT (Round Trip Time) is vital for responsive chat operations. By utilizing MongoDB Atlas's AWS Singapore region (`ap-southeast-1`) and CDN edge routers, latency is minimized.
- **Dynamic Mobile Networks:** Philippine mobile carriers (PLDT, Globe, Smart, Converge) often exhibit erratic bandwidth behavior. Offline static assets are cached locally via Progressive Web App (PWA) configurations, while the backend API is streamlined to reduce JSON payload sizes.
- **Hardware Limitations:** Students using low-spec smartphones benefit from minimal client-side execution, delegating AI classification and database lookups to the cloud containers.
- **Compliance (Data Privacy Act of 2012):** Sensitive records (e.g., login credentials, user profiles) are protected using industry-standard hash algorithms (bcryptjs), transit encryption (TLS 1.3), and encrypted storage at rest.

---

## 2. Cloud Environment Setup: Account Creation & Service Provisioning

This section outlines the onboarding steps to configure the deployment environments.

### 2.1 Prerequisites
- **GitHub Account:** Linked to repository: `ShakiraCasusi/Brainbytes-AITutoring-Platform`.
- **Railway.app Account:** Verified with credit/debit card for billing/account limits.
- **MongoDB Atlas Account:** Free tier (M0 Shared) database cluster deployed in **AWS / Singapore (ap-southeast-1)**.

### 2.2 Project Setup
1. **Create Project:** On Railway, create a new project and select **Deploy from GitHub repo**.
2. **Configure Services:** Set up two services mapped to the same monorepo directory:
   - **Frontend Service (`brainbytes-frontend`):** Set **Root Directory** to `frontend/`.
   - **Backend Service (`brainbytes-backend`):** Set **Root Directory** to `backend/`.

---

## 3. Environment Architecture & Multi-Environment Setup

To support safe validation of releases before they hit production, we maintain a separate **Staging Cluster** alongside the **Production Cluster**.

### 3.1 Network Topology Diagram

```mermaid
graph TD
    %% Clients
    Student[Student Client] -->|HTTPS: Port 443| Edge[Railway Edge Router / Ingress]
    Developer[Developer Branch Commit] -->|Trigger Git Hook| GHA[GitHub Actions Runner]

    %% Staging Environment
    subgraph Staging Environment [Staging Environment]
        Edge -.->|Path: / - Host: staging.brainbytes.app| FE_Stg[Frontend Service: Next.js Port 3000]
        Edge -.->|Path: /api - Host: staging.brainbytes.app/api| BE_Stg[Backend Service: Node.js Port 4000]
        
        FE_Stg <-->|REST / WS| BE_Stg
        BE_Stg -->|Fixed Static Outbound Proxy| Proxy_Stg[Static IP Proxy Add-On]
    end

    %% Production Environment
    subgraph Production Environment [Production Environment]
        Edge -->|Path: / - Host: brainbytes.app| FE_Prod[Frontend Service: Next.js Port 3000]
        Edge -->|Path: /api - Host: brainbytes.app/api| BE_Prod[Backend Service: Node.js Port 4000]
        
        FE_Prod <-->|REST / WS| BE_Prod
        BE_Prod -->|Fixed Static Outbound Proxy| Proxy_Prod[Static IP Proxy Add-On]
    end

    %% Database & External Services
    Proxy_Stg -->|Whitelisted Static IP Only| DB_Stg[(MongoDB Atlas Staging DB)]
    Proxy_Prod -->|Whitelisted Static IP Only| DB_Prod[(MongoDB Atlas Prod DB)]
    BE_Prod -->|API Queries| HF[Hugging Face AI API]

    %% CI/CD Delivery
    GHA -->|Push Images & CLI deploy| FE_Stg
    GHA -->|Push Images & CLI deploy| BE_Stg
    GHA -->|Promote to Production| FE_Prod
    GHA -->|Promote to Production| BE_Prod

    classDef envStg fill:#1e293b,stroke:#475569,stroke-width:2px,color:#fff;
    classDef envProd fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff;
    class Staging Environment envStg;
    class Production Environment envProd;
```

---

## 4. Network Security & Database Inbound Restriction

Originally, MongoDB Atlas was configured with network access from anywhere (`0.0.0.0/0`) due to Railway's dynamic outbound IPs. To secure the database layer:

> [!IMPORTANT]
> - **Outbound Static IP Proxy:** We route backend outbound requests to MongoDB Atlas through a static IP egress proxy (such as *Fixie* or *QuotaGuard* add-ons configured on Railway).
> - **IP Whitelisting:** MongoDB Atlas's Network Access list is restricted *only* to these static outbound proxy IPs, ensuring that database traffic is only accepted from verified cloud backend containers.

---

## 5. Resource Specifications & Autoscaling Rules

### 5.1 Service Resource Specifications
| Service Name | Service Type | CPU | RAM Limit | Target Environment |
| :--- | :--- | :--- | :--- | :--- |
| `brainbytes-frontend-stg` | Web Service | Shared CPU | 512 MB | Staging |
| `brainbytes-backend-stg` | API Service | Shared CPU | 512 MB | Staging |
| `brainbytes-frontend` | Web Service | 1x Dedicated vCPU | 1 GB | Production |
| `brainbytes-backend` | API Service | 1x Dedicated vCPU | 1 GB | Production |

### 5.2 Autoscaling Rules for Traffic Spikes
Railway services are configured to autoscale dynamically during exam-period load spikes:
- **Autoscaling Metric:** CPU Utilization and Memory Usage.
- **Scale-Out Trigger:** Scale container replicas from 1 up to 5 when CPU utilization exceeds **70%** or Memory utilization exceeds **80%** for a sustained period of 120 seconds.
- **Scale-In Trigger:** De-provision container replicas down to 1 when CPU utilization falls below **30%** for more than 10 minutes (cooldown period).

---

## 6. Zero-Downtime Deployment & Environment Variables

### 6.1 Zero-Downtime rolling updates
Deployments are executed using rolling update strategies:
1. A new version of the service is built and spun up alongside the old version.
2. The router holds traffic until the container's health check returns `200 OK`.
3. Once the new container is verified healthy, traffic is routed to it, and the old container is gracefully terminated.

### 6.2 Environment Variable Practices
All environment variables are injected at runtime and never committed to source control:
- `MONGO_URI`: Encrypted database connection string.
- `JWT_SECRET`: Security salt for signing JWT tokens.
- `HUGGINGFACE_TOKEN`: API credentials for Hugging Face inference.
- `NODE_ENV`: Set to `production` or `test`.

> [!TIP]
> **Credential Rotation Procedure:** Rotate secrets every 90 days. Update credentials on the service provider (MongoDB Atlas, Hugging Face), update Railway environment variables, update GitHub repository secrets, and execute a rolling update deployment.

---

## 7. Master CI/CD Workflow Setup

The CI/CD pipeline is managed via GitHub Actions:
- **CI Pipeline (`main.yml`):** Runs checks on pull requests and pushes, ensuring linting passes, secrets are scanned, unit tests execute against mock database schemas (independent of external services), and Trivy checks container files.
- **CD Pipeline (`deploy.yml`):** Compiles multi-stage builds, tags images, pushes to GitHub Container Registry, and deploys to Railway Staging or Production based on branch target.

---

## 8. Health Validation, Observability & Live Metrics Dashboards

### 8.1 Post-Deployment Health Check Wait-Loop
Rather than static timeouts, the post-deployment script utilizes a curl loop:
```bash
for i in {1..12}; do
  if curl -sf "https://brainbytes-backend.up.railway.app/api/health" > /dev/null; then
    echo "✓ Health validation passed!"
    exit 0
  fi
  echo "Polling backend health endpoint... ($i/12)"
  sleep 10
done
exit 1
```

### 8.2 Rollback Verification
If the health check wait loop fails:
1. **Deployment Lock:** Railway detects the failure on container startup probes and aborts traffic routing to the new container.
2. **Alert Trigger:** An alert notification is published to the developer Slack channel.
3. **Manual Trigger:** Run `railway rollback` from the terminal to instantly revert the service to the previous release.

### 8.3 Live Health Metrics Dashboard (Grafana & Prometheus)
The backend exports system performance data via `prom-client` on `/metrics`. Below are the primary metrics queries for Prometheus dashboards:

- **1. HTTP Request Latency (99th Percentile):**
  ```promql
  histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
  ```
- **2. Container Memory Consumption Rate:**
  ```promql
  process_resident_memory_bytes{job="brainbytes-backend"} / 1024 / 1024
  ```
- **3. Concurrent API Active Connections:**
  ```promql
  sum(nodejs_active_handles{job="brainbytes-backend"})
  ```
- **4. Database Connection Status (Boolean):**
  ```promql
  mongodb_up
  ```

---

## 9. Test Case Validation Matrix

The matrix below shows the validation parameters for confirming cloud readiness:

| Test ID | Functional Area | Method | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Port Inbound Access | curl `https://brainbytes-frontend.up.railway.app` | Status `200 OK` | Passed |
| **TC-02** | Secure API Handshake | curl `https://brainbytes-backend.up.railway.app/api/health` | Response `databaseConnected: true` | Passed |
| **TC-03** | Auto-Recovery Probe | Simulate container process crash (SIGTERM) | Container restarts automatically | Passed |
| **TC-04** | Private Network Bind | Access database from console of backend | Direct internal connection, reject external requests | Passed |
