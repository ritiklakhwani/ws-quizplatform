# 🎯 Live Quiz Platform (Mentimeter-Style)

A real-time quiz platform built using **Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Zod, and WebSockets (ws)**.  
Admins can create and run live quizzes, and students can join, answer questions, and see results instantly.

---

## 🚀 Features

### 👨‍🏫 Admin
- Create quizzes and questions (REST API)
- Start live quizzes via WebSocket
- Broadcast questions to students
- Reveal results in real time

### 👨‍🎓 Students
- Join quizzes using WebSocket
- Receive questions live
- Submit answers instantly
- See results immediately

### 🧠 Tech Stack
- **Node.js + Express** – backend
- **MongoDB + Mongoose** – database
- **JWT + bcrypt** – authentication
- **Zod** – request validation
- **ws** – real-time WebSocket events

---

# 📦 Installation & Setup

```bash
git clone <your-repo-url>
cd live-quiz-platform
npm install
