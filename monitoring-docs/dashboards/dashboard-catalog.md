# BrainBytes Monitoring Dashboard Catalog

This catalog details the three provisioned Grafana dashboards in the **BrainBytes AI Tutoring Platform**. Use this guide to understand each dashboard's purpose, target audience, key visualizations, and as a guide to capturing visual screenshots for validation.

---

## 📸 Step-by-Step Screenshot Capture Guide

To view the dashboards locally and capture the screenshots required for submission, follow these steps:

1. **Boot up the Stack:**
   Ensure all Docker containers are running (especially `grafana` and `prometheus`):
   ```bash
   docker compose up -d
   ```
2. **Access the Grafana UI:**
   Open your browser and navigate to:
   * **URL:** `http://localhost:3001`
   * **Login Credentials (Default):**
     * **Username:** `admin`
     * **Password:** `admin` (you can skip the prompt to change the password)
3. **Open the Dashboards Folder:**
   * In the left-hand navigation sidebar, click on **Dashboards** (or search using the magnifying glass icon).
   * Open the **BrainBytes** folder.
   * You will see the three provisioned dashboards:
     * **BrainBytes Main Dashboard**
     * **BrainBytes Error Analysis Dashboard**
     * **BrainBytes Resource Optimization Dashboard**
4. **Generate Demo Traffic (Crucial for visual charts):**
   * Before taking a screenshot, run the load simulator in another terminal window so the graphs are populated with active curves instead of flat lines. You can run the simulator from the backend folder:
     ```bash
     cd backend
     node simulate-scenarios.js normal-load
     ```
   * Or run it directly from its location inside the documentation package from your project root:
     ```bash
     node monitoring-docs/demo/simulate-scenarios.js normal-load
     ```
   * To populate the Error Analysis curves, run:
     ```bash
     node monitoring-docs/demo/simulate-scenarios.js error-spikes
     ```
   * Let the generator run for 2-3 minutes to allow metrics to propagate.
5. **Capture & Save Screenshots:**
   * Open each dashboard in turn.
   * Press `F11` (Chrome/Firefox) to enter full screen for a clean, browser-frame-free visual look.
   * Capture a high-resolution screenshot of each dashboard (e.g., using Windows Snipping Tool `Win + Shift + S` or print screen).
   * Save the image files inside your local repository folder at:
     `monitoring-docs/dashboards/dashboard-screenshots/`
   * **Recommended Filenames:**
     * `brainbytes-main.png`
     * `error-analysis.png`
     * `resource-optimization.png`

---

## 📊 Dashboard 1: BrainBytes Main Dashboard

* **Purpose:** High-level platform health indicator providing real-time visibility into overall system availability, student throughput, and response times.
* **Target Audience:** Development Leads, Product Managers, and Operations Engineers.
* **Use Cases:** Monitoring current student engagement levels, checking if the backend application is responding within acceptable limits, and identifying high-level traffic trends.
* **Key Visualizations:**
  * **Service Status Timeline:** (State Timeline) Shows historical up/down state changes for each monitored job container (`brainbytes-backend`, `node-exporter`, `cadvisor`, etc.).
  * **API Success Rate:** (Stat Panel with thresholds) Displays the percentage of HTTP `2xx` responses. Color-coded steps: Green (>95%), Yellow (90-95%), Red (<90%).
  * **Active Tutoring Sessions:** (Stat Panel) Gauges the number of concurrent students currently logged in and chatting.
  * **Throughput per Route:** (Timeseries) Shows request rates grouped by endpoint (e.g. `/api/question`, `/api/session/start`).
  * **HTTP Latency:** (Timeseries) Tracks the 95th percentile response latency for API routes.

#### Screenshot Placement:
![BrainBytes Main Dashboard](./dashboard-screenshots/brainbytes-main.png)

---

## 🔍 Dashboard 2: Error Analysis Dashboard

* **Purpose:** In-depth debugging dashboard to trace API route errors, AI query failures, input validations, and correlate application errors with host resource exhaustion.
* **Target Audience:** Backend Developers, QA Engineers, and Site Reliability Engineers (SREs).
* **Use Cases:** Troubleshooting failed student submissions, tracking if HuggingFace API key rate-limits are causing AI hint errors, and diagnosing validation errors.
* **Key Visualizations:**
  * **Error Distribution by Endpoint & Code:** (Bar Gauge) Visualizes HTTP `4xx` and `5xx` error frequencies per endpoint.
  * **AI Error Code Distribution:** (Bar Gauge) Tracks AI-specific failures (`timeout`, `service_error`) across tutoring subjects.
  * **Error Pattern by Time of Day:** (Heatmap) Highlights hot time-of-day blocks where system errors spike.
  * **Recent Errors Log Summary:** (Table) Displays total validation errors (`brainbytes_validation_errors_total`) and system errors by severity and category over the hour.
  * **CPU vs. HTTP 5xx Correlation:** (Timeseries) Overlays host CPU usage against HTTP 500 server error rates to identify memory leak or CPU throttling bottlenecks.

#### Screenshot Placement:
![Error Analysis Dashboard](./dashboard-screenshots/error-analysis.png)

---

## 📈 Dashboard 3: Resource Optimization Dashboard

* **Purpose:** Tracking infrastructure cost metrics, container utilization boundaries, and bandwidth consumption parameters mapped against economic constraints.
* **Target Audience:** DevOps Engineers, Infrastructure Managers, and Billing Specialists.
* **Use Cases:** Tracking if Node.js containers are approaching their OOM limits, monitoring database memory consumption, and auditing student bandwidth overhead (to prevent draining prepaid data plans).
* **Key Visualizations:**
  * **Container Memory Comparison:** (Bar Gauge) Ranks all active containers by RAM usage in bytes.
  * **Container CPU Comparison:** (Bar Gauge) Ranks containers by CPU usage percentage.
  * **Resource Usage vs. Request Volume:** (Timeseries) Correlates total container CPU percentage against incoming API request volumes to measure container sizing efficiency.
  * **Cloud Limits & Free Tier Caps:** (Radial Gauges) Directly alerts engineers if memory usage approaches the production `512MB` limit, or if total outbound bandwidth exceeds the `50MB/hour` limit (Philippine context budget optimization).

#### Screenshot Placement:
![Resource Optimization Dashboard](./dashboard-screenshots/resource-optimization.png)
