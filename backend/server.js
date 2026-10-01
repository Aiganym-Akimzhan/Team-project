import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../frontend");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "task3",
  user: "aiganym_akimzhan",
});

app.use(cors());
app.use(express.json());

app.use(express.static(frontendPath));

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, phone FROM users ORDER BY id ASC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    await pool.query("UPDATE users SET username = $1 WHERE id = $2", [
      username,
      id,
    ]);

    res.status(200).json({ message: "User updated" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    const result = await pool.query(
      `INSERT INTO users (username, email, phone, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, phone`,
      [username, email, phone, password]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ message: "Registration failed or user exists" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      "SELECT id, username, email, phone FROM users WHERE username = $1 AND password = $2",
      [username, password]
    );

    if (result.rows.length > 0) {
      res.status(200).json({
        message: "Login successful",
        user: result.rows[0],
      });
    } else {
      res.status(401).json({ message: "Incorrect username or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({ message: "Invalid request" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
