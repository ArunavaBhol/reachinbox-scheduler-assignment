# ReachInbox Smart Email Scheduler & Drip Campaign Engine

An advanced, production-grade automated email scheduling and drip campaign management system built to handle high-throughput email dispatch with precision timing, Redis-powered distributed rate-limiting, and zero cron-job dependencies.

---

## 🚀 Key Architectural Highlights

* **Cronless Distributed Scheduling:** Leverages BullMQ and Redis delayed jobs to precisely execute email tasks down to the millisecond without relying on traditional server cron jobs.
* **Intelligent Rate-Limiting:** Enforces strict hourly sender limits via Redis atomic counters with automatic rolling window rollovers.
* **Robust Persistence Layer:** Built with PostgreSQL (managed via raw `pg` connection pools) to store campaign states, user entities, sender configurations, and granular delivery logs.
* **Modern Developer Frontend:** Built using React, Vite, and Tailwind CSS, featuring real-time polling to monitor active queue items and delivery histories.
* **Visual Queue Management:** Integrated with Bull-Board for real-time visual monitoring of Redis queues, active worker concurrency, and failed job retries.

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express, TypeScript, BullMQ, Redis, PostgreSQL (`pg`)
* **Frontend:** React, Vite, TypeScript, Tailwind CSS, Lucide Icons
* **Email Layer:** Nodemailer with Ethereal SMTP / Fake SMTP integration for safe local testing

---

## 📂 Project Structure

- reachinbox-scheduler-assignment/
  - backend/
    - src/config/ (Database pools and Redis connections)
    - src/controllers/ (API route controllers for email scheduling)
    - src/queues/ (BullMQ worker processors & queue definitions)
    - src/services/ (Mailer and simulation services)
    - src/server.ts (Express application entry point)
    - prisma/ (Database schema definition)
  - frontend/
    - src/App.tsx (Main dashboard interface)
    - src/main.tsx (React DOM bootstrap)
    - src/index.css (Stylesheet)

---

## ⚙️ Getting Started & Installation

### Prerequisites
* Node.js (v18 or higher)
* PostgreSQL Database instance
* Redis instance (or local Redis container)

### 1. Backend Setup
Navigate to the backend directory, install dependencies, and start the development server:

cd backend
npm install

Create a `.env` file inside the `backend` folder with your credentials:
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/reachinbox_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379

Run the server using `tsx`:
npx tsx src/server.ts

### 2. Frontend Setup
Open a separate terminal window, navigate to the frontend directory, install dependencies, and launch the Vite development server:

cd frontend
npm install
npm run dev

Open your browser and navigate to `http://localhost:5173` to access the dashboard.

---

## 📊 API Endpoints

- **POST /api/emails/schedule** -> Submits a new batch of leads with custom delays and hourly limits
- **GET /api/emails/scheduled** -> Fetches all pending, rate-limited, or processing queue items
- **GET /api/emails/sent** -> Retrieves complete delivery history (SENT or FAILED)
- **GET /admin/queues** -> Opens the Bull-Board graphical queue monitoring dashboard
