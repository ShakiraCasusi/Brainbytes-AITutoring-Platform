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
