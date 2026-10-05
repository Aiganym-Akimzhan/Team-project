import { Pool } from "pg";
import { initialActors } from "../data/actorsData.js";
import { movies as movieGroups } from "../data/movieData.js";

const adminAccounts = [
  ["Aiganym", "aiganym@gmail.com", "1234"],
  ["AishaF2", "aisha@gmail.com", "1234"],
  ["AishaF1", "aisha.f1@gmail.com", "5678"],
  ["Leyla", "leyla@gmail.com", "1234"],
];

export function createPool() {
  return new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "kino_db",
    password: process.env.DB_PASSWORD || "",
    port: Number(process.env.DB_PORT || 5432),
  });
}

async function createTables(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS actors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) UNIQUE NOT NULL,
      role VARCHAR(100),
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS movies (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) UNIQUE NOT NULL,
      genre VARCHAR(150),
      rating NUMERIC(3,1),
      image_url TEXT,
      description TEXT,
      category VARCHAR(100),
      year INTEGER,
      release_date DATE,
      country VARCHAR(100),
      director VARCHAR(150),
      cast_names TEXT[] DEFAULT '{}'
    );

  `);
}

async function seedAdmins(client) {
  for (const account of adminAccounts) {
    await client.query(
      `INSERT INTO admins (username, email, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET
       username = EXCLUDED.username,
       password = EXCLUDED.password`,
      account,
    );
  }
}

async function seedActors(client) {
  for (const actor of initialActors) {
    const name = actor.en || actor.name;

    if (!name) continue;

    await client.query(
      `INSERT INTO actors (name, role, image_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET
       role = EXCLUDED.role,
       image_url = EXCLUDED.image_url`,
      [name.trim(), actor.role || actor.ru || null, actor.photo || null],
    );
  }
}

async function seedMovies(client) {
  const movies = movieGroups.flatMap((group) => group.movies || []);

  for (const movie of movies) {
    await client.query(
      `INSERT INTO movies
       (title, genre, rating, image_url, description, category, year,
        release_date, country, director, cast_names)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (title) DO UPDATE SET
       genre = EXCLUDED.genre,
       rating = EXCLUDED.rating,
       image_url = EXCLUDED.image_url,
       description = EXCLUDED.description,
       category = EXCLUDED.category,
       year = EXCLUDED.year,
       release_date = EXCLUDED.release_date,
       country = EXCLUDED.country,
       director = EXCLUDED.director,
       cast_names = EXCLUDED.cast_names`,
      [
        movie.title,
        movie.genre || "",
        movie.rating ?? 0,
        movie.poster || "",
        movie.description || "",
        movie.category || "",
        movie.year || null,
        movie.releaseDate || null,
        movie.country || "",
        movie.director || "",
        movie.actors || [],
      ],
    );
  }

  return movies.length;
}

export async function migrateAndSeed(pool) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await createTables(client);
    await seedAdmins(client);
    await seedActors(client);

    const movieCount = await seedMovies(client);

    await client.query("COMMIT");

    console.log(`Database ready: ${movieCount} movies seeded.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
