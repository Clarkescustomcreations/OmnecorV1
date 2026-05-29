# Omnecor Architecture

## 1. Overview

Omnecor HMCI is the premier Human-Machine Collaboration Interface, acting as the central nervous system for digital and physical workflows. Omnecor provides a unified, service-oriented backend architecture designed for production-grade reliability and real-time performance.

## 2. Architectural Principles

- **Unified Backend:** A single Express/tRPC instance manages all API requests, providing consistent state and security.
- **Service-Oriented Modularity:** Business logic is encapsulated in singleton services (e.g., `VectorDBService`, `ProcessManagerService`).
- **Real-Time Orchestration:** WebSocket integration ensures real-time synchronization between the backend and the Neural Workspaces UI.
- **Hardware Abstraction:** Specialized bridges (Blender, KiCad, ESPTool) are managed via robust service classes that interface with Python-based CLI tools.
- **Compute Isolation:** GPU-intensive tasks (Voice, Training) are offloaded to dedicated services or microservices.

## 3. Core Architecture

### 3.1 Backend

- **Framework:** Express.js + tRPC (Type-safe API).
- **Persistence:** Drizzle ORM.
- **Real-time:** WebSocket endpoint for event streaming.

### 3.2 Neural Workspaces (Frontend)

- **Engine:** React 19 + React Flow.
- **Visualization:** Dynamic, interactive neural networks for project data visualization.

### 3.3 Hardware Integration Layer

- **Management:** `ProcessManagerService` handles child processes (Blender, KiCad, etc.) with real-time logging and progress tracking.

## 4. Directory Structure

```
/
├── client/          # React frontend (Neural Workspaces UI)
├── server/          # Unified Express/tRPC backend
├── drizzle/         # Database schema
├── shared/          # Shared types and constants
└── docs/            # Documentation
```
