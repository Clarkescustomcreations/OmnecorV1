# Omnecor Feature Plan

## Canonical Architecture
CORTEX is a multi-agent AI workstation designed for autonomous task execution, local inference, and hardware integration. Omnecor now utilizes a **Unified Backend Architecture** (v2.2.0) with a single Express/tRPC instance and robust WebSocket event streaming.

## Completed Phases
- **Phase A:** Router Consolidation & Service Standardisation
- **Phase B:** Voice System Pipeline Integration
- **Phase C:** AI Provider Hub Completion (Streaming/Multi-Provider)
- **Phase D:** Memory System Integration (Persistent Chat/Episodic Pruning)
- **Phase E:** Neural Graph & Process Manager UI Wiring
- **Phase F:** Media Runtime Completion (RVC Inference / Dataset Validation)
- **Phase G:** Repository Cleanup & Legacy Removal

## Current Status
All core backend and frontend infrastructure is unified and integrated. The system is currently in a state of high architectural stability, ready for higher-level feature development, polish, and final packaging.

## Core Features
1. **Unified Backend:** tRPC + Express + WebSocket hub.
2. **Deterministic Graph Engine:** Neural Graph Node-Tree visualization.
3. **Multi-Agent Orchestration:** Persistent chat sessions with long-term memory.
4. **Local Inference:** Real-time Ollama/OpenAI/Gemini streaming.
5. **Hardware Integration:** Blender, KiCad, ESPTool bridges (Process-managed).
6. **Voice System:** RVC voice cloning and transcription (Whisper/TTS/RVC).

## Post-Phase G Roadmap

### Phase 8: UX Polish & Aviation Oversight
*   **Fiction Mode:** Implement dedicated "Fiction/Story Mode" with distinct visual/prompt styling.
*   **UX Refinement:** Add global keyboard shortcuts (Command/Ctrl + K).
*   **Aviation Reliability:** Implement time-boxed decision lanes and challenge-and-response checklists for high-impact AI tasks.

### Phase 9: OMMESH Distributed Mesh Intelligence
*   **Mesh Discovery:** LAN-native auto-discovery of multiple Omnecor instances.
*   **Federated Compute:** Intelligent routing of inference tasks across the network based on VRAM/latency.

### Phase 10: Packaging & Distribution
*   **Debian Packaging:** Finalizing production `.deb` packages.
*   **AppImage:** Runtime bundling and distribution.

### Phase 11: OpenArt AI Video Clone
*   **API Extraction:** Implement the minimal `fal.ai` handler (`fal_utils.py` logic) in a new backend service.
*   **Character Engine:** Build the Character Creation module (Flux Pro Kontext) for consistent character generation.
*   **Video Clone Engine:** Implement the Video Generation module (MiniMax) taking character image references as input.

