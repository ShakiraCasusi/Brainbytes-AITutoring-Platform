# BrainBytes AI Tutoring Platform - Technical Documentation

## TABLE OF CONTENTS

1. [Container Setup Guide](#1-container-setup-guide)
   1.1. [Prerequisites](#11-prerequisites)
   1.2. [Getting Started](#12-getting-started)
   1.3. [Container Structure](#13-container-structure)
   1.4. [Development Workflow](#14-development-workflow)
   1.5. [Stopping the Application](#15-stopping-the-application)
2. [Application Architecture](#2-application-architecture)
   2.1. [Architecture Overview](#21-architecture-overview)
   2.2. [Communication Flow](#22-communication-flow)
   2.3. [Network Configuration](#23-network-configuration)
3. [Environment Requirements](#3-environment-requirements)
   3.1. [Hardware Requirements](#31-hardware-requirements)
   3.2. [Software Requirements](#32-software-requirements)
   3.3. [Network Requirements](#33-network-requirements)
   3.4. [Development Tools](#34-development-tools)
4. [Development Modes](#4-development-modes)
   4.1. [Container-Based Development](#41-container-based-development)
   4.2. [Hybrid Development](#42-hybrid-development)
   4.3. [Code Structure](#43-code-structure)
   4.4. [Development Process](#44-development-process)
   4.5. [Testing](#45-testing)
5. [Feature Documentation](#5-feature-documentation)
   5.1. [Core Features](#51-core-features)
   5.2. [User Experience Features](#52-user-experience-features)
   5.3. [Future Feature Roadmap](#53-future-feature-roadmap)
6. [Troubleshooting Guide](#6-troubleshooting-guide)
   6.1. [Container Issues](#61-container-issues)
   6.2. [Application Issues](#62-application-issues)
   6.3. [Database Issues](#63-database-issues)

---

## 1. Container Setup Guide

### 1.1. Prerequisites

Before setting up the project, ensure you have the following installed:

- Docker Desktop or Docker Engine (latest version)
- Docker Compose
- Git (for cloning the repository)

### 1.2. Getting Started

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd brainbytes-multi-containers
   ```
2. **Environment Configuration**:
   Create a `.env` file in the root directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. **Build and Run**:
   Use Docker Compose to build and start the containers:
   ```bash
   docker-compose up --build
   ```

### 1.3. Container Structure

The application runs in three interconnected containers defined in `docker-compose.yml`:

- **Frontend (`frontend`)**: Next.js React application running on port `8080`.
- **Backend (`backend`)**: Node.js/Express API server running on port `4000`.
- **Database (`mongo`)**: MongoDB 4.4 instance running on port `27017` with a persistent volume (`mongo-data`).

### 1.4. Development Workflow

Changes made in the `./frontend` and `./backend` directories will automatically reflect in the containers if hot-reloading is supported, thanks to volume mappings in `docker-compose.yml` (`./frontend:/app` and `./backend:/app`).

- Check the terminal logs for compilation errors.
- Both frontend and backend containers are limited to 512MB RAM and 0.75 CPUs to ensure lightweight development.

### 1.5. Stopping the Application

To gracefully stop the running containers:

```bash
docker-compose down
```

To stop the containers and remove persistent volumes (warning: deletes database data):

```bash
docker-compose down -v
```

---

## 2. Application Architecture

### 2.1. Architecture Overview

BrainBytes uses a classic MERN/Next.js stack architecture:

- **Frontend**: A Next.js application that provides a responsive user interface and PWA capabilities.
- **Backend**: A Node.js API that handles authentication, rate limiting, and business logic including interactions with external AI APIs.
- **Database**: MongoDB for persistent data storage, managed via Mongoose schemas.

### 2.2. Communication Flow

- The **Frontend** communicates with the **Backend** via HTTP REST API endpoints and WebSockets for real-time interactions.
- The **Backend** receives these requests, processes AI/chat logic, and executes queries against the **Database** via the native MongoDB driver/Mongoose.
- The **Backend** exposes metrics and logs which will be consumed by a planned Prometheus & Grafana stack.

### 2.3. Network Configuration

- **Host mapping**:
  - Frontend: Accessible via `http://localhost:8080`
  - Backend: Accessible via `http://localhost:4000`
  - Database: Accessible via `mongodb://localhost:27017`
- **Internal Docker Network**: Containers can talk to each other using their service names (e.g., `http://backend:4000`, `mongodb://mongo:27017`).

---

## 3. Environment Requirements

### 3.1. Hardware Requirements

- **CPU**: Minimum 2 cores (Dual-Core).
- **RAM**: Minimum 4GB (8GB recommended for comfortable local development).
- **Storage**: At least 5GB free space for Docker images, Node modules, and database storage.

### 3.2. Software Requirements

- OS: Windows 10/11, macOS, or modern Linux distribution.
- Docker Engine >= 20.10.x
- Docker Compose >= 2.x.x

### 3.3. Network Requirements

- Stable internet connection required to download Docker base images, npm packages, and to communicate with the HuggingFace AI API.
- Local ports `8080`, `4000`, and `27017` must be available and not blocked by local firewalls.

### 3.4. Development Tools

For code modifications:

- IDE: Visual Studio Code (recommended)
- Optional: Postman/Insomnia for API testing
- Optional: MongoDB Compass for visual database inspection

---

## 4. Development Modes

### 4.1. Container-Based Development

All services (Frontend, Backend, DB) run inside Docker containers.

- **Pros**: Environment consistency, requires no local Node.js or MongoDB installations.
- **Cons**: Slightly higher resource overhead, slower initial build times.

### 4.2. Hybrid Development

Running the database in Docker, while running the Node.js backend and Next.js frontend locally using `npm run dev`.

- **Pros**: Faster hot-reloading, easier debugging using native IDE tools.
- **Cons**: Requires local installation of Node.js and consistent environment variable configurations.

### 4.3. Code Structure

- `/frontend/`: Contains Next.js pages, React components, and static assets.
- `/backend/`: Contains Express controllers, routers, Mongoose models, and AI integration services.
- `docker-compose.yml`: Root orchestrator for the container suite.

### 4.4. Development Process

1. Pick a feature from the `TO-DO.md` or `WEEKLY-TASKS.md`.
2. Write the code in the respective frontend or backend directory.
3. Test locally using either hybrid or containerized mode.
4. Push to source control (GitHub Actions CI/CD will validate the build).

### 4.5. Testing

The frontend includes Jest for unit testing. To run tests:

```bash
cd frontend
npm run test
```

_(Backend tests should follow a similar structure in the `/backend/tests/` directory.)_

---

## 5. Feature Documentation

### 5.1. Core Features

- **AI Chat Tutoring**: Real-time academic assistance categorized by subjects using AI analysis logic.
- **User Authentication**: Secure user login and session management via JWT.
- **Session History**: Paginated chat history securely stored in MongoDB.
- **Learning Materials**: Access to topic-specific educational text.

### 5.2. User Experience Features

- **Progressive Web App (PWA)**: Desktop/mobile installability via `next-pwa`.
- **Desktop Application**: Support for building native Windows applications via Electron.
- **Personalized Settings**: User-configurable themes, notifications, reading levels, and daily study goals.

### 5.3. Future Feature Roadmap

- Complete Prometheus and Grafana monitoring stack deployment.
- Enhanced analytics dashboards for student progress tracking.
- Advanced sentiment analysis reporting for instructors/parents.

---

## 6. Troubleshooting Guide

### 6.1. Container Issues

- **Containers fail to start**: Ensure Docker Desktop is running. Check for syntax errors in `docker-compose.yml` or `.env`.
- **Port already in use**: If `8080` or `4000` is bound by another service, change the mapping in `docker-compose.yml` (e.g., `"8081:3000"`).
- **Out of Memory Error (OOM)**: The memory limits are set to 512MB per container. If the build crashes, temporarily increase `mem_limit` in `docker-compose.yml`.

### 6.2. Application Issues

- **Frontend cannot reach Backend**: Check if `NEXT_PUBLIC_API_URL` is correctly configured in `.env` or in the frontend container environment. Ensure the backend is running and healthy.
- **AI responses are failing**: Verify that your `HUGGINGFACE_TOKEN` is correctly set in the environment variables and is not expired.

### 6.3. Database Issues

- **Backend cannot connect to MongoDB**: Verify the `MONGO_URI` is pointing to `mongodb://mongo:27017/brainbytes` (when running via Docker) or `mongodb://localhost:27017` (when running Hybrid).
- **Data missing after restart**: Check that the `mongo-data` volume is properly mapped in `docker-compose.yml`. Use `docker volume ls` to ensure the persistent volume exists.
