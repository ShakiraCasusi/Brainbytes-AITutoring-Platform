# BrainBytes AI Tutoring Platform

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

## Project Architecture Diagram - Draft
```mermaid
graph TD
    %% ===========================
    %% FRONTEND CONTAINER
    %% ===========================
    A[Frontend Container: Next.js]
    A:::frontend
    A -->|HTTP Requests : Port 3000| B[Backend Container: Node.js API Server]

    %% ===========================
    %% BACKEND CONTAINER
    %% ===========================
    B:::backend
    B -->|RESTful API Calls : Port 4000| C[(Database: MongoDB)]
    B -->|Simple Response Logic| D[Academic Chat Logic]

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
    A -->|User Input Questions and Images| B
    B -->|Processed AI Responses| A
    C -->|Conversation History and User Data| B
    D -->|Generated Academic Answers| B

    %% ===========================
    %% STYLES
    %% ===========================
    classDef frontend fill:#003399,stroke:#fff,stroke-width:2px,color:#fff;
    classDef backend fill:#FFD700,stroke:#333,stroke-width:2px,color:#000;
    classDef monitoring fill:#333,stroke:#FFD700,stroke-width:2px,color:#fff;
```

### Project Architecture Diagram Draft - Components Explained

| **Component** | **Role / Function** | **Port** | **Data Flows** |
| --- | --- | --- | --- |
| **Frontend Container (Next.js)** | Provides the user interface (chat window, login/guest mode, conversation history). Optimized for mobile-first experience. | `3000` | - Sends HTTP requests to Backend<br>- Receives processed AI responses<br>- Logs frontend performance metrics to Monitoring |
| **Backend Container (Node.js API Server)** | Core application logic; handles chat requests, generates simple academic responses, and stores messages. | `4000` | - Receives user input from Frontend<br>- Sends API calls to Database<br>- Returns responses to Frontend |
| **Database (MongoDB)** | Stores conversation history in the containerized environment. | `27017` | - Receives API calls from Backend<br>- Provides conversation history back to Backend |
| **Academic Chat Logic** | Generates basic responses using keyword matching. | In backend | - Receives user messages from Backend<br>- Returns simple academic guidance |
| **Monitoring Stack (Prometheus + Grafana)** | Planned stack for system health and performance metrics. | Planned | - Receives metrics in future iterations |