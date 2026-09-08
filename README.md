# 🚨 Local Crisis Radar

**Local Crisis Radar** is a full-stack crowdsourced crisis reporting and response platform that enables citizens to report local emergencies and allows authorities to verify, track, and manage incidents through a structured response workflow.

The platform combines geotagged incident reporting, interactive maps, photo evidence, role-based access control, live incident tracking, and administrative dashboards to provide a centralized view of local crisis situations.

---

## ✨ Features

### 👤 Citizen

- Create an account and securely log in
- Report local incidents with:
  - Crisis category
  - Description
  - Severity level
  - Geographic location
  - Photo evidence
- Select an incident location directly from an interactive map
- Use the device's current location for faster reporting
- View submitted reports and their current status
- Explore nearby incidents through the live crisis map

### 🛡️ Authority

- Access an authority-specific dashboard
- View reported incidents
- Verify citizen-submitted reports
- Update incidents as response work progresses
- Track incidents from initial reporting through resolution
- View incident location, severity, description, and supporting evidence

### ⚙️ Administrator

- Access system-wide statistics
- View and manage registered users
- Create Citizen, Authority, and Administrator accounts
- Change user roles
- Suspend and reactivate accounts
- Remove inappropriate or invalid reports
- Monitor reports and platform activity

---

## 🗺️ Live Crisis Map

The interactive crisis map provides a geographical view of reported incidents.

Users can:

- View incidents as map markers
- Filter reports by crisis type
- Filter by severity
- Filter by incident status
- Search by location or keyword
- Select an incident to view detailed information
- View uploaded photo evidence
- See the reporting and verification timeline

Marker size and appearance help distinguish incidents based on severity.

---

## 🔄 Incident Workflow

Each crisis report moves through a structured response lifecycle:

```text
Reported
   ↓
Verified
   ↓
In Progress
   ↓
Resolved
```

**Reported** — A citizen submits a new incident.

**Verified** — An authorized responder confirms the incident.

**In Progress** — Authorities are actively responding to the incident.

**Resolved** — The incident has been addressed.

Role-based authorization ensures that only permitted users can perform sensitive workflow operations.

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- React Router
- Axios
- Leaflet
- React Leaflet
- Recharts
- HTML5
- CSS3

### Backend

- Node.js
- Express.js
- REST API
- JWT Authentication
- bcrypt
- Multer

### Database

- PostgreSQL

### Mapping & Location

- OpenStreetMap
- Leaflet
- Browser Geolocation API
- Reverse geocoding

---

## 🏗️ System Architecture

```text
┌──────────────────────────────┐
│        React Frontend        │
│                              │
│  Reports · Maps · Dashboard  │
└──────────────┬───────────────┘
               │
               │ HTTP / REST
               ▼
┌──────────────────────────────┐
│     Node.js + Express API    │
│                              │
│ Auth · Reports · Users · RBAC│
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          PostgreSQL          │
│                              │
│ Users · Reports · Incidents  │
└──────────────────────────────┘
```

The frontend communicates with the Express backend through REST APIs. Authentication is handled using JSON Web Tokens, while middleware enforces role-based permissions for Citizens, Authorities, and Administrators.

---

## 🔐 Authentication & Authorization

Local Crisis Radar implements JWT-based authentication and role-based access control.

Three user roles are supported:

| Role | Main Permissions |
|------|------------------|
| Citizen | Submit and track crisis reports |
| Authority | Verify and manage incident response |
| Admin | Manage users, roles and platform content |

Protected backend routes validate both authentication and the role required to perform an operation.

Passwords are securely hashed before being stored in the database.

---

## 📍 Location Reporting

Incidents can be geotagged in two ways:

1. **Interactive map selection** — users can click or drag a marker to identify the incident location.
2. **Device location** — users can allow the browser to retrieve their current coordinates.

Coordinates are stored with the report and used to display incidents on the live map.

Reverse geocoding is used to provide a human-readable area name where available.

---

## 📷 Photo Evidence

Users can optionally attach photo evidence while submitting an incident.

Supported image formats include:

- JPEG
- PNG
- WebP

Image uploads are validated by the backend before being associated with a report.

