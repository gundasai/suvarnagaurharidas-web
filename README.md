# Suvarna Gaur Hari Das - Personal Website

A high-performance, "Zero-Maintenance" personal brand website built with Next.js 14, Tailwind, and Firebase.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **Animations**: Framer Motion + Lenis Scroll
- **Database**: Firebase Firestore & Storage

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Admin Panel**
   Navigate to `http://localhost:3000/admin` to manage content.
   *Note: You must enable "Google" sign-in provider in your Firebase Console Authentication settings.*

## Architecture

- **`app/page.tsx`**: The main landing page.
- **`app/admin/page.tsx`**: The content management dashboard.
- **`components/glass-card.tsx`**: The premium card component for courses.
- **`lib/firebase.ts`**: Firebase initialization.
- **`lib/youtube.ts`**: Utilities for thumbnail extraction.

## Maintenance
To add new content, simply visit `/admin` and log in. No code changes required for:
- Adding new YouTube courses.
- Adding photos to the journey gallery.

## Deployment
This project is optimized for deployment on [Vercel](https://vercel.com).
Simply import the project and deploy.
