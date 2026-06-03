# Veritas Microfinance Bank Frontend

An intuitive and responsive Next.js web application providing a premium client interface for Veritas Microfinance Bank. It communicates directly with the Veritas Bank FastAPI backend.

---

## 🚀 Features

- **Auth Portal**: User login, registration, and OTP-based phone verification.
- **Identity (KYC) Verification**: Seamless flow to link BVN or NIN and upgrade account status.
- **Client Dashboard**: Overview of user accounts (`SAVINGS`, `CURRENT`, `FIXED`), balances, and recent transactions.
- **Transactions**: UI for deposits, withdrawals, and buying network airtime (MTN, Airtel, Glo, 9mobile).
- **Internal Transfers**: Secure funds transfer using instant recipient name lookup before confirmation.
- **Beneficiaries**: Quick access to saved bank beneficiaries for faster transfer workflows.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- Backend API running locally (typically on port 8000)

### 1. Install Dependencies
Navigate to the frontend directory and install the required npm packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root of the frontend folder and specify the backend API URL:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start Development Server
Run the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to access the banking application.

### 4. Build for Production
To generate an optimized build for production:
```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
banking_app_frontend/
├── app/
│   ├── auth/              # Registration, login, and OTP pages
│   ├── dashboard/         # User dashboard overview, accounts, and transfer screens
│   ├── globals.css        # Global CSS stylesheet (Tailwind imports)
│   └── layout.tsx         # Main HTML layout wrapper
├── components/
│   ├── layout/            # Layout components (e.g., Navigation Sidebar)
│   └── ui/                # Core reusable UI elements (inputs, buttons, cards)
├── lib/
│   └── api.ts             # Axios client instance with auth interceptors
├── store/
│   └── auth.ts            # Zustand store for user session state
├── package.json
└── tailwind.config.ts     # Tailwind configuration file
```
