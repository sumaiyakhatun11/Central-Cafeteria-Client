# Central Cafetaria - Client

## Project Title
* **Project Name:** Central Cafetaria Client
* **Description:** A modern React-based frontend for the Central Cafetaria management system.
* **Purpose:** To provide an interactive interface for students, teachers, and admins to manage food ordering, queue tracking, and cafeteria operations.

## Features
### For Students
* **Authentication:** Register and Login (including QR code login).
* **Menu Browsing:** Browse food items by category (Breakfast, Lunch, Dinner, Snacks).
* **Ordering:** Add items to cart and place orders.
* **Finance:** Request coin balance increases and track balance.
* **Live Tracking:** Monitor live order status in the queue.
* **Events:** Book cafeteria space for events.

### For Teachers
* **Immediate Orders:** Priority order placement that skips the standard waiting queue.

### For Admins
* **Food Management:** Manage food items, prices, and availability.
* **Account Approvals:** Approve/Reject user coin requests and verify registrations.
* **Analytics:** Monitor live sales reports (Daily, Weekly, Monthly) and overall analytics.
* **Inventory:** Manage raw material inventory and stock alerts.
* **Queue Control:** Adjust queue settings (minutes per order, enable/disable).
* **System Settings:** Update global coin values.

## Tech Stack
### Frontend
* **Framework:** React 19 (Vite)
* **Routing:** React Router Dom v7
* **State Management:** React Context API (`AuthProvider`)
* **Styling:** Tailwind CSS, DaisyUI, Framer Motion
* **Icons:** Lucide React, React Icons
* **Reporting:** ExcelJS, jsPDF, File-saver
* **Utilities:** React Toastify, Html5-qrcode

## System Architecture
The frontend is a Single Page Application (SPA) communicating with a RESTful Node.js backend. It utilizes a centralized `AuthProvider` for session management and a live `EventSource` (SSE) for real-time queue synchronization.

## Project Structure
* `src/Components/Admin/`: Administrative dashboards and management tools (Accounts, Events, Food, Sales).
* `src/Components/Authentication/`: Login, registration, and session logic.
* `src/Components/Home/`: Consumer-facing menu and landing pages.
* `src/Components/Queue/`: Real-time queue visualization and status tracking.
* `src/Components/Shared/`: Reusable UI components (Navbar, Footer, StatusBar, etc.).
* `src/Components/Routes/`: Application routing configuration.

## User Roles & Permissions
* **Student:** Standard access for ordering and coin requests.
* **Teacher:** Higher priority in ordering (Immediate Orders).
* **Admin:** Full access to cafeteria operations, user verification, and financial approvals.
* **Super Admin:** Ability to manage and promote other admin accounts.
* **Privileged User:** Special status allowing $0 price orders for testing or specific use cases.

## Authentication Flow
* **Registration:** Users provide details and ID card images; accounts start as `unverified`.
* **Login:** Authentication via Email/Student ID or QR Code.
* **Session:** User data is stored in `localStorage` (`authUser`) and managed via `AuthProvider`.
* **Protected Routes:** `AdminPrivateRoute` restricts access to `/admin/*` routes based on the `isadmin` or `isSuperAdmin` flag.

## API Overview
* Backend interactions are centralized using `fetch`.
* API endpoints are configured via the `VITE_API_URL` environment variable.
* Real-time data is consumed via the `/queue/stream` SSE endpoint.

## Installation
```bash
git clone <repository-url>
cd CentralCafetariaClient
npm install
```

## Environment Variables
| Name | Purpose | Required |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for the Backend API | Yes |

## Running the Project
* **Development:** `npm run dev`
* **Build:** `npm run build`
* **Preview:** `npm run preview`

## Screenshots
* *[Home Page Placeholder]*
* *[Menu Page Placeholder]*
* *[Queue Tracking Placeholder]*
* *[Admin Dashboard Placeholder]*

## Known Limitations
* **Client-Side Auth Only:** Security is primarily enforced on the client via routing; API endpoints lack token-based authorization.
* **State Persistence:** LocalStorage dependency for auth state.

## Future Improvements
* Integration of JWT/OAuth for secure API communication.
* Transition to TanStack Query for robust data fetching and caching.
* Modularization of large components into smaller, testable units.

## Contributors
* Pabna University of Science and Technology (PUST) Dev Team.

## License
* ISC (Refer to `package.json`)
