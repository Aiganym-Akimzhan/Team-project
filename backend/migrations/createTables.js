import { Pool } from "pg";
import { initialActors } from "../data/actorsData.js";
import { movies as movieGroups } from "../data/movieData.js";

export function createPool() {
  return new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "kino_db",
    password: process.env.DB_PASSWORD || "",
    port: Number(process.env.DB_PORT || 5432),
  });
}

export async function migrateAndSeed(pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, username VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY, username VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL
      );
      CREATE TABLE IF NOT EXISTS actors (
        id SERIAL PRIMARY KEY, name VARCHAR(150) NOT NULL UNIQUE,
        role VARCHAR(100), image_url TEXT
      );
      CREATE TABLE IF NOT EXISTS movies (
        id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL UNIQUE,
        genre VARCHAR(150), rating NUMERIC(3,1), image_url TEXT,
        description TEXT, category VARCHAR(100), year INTEGER, color VARCHAR(20),
        video TEXT, watch_url TEXT, release_date DATE, country VARCHAR(100),
        director VARCHAR(150), cast_names TEXT[] NOT NULL DEFAULT '{}'
      );
      CREATE TABLE IF NOT EXISTS favourites (
        id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
        movie_id INT REFERENCES movies(id) ON DELETE CASCADE,
        UNIQUE(user_id, movie_id)
      );
    `);

    await client.query(`
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS genre VARCHAR(150);
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1);
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS category VARCHAR(100);
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS year INTEGER;
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS color VARCHAR(20);
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS video TEXT;
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS watch_url TEXT;
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS release_date DATE;
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS country VARCHAR(100);
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS director VARCHAR(150);
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS cast_names TEXT[] NOT NULL DEFAULT '{}';
      ALTER TABLE actors ADD COLUMN IF NOT EXISTS image_url TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS actors_name_unique ON actors (name);
      CREATE UNIQUE INDEX IF NOT EXISTS movies_title_unique ON movies (title);
    `);

    const admins = [
      ["Aiganym", "aiganym@gmail.com", "1234"],
      ["AishaF2", "aisha@gmail.com", "1234"],
      ["AishaF1", "aisha@gmail.com", "5678"],
      ["Leyla", "leyla@gmail.com", "1234"],
    ];
    for (const admin of admins) {
      await client.query(
        "INSERT INTO admins (username,email,password) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING",
        admin,
      );
    }

    for (const actor of initialActors) {
      const name = actor.en || actor.name;
      if (!name) continue;
      await client.query(
        `INSERT INTO actors (name, role, image_url) VALUES ($1,$2,$3)
         ON CONFLICT (name) DO UPDATE SET role=EXCLUDED.role, image_url=EXCLUDED.image_url`,
        [name.trim(), actor.role || actor.ru || null, actor.photo || null],
      );
    }

    const currentActorNames = initialActors
      .map((actor) => actor.en || actor.name)
      .filter(Boolean)
      .map((name) => name.trim());
    await client.query(
      "DELETE FROM actors WHERE NOT (name = ANY($1::text[]))",
      [currentActorNames],
    );

    const allMovies = movieGroups.flatMap((group) => group.movies || []);
    for (const movie of allMovies) {
      await client.query(
        `INSERT INTO movies
          (title,genre,rating,image_url,description,category,year,color,video,watch_url,release_date,country,director,cast_names)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (title) DO UPDATE SET genre=EXCLUDED.genre, rating=EXCLUDED.rating,
          image_url=EXCLUDED.image_url, description=EXCLUDED.description, category=EXCLUDED.category,
          year=EXCLUDED.year, color=EXCLUDED.color, video=EXCLUDED.video, watch_url=EXCLUDED.watch_url,
          release_date=EXCLUDED.release_date, country=EXCLUDED.country, director=EXCLUDED.director,
          cast_names=EXCLUDED.cast_names`,
        [
          movie.title,
          movie.genre || "",
          movie.rating ?? 0,
          movie.poster || "",
          movie.description || "",
          movie.category || "",
          movie.year || null,
          movie.color || "",
          movie.video || "",
          movie.watchUrl || "",
          movie.releaseDate || null,
          movie.country || "",
          movie.director || "",
          movie.actors || [],
        ],
      );
    }
    await client.query("COMMIT");
    console.log(
      `Database ready: ${allMovies.length} movies and ${initialActors.length} actors seeded.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
