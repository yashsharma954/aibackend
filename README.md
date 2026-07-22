# 🤖 AI Interview Preparation Platform (Backend)

Backend API for an AI-powered interview preparation platform that generates personalized interview questions, evaluates user responses, and manages interview history.

🌐 Live API:
https://aibackend-0cu5.onrender.com

---

## 🚀 Features

- 🔐 JWT Authentication
- 🔑 Google OAuth Authentication
- 📄 Resume Upload (Cloudinary)
- 🤖 AI-powered Interview Question Generation
- 📝 AI Answer Evaluation
- 📚 Interview History Management
- 👤 User Profile Management
- 🗄️ MongoDB Database Integration
- 🔒 Protected REST APIs

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- Cloudinary
- Gemini API / Groq API
- Multer

---

## 📂 Project Structure

```
aibackend
│
├── src
│   ├── controllers      # Business logic for APIs
│   ├── db               # MongoDB database connection
│   ├── middleware       # JWT authentication & other middleware
│   ├── models           # Mongoose schemas
│   ├── routes           # Express API routes
│   └── utils            # Helper functions & constants
│
├── index.js             # Entry point
├── .gitignore
├── package.json
└── README.md
```

## 📌 Main API Endpoints

### Authentication

POST /api/v1/auth/register

POST /api/v1/auth/login



---

### Resume

POST /api/v1/resume/upload

GET /api/v1/resume/myresume

---

### Interview

POST /api/v1/interview/generate

POST /api/v1/interview/submit-answer

GET /api/v1/interview/result/:interviewId

---

## ⚙️ Environment Variables

Create a `.env` file and add:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

JWT_REFRESH_SECRET=your_refresh_secret

GOOGLE_CLIENT_ID=your_google_client_id

GOOGLE_CLIENT_SECRET=your_google_client_secret

GEMINI_API_KEY=your_gemini_api_key

GROQ_API_KEY=your_groq_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name

CLOUDINARY_API_KEY=your_api_key

CLOUDINARY_API_SECRET=your_api_secret
```

---

## ⚙️ Installation

```bash
git clone https://github.com/YOUR_USERNAME/aibackend.git

cd aibackend

npm install

npm run dev
```

---

## 🌐 Frontend Repository

https://github.com/yashsharma954/aifrontend

---

## 👨‍💻 Author

Yash Sharma

LinkedIn:
https://linkedin.com/in/yash-sharma-342b65381/

GitHub:
https://github.com/yashsharma954
