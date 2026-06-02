# Split - Project Overview

## Description
- A modern, local-first financial dashboard and ledger application designed to help businesses efficiently manage daily sales and revenue splits. Originally built for a Pisonet/Pisowifi tracker, it has evolved into a fully flexible open-source split-revenue tool, packaged as a standalone Windows desktop application.

## 1. PROBLEM (The Pain Point)
- Manually calculating profit splits (e.g., 60/40) and deducting specific expenses to find the net revenue takes time and is prone to human error.
- Users need a centralized system to automate these calculations and provide clear monthly and yearly financial summaries, while keeping their sensitive financial data strictly local and private.

## 2. USERS
- **Primary Admin (Shop Owner):** The primary user managing their business. They have full read/write access to their own local data.
- **Partners/Stakeholders:** A business partner who receives a percentage of the split.

## 3. FEATURES (The Solution)
- **Data Entry Form:** A simple input screen to log the date, weekly gross sales, expenses, and operational notes.
- **AI Entry Agent:** Natural language processing that allows users to type "Sales this week were 5000, spent 300 on router repair" and automatically formats it into the database.
- **Automated Split & Net Calculator:** Auto-calculates primary and secondary shares based on user-defined dynamic percentages. Expenses are deducted from the primary share to output the final net revenue.
- **Analytics Dashboard:** Monthly and yearly bar charts.
- **AI Summaries:** Generates intelligent monthly summaries of operational notes to spot trends.
- **Local AI Settings:** Users can provide their own OpenRouter API key and preferred model name, stored securely in the local SQLite database.
- **Offline Account Recovery:** Offline recovery key system replacing traditional email-based password resets for maximum privacy.

## 4. DATA (Database & Prisma Schema)
The architecture is entirely local-first, utilizing a local SQLite database file (`dev.db`).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
}

model User {
  id                       String       @id @default(uuid())
  name                     String       @default("Admin")
  email                    String       @unique
  emailVerified            DateTime?
  password                 String
  default_split_percentage Float        @default(60)
  openrouterKey            String?
  aiModel                  String       @default("deepseek/deepseek-v4-flash")
  recoveryKey              String?
  weeklySales              WeeklySale[]
}

model VerificationToken {
  id      String   @id @default(uuid())
  email   String
  token   String   @unique
  expires DateTime

  @@unique([email, token])
}

model PasswordResetToken {
  id      String   @id @default(uuid())
  email   String
  token   String   @unique
  expires DateTime

  @@unique([email, token])
}

model WeeklySale {
  record_id                String   @id @default(uuid())
  user_id                  String
  date                     DateTime
  weekly_sales             Float
  primary_split_percentage Float    @default(60)
  primary_share            Float
  secondary_share          Float
  primary_expenses         Float
  expense_type             String?
  primary_net_revenue      Float
  notes                    String?

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

## 5. TECH STACK
Built entirely for privacy and speed on the user's local machine.
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, ShadCN UI.
- **Backend & ORM:** Next.js Server Actions, Prisma ORM.
- **Database:** Local SQLite (`@prisma/adapter-better-sqlite3`).
- **Desktop Packaging:** Electron with `electron-builder`, utilizing `asar` packaging and automated GitHub Actions for Windows `.exe` releases.
- **AI Integration:** Vercel AI SDK mapped to OpenRouter (DeepSeek/Gemini/Llama).
- **Authentication & Security:** Auth.js (NextAuth v5) & Bcrypt (12) for secure local logins. Password reset flows run entirely locally via Recovery Keys (Resend was removed).

## 6. UI/UX
- **Mobile-First Design:** Responsive layout for on-the-go data entry.
- **Clean Dashboards:** Boldly display key metrics (e.g., Total Weekly Sales, Net Revenue) alongside monthly and yearly bar chart visualizations.
- **Primary Visible Columns:** Keep the main table view focused purely on high-level financial performance: Date, Gross Sales, Net Revenue, and Expenses.
- **AI Settings Page:** A dedicated tab in the Profile page for users to plug in their own OpenRouter API keys safely.

## 7. DOCUMENT (Core Logic & Rules)
- **Dynamic Splits:** Users configure their default primary split (e.g., 60%). Secondary split is dynamically calculated as (100 - Primary).
- **Primary Share:** Weekly Sales * (Primary Split % / 100).
- **Secondary Share:** Weekly Sales * (Secondary Split % / 100).
- **Net Profit Deduction:** Primary Net Revenue = Primary Share - Primary Expenses.

## 8. FUTURE RECOMMENDATIONS (OPTIONAL - There's a chance we are not doing these)
- **Open Source Contributions:** Maintain the MIT License and accept pull requests for new analytics views or AI provider integrations.
- **Local Model Support:** Investigate direct local Ollama support so users can run the AI Entry Agent entirely offline without an OpenRouter key.
- **Data Export:** Add features to export monthly or yearly financial reports to PDF or CSV.
- **Multi-currency Support:** Allow users to define their local currency symbol instead of assuming a fixed currency.