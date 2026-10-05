import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { createPool } from "./migrations/createTables.js";

const app = express();
app.use(express.json());
app.use(cors());
const frontendPath = fileURLToPath(new URL("../frontend", import.meta.url));
app.use(express.static(frontendPath));

const pool = createPool();

function mapMovie(row) {
  return {
    id: row.id,
    title: row.title,
    genre: row.genre,
    rating: row.rating,
    poster: row.image_url,
    description: row.description,
    category: row.category,
    year: row.year,
    releaseDate: row.release_date,
    country: row.country,
    director: row.director,
    actors: row.cast_names || [],
  };
}

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, created_at FROM users ORDER BY id ASC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Could not load users." });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [
      req.params.id,
    ]);
    if (!result.rowCount) return res.status(404).json({ error: "User not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not delete user." });
  }
});

app.post("/api/register", async (req, res) => {
  const username = req.body.username?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  if (!username || !email || typeof password !== "string") {
    return res.status(400).json({ error: "Username, email, and password are required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [username, email, password],
    );
    res.status(201).json({ user: result.rows[0], role: "user" });
  } catch (err) {
    const duplicate = err.code === "23505";
    res.status(duplicate ? 409 : 500).json({
      error: duplicate ? "An account with this email already exists." : "Could not create your account.",
    });
  }
});

app.post("/api/login", async (req, res) => {
  const login = req.body.username?.trim();
  const password = req.body.password;
  if (!login || typeof password !== "string") {
    return res.status(400).json({ error: "Username/email and password are required." });
  }

  try {
    const admin = await pool.query(
      `SELECT id, username, email FROM admins
       WHERE (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1))
         AND password = $2`,
      [login, password],
    );
    if (admin.rowCount) {
      return res.json({ user: admin.rows[0], role: "admin" });
    }

    const user = await pool.query(
      `SELECT id, username, email FROM users
       WHERE (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1))
         AND password = $2`,
      [login, password],
    );
    if (!user.rowCount) return res.status(401).json({ error: "Invalid username/email or password." });
    res.json({ user: user.rows[0], role: "user" });
  } catch (err) {
    res.status(500).json({ error: "Could not log in." });
  }
});

app.patch("/api/account/username", async (req, res) => {
  const username = req.body.username?.trim();
  const userId = Number(req.body.userId);
  const role = req.body.role;
  if (!username || username.length < 2 || !Number.isInteger(userId)) {
    return res.status(400).json({ error: "Enter a username with at least 2 characters." });
  }
  if (role !== "admin" && role !== "user") {
    return res.status(400).json({ error: "Invalid account role." });
  }

  try {
    const table = role === "admin" ? "admins" : "users";
    const result = await pool.query(
      `UPDATE ${table} SET username = $1 WHERE id = $2
       RETURNING id, username, email`,
      [username, userId],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Account not found." });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Could not update username." });
  }
});

app.get("/api/movies", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM movies ORDER BY id ASC");
    res.json({ movies: result.rows.map(mapMovie) });
  } catch (err) {
    res.status(500).json({ error: "Could not load movies." });
  }
});

app.post("/api/movies", async (req, res) => {
  const movie = req.body;
  if (!movie.title?.trim()) {
    return res.status(400).json({ error: "Movie title is required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO movies
        (title, genre, rating, image_url, description, category, year,
         release_date, country, director, cast_names)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        movie.title.trim(), movie.genre || "", Number(movie.rating) || 0,
        movie.poster || movie.image_url || "", movie.description || "", movie.category || "",
        Number(movie.year) || null, movie.releaseDate || movie.release_date || null,
        movie.country || "", movie.director || "", movie.cast_names || [],
      ],
    );
    res.status(201).json({ movie: mapMovie(result.rows[0]) });
  } catch (err) {
    const duplicate = err.code === "23505";
    res.status(duplicate ? 409 : 500).json({
      error: duplicate ? "A movie with this title already exists." : "Could not add movie.",
    });
  }
});

app.delete("/api/movies/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM movies WHERE id = $1 RETURNING id", [
      req.params.id,
    ]);
    if (!result.rowCount) return res.status(404).json({ error: "Movie not found." });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not delete movie." });
  }
});

app.get("/api/actors", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM actors ORDER BY id ASC");
    res.json(result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      photo: row.image_url,
    })));
  } catch (err) {
    res.status(500).json({ error: "Could not load actors." });
  }
});

app.post("/api/actors", async (req, res) => {
  const { name, role } = req.body;
  const photo = req.body.photo || req.body.image_url;
  if (!name?.trim()) return res.status(400).json({ error: "Actor name is required." });

  try {
    const result = await pool.query(
      `INSERT INTO actors (name, role, image_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), role || "", photo || ""],
    );
    const row = result.rows[0];
    res.status(201).json({ actor: { id: row.id, name: row.name, role: row.role, photo: row.image_url } });
  } catch (err) {
    const duplicate = err.code === "23505";
    res.status(duplicate ? 409 : 500).json({
      error: duplicate ? "This actor already exists." : "Could not add actor.",
    });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