The stored evidence can then be viewed from the incident details panel on the Live Crisis Map.

> **Development note:** The current local implementation stores uploaded evidence on the backend filesystem and stores the corresponding path with the report. For production deployment, persistent object/cloud storage such as Cloudinary or Amazon S3 would be preferable.

---

## 📊 Dashboards & Insights

The platform provides role-specific dashboards containing information such as:

- Total incidents
- Active incidents
- Incident severity
- Report status
- Geographic areas affected
- User statistics
- Authority accounts

This allows responders and administrators to quickly understand the current state of reported crises.

---

## 📁 Project Structure

```text
Local-Crisis-Radar/
│
├── crisis-radar-backend/
│   └── crisis-radar-backend/
│       ├── src/
│       │   ├── config/
│       │   ├── controllers/
│       │   ├── db/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── utils/
│       │   ├── app.js
│       │   └── server.js
│       │
│       ├── .env.example
│       ├── package.json
│       └── README.md
│
├── crisis-radar-frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── constants.js
│   │   └── main.jsx
│   │
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Running the Project Locally

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- PostgreSQL

---

### 1. Clone the Repository

```bash
git clone https://github.com/bhoomi-1911/Local-Crisis-Radar.git
cd Local-Crisis-Radar
```

---

### 2. Backend Setup

Navigate to the backend:

```bash
cd crisis-radar-backend/crisis-radar-backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file using `.env.example` as the reference.

Example configuration:

```env
PORT=4000
DATABASE_URL=postgresql://username:password@localhost:5432/crisis_radar
JWT_SECRET=your_secret_key
```

Create the PostgreSQL database:

```sql
CREATE DATABASE crisis_radar;
```

Set up the database:

```bash
npm run db:setup
```

Start the backend:

```bash
npm run dev
```

The API will run at:

```text
http://localhost:4000
```

You can verify the server using:

```text
http://localhost:4000/api/health
```

---

### 3. Frontend Setup

Open another terminal and navigate to:

```bash
cd crisis-radar-frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file based on `.env.example`:

```env
VITE_API_URL=http://localhost:4000/api
```

Start the frontend:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

---

## 🌐 API Overview

The backend exposes REST endpoints for the main application functionality.

### Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Reports

```text
GET    /api/reports
POST   /api/reports
GET    /api/reports/mine
GET    /api/reports/:id
PATCH  /api/reports/:id/status
DELETE /api/reports/:id
```

### Administration

```text
GET    /api/users
POST   /api/users
PATCH  /api/users/:id/role
PATCH  /api/users/:id/suspend
```

Authorization middleware protects operations that require Authority or Administrator permissions.

---

## 🛡️ Security

The application includes several security and access-control measures:

- Password hashing using bcrypt
- JWT-based authentication
- Protected REST endpoints
- Role-based authorization middleware
- Server-side input validation
- Restricted administrative operations
- Image type and upload-size validation
- Environment variables for sensitive configuration

Sensitive files such as `.env` and user-uploaded evidence are excluded from version control.

---

## 🔮 Future Enhancements

Potential future improvements include:

- Cloud-based image storage
- Real-time notifications
- Email/SMS alerts for critical incidents
- Authority assignment based on location
- Incident clustering and duplicate-report detection
- AI-assisted crisis classification
- Automated severity estimation
- Image-based incident analysis
- Progressive Web App (PWA) support
- Production deployment with scalable storage

---

## 🎯 Project Motivation

During local emergencies, information is often fragmented across social media, messaging applications, and informal communication channels.

Local Crisis Radar explores how a centralized crowdsourced platform can structure this information by combining citizen reporting with authority verification and a clear incident-response lifecycle.

The project focuses on building a practical full-stack system involving authentication, authorization, REST APIs, relational data, geographic interfaces, file uploads, responsive UI design, and role-specific workflows.

---

## 👩‍💻 Author

**Bhoomi H S**

B.E. Information Science & Engineering  
BMS Institute of Technology & Management

GitHub: [bhoomi-1911](https://github.com/bhoomi-1911)

---

## 📄 License

This project was developed for educational and portfolio purposes.
