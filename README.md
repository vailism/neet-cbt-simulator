# NEET CBT Simulator

A near-exact, production-ready **National Eligibility Cum Entrance Test (NEET UG)** Computer-Based Examination Simulation Platform developed with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM.

Designed specifically to help first-time NEET candidates become completely confident and familiar with the official National Testing Agency (NTA) computer-based examination environment.

---

## 🌟 Key Features

### 1. Realistic NTA CBT Examination Interface
* **Authentic Top Header**: Exam name, candidate name, roll number, subject, and real-time countdown timer.
* **Question Paper & Instructions Modals**: Full-paper preview and instructions popup at any point during the test.
* **Subject Tabs**: Immediate one-click section switching between **Physics (45 Qs)**, **Chemistry (45 Qs)**, **Botany (45 Qs)**, and **Zoology (45 Qs)**.
* **Mathematical & Scientific Equations**: Crisp formula rendering via KaTeX (LaTeX inline `$ ... $` and display `$$ ... $$` math, chemical reaction arrows, sub/superscripts).
* **NTA Standard Bottom Actions**:
  - `Save & Next` (Green button)
  - `Clear Response` (Erases selection and marks unattempted)
  - `Save & Mark for Review` (Purple button with evaluation indicator)
  - `Mark for Review & Next` (Purple button without option)
  - `Previous` (Navigates backwards)

### 2. Official Question Palette & Color Transitions
* **Grey**: Not Visited
* **Red**: Visited but Not Answered
* **Green**: Answered
* **Purple**: Marked for Review (Unanswered)
* **Purple with Green Indicator**: Answered & Marked for Review (*evaluated in scoring under official NTA rules*)

### 3. Examination Workflow & Reliability
* **Step 1 - Candidate Verification**: Name, Roll Number, and profile setup.
* **Step 2 - Instructions Screen**: Detailed guidelines, marking scheme, palette symbols, and candidate declaration.
* **Step 3 - Examination**: 180-minute countdown with server-side timestamps (`expiresAt`).
* **Step 4 - Submission Summary**: Subject-wise confirmation table before final submission.
* **Step 5 - Scorecard & Solution Review**: Instant calculation of score out of 720, accuracy %, chapter analytics, and step-by-step explanations.
* **Reliability Engineering**:
  - **Browser Refresh Recovery**: Full recovery of selected options, palette status, and timer.
  - **Server-Side Expiry**: Timer cannot be reset by client clock modification or page reloads.
  - **Automatic Submission**: Triggered seamlessly when time expires.
  - **Duplicate Submission Guard**: Atomic database transaction checks.
  - **Accidental Exit Protection**: `beforeunload` listener warns candidate before leaving.

### 4. Question Randomisation Engine
* Configurable distribution (Physics: 45, Chemistry: 45, Botany: 45, Zoology: 45 = 180 questions).
* Difficulty balance: 30% Easy, 50% Moderate, 20% Difficult.
* Paper Freezing: Once generated, question orders and options are permanently frozen for that attempt.
* Avoids recently attempted questions for that candidate.

### 5. Targeted Practice Mode
* Subject-wise & Chapter-wise practice.
* Custom question volumes (10, 20, 30, 45).
* Timed or untimed options.
* Instant step-by-step KaTeX explanations.

### 6. Student Performance Dashboard
* Lifetime metrics: Total attempts, highest score, average score, overall accuracy.
* Score trends over time with Recharts.
* Subject-wise performance tracking.
* Complete history with direct links to review results and solutions.

### 7. Question Bank Manager (Admin)
* Browse 250+ seeded authentic NEET questions.
* Filter by subject, chapter, difficulty, and PYQ status.
* Live KaTeX preview when adding or editing questions.
* Bulk CSV and JSON question import.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS |
| Database | PostgreSQL 16 |
| ORM | Prisma ORM 5.22.0 |
| Math Rendering | KaTeX |
| Data Visualizations | Recharts |
| Icons | Lucide React |

---

## 🚀 Getting Started

### Prerequisites
* Node.js 20+
* PostgreSQL running locally or remotely

### 1. Database Configuration
Ensure PostgreSQL is running and configure `.env`:
```env
DATABASE_URL="postgresql://<user>@localhost:5432/neetcbt?schema=public"
```

### 2. Setup & Seeding
```bash
# Push schema to PostgreSQL
npx prisma db push

# Seed 250+ authentic questions and exam configuration
npm run seed
```

### 3. Run the Test Suite
```bash
npm test
```

### 4. Start Development or Production Server
```bash
# Development Server
npm run dev

# Or Production Build & Server
npm run build
npm start
```

Open `http://localhost:3000` (or `http://localhost:3001`) in your browser to experience the simulator.
