# Project conventions

## Existing project

- The repository is split into `frontend/` and `backend/`, with product requirements and wireframes in `docs/`.
- The frontend is a React + TypeScript app built with Vite. Its app entry is `frontend/src/main.tsx`, and the root component is `frontend/src/App.tsx`.
- Frontend styles currently import Tailwind CSS v4 in `frontend/src/index.css`; Vite enables it through `@tailwindcss/vite`. `App.css` is currently empty. Follow this setup and the existing `src/` structure when adding UI.
- `frontend/package.json` includes Axios and React Router, but the current app has no routes, API client, or API calls. Configure a shared API base URL from Vite environment variables when the API client is added. Keep API payloads and responses explicitly typed in TypeScript.
- The backend is a minimal FastAPI app in `backend/app/main.py`. Dependencies are pinned in `backend/requirements.txt`; it includes SQLAlchemy 2, psycopg2, and python-dotenv. There are no existing ORM models, database session setup, migration tool/configuration, or domain endpoints. The only current endpoint is `GET /`.
- `backend/.env` exists and must be treated as secret configuration. Do not print, commit, overwrite, or expose its values. Backend code should read configuration from environment variables and keep credentials out of source code. No `.env` file values have been recorded here.
- Naming currently uses Python `snake_case` and React/TypeScript `PascalCase` for components. Keep file and symbol names consistent with the surrounding code.
- `docs/working-document.md` and `docs/wireframes.html` describe the ACC player auction website. The intended experience is responsive on mobile and large screens.

## Rules for future work

- Follow the existing structure and libraries; do not reinstall or reconfigure anything that already exists.
- Use TypeScript types for all API data.
- Keep every page responsive for mobile and big screens.
- Build one page or feature at a time.
