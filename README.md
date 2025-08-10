# 🧪 LabAssist

**LabAssist** is a next-generation Laboratory Management System (LMS) designed to streamline and digitize the workflow of diagnostic labs. Built with a React.js frontend and a Python Flask backend, LabAssist empowers lab staff to efficiently manage patients, tests, reports, and analytics—all through a secure and intuitive web interface.

---

## 🚀 Features

### 🔐 Authentication & Security
- Secure user login and logout
- JWT-based session management
- Admin credentials configurable via environment variables

### 📊 Dashboard
- Overview of total patients, tests, and reports
- Real-time count of today’s tests
- Quick access to key lab metrics

### 🧑‍⚕️ Patient Management
- Add, view, edit, and delete patient records
- Search and filter patients
- Detailed patient profiles

### 🧫 Test Management
- Add, view, edit, and delete test records
- Assign tests to patients
- Track test status and history

### 📝 Report Generation
- Generate and download PDF reports
- Reports grouped by test category
- Auto-calculates status (Normal, High, Low, Positive, Negative)
- Includes all patient and test details

### 🧬 Lab Branding & Info
- Dynamic lab name, logo, and contact info
- Personalized reports with lab branding

### 📈 Analytics
- View lab analytics and trends
- Monitor lab performance

### ⚙️ Administration
- Manage lab settings, user accounts, and security
- Edit lab name, address, and contact info

---

## 🛠 Technologies Used

- **Frontend:** React.js, Tailwind CSS, Vite
- **Backend:** Python Flask
- **Database:** MySQL
- **API:** RESTful endpoints (CRUD for patients, tests, reports, labs)
- **Authentication:** JWT

---

## 🏁 Getting Started

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <project-folder>
```

### 2. Database Setup (MySQL)
- Make sure MySQL is installed and running.
- Open your MySQL client (phpMyAdmin, MySQL Workbench, or command line).
- Create a new database named `metacore_db`:
  ```sql
  CREATE DATABASE metacore_db;
  ```
- Import the provided SQL schema:
  - Go to the `database` folder.
  - Import `metacore_db.sql` into your MySQL server.

### 3. Backend Setup (Flask)
- Go to the `backend` folder:
  ```bash
  cd backend
  ```
- Create and configure your `.env` file (see `.env.example` for reference).
- Install dependencies:
  ```bash
  pip install -r requirements.txt
  ```
- Start the backend server:
  ```bash
  python run.py
  ```

### 4. Frontend Setup (React)
- Go to the `frontend` folder:
  ```bash
  cd ../frontend
  ```
- Install dependencies:
  ```bash
  npm install
  ```
- Start the frontend development server:
  ```bash
  npm run dev
  ```
- The app will be available at [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

---

## ℹ️ Notes

- **Default Admin Credentials:**  
  Set in your `.env` file (e.g., `ADMIN_EMAIL`, `ADMIN_PASSWORD`).
- **Lab Branding:**  
  Update the logo in `frontend/public/logo.png` and lab info in the admin/settings section.
- **API URLs:**  
  Make sure the frontend is configured to point to the correct backend API URL if running on different hosts/ports.

---

### ✅ All core functionalities are covered:
- Authentication (login/logout, JWT)
- Dashboard with real-time metrics
- Patient management (add, edit, delete, search)
- Test management (add, edit, delete, assign, track)
- Report generation (PDF, grouped, auto-status)
- Lab branding (logo, info)
- Analytics (basic trends)
- Administration (settings, security)
