# ResumeLens 🚀

**Turn your resume into opportunities with AI-powered insights.**

ResumeLens is an AI-powered resume analysis platform designed to help job seekers understand their resume strengths, identify skill gaps, improve ATS compatibility, and prepare for career opportunities through actionable insights.

## ✨ Features

- 🎯 **AI-Powered Resume Analysis** — Get personalized feedback to improve your resume.
- 📊 **ATS Optimization** — Identify areas that may affect applicant tracking system compatibility.
- 💡 **Personalized Insights** — Understand your strengths and areas for improvement.
- 🎯 **Job Match Score** — Evaluate how well your resume aligns with job opportunities.
- 📝 **Resume Management** — Organize and manage your resumes.
- 💼 **Job Matching** — Explore job-related features to support your job search.
- 🎤 **Interview Preparation** — Prepare for interviews with dedicated practice features.
- 🌙 **Modern Dark UI** — A sleek interface featuring a dark background, subtle grid patterns, glowing orange gradients, clean typography, and responsive layouts.

## 🎨 UI Design

ResumeLens uses a modern SaaS-inspired visual design with:

- Near-black backgrounds and subtle grid effects
- Orange-to-yellow gradient buttons and highlights
- Dark, bordered cards with rounded corners
- Clean navigation and consistent spacing
- Bold headings and readable typography
- Responsive layouts for different screen sizes

## 🛠️ Tech Stack

The project is built around the MERN stack:

- **MongoDB** — Database
- **Express.js** — Backend framework
- **React.js** — Frontend library
- **Node.js** — JavaScript runtime
- **SCSS** — Styling and reusable design variables
- **Vite** — Frontend development and build tooling

## 📁 Project Structure

```text
ResumeLens/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── style/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── package.json
└── README.md
```

*Note: The directory structure above is illustrative. Adjust it to match the actual repository.*

## ⚙️ Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB or a MongoDB connection URI
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/ankitpasvan/ResumeLens.git
cd ResumeLens
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file using the environment variables required by the backend.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Use the actual variable names required by your backend configuration. Never commit real API keys, database credentials, or secrets to GitHub.

Start the backend using the script defined in `backend/package.json`. For example:

```bash
npm run dev
```

### 3. Set Up the Frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

```text
http://localhost:5173
```

## 🔐 Environment Variables

Configure the backend environment variables according to your project setup.

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used for JWT authentication |
| `GEMINI_API_KEY` | API key for Gemini-powered features |
| `PORT` | Backend server port, if configurable |

Keep `.env` files private and provide a sanitized `.env.example` for contributors.

## 🧪 Testing and Build

Run the scripts defined in the respective `package.json` files.

Frontend examples:

```bash
npm run lint
npm run build
```

Backend tests depend on the test scripts configured in the backend package.

## 🚀 Future Improvements

- Further refine the responsive UI across all application pages.
- Improve resume feedback and skill-gap insights.
- Enhance job matching and resume-to-job comparisons.
- Expand interview preparation capabilities.
- Improve accessibility, loading states, and error handling.

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes.
5. Submit a pull request.

## 📄 License

No license has been specified here. Add a `LICENSE` file and update this section if you decide to distribute the project under a particular open-source license.

---

**Built to help job seekers turn their resumes into better opportunities.** 🚀
