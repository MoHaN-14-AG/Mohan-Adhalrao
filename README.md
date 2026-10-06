# SetuSeva — Citizen Relationship Management (CiRM)
### Mira-Bhayandar Municipal Corporation (MBMC)

> **Core Philosophy:** Instead of disjointed silos where grievance redressal, certificate applications, and citizen feedback live in separate databases, **SetuSeva maintains ONE unified record per citizen** anchored to their unique citizen profile. From this unified stream of civic interactions, a live **Ward Accountability Score** is calculated and published openly for municipal transparency.

---

## 1. Quick Demo Credentials

All seed accounts are pre-configured. Use these credentials to test role-based access:

| Role | Username | Password | Context |
| :--- | :--- | :--- | :--- |
| **Municipal Commissioner (Admin)** | `admin` | `admin123` | Full administrative visibility across all MBMC wards & departments |
| **Water Dept Officer** | `officer_water` | `officer123` | Assigned to Water Department complaints & field dispatch |
| **Sanitation Dept Officer** | `officer_sanitation` | `officer123` | Assigned to Sanitation & Drainage grievances |
| **Citizen (Rahul Sharma)** | `citizen_rahul` | `citizen123` | Ward 1 (Mira Road East), Hindi UI preference |
| **Citizen (Priya Patil)** | `citizen_priya` | `citizen123` | Ward 2 (Mira Road West), Marathi UI preference |
| **Citizen (Amit Verma)** | `citizen_amit` | `citizen123` | Ward 3 (Bhayandar East), English UI preference |

*(All 10 demo citizens share the password `citizen123`)*

---

## 2. Text Entity-Relationship (ER) Diagram

```text
 +---------------------------------------------------------+
 |                       auth_user                         |
 | (Django User: id, username, email, first/last_name, pw) |
 +----------------------------+----------------------------+
                              | 1:1
                              v
                   +---------------------+
                   |     cirm_citizen    |  <--- [ANCHOR TABLE]
                   |---------------------|
                   | id (PK)             |
                   | user_id (FK -> User)|
                   | phone (VARCHAR 15)  |
                   | ward_id (FK -> Ward)|
                   | preferred_language  |
                   | created_at          |
                   +----------+----------+
                              |
       +----------------------+----------------------+
       | 1:N                                         | 1:N
       v                                             v
+-------------------------------+             +-------------------------------+
|        cirm_complaint         |             |      cirm_servicerequest      |
|-------------------------------|             |-------------------------------|
| id (PK)                       |             | id (PK)                       |
| citizen_id (FK -> Citizen)    |             | citizen_id (FK -> Citizen)    |
| ward_id (FK -> Ward)          |             | type (cert / permit / tax)    |
| department_id (FK -> Dept)    |             | title (VARCHAR 150)           |
| category (VARCHAR 100)        |             | details (TEXT)                |
| description (TEXT)            |             | status (draft / submitted /   |
| location_text (VARCHAR 255)   |             |   processing / completed /    |
| status (submitted / routed /  |             |   abandoned)                  |
|   in_progress / resolved /    |             | created_at (TIMESTAMP)        |
|   citizen_confirmed)          |             | updated_at (TIMESTAMP)        |
| created_at (TIMESTAMP)        |             +-------------------------------+
| sla_due_at (TIMESTAMP +72h)   |
| resolved_at (TIMESTAMP NULL)  |
| is_duplicate (BOOLEAN)        |
| reopen_count (INT DEFAULT 0)  |
+---------------+---------------+
                | 1:1
                v
+-------------------------------+
|         cirm_feedback         |
|-------------------------------|
| id (PK)                       |
| citizen_id (FK -> Citizen)    |
| complaint_id (FK -> Complaint)|
| rating (INT CHECK 1..5)       |
| comment (TEXT)                |
| created_at (TIMESTAMP)        |
+-------------------------------+

+-------------------------------+             +-------------------------------+
|           cirm_ward           |             |        cirm_department        |
|-------------------------------|             |-------------------------------|
| id (PK)                       |             | id (PK)                       |
| name (VARCHAR 100 UNIQUE)     |             | name (Water, Sanitation,      |
| population (INT)              |             |       Roads, Electricity,     |
+---------------+---------------+             |       Property Tax)           |
                |                             +-------------------------------+
                | 1:N
                v
+---------------------------------------+
|            cirm_wardscore             |
|---------------------------------------|
| id (PK)                               |
| ward_id (FK -> Ward)                  |
| month (VARCHAR 20)                    |
| resolution_rate (FLOAT % [40% weight])|
| avg_response_hours (FLOAT [25% weight])|
| reopened_ratio (FLOAT % [15% weight]) |
| fund_utilisation_pct (FLOAT [20% wt]) |
| final_score (FLOAT 0-100)             |
| calculated_at (TIMESTAMP)             |
+---------------------------------------+
```

---

## 3. Setup Steps for Windows

Follow these steps on a Windows command prompt (`cmd.exe`) or PowerShell.

### Step 3.1: Prerequisites
- Python 3.10+ installed and added to `PATH`
- Node.js 18+ and `npm` installed

### Step 3.2: Backend Setup (Django + DRF)
```cmd
:: 1. Navigate to the backend directory
cd backend

:: 2. Create a Python virtual environment
python -m venv venv

:: 3. Activate the virtual environment
venv\Scripts\activate

:: 4. Install backend dependencies
pip install -r requirements.txt

:: 5. Copy environment variables file
copy .env.example .env

:: 6. Run database migrations (creates SQLite database db.sqlite3)
python manage.py makemigrations cirm
python manage.py migrate

:: 7. Seed MBMC demo data (~60 complaints, 22 service requests, 6 wards)
python manage.py seed_demo

:: 8. Start the Django development server on port 8000
python manage.py runserver 8000
```

