# Saddle Prime Store Attendance System — Frontend

The web app for the Saddle Prime Store attendance system. Staff clock in and out from a phone or computer and see their own history. Admins manage employees, correct records and download monthly reports.

It talks to the backend API in the `backend/` folder. Built as a SIWES (industrial training) project.

## Tech stack

- **React** (with **Vite**), using functional components and hooks
- **Tailwind CSS v4** for styling, through the official `@tailwindcss/vite` plugin (no `tailwind.config.js` needed)
- **React Router** for pages and URLs
- **Axios** for API calls
- **React Context** to share who is logged in, and to show toast messages

## Folder structure

```
frontend/
├── index.html            The single HTML page React draws into
├── vite.config.js        Vite settings (React + Tailwind plugins)
├── .env.example          Template for the API address
└── src/
    ├── main.jsx          Starts React; wraps the app in Router, Toast and Auth providers
    ├── App.jsx           All routes and who can see them
    ├── index.css         Tailwind import + a few shared classes (btn, input, card, table)
    ├── api/              One small function per backend endpoint
    │   └── axios.js      Shared axios instance: adds the token, handles 401
    ├── context/          AuthContext (login state), ToastContext (pop-up messages)
    ├── components/       Reusable pieces: Layout, Modal, Pagination, StatusBadge, ...
    ├── hooks/            useDebounce (waits for the user to stop typing)
    ├── pages/            One file per page
    └── utils/            Date/time formatting and constants
```

## Setup

1. Make sure the backend is running (see `backend/README.md`). By default it runs at `http://localhost:5001`.
2. Then run:

```bash
npm install
cp .env.example .env    # change VITE_API_URL if your backend uses another address
npm run dev             # opens on http://localhost:5173
```

Other scripts: `npm run build` (production build into `dist/`), `npm run preview` (serve that build), `npm run lint`.

### Login details

If you ran `npm run seed` in the backend, every account's password is `Passw0rd!`:

- Admin: `admin`
- Staff: `adebayo`, `ngozi`, `emeka`, `funmilayo`, `ibrahim`, `chiamaka`, `tunde`, `aisha`, `oluwaseun`, `halima`, `ifeanyi`, `blessing`

## Pages and permissions

| URL              | Page               | Staff | Admin |
| ---------------- | ------------------ | :---: | :---: |
| `/login`         | Log in             |  ✅   |  ✅   |
| `/`              | Dashboard: clock in and out (admins also see today's summary) |  ✅   |  ✅   |
| `/my-attendance` | My attendance, by month |  ✅   |  ✅   |
| `/employees`     | Add, edit, deactivate employees |  ❌   |  ✅   |
| `/records`       | All attendance records, plus corrections |  ❌   |  ✅   |
| `/reports`       | Monthly report and CSV export |  ❌   |  ✅   |

A staff member who opens an admin page is sent back to the dashboard. Hiding pages is only for convenience. The **backend** is what really enforces permissions: it rejects admin requests from staff with a 403.

## How it works (short version)

- **Login:** the token and user are saved in `localStorage`, so a refresh keeps you logged in. Every request sends `Authorization: Bearer <token>`. If the server replies 401 (expired token or deactivated account), you are logged out and sent to `/login`.
- **Times:** the server records every clock-in and clock-out time. The app never sends a time when you clock in or out. The late cutoff is also decided by the server; the app only shows the status it gets back.
- **Lagos time:** every time on screen is shown in Africa/Lagos time, whatever time zone your device uses. Attendance dates (`"YYYY-MM-DD"`) are formatted by splitting the text, not with `new Date()`, so they never shift by a day.
- **Absent** is never stored. It only appears in the reports, which the server calculates.

## Known limitations

- **Corrections use the device's time zone.** The correction form uses `<input type="datetime-local">`, which works in the browser's time zone. Corrections therefore assume the admin's device is set to Lagos time (West Africa Time, UTC+1). On a device set to another time zone, the corrected times will be off by the difference.
- **The employee filter shows the first 100 employees.** On the Attendance records page, the employee drop-down loads at most 100 employees, the API maximum.
- **No live updates.** The admin's "today" summary does not update by itself. Use the Refresh button.
- **The session is stored in `localStorage`.** This is simple and survives a refresh, but anyone using the same browser profile can reach it. Always log out on shared computers.
