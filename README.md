# Expense Tracker

A simple **offline-first Progressive Web App (PWA)** for recording and managing daily expenses.

The application uses **IndexedDB** for local storage and **Google Sheets** as the remote data store. **Google Apps Script** provides the backend API and synchronization layer.

---

## Overview

Expense Tracker is designed to work reliably even when the network connection is unavailable or unstable.

The application separates local expense management from remote synchronization:

- Expense data is stored locally in IndexedDB.
- Users can continue entering expenses while offline.
- Unfinished input is saved as local drafts.
- Saved expenses are marked as pending synchronization.
- Google Apps Script provides the backend API.
- Google Sheets stores the remote expense data.
- Local and remote records are reconciled using the last modified timestamp.

---

## Features

- Record daily expenses by category.
- Support Food, Daily, and Bills categories.
- Enter amounts using expressions such as `45+15`.
- Add notes to expense records.
- Select and load expenses by date.
- Save unfinished input as local drafts.
- View and resume unsaved drafts.
- Store expense data locally using IndexedDB.
- Continue working without an internet connection.
- Synchronize pending expenses with Google Sheets.
- Load and reconcile data by month.
- Compare local and remote records using modification timestamps.
- Detect changes made directly in Google Sheets.
- Install and run as a Progressive Web App.

---

## Architecture

```text
                         Expense Tracker
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
             ┌─────────────┐        ┌─────────────────┐
             │  Frontend   │        │     Backend     │
             │     PWA     │◄──────►│ Google Apps     │
             │ TypeScript  │        │ Script          │
             └──────┬──────┘        └────────┬────────┘
                    │                        │
                    ▼                        ▼
             ┌─────────────┐        ┌─────────────────┐
             │  IndexedDB  │        │  Google Sheets  │
             │ Local Data  │        │  Remote Data    │
             └─────────────┘        └─────────────────┘
```

### Main Data Flow

```text
User
 │
 ▼
Frontend PWA
 │
 ├── Expense / Draft
 │
 ▼
IndexedDB
 │
 │ Synchronization
 ▼
Google Apps Script API
 │
 ▼
Google Sheets
```

The frontend communicates with Google Sheets through the Google Apps Script API rather than accessing the spreadsheet directly.

---

## Synchronization

Synchronization is handled separately from the expense-entry workflow.

When an expense is saved:

```text
User saves expense
       │
       ▼
IndexedDB
       │
       ▼
Pending
       │
       ▼
Sync Queue
       │
       ▼
Google Apps Script
       │
       ▼
Google Sheets
       │
       ▼
Synced
```

During synchronization, local and remote records are compared using `lastModifiedUtc`.

The newer record becomes the source of truth:

```text
Local modified time > Remote
        │
        ▼
Local → Remote
```

```text
Remote modified time > Local
        │
        ▼
Remote → Local
```

When an expense is edited directly in Google Sheets, the Apps Script `onEdit` trigger updates the record's modification timestamp so that the synchronization process can detect the change.

---

## Project Structure

```text
expense-tracker/
│
├── README.md
│
├── frontend/
│   ├── public/
│   │   ├── icons/
│   │   ├── manifest.webmanifest
│   │   └── service-worker.js
│   │
│   ├── src/
│   │   ├── constants/
│   │   ├── contracts/
│   │   ├── css/
│   │   ├── data/
│   │   ├── enums/
│   │   ├── factories/
│   │   ├── models/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── storage/
│   │   ├── sync/
│   │   └── ui/
│   │
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── backend/
    ├── code/
    │   ├── ApiController.gs
    │   ├── Code.gs
    │   ├── Config.gs
    │   ├── Mapper.gs
    │   ├── Repository.gs
    │   ├── Response.gs
    │   ├── Trigger.gs
    │   └── Utils.gs
    │
    └── template/
        └── google-sheet-template.xlsx
```

---

## Tech Stack

### Frontend

- TypeScript
- Vite
- HTML5
- CSS
- IndexedDB
- Service Worker
- Progressive Web App (PWA)

### Backend

- Google Apps Script
- Google Sheets

### Tools

- Visual Studio Code
- Git
- GitHub

---

## Data Storage

### IndexedDB

IndexedDB is used for local application data.

It stores:

- Daily expenses
- Synchronization status
- Last modified timestamp
- Unfinished drafts

This allows the application to continue operating without a network connection.

### Google Sheets

Google Sheets is used as the remote data store.

Google Apps Script provides the API layer for reading and writing expense data.

---

## Date Format

Expense dates use the following format throughout the application:

```text
YYYY-MM-DD
```

Example:

```text
2026-08-18
```

This format is used for:

- Expense records
- Draft records
- IndexedDB keys
- Synchronization
- Backend requests

Using a single date format avoids ambiguity between regional formats such as `MM/DD/YYYY` and `DD/MM/YYYY`.

---

## Backend API

The Google Apps Script backend exposes the following actions:

| Action | Purpose |
|---|---|
| `PING` | Check whether the API is available |
| `LOAD_MONTH` | Load expense records for a specific month |
| `SAVE_EXPENSE` | Save an expense record |

The backend returns JSON responses containing a success status and, when applicable, data or error information.

---

## Running the Frontend

### Prerequisites

- Node.js
- npm
- Git

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## Backend

The backend is implemented using Google Apps Script and Google Sheets.

The `backend/template/` directory contains a sample Google Sheets structure.

The files in `backend/code/` contain the Apps Script backend implementation.

The general deployment process is:

1. Create a Google Sheet using the provided template.
2. Create a Google Apps Script project.
3. Add the files from `backend/code/`.
4. Configure the spreadsheet information in `Config.gs`.
5. Deploy the Apps Script project as a Web App.
6. Configure the resulting Web App URL in the frontend configuration.
7. Build and run the frontend.

---

## Configuration

The frontend backend URL is configured in:

```text
frontend/src/config.ts
```

Replace the placeholder URL with the URL of the deployed Google Apps Script Web App before running the application against your own backend.

Do not commit real credentials, private keys, access tokens, or other sensitive information to the repository.

---

## Design Goals

The project focuses on:

- **Offline-first usage** — expense entry does not depend on a continuous network connection.
- **Local persistence** — IndexedDB keeps application data available between sessions.
- **Reliable synchronization** — local and remote records are reconciled using modification timestamps.
- **Separation of concerns** — UI, services, storage, synchronization, and API communication are separated into different modules.
- **Simple backend architecture** — Google Apps Script provides a lightweight API while Google Sheets serves as the remote data store.

---

## License

This project is provided for demonstration and portfolio purposes.