### Step 3.3: Switching to PostgreSQL (Optional 1-Line Setting)
By default, the project runs on **SQLite** with zero configuration required.
To switch to PostgreSQL:
1. Open `backend/.env`
2. Change:
   ```env
   DB_ENGINE=postgresql
   DB_NAME=setuseva_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_HOST=127.0.0.1
   DB_PORT=5432
   ```
3. Run `python manage.py migrate` and `python manage.py seed_demo`.

### Step 3.4: Frontend Setup (React + Vite)
In a second terminal:
```cmd
:: 1. From the repository root
npm install

:: 2. Start the interactive web development server
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 4. Key Engineering Implementations

### A. Simple Keyword Routing (`backend/cirm/routing_rules.py`)
No complex ML/AI black box. Uses clear, deterministic keyword rules:
- **Water:** `water`, `leak`, `pipeline`, `tap`, `supply`, `meter`, `contamination`, `tanker`, `jal`
- **Sanitation:** `garbage`, `drain`, `sewage`, `trash`, `waste`, `cleaning`, `dump`, `gutter`, `kachra`
- **Roads:** `road`, `pothole`, `asphalt`, `footpath`, `divider`, `pavement`, `street`, `rasta`
- **Electricity:** `light`, `pole`, `power`, `shock`, `electricity`, `transformer`, `spark`, `wire`, `bijli`
- **Property Tax:** `tax`, `assessment`, `property`, `bill`, `receipt`, `challan`, `valuation`

### B. 7-Day Duplicate Detection
When a citizen lodges a complaint, a database query checks if a ticket with the **same category and same ward** was created within the last 7 days (`created_at >= now - 7 days`). If found, it flags `is_duplicate = True` without rejecting the citizen, helping officers consolidate dispatch.

### C. Citizen-Verified Closure State Machine
Allowed transitions:
$$\text{submitted} \longrightarrow \text{routed} \longrightarrow \text{in\_progress} \longrightarrow \text{resolved} \longrightarrow \text{citizen\_confirmed}$$
- **A ticket CANNOT be permanently closed by an officer.**
- Once an officer marks an issue as `resolved`, the ticket remains pending citizen confirmation.
- If the citizen clicks **"Not Fixed"**, status returns to `in_progress` and `reopen_count` increments.
- Only when the citizen clicks **"Confirm Fixed"** does status advance to `citizen_confirmed`, immediately unlocking the 1–5 star rating modal.

### D. Silent Friction Tracking (`mark_abandoned_requests.py`)
Citizens frequently abandon complicated civic forms halfway. If a service request stays in `draft` status for **more than 3 days**, the management command:
```bash
python manage.py mark_abandoned_requests
```
flags it as `abandoned`. This gives MBMC leadership actionable metrics on paperwork bottlenecks.

### E. Ward Accountability Score Formula (`score_calculator.py`)
Calculated in **one clean, clearly commented function**:
$$\text{Ward Score} = 0.40 \times \text{Resolution} + 0.25 \times \text{Speed} + 0.15 \times \text{FirstTimeFix} + 0.20 \times \text{FundUtilisation}$$

- **40% Resolution Rate:** Percentage of complaints resolved in that ward.
- **25% Speed Score:** Baseline of 72 hours SLA ($100 - (\text{avg\_hours} / 144) \times 100$).
- **15% First-Time Fix:** $(100 - \text{reopened\_ratio})$. Reopened tickets penalize rushed or sloppy work.
- **20% Fund Utilisation:** Direct percentage of allocated municipal ward budget spent, ingested from `data/ward_funds.csv` (CityFinance.in stand-in).

Run via:
```bash
python manage.py compute_ward_scores
```

---

## 5. API Endpoints Documentation

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/` | Public | Register new resident + create Citizen anchor record |
| `POST` | `/api/auth/login/` | Public | Authenticate and obtain auth token + role info |
| `GET` | `/api/auth/me/` | Authenticated | Retrieve current user profile and citizen details |
| `GET` | `/api/wards/` | Public | List 6 MBMC administrative wards |
| `GET` | `/api/departments/` | Public | List 5 municipal departments |
| `GET` | `/api/complaints/` | Role-filtered | Citizen sees own; Officer sees department; Admin sees all |
| `POST` | `/api/complaints/` | Citizen | Lodge complaint (auto-routes dept, 7-day duplicate check, sets 72h SLA) |
| `PATCH`| `/api/complaints/:id/update-status/` | Officer/Citizen | Advance state machine (closure restricted to citizen) |
| `POST` | `/api/complaints/:id/reopen/` | Citizen | Reopen resolved ticket to `in_progress` & increment `reopen_count` |
| `GET` | `/api/service-requests/` | Role-filtered | View applications for certificates, permits, or taxes |
| `POST` | `/api/service-requests/` | Citizen | Create draft or submit service request |
| `PATCH`| `/api/service-requests/:id/update-status/` | Officer/Admin | Update service request status |
| `GET` | `/api/feedback/` | Authenticated | List citizen satisfaction reviews |
| `POST` | `/api/feedback/` | Citizen | Submit 1–5 star rating and comment for confirmed ticket |
| `GET` | `/api/ward-scores/` | Public | Retrieve public ward accountability scorecard |
| `POST` | `/api/ward-scores/compute` | Admin | Recalculate ward scores from current database & CSV data |
| `GET` | `/api/admin/stats/` | Officer/Admin | High-level KPIs: total, active, SLA breaches, avg hours, friction |
