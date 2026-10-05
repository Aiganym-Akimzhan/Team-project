import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createPool, migrateAndSeed } from "./migrations/createTables.js";

const app = express();
const pool = createPool();

const frontendFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../frontend",
);

app.use(express.json());
app.use(express.static(frontendFolder));

function getSessionId(req) {
  const cookie = req.get("cookie") || "";

  const session = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("spirit_session="));

  return session?.slice("spirit_session=".length);
}

async function requireLogin(req, res, next) {
  const sessionId = getSessionId(req);

  if (!sessionId) {
    return res.status(401).json({ error: "Please log in again." });
  }

  try {
    const { rows } = await pool.query(
      `SELECT account_id AS id, role
       FROM sessions
       WHERE session_id = $1 AND expires_at > NOW()`,
      [sessionId],
    );

    const session = rows[0];

    if (!session) {
      return res.status(401).json({ error: "Please log in again." });
    }

    const table = session.role === "admin" ? "admins" : "users";
    const account = await pool.query(`SELECT id FROM ${table} WHERE id = $1`, [
      session.id,
    ]);

    if (!account.rowCount) {
      await pool.query("DELETE FROM sessions WHERE session_id = $1", [
        sessionId,
      ]);
      return res.status(401).json({ error: "Please log in again." });
    }

    req.session = session;
    req.sessionId = sessionId;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.session.role !== "admin") {
    return res.status(403).json({
      error: "Administrator access required.",
    });
  }

  next();
}

async function startSession(res, account, role) {
  const sessionId = randomUUID();

  await pool.query(
    `INSERT INTO sessions
     (session_id, account_id, role, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
    [sessionId, account.id, role],
  );

  res.setHeader(
    "Set-Cookie",
    spirit_session=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000,
  );
}

// MOVIES

app.get("/api/movies", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, title, genre, rating,
        image_url AS poster, description, category, year,
        release_date AS "releaseDate", country, director,
        cast_names AS actors
      FROM movies
      ORDER BY id
    `);

    res.json({ movies: rows });
  } catch {
    res.status(500).json({ error: "Could not load movies." });
  }
});

app.post("/api/movies", requireLogin, requireAdmin, async (req, res) => {
  const movie = req.body || {};

  if (
    !movie.title?.trim() ||
    !movie.genre?.trim() ||
    !movie.image_url?.trim()
  ) {
    return res.status(400).json({
      error: "Title, genre, and image URL are required.",
    });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO movies
       (title, genre, rating, image_url, description, category,
        year, release_date, country, director, cast_names)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id, title, genre, rating,
        image_url AS poster, description, category, year,
        country, director, release_date AS "releaseDate",
        cast_names AS actors`,
      [
        movie.title.trim(),
        movie.genre.trim(),
        Number(movie.rating) || 0,
        movie.image_url.trim(),
        movie.description || "",
        movie.category || "",
        movie.year ? Number(movie.year) : null,
        movie.release_date || null,
        movie.country || "",
        movie.director || "",
        Array.isArray(movie.cast_names) ? movie.cast_names : [],
      ],
    );
app.get("/api/session", requireLogin, async (req, res) => {
  try {
    const table = req.session.role === "admin" ? "admins" : "users";

    const { rows } = await pool.query(
      `SELECT id, username, email
       FROM ${table} WHERE id = $1`,
      [req.session.id],
    );

    if (!rows.length) {
      return res.status(401).json({
        error: "Account was not found.",
      });
    }

    res.json({
      user: rows[0],
      role: req.session.role,
    });
  } catch {
    res.status(500).json({
      error: "Could not verify session.",
    });
  }
});

app.delete("/api/session", async (req, res) => {
  const sessionId = getSessionId(req);

  if (sessionId) {
    await pool.query("DELETE FROM sessions WHERE session_id = $1", [sessionId]);
  }

  res.setHeader(
    "Set-Cookie",
    "spirit_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0",
  );

  res.json({ message: "Logged out." });
});

// ACCOUNT

app.patch("/api/account/username", requireLogin, async (req, res) => {
  const username = req.body?.username?.trim();

  if (!username || username.length < 2) {
    return res.status(400).json({
      error: "Username must have at least 2 characters.",
    });
  }

  try {
    const table = req.session.role === "admin" ? "admins" : "users";

    const { rows } = await pool.query(
      `UPDATE ${table}
       SET username = $1
       WHERE id = $2
       RETURNING id, username, email`,
      [username, req.session.id],
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "Account was not found.",
      });
    }

    res.json({ user: rows[0] });
  } catch {
    res.status(500).json({
      error: "Could not update username.",
    });
  }
});

// USERS

app.get("/api/users", requireLogin, requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, email, created_at
       FROM users ORDER BY id`,
    );

    res.json(rows);
  } catch {
    res.status(500).json({
      error: "Could not load users.",
    });
  }
});

app.delete("/api/users/:id", requireLogin, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [req.params.id],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        error: "User was not found.",
      });
    }

    res.json({ message: "User deleted." });
  } catch {
    res.status(500).json({
      error: "Could not delete user.",
    });
  }
});

// FRONTEND

app.get("/", (_req, res) => {
  res.sendFile(path.join(frontendFolder, "index.html"));
});

const port = Number(process.env.PORT || 3000);

try {
  await migrateAndSeed(pool);

  app.listen(port, () => {
    console.log(`SpiritTV ready at http://localhost:${port}`);
  });
} catch (error) {
  console.error("Could not start the app:", error);

  await pool.end();
  process.exit(1);
}
