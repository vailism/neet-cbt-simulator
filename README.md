# NEET UG 2027 CBT Examination Simulator

A near-exact, production-ready **National Eligibility Cum Entrance Test (NEET UG)** Computer-Based Examination Simulation Platform developed with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, and Google Gemini API.

Designed specifically to help NEET candidates become completely confident and familiar with the official National Testing Agency (NTA) computer-based examination environment.

---

## 🌟 Key Features

### 1. 100 Full-Length NEET CBT Mock Examinations
* **100 Complete Mock Papers**: Indexed from `NEET MOCK TEST 01` to `NEET MOCK TEST 100`.
* **18,000 Questions**: 100 papers $\times$ 180 questions with official NTA subject distributions:
  - **Physics**: 45 questions (180 Marks)
  - **Chemistry**: 45 questions (180 Marks)
  - **Botany**: 45 questions (180 Marks)
  - **Zoology**: 45 questions (180 Marks)
* **Total Capacity**: 72,000 marks across 100 full papers.
* **Anti-Cheat Option Shuffling**: Seeded Mulberry32 PRNG permutes answer choices $(A, B, C, D)$ per paper while maintaining 100% accurate correct answer scoring.
* **Non-Destructive Retakes**: Candidates can retake any mock examination (generating Attempt #1, #2, #3...) without erasing prior scores.

### 2. Realistic NTA CBT Examination Interface
* **Authentic Top Header**: Exam title, candidate name, roll number, subject, and real-time countdown timer.
* **Question Paper & Instructions Modals**: Full-paper preview and instructions popup at any point during the test.
* **Dynamic Subject Tabs**: Immediate section switching between **Physics**, **Chemistry**, **Botany**, and **Zoology**.
* **Scientific & Mathematical Equations**: Crisp formula rendering via KaTeX (LaTeX math `$ ... $` and `$$ ... $$`, chemical reactions, sub/superscripts).
* **NTA Standard Bottom Actions**:
  - `Save & Next` (Green button)
  - `Clear Response` (Erases selection and marks unattempted)
  - `Save & Mark for Review` (Purple button with evaluation indicator)
  - `Mark for Review & Next` (Purple button without option)
  - `Previous` (Navigates backwards)

### 3. Official Question Palette & Color Transitions
* **Grey**: Not Visited
* **Red**: Visited but Not Answered
* **Green**: Answered
* **Purple**: Marked for Review (Unanswered)
* **Purple with Green Indicator**: Answered & Marked for Review (*evaluated in scoring under official NTA rules*)

### 4. Examination Workflow & Reliability
* **Step 1 - Candidate Verification**: Name, Roll Number, and profile setup.
* **Step 2 - Instructions Screen**: Detailed guidelines, marking scheme, palette symbols, and candidate declaration.
* **Step 3 - Examination**: 180-minute countdown synchronized with server timestamps (`expiresAt`).
* **Step 4 - Submission Summary**: Subject-wise confirmation table before final submission.
* **Step 5 - Scorecard & Analytics**: Instant calculation of score out of 720 (+4, -1, 0), accuracy %, negative marks lost, time-spent analysis, and step-by-step NCERT solutions.
* **Reliability Engineering**:
  - **Browser Refresh Recovery**: Full recovery of selected options, palette status, and timer.
  - **Server-Side Expiry**: Timer cannot be bypassed by client clock modification.
  - **Automatic Submission**: Triggered seamlessly when time expires.
  - **Atomic Submission Lock**: Prevents double-submission race conditions.
  - **Answer Leak Protection**: Question answer keys and explanations remain strictly withheld while an exam is in progress.

### 5. Targeted Practice Mode
* Subject-wise & Chapter-wise custom practice sets.
* Custom question volumes (10, 20, 30, 45).
* Timed or untimed options.
* Instant step-by-step KaTeX explanations.

### 6. Student Performance Dashboard
* Lifetime metrics: Total attempts, highest score, average score, overall accuracy.
* Score trends over time with Recharts.
* Subject-wise performance tracking.
* Complete history with direct links to review results and solutions.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS |
| Database | PostgreSQL 16 (Neon / Supabase / Vercel Postgres compatible) |
| ORM | Prisma ORM 5.22.0 |
| AI Integration | Google GenAI SDK (`@google/genai`) |
| Math Rendering | KaTeX |
| Data Visualizations | Recharts |
| Icons | Lucide React |

---

## 🚀 Getting Started Locally

### 1. Clone & Install
```bash
git clone https://github.com/vailism/neet-cbt-simulator.git
cd neet-cbt-simulator
npm install
```

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Update `.env` with your PostgreSQL database URL and optional Gemini API key:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/neetcbt?schema=public"
GEMINI_API_KEY="your_gemini_api_key"
```

### 3. Initialize Database & Seed All 100 Papers
```bash
# Push schema to PostgreSQL
npx prisma db push

# Seed 2,361 questions and generate all 100 Mock Papers (< 2 seconds)
npm run seed
```

### 4. Run Automated Test Suite
```bash
npm test
```

### 5. Start Development or Production Server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```
Visit `http://localhost:3000` (or `http://localhost:3001`).

---

## ☁️ Deploying to Vercel

This repository is optimized for zero-config Vercel deployment:

### 1. Push to GitHub
Ensure your code is pushed to your GitHub repository:
```bash
git push -u origin main
```

### 2. Import to Vercel
1. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Select your `neet-cbt-simulator` GitHub repository.
3. Framework Preset: **Next.js** (auto-detected).

### 3. Configure Environment Variables in Vercel
Add the following in **Settings > Environment Variables**:
* `DATABASE_URL`: Your production PostgreSQL connection string (from [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Vercel Postgres](https://vercel.com/storage/postgres)).
* `GEMINI_API_KEY`: Your Gemini API key from [Google AI Studio](https://aistudio.google.com/).
* `GEMINI_MODEL`: `gemini-3.5-flash-lite` (or `gemini-3.5-flash`).

### 4. Initialize Database on Vercel
Once deployed (or locally against your remote production database):
```bash
DATABASE_URL="your-production-db-url" npx prisma db push
DATABASE_URL="your-production-db-url" npx prisma db seed
```
All 2,361 questions and all 100 full-length mock examinations will be populated immediately!

---

## 📜 License
MIT License. Created for NEET UG examination aspirants.
