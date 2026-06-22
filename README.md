# 🏥 ClinicQ — Real-Time Hospital Queue Management App

> A mobile-friendly web app that digitizes clinic queues, reduces patient waiting confusion, and helps receptionists manage patient flow in real time.

🔗 **Live Demo:** [friendly-cranachan-ad2213.netlify.app](https://friendly-cranachan-ad2213.netlify.app)

---

## 📌 Problem Statement

Patients in clinics often wait without knowing their position in the queue. Receptionists struggle to manage walk-ins, urgent cases, and multiple doctors manually. ClinicQ solves this with a live, token-based digital queue system.

---

## ✨ Features

- 🟢 **Live Queue Display** — Patients can see real-time queue updates without refreshing
- 🔢 **Token Generation** — Every patient gets a unique token (e.g. `A42`, `B17`)
- 🚨 **Urgent Patient Priority** — Urgent cases are automatically moved to the top of the queue
- 👨‍⚕️ **Multi-Doctor Support** — Separate queues for each doctor
- 📢 **"Now Serving" Banner** — Displays the current patient being called
- 📱 **QR Code Check-in** — Patients can scan QR to view their queue status
- 📊 **Analytics Dashboard** — Track average wait times and completed visits
- 📲 **Mobile Responsive** — Works smoothly on phones and tablets

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend UI |
| Firebase Realtime Database | Live data sync (WebSocket-based) |
| Firebase Hosting / Netlify | Deployment |
| CSS-in-JS (inline styles) | Styling |

---

## 🗂️ Project Structure

```
clinic-queue/
├── public/
├── src/
│   ├── components/
│   │   ├── ReceptionistScreen.jsx   # Add/manage patients & doctors
│   │   ├── PatientScreen.jsx        # Patient queue view
│   │   ├── StatusScreen.jsx         # Live "Now Serving" display
│   │   ├── AnalyticsScreen.jsx      # Wait time analytics
│   │   └── QRModal.jsx              # QR code generator
│   ├── firebase.js                  # Firebase config & init
│   └── App.js                       # Main app with navigation
```

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Node.js (v16+)
- npm

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/AnishaGehlot/Clinic-Queue.git

# 2. Navigate to project folder
cd clinic-queue

# 3. Install dependencies
npm install

# 4. Start development server
npm start
```

App will run at `http://localhost:3000`

---

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Realtime Database**
4. Copy your config to `src/firebase.js`:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  ...
};
```

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Receptionist** | Add patients, manage queue, call next patient |
| **Patient** | View queue position and token status |
| **Status Screen** | Public display showing "Now Serving" token |

---

## 📊 How It Works

1. Receptionist adds a doctor and starts a queue
2. Patients are added with name + urgent flag → token is auto-generated
3. Firebase syncs data in real time to all connected screens
4. Receptionist clicks "Call Next" → Now Serving banner updates live
5. Completed visits are logged for analytics

---

## 🙋‍♀️ Built By

**Anisha Gehlot**
Built as part of the Wooble internship program.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
