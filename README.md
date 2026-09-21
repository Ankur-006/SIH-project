<p align="center">
  <img src="https://img.shields.io/badge/MailGuard-Forensic%20Intelligence-blueviolet?style=for-the-badge&logo=shield&logoColor=white" alt="MailGuard Badge" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<h1 align="center">🛡️ MailGuard — Email Forensic Threat Intelligence Platform</h1>

<p align="center">
  <strong>A comprehensive cyber intelligence and digital forensics platform for real-time email threat detection, phishing analysis, SMTP relay tracking, and IP geolocation intelligence.</strong>
</p>

<p align="center">
  Built for <strong>Smart India Hackathon (SIH)</strong> — solving real-world email security challenges for government and enterprise organizations.
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Default Login Credentials](#-default-login-credentials)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

**MailGuard** is a full-stack Digital Forensics & Incident Response (DFIR) platform that empowers security analysts to:

- **Detect phishing, fraud, and impersonation** attacks in real-time using NLP and multi-vector threat analysis
- **Trace email origins** through SMTP relay hop reconstruction and IP geolocation mapping
- **Validate email authenticity** via SPF, DKIM, and DMARC compliance checks
- **Investigate suspicious domains and URLs** with typosquatting detection, disposable email identification, and TLD risk scoring
- **Manage security cases** with a built-in investigation workflow and evidence tracking system
- **Connect live mailboxes** via IMAP for automated batch scanning of entire inboxes

The platform works in a **hybrid mode** — it uses a Python FastAPI backend for full analysis, but gracefully falls back to a **client-side JavaScript analysis engine** when the backend is unavailable, ensuring the tool works even offline.

---

## ✨ Key Features

### 🔬 Core Analysis Engine
| Feature | Description |
|---------|-------------|
| **RFC 822 Header Parsing** | Extracts all email headers, reconstructs SMTP relay chain with IP extraction |
| **NLP Threat Analysis** | Detects urgency manipulation, phishing keywords, social engineering, and BEC patterns |
| **Authentication Validation** | Validates SPF, DKIM alignment, and DMARC policy enforcement |
| **Link Intelligence** | Scans for IP-based URLs, URL shorteners, punycode homograph attacks, and credential harvesting paths |
| **Multi-Vector Threat Scoring** | Weighted scoring across 6+ analysis vectors with classification (phishing, fraud, impersonation, suspicious, legitimate) |

### 🌍 Intelligence Modules
| Module | Description |
|--------|-------------|
| **IP Geolocation & Mapping** | Interactive Leaflet.js world map with relay hop visualization, VPN/Proxy detection |
| **Domain Intelligence** | WHOIS reputation, typosquatting brand impersonation detection, disposable email registry, TLD risk analysis |
| **URL Scanner** | Deep link deconstruction for phishing indicators, redirect chain analysis |

### 📬 Mailbox Integration
| Feature | Description |
|---------|-------------|
| **IMAP Connection** | Auto-detects Gmail, Outlook, Yahoo IMAP servers with one-click connection |
| **Batch Scanning** | Scans up to 50 emails from connected inbox with progress tracking |
| **Inbox Security Dashboard** | Real-time threat breakdown of all scanned emails with filter/search |

### 🏢 Enterprise Features
| Feature | Description |
|---------|-------------|
| **JWT Authentication** | Secure session management with bcrypt password hashing |
| **Role-Based Access Control** | Super Admin, Security Analyst, Investigator, and Viewer roles |
| **Case Management** | Create, track, and manage investigation cases with email evidence linking |
| **Forensic Reports** | Exportable threat reports with defanged IOCs, evidence hashes (SHA-256), and chain-of-custody tracking |
| **Audit Trail** | Immutable logging of all authentication events, analysis submissions, and administrative actions |
| **Global Search** | Ctrl+K command palette searching across emails, cases, domains, IPs, and users |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework with modern hooks and context-based state management |
| **Vite 8** | Lightning-fast dev server with HMR and production bundling |
| **React Router 7** | Client-side routing with protected routes and RBAC guards |
| **Chart.js** | Interactive telemetry charts on the dashboard |
| **Leaflet.js** | Interactive world map for IP geolocation visualization |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Python FastAPI** | High-performance async REST API framework |
| **Uvicorn** | ASGI server for production-grade performance |
| **Pydantic v2** | Request/response validation and serialization |
| **bcrypt** | Secure password hashing |
| **PyJWT** | JSON Web Token generation and verification |
| **TinyDB** | Lightweight JSON document database (zero-config) |
| **HTTPX** | Async HTTP client for external API calls |

---

## 🏗️ Architecture

```
SIH PROJECT/
├── frontend/                        # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/              # Sidebar, TopBar, WorldMap, ThreatGauge, Toast, etc.
│   │   ├── context/                 # AuthContext, EmailContext, ThemeContext, NotificationContext
│   │   ├── pages/                   # 15+ pages: Dashboard, Analyzer, GeoTracer, ForensicReport, etc.
│   │   ├── services/api.js          # Centralized REST client with JWT interceptor
│   │   ├── engine/                  # Client-side fallback: NLP, link analysis, threat scoring
│   │   └── data/                    # Sample phishing emails for demo
│   ├── package.json
│   └── vite.config.js               # Proxies /api → http://127.0.0.1:8000
│
├── backend/                         # Python FastAPI Backend
│   ├── main.py                      # FastAPI app with lifespan, CORS, route registration
│   ├── config.py                    # JWT secrets, CORS origins, DB path
│   ├── requirements.txt             # All Python dependencies
│   ├── routers/                     # 14 route modules: auth, analyze, geo, cases, reports, etc.
│   ├── engine/                      # Core analysis: header parsing, NLP, auth validation, link scanning
│   ├── middleware/                   # JWT auth middleware with RBAC enforcement
│   ├── models/                      # Pydantic request/response schemas
│   ├── data/                        # Threat patterns, TinyDB database layer
│   └── storage/                     # Auto-created JSON database files
│
├── start_backend.bat                # One-click Windows launcher for backend
├── start_frontend.bat               # One-click Windows launcher for frontend
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 18 (for the frontend)
- **Python** ≥ 3.10 (for the backend)
- **Git** (to clone the repository)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Ankur-006/SIH-project.git
cd "SIH PROJECT"
```

### 2️⃣ Start the Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- 🌐 **API Server:** http://localhost:8000
- 📖 **Swagger UI (Interactive Docs):** http://localhost:8000/docs
- 📘 **ReDoc (Alternative Docs):** http://localhost:8000/redoc

### 3️⃣ Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The web app will be available at:
- 🖥️ **Web Dashboard:** http://localhost:5173

### 💡 Windows Users — One-Click Launch

Simply double-click the batch files in the project root:
1. `start_backend.bat` — Launches the Python API server
2. `start_frontend.bat` — Launches the React dev server

---

## 🔐 Default Login Credentials

The platform seeds default users on first launch:

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | `admin@mailguard.com` | `admin123` |
| **Security Analyst** | `analyst@mailguard.com` | `analyst123` |

> ⚠️ **Important:** Change default passwords immediately in a production environment.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate user and receive JWT token |
| `POST` | `/api/auth/register` | Register new user (Super Admin only) |
| `GET` | `/api/auth/me` | Get current authenticated user profile |
| `POST` | `/api/auth/logout` | Log out and record audit event |

### Email Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Full RFC 822 email forensic analysis |
| `POST` | `/api/inbox/connect` | Connect IMAP mailbox and batch scan |

### Intelligence
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/geo/lookup` | Single IP geolocation lookup |
| `POST` | `/api/geo/batch` | Batch IP geolocation (up to 10 IPs) |
| `POST` | `/api/domain/lookup` | Domain reputation and WHOIS intelligence |
| `POST` | `/api/url/analyze` | Deep URL phishing analysis |

### Case Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cases` | List all investigation cases |
| `POST` | `/api/cases` | Create a new case |
| `PUT` | `/api/cases/{id}` | Update case status/details |
| `DELETE` | `/api/cases/{id}` | Delete a case |
| `POST` | `/api/cases/{id}/emails` | Link analyzed email to case |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports` | List all saved forensic reports |
| `GET` | `/api/reports/{id}` | Get specific report details |
| `DELETE` | `/api/reports/{id}` | Delete a report |

### Administration
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List all platform users (Admin/Analyst) |
| `POST` | `/api/users` | Create new user (Super Admin) |
| `PUT` | `/api/users/{id}` | Update user role/status (Super Admin) |
| `DELETE` | `/api/users/{id}` | Delete user account (Super Admin) |
| `GET` | `/api/audit` | Retrieve audit trail logs |
| `GET` | `/api/search?q=...` | Global search across all data |
| `GET/PUT` | `/api/settings` | User preferences and theme settings |
| `GET/PUT` | `/api/profile` | User profile management |
| `GET` | `/api/dashboard/stats` | Dashboard telemetry statistics |

---

## 🖼️ Screenshots

> **Coming Soon** — Run the project locally to explore the full UI with live threat analysis, interactive geo maps, and forensic reports.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature`
3. **Commit** your changes: `git commit -m "Add your feature"`
4. **Push** to the branch: `git push origin feature/your-feature`
5. **Open** a Pull Request

### Development Tips

- The frontend hot-reloads on save via Vite HMR
- The backend auto-reloads with `--reload` flag
- API docs are always available at `/docs` (Swagger) while the backend is running
- The app works in offline/fallback mode even without the backend — the client-side engine handles analysis

---

## 📄 License

This project is built for the **Smart India Hackathon (SIH)** initiative. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Ankur-006">Ankur</a> & Team
</p>
