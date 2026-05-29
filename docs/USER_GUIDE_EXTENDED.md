# Omnecor User Guide

## Table of Contents

1. [Introduction](#1-introduction)
2. [Feature Overview](#2-feature-overview)
3. [System Requirements](#3-system-requirements)
4. [Installation Guide](#4-installation-guide)
5. [First Launch Walkthrough](#5-first-launch-walkthrough)
6. [User Interface Guide](#6-user-interface-guide)
7. [Core Workflows](#7-core-workflows)
8. [Configuration Guide](#8-configuration-guide)
9. [AI Systems Documentation](#9-ai-systems-documentation)
10. [Networking & Multi-System Operation](#10-networking--multi-system-operation)
11. [Security & Permissions](#11-security--permissions)
12. [Backup, Recovery, and Migration](#12-backup-recovery-and-migration)
13. [Troubleshooting Guide](#13-troubleshooting-guide)
14. [Logs & Diagnostics](#14-logs--diagnostics)
15. [Advanced Usage](#15-advanced-usage)
16. [Performance Optimization](#16-performance-optimization)
17. [FAQ](#17-faq)
18. [Glossary](#18-glossary)
19. [Appendix](#19-appendix)

---

# 1. Introduction
[Content provided in previous turn]

# 2. Feature Overview
Omnecor is engineered as a modular, production-grade workstation. Key features include:
- **Unified Backend**: A centralized Express.js/tRPC engine ensuring real-time UI/data state synchronization via WebSockets.
- **Neural Workspaces**: Spatial graph-based project management using React Flow for semantic file/knowledge visualization.
- **Multi-Modal Workforce**: Integrated autonomous agent orchestration for software, media, and hardware tasks.
- **Hardware Integration Layer**: Secure, process-managed bridges for Blender (3D), KiCad (PCB), and ESPTool (Firmware).
- **Voice Pipeline**: A high-performance inference bridge to FastAPI-based STT (Whisper) and TTS/RVC microservices.

# 3. System Requirements
- **OS**: Debian 12, Ubuntu 20.04+ (LTS recommended)
- **CPU**: 4+ physical cores
- **RAM**: 8GB Minimum, 16GB+ recommended for local LLM inference
- **Disk**: 20GB free space on NVMe SSD
- **Network**: Stable connection for API provider calls

# 4. Installation Guide
Detailed instructions for production deployment:
1. **Clone**: `git clone [repository-url]`
2. **Environment**: Configure `.env` with required API keys and local host endpoints (Ollama/Llama.cpp).
3. **Setup**: Run `pnpm install` and `npm run db:push` to ensure schema synchronization.
4. **Start**: `npm run build` followed by `npm run start` for production deployment.

# 5. First Launch Walkthrough
1. **Dashboard Initialization**: System performs inventory of locally available AI models (Ollama/Llama.cpp).
2. **Knowledge Base**: Upon first project folder import, Omnecor initiates semantic indexing via the `VectorDBService`.
3. **System Readiness**: The `ProcessManagerService` validates bridge availability (Python environment check).

# 6. User Interface Guide
- **Navigation Sidebar**: Global navigation and session management.
- **Neural Workspaces**: Interactive graph interface; nodes represent project assets, edges represent relationships.
- **Chat Interface**: Stream-based, context-aware AI interactions.

# 7. Core Workflows
- **Knowledge Augmentation**: Importing documentation folders and performing semantic search via the knowledge base.
- **Hardware Bridge Execution**: Triggering firmware flash operations through the UI; progress is streamed asynchronously via `hardware:{jobId}` WebSocket channels.

# 8. Configuration Guide
- **`.env`**: Global configuration (port, API keys, Ollama endpoint).
- **UI Settings**: Granular control over context management, security thresholds, and performance tuning.

# 9. AI Systems Documentation
- **Inference Routing**: Intelligent dispatching to local/cloud models based on provider latency and task complexity.
- **Memory Layer**: Recursive directory chunking (1500 chars/200 overlap) stored in ChromaDB, used for RAG (Retrieval-Augmented Generation).

# 10. Networking & Multi-System Operation
- Omnecor utilizes WebSockets for real-time state synchronization, enabling responsiveness across asynchronous hardware tasks (e.g., render job status updates).

# 11. Security & Permissions
- **CSRF/Path Traversal**: Backend middleware enforces secure resource access.
- **Encryption**: AES-256-GCM for sensitive local project data.

# 12. Backup, Recovery, and Migration
- Back up the `~/.omnecor` directory and Drizzle-managed database files for comprehensive state recovery.

# 13. Troubleshooting Guide
- Refer to `TROUBLESHOOTING.md` for specific port/memory/GPU diagnostics.

# 14. Logs & Diagnostics
- Backend runtime logs are managed by `server/_core/logs`.
- Process-specific logs (e.g., Blender, ESPTool) are streamed as JSON for backend parsing.

# 15. Advanced Usage
- Headless Python CLI bridging allows direct integration with specialized local tools.
- tRPC extensibility enables custom router creation for third-party module integration.

# 16. Performance Optimization
- **LRU Caching**: For voice models and inference results.
- **Zram**: Mandatory for memory-constrained Linux systems to prevent OOM termination.

# 17. FAQ
- **Q: Is data storage local?** A: Yes, Omnecor is local-first. Cloud synchronization is entirely optional.

# 18. Glossary
- **HMCI**: Human-Machine Collaboration Interface.
- **Neural Workspace**: Spatial graph-based project view.
- **ProcessManagerService**: Orchestration layer for child Python processes.

# 19. Appendix
- Command references (`pnpm dev`, `db:push`).
- Environment variable manifest.
