# HackingTheRepo – Frontend

The user interface for HackingTheRepo — an AI-powered model that autonomously improves your codebase by generating pull requests.

## What This Does
- Lets the repo owner submit a GitHub repo URL
- Shows real time progress of what the AI is doing
- Displays AI suggestions before they are applied
- Allows the owner to type guidance/instructions to the AI mid-process
- Shows the final PR link once it is automatically opened

## Tech Stack
- **Framework:** React.js
- **Realtime:** Socket.io Client
- **Icons:** Lucide React
- **API:** Connects to HackingTheRepo Backend on port 5000

## Folder Structure
```
frontend/
├── public/
│   └── index.html
├── src/
│   └── App.js          # Main app — all components and logic
│   └── index.css       # Styles
│   └── index.js        # Entry point
├── .env                # Environment variables
├── package.json
└── package-lock.json
```

## Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/QuantumLogicsLabs/HackingTheRepo-Frontend.git
cd HackingTheRepo-Frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root folder:
```
REACT_APP_GITHUB_REPOS=your_username/your_repo
```

### 4. Make sure Backend is running
The frontend connects to backend on `http://localhost:5000` so make sure the backend server is running first.

### 5. Start the frontend
```bash
npm start
```
Opens at `http://localhost:3000`

## How It Connects to Backend
```
Frontend (port 3000)
        ↓
HTTP API calls → Backend (port 5000)
Socket.io → Real time progress updates
```

## Team
Built by TeamAlpha — QuantumLogicsLabs
