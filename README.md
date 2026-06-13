# BrainBytes AI Tutoring Platform

[![BrainBytes CI/CD](https://github.com/ShakiraCasusi/Brainbytes-AITutoring-Platform/actions/workflows/main.yml/badge.svg)](https://github.com/ShakiraCasusi/Brainbytes-AITutoring-Platform/actions/workflows/main.yml)

## Project Overview

BrainBytes is an AI-powered tutoring platform designed to provide accessible academic assistance to Filipino students. This project implements the platform using modern DevOps practices and containerization.

## Development Team

- [Shakira Angela Casusi] - Team Lead - [lr.sacasusi@mmdc.mcl.edu.ph]
- [Jerico Gabriel Crisostomo] - Backend Developer - [lr.jgcrisostomo@mmdc.mcl.edu.ph]
- [Juliana Martina Relox] - Frontend Developer - [lr.jmrelox@mmdc.mcl.edu.ph]
- [Shirly Rose Montes] - DevOps Engineer - [lr.srmontes@mmdc.mcl.edu.ph]

## Project Goals

- Implement a containerized application with proper networking
- Create an automated CI/CD pipeline using GitHub Actions
- Deploy the application to Oracle Cloud Free Tier
- Set up monitoring and observability tools

## Technology Stack

- Frontend: Next.js
- Backend: Node.js
- Database: MongoDB
- Containerization: Docker
- PWA: next-pwa
- Desktop: Electron and Electron Builder
- CI/CD: GitHub Actions
- Cloud Provider: Oracle Cloud Free Tier
- Monitoring: Prometheus & Grafana

## Project Architecture Diagram - Updated

```mermaid
graph TD
    %% ===========================
    %% FRONTEND CONTAINER
    %% ===========================
    A[Frontend Container: Next.js]
    A:::frontend
    A -->|HTTP REST API / Auth : Port 3000| B[Backend Container: Node.js API Server]
    A <-->|WebSocket Real-time Events| B

    %% ===========================
    %% BACKEND CONTAINER
    %% ===========================
    B:::backend
    B -->|Mongoose Queries / Caching : Port 4000| C[(Database: MongoDB)]
    B -->|AI Processing & Metadata| D[Academic Chat Logic]
    B -->|Backup Script execution| F[Local Backups]

    %% ===========================
    %% SECURITY & MIDDLEWARE
    %% ===========================
    G[Rate Limiter & Helmet Security]
    G:::middleware
    A -->|Requests Intercepted by| G
    G --> B

    %% ===========================
    %% MONITORING & DEVOPS
    %% ===========================
    E[Monitoring Stack: Prometheus + Grafana]
    E:::monitoring
    B -->|Metrics Export| E
    A -->|Frontend Performance Logs| E

    %% ===========================
    %% DATA FLOWS
    %% ===========================
    A -->|User Messages, Authentication| B
    B -->|Paginated History, AI Responses, Realtime updates| A
    C -->|Indexed Conversation History, User Profiles, Materials| B
    D -->|Responses, Subject, Question Type, Sentiment, Suggestions| B

    %% ===========================
    %% STYLES
    %% ===========================
    classDef frontend fill:#003399,stroke:#fff,stroke-width:2px,color:#fff;
    classDef backend fill:#FFD700,stroke:#333,stroke-width:2px,color:#000;
    classDef monitoring fill:#333,stroke:#FFD700,stroke-width:2px,color:#fff;
    classDef middleware fill:#ff4d4d,stroke:#fff,stroke-width:2px,color:#fff;
```

### Project Architecture Diagram - Components Explained

| **Component**                       | **Role / Function**                                                       | **Port / Mechanism** | **Data Flows & Features**                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend Container (Next.js)**    | User interface for chat, profiles, and dashboards.                        | `3000`               | - Sends REST API & WebSocket requests to Backend<br>- Receives AI responses, paginated history, and realtime events<br>- PWA caching via Service Worker |
| **Security & Middleware**           | Protects the backend from excessive load and vulnerabilities.             | Internal             | - Uses `express-rate-limit` for DDoS protection<br>- Uses `helmet` for secure HTTP headers                                                              |
| **Backend Container (Node.js API)** | Core logic; handles auth, WebSockets, rate limiting, and chat processing. | `4000`               | - Handles JWT Authentication<br>- Generates JSON Backups (`scripts/backup.js`)<br>- Manages user settings & learning materials                          |
| **Database (MongoDB)**              | Stores all persistent structured data using Mongoose schemas.             | `27017`              | - Validates data upon entry<br>- Uses optimized indexes for fast lookups<br>- Stores Users, Profiles, Messages, and Materials                           |
| **Academic Chat Logic**             | Processes user input to generate relevant AI answers.                     | Internal             | - Analyzes user sentiment & categorizes subjects<br>- Provides actionable suggestions & math handling                                                   |
| **Monitoring Stack**                | Future-ready stack for tracking application health.                       | Planned              | - Will collect metrics for observability                                                                                                                |

---

# Cloud Environment Setup & Deployment Plan

The BrainBytes platform utilizes **Railway.app** as its cloud environment, providing automated container provisioning, built-in TLS certificates, and integrated MongoDB hosting.

> [!TIP]
> This is a summary of the deployment configuration. For the complete specifications, setup guides, project architectures, and testing metrics, see the **[deployment-plan.md (Full Version)](./docs/deployment-plan.md)**.

## 1. Cloud Infrastructure & Service Configuration (Task 1)
To ensure system durability and resilience, the Railway environment is configured with:
- **Service Optimization:** Standard multi-service project hosting separated root folders (`frontend/` and `backend/`) to run independent Next.js and Node.js containers.
- **MongoDB Provisioning:** An active container database instance on Railway, connected dynamically using integrated reference bindings (`MONGO_URL`).
- **Health Checks & Auto-Restarts:** Configured start validations checking `/api/health` with automatic restart properties.
- **Observability:** Centralized service logs and metrics dashboard for latency tracking.

## 2. Environment Architecture (Task 2)
The application operates in a multi-container isolated private network within Railway:
- **Frontend Service:** Exposes Next.js web requests over custom generated HTTPS domains.
- **Backend Service:** Exposes Node.js/Express APIs over custom generated HTTPS domains.
- **MongoDB Service:** Accessible internally to the backend service.

For complete network diagrams, topologies, and rollback details, refer to **[deployment-plan.md](./docs/deployment-plan.md)**.

## 3. GitHub Actions CI/CD Integration (Task 3)
Continuous integration builds Docker image layers on the runner, while the **[deploy.yml](./.github/workflows/deploy.yml)** workflow triggers deployment updates on Railway using the Railway CLI.

### Railway Deployment Secrets Config
Ensure the following Repository Secrets are defined under **Settings > Secrets and variables > Actions**:
- `RAILWAY_TOKEN`: Authentication token for accessing Railway projects.
- `RAILWAY_BACKEND_URL`: Public domain URL generated for the backend API (used for workflow health checks).
- `JWT_SECRET`: Signature generation key for JSON Web Tokens.
- `HUGGINGFACE_TOKEN`: API key for accessing the Hugging Face AI text processing models.

## 4. Philippine-Specific Considerations (Task 4)
- **Low-Latency Edge Networks:** Railway utilizes global edge network routers to minimize round-trip times (RTT) for PLDT, Globe, and Converge users in the Philippines.
- **Resilient Mobile App:** Next.js uses service workers for offline caching, enabling users with intermittent connectivity to access loaded worksheets and fallback mock interfaces.
- **Data Compliance:** Adheres to the **Philippine Data Privacy Act of 2012 (DPA)** by hashing user credentials using BCrypt and encrypting env variables at rest inside Railway.

---

# Workspace File Registry & Changelog
As part of the DevOps cloud integration and testing process, the following files were added, tested, or modified:

### 1. [deploy.yml](./.github/workflows/deploy.yml) [MODIFY]
- **What was added/modified:** Updated deployment workflow from SSH VM actions to trigger multi-service container builds on Railway.app using the Railway CLI.
- **Testing performed:** Confirmed YAML configurations and local compose fallback routines lint successfully.

### 2. [deployment-plan.md](./docs/deployment-plan.md) [NEW]
- **What was added/modified:** Created the full cloud deployment specifications document, containing project setups, service lists, Mermaid topologies, validation matrices, and screenshot placeholders.
- **Testing performed:** Verified Mermaid tags, file link schemes, and markdown formatting layouts.

### 3. [README.md](./README.md) [MODIFY]
- **What was added/modified:** Added Railway environment summaries, secrets config parameters, and refined the workspace registry list.
- **Testing performed:** Validated links redirect successfully.

### 4. [Dockerfile (Backend)](./backend/Dockerfile) [MODIFY]
- **What was added/modified:** Added missing `app.js` and `db.js` file copy commands to the production build stage to prevent deployment boot crashes.
- **Testing performed:** Confirmed it resolves the `MODULE_NOT_FOUND` server boot crash during deployment.

-----

# BrainBytes CI/CD Documentation

This section details the custom Continuous Integration and Continuous Deployment (CI/CD) pipelines configured for the BrainBytes AI tutoring platform.

## Codebase Workflows

### 1. Main Sequential Workflow (`main.yml`)

**Purpose**: Comprehensive sequential pipeline running code analysis, image compilation, and multi-version test matrices on pushes and pull requests to `main` and `development`.

**Jobs & Stages**:

1. **`lint` (Lint Code)**:
   - Restores npm dependencies from GitHub's cache.
   - Generates ESLint outputs inside `eslint-report.json` and posts inline visual annotations inside pull requests via `eslint-annotate-action@v2`.
   - Checks code styling conformity via Prettier.
   - Audits dependencies via `npm audit --json` and executes automated vulnerability scanning via **Snyk Node scan** using your `SNYK_TOKEN`.
2. **`build` (Build Docker Images)**:
   - _Depends on successful `lint` (`needs: lint`)_.
   - Sets up Buildx and restores Docker layer caches from `/tmp/.buildx-cache`.
   - Compiles both `brainbytes/frontend:latest` and `brainbytes/backend:latest` images.
   - Tests container lifecycles by starting (`docker-compose up -d`), verifying (`docker-compose ps`), and stopping (`docker-compose down`) the multi-container stack.
   - Archives compiled bundles (`frontend/build` and `backend/dist`) into a GHA shareable artifact named `build-outputs`.
3. **`test` (Run Tests)**:
   - _Depends on successful `build` (`needs: build`)_.
   - Executes tests in parallel across a matrix of **Node.js versions (`14.x`, `16.x`, `18.x`)** and `ubuntu-latest` OS.
   - Downloads the archived compiled `build-outputs` artifact.
   - Installs dependencies and runs unit tests (`npm test`) for frontend and backend.
   - Executes `npm run test:coverage` and uploads reports under `coverage-reports`.
   - Downloads Playwright browser engines and runs browser-based E2E tests in the `tests/` directory.
4. **`notify` (Pipeline Status Notifications)**:
   - _Runs regardless of overall success or failure (`if: always()`)_.
   - Dispatches visual color-coded reports to your Slack channel via `action-slack-notify@v2` using your `SLACK_WEBHOOK` secret.

### 2. Standalone CI Testing Workflow (`ci.yml`)

**Purpose**: Runs independent, matrix-based unit, integration, and coverage tests across Node.js versions `14.x`, `16.x`, and `18.x` on every push and pull request, archiving Jest/Node HTML coverage reports.

### 3. Standalone Docker Build Workflow (`build.yml`)

**Purpose**: Standalone image building pipeline which manages Buildx v3 caches and validates Docker Compose up/down lifecycles on code pushes.

### 4. Standalone Code Quality Linting (`lint.yml`)

**Purpose**: Dedicated, non-blocking pipeline checking coding styles and Snyk security parameters on pushes and PRs.

### 5. Independent Deployment Workflow (`deploy.yml`)

**Purpose**: Dedicated test environment release pipeline triggering on pushes to `main` or `development` branches to compile Docker containers, set release metadata (`DEPLOY_TIME`, `DEPLOY_SHA`), and verify health endpoints.

## Pipeline Optimization & Caching

Our workflows are optimized using caching structures:

- **Node package cache**: Caches `**/node_modules` indexed against `**/package-lock.json` to prevent downloading dependencies from scratch on every run.
- **Docker layer cache**: Caches build layers in `/tmp/.buildx-cache` indexed against the commit SHA.

---

## Required Manual Repository Settings

To activate these workflows and satisfy security guidelines, you **must manually configure** the following options in your GitHub repository settings:

### 1. Configure Branch Protection & Required Status Checks

Prevent direct commits to the production branch and ensure quality checks pass before code can be merged:

1. Go to your GitHub repository and click on **Settings** in the top navigation bar.
2. In the left-hand sidebar, click on **Branches**.
3. Under _Branch protection rules_, click on **Add rule**.
4. Set **Branch name pattern** to `main`.
5. Check the box **"Require a pull request before merging"** and check **"Require approvals"** (set to at least `1`).
6. Check the box **"Require status checks to pass before merging"**.
7. In the search box under _Status checks_, search for and select the specific job identifiers from `main.yml`:
   - **`Lint Code`** (checks eslint, snyk, prettier)
   - **`Run Tests`** (checks test suite matrices across node versions)
   - **`Build Docker Images`** (checks docker compose start/stop validations)
8. Click **Create** at the bottom to lock the protection rule.

### 2. Add Repository Secrets for Sensitive Variables

Workflow jobs require external tokens to publish reports, send Slack messages, and scan folders securely. Add these variables to your repository:

1. Go to your GitHub repository and click on **Settings**.
2. In the left-hand sidebar, click on **Secrets and variables** > **Actions**.
3. Click on the green **New repository secret** button.
4. Add the following secrets:
   - **`SNYK_TOKEN`**: Your Snyk platform API authorization token. Enable Snyk automated dependency vulnerability checking.
   - **`SLACK_WEBHOOK`**: The incoming webhook URL for your designated Slack channel. Triggers visual pipeline status alerts.
   - **`DOCKERHUB_USERNAME`** and **`DOCKERHUB_TOKEN`** _(Optional)_: Set these if you wish to push compiled images to a Docker registry in subsequent weeks.
5. Click **Add secret** to save.

### 3. Create GitHub Issue Templates

We have pre-configured GitHub issue templates inside your codebase under `.github/ISSUE_TEMPLATE/`:

- **Bug Report Template** (`bug_report.md`): Automatically prompts users to enter reproduction steps, environment details, and expected behavior.
- **Feature Request Template** (`feature_request.md`): Structured to outline proposed enhancements and use cases.
  These will automatically display under the "Issues" tab when creating new tickets on GitHub!

---

## Troubleshooting Common Issues

### 1. Workflow Failures

- **Symptom**: Jobs inside `main.yml` or `lint.yml` crash or show error statuses.
- **Troubleshooting**:
  - Open the **Actions** tab, click on the failed workflow run, and click on the failed job (e.g. _Lint Code_) to inspect logs.
  - If Snyk scanning fails due to authorization, ensure the `SNYK_TOKEN` has been correctly entered in Settings.
  - Verify that the local test suites run and pass successfully in your development console (`npm test`) before pushing new commits.

### 2. Slack Notification Failures

- **Symptom**: The pipeline completes successfully, but no status alert is sent to your channel.
- **Troubleshooting**:
  - Verify that your webhook URL has been added as the `SLACK_WEBHOOK` secret inside repository settings.
  - Check that the webhook integration has not been deleted or deactivated inside your Slack app dashboard.

### 3. Deployment Issues

- **Symptom**: The `deploy.yml` workflow run reports "Service not available yet" or crashes.
- **Troubleshooting**:
  - Verify that ports in `docker-compose.yml` (`8080:3000`, `4000:3000`) are open and do not clash with other running applications on the host runner.
  - Inspect running container health statuses using standard logging commands (`docker-compose logs`).
