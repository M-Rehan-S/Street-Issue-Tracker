# 🛣️ Street Issue Tracker

A community-driven web application that lets citizens report street issues (like potholes) using AI-powered image classification. Reports are geotagged, community-voted, and managed by admins through a full role-based dashboard.

---

## Features

- **AI Detection** — Upload a photo and a TFLite model classifies it as a pothole or normal road, with a confidence score
- **Role-based Access** — Three roles: Citizen, Admin, and Super Admin, each with different permissions
- **Community Voting** — Citizens can upvote reports to signal priority
- **Admin Dashboard** — Admins can track, update, and resolve reports
- **Audit Logging** — All admin actions are logged
- **Member Management** — Super Admins can add new Admin accounts

---

## Project Structure

```
project/
├── app.py                  # App factory entry point
├── config.py               # All configuration and env vars
├── extensions.py           # Shared Flask extensions (db, mysql, cors, migrate)
│
├── models/
│   ├── user.py             # User model (Citizen / Admin / SuperAdmin)
│   ├── report.py           # Report model with status tracking
│   ├── vote.py             # Vote model (one vote per user per report)
│   └── audit_log.py        # Admin action audit trail
│
├── routes/
│   ├── auth.py             # /register, /login, /logout
│   ├── dashboard.py        # Page routes (render templates)
│   └── api.py              # JSON API endpoints
│
├── services/
│   └── ml_service.py       # TFLite inference (lazily loaded)
│
├── templates/              # Jinja2 HTML templates
├── static/                 # CSS, JS, images
└── model/
    └── model.tflite        # Trained pothole detection model
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask |
| ORM | Flask-SQLAlchemy + Flask-Migrate |
| Database | PostgreSQL (SQLAlchemy), MySQL (legacy raw queries) |
| ML Inference | TensorFlow Lite |
| Image Processing | Pillow, NumPy |
| Auth | Flask sessions |
| Cross-Origin | Flask-CORS |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/street-issue-tracker.git
cd street-issue-tracker
```

### 2. Create and activate a virtual environment

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

Create a `.env` file in the project root:

```env
SECRET_KEY=your_secret_key_here
SQL_ALCHEMY_DATABASE_URI=postgresql://user:password@localhost/street_issue_tracker
DB_PASSWORD=your_mysql_password
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_DB=StreetIssueTracker
```

### 5. Place the TFLite model

Put your trained model file at:

```
model/model.tflite
```

### 6. Run database migrations

```bash
flask db init
flask db migrate -m "initial migration"
flask db upgrade
```

### 7. Run the app

```bash
python app.py
```

The app will be available at `http://127.0.0.1:5000`.

> **Note:** The app runs with `use_reloader=False` and `threaded=False` intentionally. TFLite spawns internal C++ threads on import — if Flask's reloader forks the process after those threads start, it causes a segmentation fault. These flags prevent that.

---

## User Roles

| Role | Permissions |
|---|---|
| **Citizen** | Register, submit reports, vote on reports |
| **Admin** | View and update report statuses, manage assigned region |
| **Super Admin** | Everything above + add/manage Admin accounts |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register a new citizen account |
| POST | `/login` | Log in |
| GET | `/logout` | Log out |

### Pages
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Home / login page |
| GET | `/dashboard` | Main dashboard |
| GET | `/report-issue` | Submit a new report |
| GET | `/all-reports` | View all reports |
| GET | `/resolved` | View resolved reports |
| GET | `/leaderboard` | Community leaderboard |
| GET | `/settings` | User settings |

### JSON API
| Method | Endpoint | Description |
|---|---|---|
| POST | `/report` | Submit image for AI classification |
| POST | `/personal-details` | Update username, password, phone, email |
| GET | `/get-roles` | Get available admin roles *(Super Admin only)* |
| GET | `/add-member` | Add member page *(Super Admin only)* |
| POST | `/add-member` | Register a new admin member *(Super Admin only)* |

---

## Requirements

```
flask
flask-mysqldb
flask-sqlalchemy
flask-migrate
flask-cors
python-dotenv
numpy
Pillow
tensorflow
psycopg2-binary
```

---

## Known Limitations

- Passwords are stored in plain text — hashing with `bcrypt` or `werkzeug.security` is strongly recommended before any production deployment
- The app currently uses both SQLAlchemy (PostgreSQL) and Flask-MySQLdb (MySQL) — consolidating to a single database is advised
- TFLite model must be provided separately; it is not included in the repository

---

## License

MIT