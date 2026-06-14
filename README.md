# CopticCloud

CopticCloud is a production-oriented, mobile-first Coptic Orthodox liturgical library application. It is built for chanters, deacons, servants, clergy, youth, and learners, with administrator-controlled content and media uploads.

## What is included

- No-Google local profile setup for immediate use, with optional Firebase/Google cloud mode available later.
- User roles: `User` and `Admin`.
- Secure Admin portal for content CRUD, publishing, media uploads, tags, category assignment, service order, and user role management.
- Empty content architecture with browser-local storage by default and Firestore-backed cloud storage when Firebase is configured. No hymns, readings, responses, demo records, or generated sample content are seeded.
- Four primary categories only:
  - Matins & Divine Liturgy
  - Readings
  - Vespers
  - Psalmody
- Coptic liturgical calendar engine with Alexandrian Paschal calculations and Julian-to-Gregorian conversion.
- Mobile-first PWA shell with light/dark mode, service worker, and manifest.
- Future-ready content schema for educational and AI-assisted features without enabling AI tools yet.

## Local use

Firebase is optional. If no Firebase environment variables are set, CopticCloud runs locally in the browser:

- Click **Continue without Google**.
- Choose a display name.
- Optionally upload a profile picture.
- The local profile is created as `Admin` so the Admin portal can be used immediately.

Local content is stored in browser storage. This is convenient for preview and simple use on one device, but Firebase or another backend should be configured for synced multi-device production use.

## Optional Firebase setup

Create a Firebase project with Authentication, Firestore, Storage, and Hosting enabled. Enable Google as an Authentication provider if you want cloud authentication.

Create a local `.env` file with:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Deploy the included `firestore.rules` and `storage.rules` before Firebase production use.

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
