# Campus Club Collaboration Portal

A full-stack web application for managing campus clubs, events, proposals, voting, and attendance.

**Student:** Advika Bhargav (24BCE1986)

## Tech Stack
- **Frontend:** React + Vite  
- **Backend:** Express.js + SQLite (better-sqlite3)  
- **Database:** SQLite (normalized up to 4NF)

## Quick Start

```bash
# 1. Install everything
bash install.sh

# 2. Run the app
npm run dev
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:5000

## Features
- 📊 Dashboard with live statistics
- 👥 Student registration & management
- 🏛️ Club creation & membership management
- 📅 Event scheduling with venue assignment
- 📝 Proposal submission & voting system
- ✅ Attendance tracking
- 🎓 Faculty coordinator management

## Database Schema (4NF)
Tables: `STUDENT`, `STUDENT_PHONE`, `CLUB`, `FACULTY_COORDINATOR`, `VENUE`, `EVENT`, `MEMBERSHIP`, `PROPOSAL`, `VOTE`, `ATTENDANCE`

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/students` | List/Add students |
| GET/POST | `/api/clubs` | List/Add clubs |
| GET/POST | `/api/memberships` | List/Add memberships |
| GET/POST | `/api/events` | List/Add events |
| GET/POST | `/api/proposals` | List/Add proposals |
| GET/POST | `/api/votes` | List/Cast votes |
| GET/POST | `/api/attendance` | List/Record attendance |
| GET/POST | `/api/faculty` | List/Add faculty |
| GET/POST | `/api/venues` | List/Add venues |
| GET | `/api/stats` | Dashboard statistics |
