# Contributing to Split

First off, thank you for considering contributing to Split! We welcome contributions to make the app even better.

## Tech Stack Overview

- **Frontend & Backend**: Next.js (App Router), TypeScript
- **Database**: Local SQLite via Prisma ORM (`@prisma/adapter-better-sqlite3`)
- **Desktop Wrapper**: Electron with `electron-builder`
- **Authentication**: Auth.js (NextAuth v5)
- **Styling**: Tailwind CSS & shadcn/ui

## Setting up for Local Development

1. **Fork & Clone** the repository.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Initialize the Database**:
   ```bash
   npx prisma db push
   ```
4. **Seed the Database (Optional)**:
   ```bash
   npx prisma db seed
   ```
5. **Run the Next.js Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)
6. **Run the Electron App**:
   ```bash
   npm run desktop
   ```

## Pull Request Process

1. Ensure your code follows the existing style guidelines.
2. If adding new features (especially new AI providers or analytics), make sure they align with the project's local-first privacy goals.
3. Update the README.md with details of changes to the interface, if applicable.
4. Submit your PR for review!
