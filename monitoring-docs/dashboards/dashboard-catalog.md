# BrainBytes Grafana Dashboard Catalog

This catalog documents the layout, target audiences, key metrics, and screenshot guidelines for the three Grafana dashboards provisioned on the **BrainBytes AI Tutoring Platform**.

---

## 1. BrainBytes Main Dashboard
* **Purpose:** High-level operational health overview of the application container stack.
* **Target Audience:** DevOps Engineers, Support Teams, Project Stakeholders.
* **Key Panels:**
  * **Service Status Timeline:** State timeline visualization displaying container connectivity status (Up/Down) based on the `up` metric.
  * **API Success Rate:** Stat panel with multiple color thresholds (Green > 95%, Yellow > 85%, Red < 85%) measuring HTTP success ratios.
  * **Active Student Sessions:** Real-time gauge showing concurrent active chat threads.
  * **HTTP Throughput Rate:** High-resolution time-series graph breaking down request volume by method and endpoint.
  * **p95 Latency Profiles:** Quantile time-series displaying response times for the backend APIs and Hugging Face pipelines.

---

## 2. BrainBytes Error Analysis Dashboard
* **Purpose:** Focused diagnostics for identifying application bugs, endpoint crashes, and security failures.
* **Target Audience:** Backend Developers, QA Engineers, Security Analysts.
* **Key Panels:**
  * **Error Distribution Bar Gauge:** LCD-style horizontal comparison tracking HTTP 4xx and 5xx errors by route and status code.
  * **AI Error Code Distribution:** Tracks API request errors (timeouts, authentication issues) from Hugging Face model requests.
  * **Error Heatmap:** Visualizes HTTP error latency patterns by time of day to identify transient performance disruptions.
  * **Error Log Table:** Summarizes error types, source files, and severity levels in a detailed grid for fast debugging.
  * **Correlation Graph:** Overlays host system CPU usage against HTTP 5xx error spikes to confirm resource-driven bottlenecks.

---

## 3. BrainBytes Resource Optimization Dashboard
* **Purpose:** Cost-efficiency tracking and optimization for resources under strict limits.
* **Target Audience:** Infrastructure Engineers, DevOps Managers.
* **Key Panels:**
  * **Container Memory Comparison:** Horizontal bar gauge charting memory allocations (cAdvisor) against the 512MB RAM cap.
  * **Container CPU Comparison:** Visualizes percentage cores used by each Docker container in real-time.
  * **Resource Correlation:** Overlays container CPU usage with API throughput rate to verify scale requirements.
  * **Cloud & Free Tier Cap Gauges:** Radial gauges tracking memory usage against the 512MB free tier cap and bandwidth size against the 50MB/hour cap (Philippine cell context).

---

## 📸 Step-by-Step UI Capture Guide

Follow these steps to populate the dashboards with active data and capture the screenshots for submission:

1. **Boot the Stack:**
   ```bash
   docker compose up -d
   ```
2. **Access Grafana:**
   * Open `http://localhost:3001` in your browser.
   * Log in with credentials: User: `admin` / Password: `admin`.
   * Navigate to **Dashboards** -> **BrainBytes** folder.
3. **Generate Active Traffic:**
   * Spawns traffic for the Main and Resource dashboards:
     ```bash
     node monitoring-docs/demo/simulate-scenarios.js normal-load
     ```
   * Spawns traffic for the Error Analysis heatmap and log tables:
     ```bash
     node monitoring-docs/demo/simulate-scenarios.js error-spikes
     ```
   * Let the simulation run for 2-3 minutes to allow metrics to build graphs.
4. **Capture Screenshots:**
   * Enter full screen (press `F11` in Chrome/Firefox) to hide browser borders.
   * Take clean captures of each dashboard and save them into the local folder:
     `monitoring-docs/dashboards/dashboard-screenshots/`
   * **Target Filenames:**
     * `brainbytes-main.png`
     * `error-analysis.png`
     * `resource-optimization.png`
