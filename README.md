# Avanthi Cricket Carnival

Avanthi Cricket Carnival (ACC) is a full stack player registration and cricket auction website. The React and TypeScript frontend provides player registration, payment verification, team and player views, auction administration, and a public live auction display. The FastAPI backend provides the REST API, PostgreSQL persistence, role-based authentication, and live auction updates over WebSockets.

## Requirements

- Windows 10 or 11
- Python 3.11 or newer
- Node.js and npm
- PostgreSQL

## Environment variables

The backend reads these variables from `backend/.env` or the process environment:

- `DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `VERIFIER_USERNAME`
- `VERIFIER_PASSWORD`
- `JWT_SECRET`
- `CORS_ORIGINS`

The frontend reads `VITE_API_BASE_URL` from `frontend/.env`. It is the backend host and port; the app adds `/api` for REST requests and derives the WebSocket URL at `/ws/auction`.

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`, then edit the local files. Keep real credentials and secrets out of the repository.

## Database

Install PostgreSQL and make sure its Windows service is running. Create a PostgreSQL database for ACC using pgAdmin or `psql`, then set `DATABASE_URL` in `backend/.env` to the connection string for that database. The database schema is created and updated by Alembic migrations; apply them as described below.

## Run the backend

In PowerShell, from the project root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` with the PostgreSQL connection string, configured admin and verifier credentials, a long random JWT secret, and allowed frontend origins. Apply migrations and start FastAPI:

```powershell
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API is available at `http://127.0.0.1:8000`. The interactive API documentation is at `http://127.0.0.1:8000/docs`.

## Run the frontend

In a second PowerShell window, from the project root:

```powershell
cd frontend
npm.cmd install
Copy-Item .env.example .env
npm.cmd run dev
```

The development site is available at `http://127.0.0.1:5173`.

## Apply migrations

Activate the backend virtual environment, make sure PostgreSQL is running and `DATABASE_URL` is configured, then run from `backend/`:

```powershell
alembic upgrade head
```

## Tests

From `backend/`, with the virtual environment activated:

```powershell
python -m pytest
```

Build the frontend from `frontend/` with:

```powershell
npm.cmd run build
```

## User roles

- **Admin:** signs in to manage teams and players and control the auction.
- **Verifier:** signs in to review registrations and update payment status.
- **Public:** can register players and view paid player listings, teams, and the live auction without signing in.

## Running the auction on a laptop

These steps let phones and other laptops on the same Wi-Fi network open the public Watch Live page. Use the laptop that will run ACC as the host; connect it to the projector by HDMI or the display connection used at your venue.

1. **Find the host laptop's Wi-Fi IP address.** Open PowerShell or Command Prompt and run:

   ```powershell
   ipconfig
   ```

   Under the active **Wireless LAN adapter Wi-Fi**, note the **IPv4 Address**, for example `192.168.1.25`. Use your actual address in the steps below. Avoid addresses belonging to VPN or virtual network adapters.

2. **Start PostgreSQL.** Open the Windows **Services** app, find the PostgreSQL service, and start it if it is stopped. Confirm that the ACC database exists and that `backend/.env` has the correct `DATABASE_URL` and login configuration.

3. **Set the laptop address in the frontend configuration.** Edit `frontend/.env` and set:

   ```dotenv
   VITE_API_BASE_URL=http://<laptop-ip>:8000
   ```

   Replace `<laptop-ip>` with the IPv4 address from step 1, such as `192.168.1.25`. The WebSocket address is derived from this setting automatically and uses `ws://<laptop-ip>:8000/ws/auction` (or `wss://` for an HTTPS API base URL). Restart the frontend after changing this file.

4. **Allow the frontend origin in backend CORS.** In `backend/.env`, add the frontend origin to `CORS_ORIGINS`:

   ```dotenv
   CORS_ORIGINS=http://<laptop-ip>:5173
   ```

   `CORS_ORIGINS` is a comma-separated list. Keep any other origins you need and add this exact origin. Restart the backend after changing this file.

5. **Apply database migrations** from a PowerShell window in `backend/` with its virtual environment active:

   ```powershell
   alembic upgrade head
   ```

6. **Start the backend on all network interfaces.** From `backend/`, with the virtual environment active, run:

   ```powershell
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

7. **Allow the two ports through Windows Firewall.** Open PowerShell **as Administrator** and run these commands. If Windows asks, allow access on the Private network used for the event:

   ```powershell
   New-NetFirewallRule -DisplayName "ACC Backend 8000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000 -Profile Private
   New-NetFirewallRule -DisplayName "ACC Frontend 5173" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173 -Profile Private
   ```

8. **Start the frontend so other devices can reach it.** In a second PowerShell window, from `frontend/`, run:

   ```powershell
   npm.cmd run dev -- --host 0.0.0.0
   ```

   For a production build preview, use these commands instead:

   ```powershell
   npm.cmd run build
   npm.cmd run preview -- --host 0.0.0.0 --port 5173
   ```

9. **Open and share the Watch Live page.** On the projector laptop and on student phones or other laptops connected to the same Wi-Fi, open:

   ```text
   http://<laptop-ip>:5173/live
   ```

   Replace `<laptop-ip>` with the host laptop's Wi-Fi IPv4 address. Keep both backend and frontend terminal windows running throughout the auction.
