# CopticCloud

CopticCloud is a production-oriented, mobile-first Coptic Orthodox liturgical library application. It is built for chanters, deacons, servants, clergy, youth, and learners, with administrator-controlled content and media uploads.

## What is included

- Google Sign-In with first-login onboarding for display name and profile picture.
- User roles: `User` and `Admin`.
- Secure Admin portal for content CRUD, publishing, media uploads, tags, category assignment, service order, and user role management.
- Empty Firestore-backed content architecture. No hymns, readings, responses, demo records, or generated sample content are seeded.
- Four primary categories only:
  - Matins & Divine Liturgy
  - Readings
  - Vespers
  - Psalmody
- Coptic liturgical calendar engine with Alexandrian Paschal calculations and Julian-to-Gregorian conversion.
- Mobile-first PWA shell with light/dark mode, service worker, and manifest.
- Future-ready content schema for educational and AI-assisted features without enabling AI tools yet.

## Firebase setup

Create a Firebase project with Authentication, Firestore, Storage, and Hosting enabled. Enable Google as an Authentication provider.

Create a local `.env` file with:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Deploy the included `firestore.rules` and `storage.rules` before production use.

New profiles are created with the `User` role. Bootstrap the first administrator by updating that user's `users/{uid}.role` field to `Admin` directly in the Firebase console or through a trusted server-side administrative script.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run build
```

## Content policy

The repository intentionally contains no liturgical content. Administrators should upload all hymns, readings, responses, liturgical texts, audio recordings, PDFs, images, and sheet music through the Admin portal.
