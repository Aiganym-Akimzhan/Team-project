# SpiritTV movies

## Run locally

Each collaborator runs their own PostgreSQL server. pgAdmin 4 is used to manage that server; it does not host the database itself.

1. Install Node.js and PostgreSQL, then make sure the PostgreSQL service is running.
2. In pgAdmin, connect to your local server and create a database named `kino_db` (or choose another name and put it in `.env`).
3. Copy `.env.example` to `.env` and set `DB_USER` and `DB_PASSWORD` to your local PostgreSQL credentials. If your local PostgreSQL role has no password, leave `DB_PASSWORD=` empty. Do not commit `.env`.
4. Run `npm install`, then `npm run dev` from the project folder.
5. Open <http://localhost:3000>. On startup, the app creates `users`, `admins`, `actors`, `movies`, and `sessions`, then loads the bundled actors and movies from `backend/data` into that database. Re-running startup safely updates those seed rows without duplicating them.

You can also run `npm run migrate` to create and seed the tables without starting the web server. User accounts registered through the site are stored in that collaborator's local database.

The API is served by the same process at `/api/movies`, `/api/actors`, `/api/register`, and `/api/login`. Serve the frontend through this backend; opening the HTML file directly or using a separate static server will not connect to its API.

Admins sign in with an account in the `admins` table. Their session reveals the Users page and the movie and actor entry forms on Home. Login sessions are stored in PostgreSQL so they remain available when moving between pages or restarting the server. New movies and registered users are also stored in PostgreSQL.
