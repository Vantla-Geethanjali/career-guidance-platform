# CareerPath AI

Starter full-stack project using React + Vite, Node.js + Express, and MySQL.

## Requirements
- Node.js 18+
- MySQL 8+
- VS Code

## 1. Create the database
Open MySQL Workbench (or MySQL command line) and run `database/careerpath_ai.sql`.

## 2. Start the backend
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` and enter your MySQL username/password.
```bash
npm run dev
```
Backend runs at http://localhost:5000

## 3. Start the frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the URL Vite prints (normally http://localhost:5173).

## Included in this starter
- Student registration and login with password hashing and JWT
- Student dashboard
- Career catalogue API and sample career data
- MySQL schema for profiles, skills, careers, courses, roadmaps, and chat history

The AI assistant is a safe starter placeholder. It does not call an external AI service yet.
Never commit your `.env` file or share your database password.
