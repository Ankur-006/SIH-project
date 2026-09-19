# Email Login & Auto-Scan Feature

Add IMAP-based email login so users can connect their email account and automatically scan their inbox for phishing threats.

## How It Works (User Flow)

1. User clicks **"Connect Inbox"** from the Sidebar (or a new `/inbox` route)
2. A premium login page asks for: **Email address**, **IMAP server** (auto-detected for Gmail/Outlook/Yahoo), and **App Password**
3. Backend connects to their mailbox via IMAP SSL, fetches the **latest 30 emails** (headers + body)
4. Each email is fed through the **existing analysis engine** (header parsing → auth validation → NLP → link analysis → IP intelligence → domain intelligence → threat scoring)
5. Results appear on a new **Inbox Security** page showing all emails sorted by threat score, with color-coded cards (critical/high/medium/safe)
6. User can click any email card to see the full forensic report (reuses existing ForensicReport page)

## User Review Required

> [!IMPORTANT]
> **App Passwords Required**: For Gmail, the user must generate an App Password at https://myaccount.google.com/apppasswords (requires 2FA enabled). For Outlook, they may need to enable IMAP access in settings. This is a limitation of IMAP-based access — no OAuth setup is needed from your side, but users need to know about App Passwords.

> [!WARNING]
> **Credentials are NOT stored permanently**. The email/password is only held in the backend session memory during the fetch operation, then discarded. No plaintext credentials are saved to TinyDB or any file. However, credentials are sent over HTTP to your FastAPI backend — this is fine for localhost development, but for production you MUST use HTTPS.

## Proposed Changes

### Backend — IMAP Email Fetcher

#### [NEW] [`imap_fetcher.py`](file:///c:/Users/ANKUR/OneDrive/Desktop/SIH%20PROJECT/backend/engine/imap_fetcher.py)

New module that:
- Connects to an IMAP server using `imaplib` (Python stdlib — no new dependencies)
- Auto-detects IMAP host for common providers (Gmail → `imap.gmail.com`, Outlook → `outlook.office365.com`, Yahoo → `imap.mail.yahoo.com`, etc.)
- Fetches the latest 30 emails from INBOX via `IMAP4_SSL`
- Extracts each email's raw RFC 822 text (the same format your existing `parse_email()` already handles)
- Returns a list of raw email strings

#### [NEW] [`inbox.py`](file:///c:/Users/ANKUR/OneDrive/Desktop/SIH%20PROJECT/backend/routers/inbox.py)

New API router with two endpoints:
- `POST /api/inbox/connect` — Accepts `{email, password, imapServer?}`, connects via IMAP, fetches latest 30 emails, runs each through the **existing** `analyze_email_endpoint` pipeline, returns all results
- `POST /api/inbox/disconnect` — Clears session state

#### [MODIFY] [`request_models.py`](file:///c:/Users/ANKUR/OneDrive/Desktop/SIH%20PROJECT/backend/models/request_models.py)

Add `InboxConnectRequest` model with fields: `email`, `password`, `imapServer` (optional)

#### [MODIFY] [`main.py`](file:///c:/Users/ANKUR/OneDrive/Desktop/SIH%20PROJECT/backend/main.py)

Register the new `inbox_router`

---

### Frontend — Login Page & Inbox Security Page

#### [NEW] [`LoginPage.jsx`](file:///c:/Users/ANKUR/OneDrive/Desktop/SIH%20PROJECT/frontend/src/pages/LoginPage.jsx)

Premium-designed login/connection page with:
- Email input with auto-detect provider icon (Gmail/Outlook/Yahoo icons)
- IMAP server field (auto-filled based on email domain, editable for custom domains)
- App password field (with show/hide toggle)
- "Connect & Scan" button with loading animation
- Help section explaining how to get App Passwords for each provider
- Stores connection state in React context (not persisted)

#### [NEW] [`InboxSecurity.jsx`](file:///c:/Users/ANKUR/OneDrive/Desktop/SIH%20PROJECT/frontend/src/pages/InboxSecurity.jsx)

New page showing scan results:
- Summary header: X emails scanned, Y threats found, Z critical
- Email cards sorted by threat score (highest first), color-coded
- Each card shows: sender, subject, date, threat score badge, classification tag
- Click any card → navigates to full forensic report
- Filter bar: All / Critical / Suspicious / Safe
- "Disconnect" button to clear session

#### [MODIFY] [`App.jsx`](file:///c:/Users/ANKUR/OneDrive/Desktop/SIH%20PROJECT/frontend/src/App.jsx)

Add new routes: `/login` for LoginPage, `/inbox` for InboxSecurity

#### [MODIFY] [`Sidebar.jsx`](file:///c:/Users/ANKUR/OneDrive/Desktop/SIH%20PROJECT/frontend/src/components/Sidebar.jsx)

Add "Connect Inbox" nav item (📬) under Tools section. Shows user email & green dot when connected.

#### [MODIFY] [`api.js`](file:///c:/Users/ANKUR/OneDrive/Desktop/SIH%20PROJECT/frontend/src/services/api.js)

Add `connectInbox(email, password, imapServer)` and `disconnectInbox()` API methods

#### [MODIFY] [`EmailContext.jsx`](file:///c:/Users/ANKUR/OneDrive/Desktop/SIH%20PROJECT/frontend/src/context/EmailContext.jsx)

Add inbox connection state: `inboxConnected`, `inboxEmail`, `inboxEmails[]`, `inboxScanning`, `inboxProgress`. Add `connectInbox()` and `disconnectInbox()` actions.

#### [MODIFY] [`index.css`](file:///c:/Users/ANKUR/OneDrive/Desktop/SIH%20PROJECT/frontend/src/index.css)

Add styles for the login page (glassmorphism card, provider icons, input groups) and inbox security page (email cards grid, threat badges, filter bar)

## Verification Plan

### Manual Verification
1. Start backend (`python -m uvicorn main:app --app-dir backend --reload`)
2. Start frontend (`npm run dev --prefix frontend`)
3. Navigate to `/login`, enter a Gmail address + App Password
4. Verify IMAP connection succeeds and emails are fetched
5. Verify the Inbox Security page shows all scanned emails with correct threat scores
6. Click an email card and verify it opens the forensic report
7. Test with invalid credentials — should show clear error message
8. Test disconnect flow — state should clear
