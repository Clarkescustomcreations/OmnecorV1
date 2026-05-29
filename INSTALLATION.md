# Omnecor Installation Guide

**Omnecor HMCI** is the premier Human-Machine Collaboration Interface. This guide provides step-by-step instructions for installing and configuring your Omnecor workstation.

## System Requirements

### Minimum Requirements

- **OS:** Debian 12 or Ubuntu 20.04+
- **CPU:** 4+ cores
- **RAM:** 8GB (16GB+ recommended for local AI models)
- **Storage:** 20GB free space
- **Internet:** Required for cloud-provider API access

### Recommended Setup

- **OS:** Ubuntu 24.04 LTS
- **CPU:** 8+ cores
- **RAM:** 32GB+
- **GPU:** NVIDIA (CUDA support) for accelerated inference
- **Storage:** 100GB+ SSD

## Installation Steps

### 1. Prerequisites

Install required system packages:

```bash
sudo apt-get update
sudo apt-get install -y \
  curl \
  wget \
  git \
  build-essential \
  python3 \
  python3-pip \
  nodejs \
  pnpm
```

### 2. Clone the Repository

```bash
git clone [repository-url]
cd omnecor-hmci-ai-workstation
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# API Keys (for cloud models)
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_GEMINI_API_KEY=your_key_here

# Local Model Configuration
OLLAMA_HOST=http://localhost:11434

# Application Settings
PORT=3000
```

### 5. Start Omnecor

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start
```

The application will be available at `http://localhost:3000`.

## Troubleshooting

### Port Already in Use

If port 3000 is occupied, change the `PORT` in your `.env` file.

### GPU Acceleration

Ensure NVIDIA drivers and CUDA toolkit are installed for hardware-accelerated model inference.

## Support

For issues, please refer to `TROUBLESHOOTING.md`.
