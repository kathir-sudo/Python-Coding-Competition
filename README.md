# PyCompete: Full-Stack Python Coding Competition Platform

PyCompete is a comprehensive, full-stack platform for hosting live Python coding competitions directly in the browser. It features a robust admin dashboard for complete control over the event, a real-time leaderboard, and a secure, focused environment for contestants. All Python code execution is handled client-side using **Pyodide (Python in WebAssembly)**, eliminating the need for complex server-side execution environments.

---

## ✨ Key Features

- **💻 In-Browser Python Execution**: Leverages Pyodide to run Python code securely and efficiently on the client-side. No backend sandbox or Docker needed.
- **🔐 Admin Dashboard**: A password-protected control panel for comprehensive competition management.
    - Start, stop, and pause the competition for all participants.
    - **CRUD Operations** for coding problems.
    - **Live Submission Feed** to monitor real-time activity.
    - **Broadcast Announcements** to all contestants.
    - **Team Management**: View team stats, manually adjust scores, and manage disqualifications.
- **🏆 Real-time Leaderboard**: Teams are ranked based on total score, with submission timestamps used for tie-breaking.
- **🔒 Anti-Cheat System**:
    - Detects tab-switching, copy/paste, and right-click events.
    - Configurable violation limits and automatic disqualification.
    - Enforces fullscreen mode for contestants.
- **👨‍💻 Contestant Experience**:
    - A clean, distraction-free UI with the powerful **Ace Code Editor**.
    - Ability to run code against sample test cases before submitting.
    - Instant feedback on submissions against hidden test cases.
    - Access to submission history.
    - "Upsolving" mode: after the contest, participants can view solutions to problems.
- **📊 Team Statistics**: Admins can view detailed performance breakdowns for each team, including score progression charts.
- **🚀 Full-Stack Architecture**: Built with a modern tech stack including React, Node.js/Express, and MongoDB for a robust and scalable platform.

---

## 🛠️ Tech Stack

- **Frontend**:
    - **Framework**: React with TypeScript
    - **Styling**: Tailwind CSS
    - **Code Editor**: React Ace (Ace Editor)
    - **Charting**: Chart.js (for admin stats)
    - **Python Runtime**: Pyodide (WebAssembly)
- **Backend**:
    - **Framework**: Node.js with Express.js
    - **Database**: MongoDB with Mongoose ODM
- **Development**:
    - **Build Tool**: Vite
    - **Concurrent Execution**: `concurrently` to run frontend and backend simultaneously.

---

## 📂 Project Structure

The repository is organized into two main parts: the client-side React application and the server-side Node.js application.

```
.
├── /public/                  # Static assets for the frontend
├── /server/                  # Backend Node.js application
│   ├── /models/              # Mongoose schemas (Team, Problem, etc.)
│   ├── /routes/              # API route definitions
│   ├── mockData.js           # Default data for seeding
│   ├── package.json          # Backend dependencies
│   └── server.js             # Express server entry point
├── /src/                     # Frontend React application source
│   ├── /components/          # React components
│   ├── /hooks/               # Custom React hooks (e.g., usePyodide)
│   ├── /services/            # API service and Pyodide service
│   ├── App.tsx               # Main application component
│   └── index.tsx             # React entry point
├── index.html                # Main HTML file
├── package.json              # Frontend dependencies and project scripts
└── README.md                 # You are here!
```

---

## 🚀 Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- **Node.js**: Version 18.x or later.
- **npm** or **yarn**: Package manager.
- **MongoDB**: A running MongoDB instance (local or a cloud service like MongoDB Atlas). You will need the connection URI.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/pycompete.git
cd pycompete
```

### 2. Backend Setup

The backend server connects to MongoDB and serves the API.

```bash
# Navigate to the server directory
cd server

# Install backend dependencies
npm install

# Create a .env file in the /server directory
# Add your MongoDB connection string and an optional port
touch .env
```

Your `server/.env` file should look like this:
```
MONGODB_URI=your_mongodb_connection_string_here
PORT=5001
```

### 3. Frontend Setup

The frontend is a React application built with Vite.

```bash
# Navigate to the project root (if you are in /server, go back one level)
cd ..

# Install frontend dependencies
npm install
```

### 4. Running the Application

The root `package.json` includes a `concurrently` script to start both the frontend dev server and the backend server with a single command.

```bash
# From the project root directory
npm start
```

This command will:
1.  Start the backend server (usually on `http://localhost:5001`).
2.  Start the Vite frontend dev server (usually on `http://localhost:5173`).
3.  Proxy API requests from `/api` on the frontend to the backend server.

You can now access the application at `http://localhost:5173` (or whatever port Vite chooses).

---

## 📖 How to Use

### Admin Access

1.  Navigate to the login page.
2.  Enter the team name `admin`.
3.  An admin password field will appear. Enter the password `admin123`.
4.  You will be redirected to the Admin Dashboard, where you can manage the entire competition.

### Contestant Access

1.  Navigate to the login page.
2.  Enter any unique team name.
3.  If the team name doesn't exist, a new team will be created automatically. If it exists, you will log in as that team.
4.  You will be taken to the coding challenge interface.

---

