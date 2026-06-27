# BrainBytes CI/CD System Architecture

## Overview
The **BrainBytes AI Tutoring Platform** is a containerized multi-service web application designed to support Filipino students. The architecture leverages high-availability containers, automated deployment pipelines, and persistent database clustering. It is built as a Node.js Express backend and a Next.js frontend, integrated with a MongoDB Atlas database, and monitored using a Prometheus monitoring stack (Prometheus, node-exporter, cAdvisor).

---

## Architecture Diagram

The diagram below details the integration between developer actions, CI/CD pipeline automation, and multi-environment cloud resource deployments:

```mermaid
graph TD
    %% Source Control
    Developer["Developer Git Push"] -->|Commit / Pull Request| Repo["GitHub Repo: Brainbytes-AITutoring-Platform"]
    
    %% CI/CD Gate
    subgraph GHA_Pipeline ["GitHub Actions CI/CD Pipeline"]
        Repo -->|Trigger Check| Main_Workflow["main.yml: CI Pipeline"]
        Main_Workflow -->|Lint & Security Scan| Lint_Job["ESLint & Prettier & TruffleHog"]
        Main_Workflow -->|Unit Testing| Unit_Job["Isolated Jest Tests (Mock DB)"]
        Main_Workflow -->|Integration Testing| Int_Job["Live MongoDB Service Container"]
        Main_Workflow -->|Container Vulnerability Check| Trivy_Job["Docker Buildx & Trivy Image Scan"]
        
        Trivy_Job -->|Success Gate| Deploy_Workflow["deploy.yml: CD Pipeline"]
    end

    %% Deployment Targets
    Deploy_Workflow -->|Push Staging Images| GHCR["GitHub Container Registry (ghcr.io)"]
    Deploy_Workflow -->|Push Production Images| GHCR
    
    GHCR -->|Trigger Deploy staging branch| Railway_Stg["Railway.app: Staging Environment"]
    GHCR -->|Trigger Deploy main branch| Railway_Prod["Railway.app: Production Environment"]

    %% Infrastructure Components
    subgraph Cloud_Deployment ["Railway.app Cloud Stack"]
        Railway_Prod -->|Ingress Routes /| FE["Frontend: Next.js PWA Container"]
        Railway_Prod -->|Ingress Routes /api| BE["Backend: Node.js Express Container"]
        
        BE -->|Exposes metrics on Port 9080| BE_Metrics["/metrics Endpoint"]
        
        Prometheus["Prometheus Container (v2.43.0)"] -->|Scrapes metrics: Port 9080| BE_Metrics
        Prometheus -->|Scrapes CPU/Memory: Port 9100| Node_Exporter["node-exporter Container (v1.5.0)"]
        Prometheus -->|Scrapes Container stats: Port 8080| cAdvisor["cAdvisor Container (v0.45.0)"]
    end
    
    BE -->|Outbound Static IP Proxy| Proxy["Fixie / QuotaGuard Outbound Proxy"]
    Proxy -->|TLS encrypted port 27017| DB[(MongoDB Atlas Cloud DB)]

    %% Class definition styles
    classDef workflow fill:#1e293b,stroke:#475569,stroke-width:2px,color:#fff;
    classDef container fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef database fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff;
    
    class Main_Workflow,Deploy_Workflow workflow;
    class FE,BE,Prometheus,Node_Exporter,cAdvisor container;
    class DB database;
```

---

## Components

### 1. Source Control
- **Repository:** `https://github.com/ShakiraCasusi/Brainbytes-AITutoring-Platform`
- **Branch Structure:**
  - `main`: Reflects the production-ready state of the application. Commits merged here are deployed directly to the Production environment.
  - `development`: Tracks feature development and staging integrations. Commits pushed here are automatically deployed to the Staging environment for verification.
- **Protection Rules:**
  - Mandatory Pull Request code reviews before merging into protected branches.
  - Require status checks to pass before merging, specifically ESLint linting, TruffleHog secret scanning, and Jest unit and integration tests.
  - Deletions and force-pushes are strictly blocked on both branches.

### 2. CI/CD Pipeline
- **Platform:** GitHub Actions
- **Workflow Files:**
  - `main.yml`: Executes Lint checks, Secret scanning (TruffleHog), Unit tests in isolation using Jest mocks, Integration tests (utilizing a local MongoDB container service), and local Docker Buildx builds analyzed by Trivy container scanners.
  - `deploy.yml`: Logs in to GHCR, compiles and pushes tagged Docker images (`sha-<commit-sha>`, branch name, and `latest` for prod), executes Railway CLI deployments, pings endpoint health wait-loops, and handles alerts and rollback recommendations on failure.
- **Pipeline Stages:**
  1. **Linting & Code Quality:** Syntax checks using ESLint and Prettier.
  2. **Secret Auditing:** Historical scanning for hardcoded tokens using TruffleHog.
  3. **Unit Tests:** Mock-based test executions for frontend and backend in isolation.
  4. **Integration Tests:** Local service-container verification against a real database instance, using health check polling retry loops.
  5. **Vulnerability Checks:** Trivy scanning on compiled microservice images.
  6. **Build & Release:** Production-ready compilation and push to GHCR.
  7. **Cloud Deployment:** Orchestration of dynamic container deploys on Railway.app.

### 3. Cloud Infrastructure
- **Cloud Provider:** Railway.app & MongoDB Atlas (Cloud Database Provider)
- **Resources:**
  - `brainbytes-frontend`: Next.js web application server.
  - `brainbytes-backend`: Express Node.js API server.
  - `prometheus`: Scrapes and stores time-series system metrics.
  - `node-exporter`: Exposes system-level OS parameters.
  - `cadvisor`: Exposes container resource consumption.
  - `mongo`: Persistent storage layers.
- **Networking:**
  - Private routing inside the Railway internal network for frontend-to-backend communication.
  - Inbound database access on MongoDB Atlas is restricted to outbound static IP egress proxies (Fixie/QuotaGuard) provisioned for the backend web services.

---

## Component Interactions
1. **User Request Routing:** The student client issues requests that hit the Railway Edge Router over HTTPS (Port 443). The Edge Router splits traffic: routing frontend pages to `brainbytes-frontend` and API calls (`/api/*`) to `brainbytes-backend`.
2. **Database Queries:** The backend service routes traffic through the static proxy IP, which maps to MongoDB Atlas port 27017 using a secure TLS connection string.
3. **AI Generation:** The backend interacts with the Hugging Face AI API to generate tutoring hints and subject classifications.
4. **Metrics Collection:** The backend runs a dedicated metrics listener on port `9080` (separate from the API listener). Prometheus queries `backend:9080/metrics`, `node-exporter:9100/metrics`, and `cadvisor:8080/metrics` every 15 seconds, storing CPU, RAM, and application-specific metrics.

---

## Security Considerations
- **Environment Secrets Encryption:** API keys, database strings, and salts are stored securely within Railway's Secret Manager and injected at runtime.
- **Pipeline Scanning:** All code updates undergo automatic scanning (Prettier/ESLint, Snyk vulnerability analysis, TruffleHog credential audits, and Trivy base image scans).
- **Network Lockdown:** Public internet database connections are blocked. Whitelists are restricted strictly to proxy egress static IPs.
- **Header Hardening:** Express backend endpoints use Helmet middleware to configure secure HTTP headers (CORS, CSP, XSS protection).
