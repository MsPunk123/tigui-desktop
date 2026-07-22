<p align="center">
  <img src="assets/images/logo.png" alt="TigUI Desktop Logo" width="200"/>
</p>

<h1 align="center">TigUI Desktop</h1>

<p align="center">
  A beautiful, native desktop client for <a href="https://tigerbeetle.com">TigerBeetle</a> — the financial transactions database built for the next generation of OLTP.
</p>

<p align="center">
  <a href="https://github.com/MsPunk123/tigui-desktop/releases"><img src="https://img.shields.io/github/v/release/MsPunk123/tigui-desktop?style=flat-square&color=orange" alt="Latest Release"/></a>
  <a href="https://github.com/MsPunk123/tigui-desktop/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License"/></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-22.x-brightgreen?style=flat-square&logo=node.js" alt="Node.js 22"/></a>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square" alt="Platform"/>
</p>

---

## What is TigUI Desktop?

**TigUI Desktop** is an open-source GUI client that lets you connect to, browse, and monitor your [TigerBeetle](https://github.com/tigerbeetle/tigerbeetle) database clusters with ease — no terminal commands required.

[TigerBeetle](https://docs.tigerbeetle.com/) is a purpose-built financial transactions database designed for mission-critical Online Transaction Processing (OLTP). It is blazing fast, strictly consistent, and designed to handle the scale of global financial infrastructure. However, working with TigerBeetle natively requires using its CLI or writing client code — which is where TigUI Desktop comes in.

TigUI Desktop bridges that gap by providing a rich, intuitive visual interface to:

- **Connect** to local or remote TigerBeetle clusters
- **Browse** accounts and transfers in real time
- **Inspect** balances, flags, and metadata at a glance
- **Monitor** your database health without writing a single line of code

Think of it as a **TablePlus** or **DBeaver** — but purpose-built for TigerBeetle's unique double-entry accounting model.

---

## ✨ Features

- 🔌 **Cluster Connection Management** — Connect to single-node or multi-replica TigerBeetle clusters
- 📊 **Account Viewer** — Browse accounts with their debit/credit balances, flags, and ledger details
- 💸 **Transfer Explorer** — Inspect transfers, pending amounts, and two-phase commit states
- 🔍 **Real-time Data Monitoring** — Keep an eye on your financial data as it flows through the system
- 🔒 **Secure by Default** — Built on Electron with `contextIsolation`, sandboxed renderer, and typed IPC bridge
- 🎨 **Modern UI** — Dark-mode-first design with Tailwind CSS and Radix UI primitives
- ⚡ **Fast & Lightweight** — Built with Vite and React 19 for a snappy, native-feel experience

---

## 🖥️ Tech Stack

| Layer     | Technology                   |
| --------- | ---------------------------- |
| Shell     | Electron 41 + Electron Forge |
| Renderer  | React 19 + TypeScript        |
| Styling   | Tailwind CSS v4 + Radix UI   |
| Build     | Vite 5                       |
| DB Client | `tigerbeetle-node`           |
| Testing   | Vitest + Testing Library     |
| Linting   | ESLint + Prettier            |
| Git Hooks | Husky + lint-staged          |

---

## 📋 Prerequisites

| Requirement                       | Version                                   |
| --------------------------------- | ----------------------------------------- |
| [Node.js](https://nodejs.org/)    | `22.x` (see `.nvmrc`)                     |
| [pnpm](https://pnpm.io/)          | `10+`                                     |
| [Docker](https://www.docker.com/) | Required for local TigerBeetle cluster    |
| TigerBeetle                       | `0.16.x` (bundled via `tigerbeetle-node`) |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/MsPunk123/tigui-desktop.git
cd tigui-desktop
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your TigerBeetle cluster address if needed.

### 4. Start a local TigerBeetle cluster (first time only)

> **Requires Docker.** Initialize the replica data files before starting:

```bash
docker run --rm --security-opt seccomp=unconfined --cap-add IPC_LOCK \
  -v $(pwd)/infra/data:/data ghcr.io/tigerbeetle/tigerbeetle \
  format --cluster=0 --replica=0 --replica-count=3 /data/0_0.tigerbeetle

docker run --rm --security-opt seccomp=unconfined --cap-add IPC_LOCK \
  -v $(pwd)/infra/data:/data ghcr.io/tigerbeetle/tigerbeetle \
  format --cluster=0 --replica=1 --replica-count=3 /data/0_1.tigerbeetle

docker run --rm --security-opt seccomp=unconfined --cap-add IPC_LOCK \
  -v $(pwd)/infra/data:/data ghcr.io/tigerbeetle/tigerbeetle \
  format --cluster=0 --replica=2 --replica-count=3 /data/0_2.tigerbeetle
```

Then start the cluster with the helper script:

```bash
pnpm infra:tigerbeetle:start
```

Or manually via Docker Compose:

```bash
docker compose -f infra/docker-compose.yml up -d
```

> See [infra/README.md](infra/README.md) for more details and reset instructions.

### 5. Launch the app

```bash
pnpm dev
```

---

## 🧪 Development

### Quality checks

```bash
# Lint (ESLint + design token check)
pnpm lint

# Type check
pnpm typecheck

# Run tests with coverage
pnpm test

# Watch mode
pnpm test:watch
```

### Code formatting

```bash
pnpm format
```

---

## 📦 Building & Packaging

```bash
# Package the app (no installer)
pnpm build

# Create a distributable installer
pnpm make
```

Distributables are output to the `out/` directory. Supported targets include:

- **Windows** — Squirrel installer (`.exe`)
- **macOS** — ZIP archive
- **Linux** — `.deb` / `.rpm`

---

## 🏗️ Project Architecture

TigUI Desktop follows a strict **process boundary** architecture required by Electron's security model:

```
src/
├── main/           # Node.js / Electron process (OS, file, network access)
│   ├── ipc/        # IPC handler registrations
│   └── services/   # Feature-scoped backend services
├── preload/        # Bridge: exposes a typed window.tigui API to the renderer
├── renderer/       # React UI (no direct Node/Electron access)
│   ├── features/   # Feature-scoped modules (accounts, transfers, connections…)
│   └── shared/     # Shared UI primitives, state, utils
└── shared/         # Typed contracts shared across all processes (IPC channels, types)
```

**Key security principles:**

- `contextIsolation` is **enabled** — renderer is fully isolated from Node.js
- `nodeIntegration` is **disabled** — no direct Node APIs in the UI
- `sandbox` is **enabled** — additional OS-level sandboxing
- All cross-process communication flows through typed IPC contracts in `src/shared/`

For full architecture and coding standards, see [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md).

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feat/my-feature`
3. **Commit** your changes following the project standards
4. **Run** all quality checks before pushing:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```
5. **Open** a Pull Request

Before submitting, check the [Developer Guide](docs/DEVELOPER_GUIDE.md) for architecture rules, naming conventions, and the PR checklist.

---

## 📚 Resources

- 📖 [TigerBeetle Documentation](https://docs.tigerbeetle.com/)
- 💻 [TigerBeetle GitHub](https://github.com/tigerbeetle/tigerbeetle)
- 🧑‍💻 [TigUI Developer Guide](docs/DEVELOPER_GUIDE.md)
- 🐞 [Report a Bug](https://github.com/MsPunk123/tigui-desktop/issues)
- 💡 [Request a Feature](https://github.com/MsPunk123/tigui-desktop/issues)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

> TigerBeetle is a separate open-source project. TigUI Desktop is an independent, community-built client and is not officially affiliated with or endorsed by the TigerBeetle team.

---

<p align="center">
  Made with ❤️ for the TigerBeetle community
</p>
