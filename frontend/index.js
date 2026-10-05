const movieGrid = document.getElementById("result");
const searchInput = document.getElementById("search");
const popup = document.getElementById("popup");
const actorsTrack = document.getElementById("actorsTrack");

let movies = [];
let currentGenre = "";

// show actorss

function renderActors(actors) {
  if (!actorsTrack) return;

  actorsTrack.innerHTML = actors
    .map(
      (actor) => `
        <article class="actor">
          <div class="actor-photo">
            <img src="${actor.photo || ""}" alt="${actor.name}">
          </div>

          <div class="actor-info">
            <div class="actor-ru">${actor.role || ""}</div>
            <div class="actor-en">${actor.name}</div>
          </div>
        </article>
      `,
    )
    .join("");
}

// movie poster

function posterHtml(movie) {
  if (movie.poster) {
    return `
      <img 
        src="${movie.poster}" 
        alt="${movie.title}" 
        class="poster-image"
      >
    `;
  }

  return `
    <div class="poster-placeholder">
      ${movie.title}
    </div>
  `;
}

// create movie

function createMovieCard(movie) {
  const card = document.createElement("article");

  card.className = "movie-card";

  card.innerHTML = `
    <div class="poster">
      ${posterHtml(movie)}

      <span class="rating">
        ★ ${movie.rating || 0}
      </span>

      <div class="description">
        ${movie.description || "No description available."}
      </div>
    </div>

    <h3>${movie.title}</h3>

    <div class="movie-country">
      ${movie.country || ""}
    </div>

    <div class="movie-year">
      ${movie.year || ""}, ${movie.genre || ""}
    </div>
  `;

  card.addEventListener("click", () => openMovie(movie));

  return card;
}

// show movies

function showMovies(list) {
  movieGrid.innerHTML = "";

  if (list.length === 0) {
    movieGrid.innerHTML = "<p>No movies found.</p>";
    return;
  }

  list.forEach((movie) => {
    movieGrid.append(createMovieCard(movie));
  });
}

// SEARCH AND FILTER

function getFilteredMovies() {
  const searchText = searchInput.value.toLowerCase();

  return movies.filter((movie) => {
    const title = (movie.title || "").toLowerCase();
    const genre = (movie.genre || "").toLowerCase();
    const category = (movie.category || "").toLowerCase();

    const titleMatches = title.includes(searchText);

    const genreMatches =
      !currentGenre ||
      category === currentGenre ||
      genre.includes(currentGenre);

    return titleMatches && genreMatches;
  });
}

function updatePage() {
  showMovies(getFilteredMovies());
}

// popup

function detailRow(label, value) {
  return `
    <div class="detail-row">
      <b>${label}:</b>
      <span>${value || "—"}</span>
    </div>
  `;
}

function openMovie(movie) {
  popup.innerHTML = `
    <article class="popup-box">

      <button class="close">✕</button>

      <h2>${movie.title}</h2>

      <p class="popup-description">
        ${movie.description || "No description available."}
      </p>

      <div class="popup-details">

        <div class="popup-poster">
          ${posterHtml(movie)}
        </div>

        <div class="movie-facts">

          ${detailRow("Rating", `★ ${movie.rating || 0}`)}
          ${detailRow("Country", movie.country)}
          ${detailRow("Director", movie.director)}
          ${detailRow("Genre", movie.genre)}
          ${detailRow("Cast", (movie.actors || []).join(", "))}
          ${detailRow("Release date", movie.releaseDate)}

          <div class="popup-actions">

            <button class="trailer">
              ▶ Watch trailer
            </button>

            <button class="watch">
              ▶ Watch movie
            </button>

            ${
              currentRole === "admin"
                ? '<button class="delete-movie">Delete movie</button>'
                : ""
            }

          </div>

        </div>
      </div>
    </article>
  `;

  popup.style.display = "flex";

  popup.querySelector(".close").addEventListener("click", closeMovie);

  popup.querySelector(".trailer").addEventListener("click", () => {
    const query = encodeURIComponent(
      `${movie.title} ${movie.year || ""} official trailer`,
    );

    window.open(
      `https://www.youtube.com/results?search_query=${query}`,
      "_blank",
    );
  });

  popup.querySelector(".watch").addEventListener("click", () => {
    window.location.href = "/subscription/index.html";
  });

  const deleteButton = popup.querySelector(".delete-movie");

  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      deleteMovie(movie);
    });
  }
}

function closeMovie() {
  popup.style.display = "none";
  popup.innerHTML = "";
}

// deletee

async function deleteMovie(movie) {
  const answer = confirm(`Delete "${movie.title}"?`);

  if (!answer) return;

  try {
    const response = await fetch(`/api/movies/${movie.id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not delete movie.");
    }

    movies = movies.filter((item) => item.id !== movie.id);

    closeMovie();
    updatePage();
  } catch (error) {
    alert(error.message);
  }
}

async function loadMovies() {
  try {
    const response = await fetch("/api/movies");

    if (!response.ok) {
      throw new Error("Could not load movies.");
    }

    const data = await response.json();

    movies = data.movies;

    updatePage();
  } catch (error) {
    movieGrid.innerHTML = `<p>${error.message}</p>`;
  }
}

// actors

async function loadActors() {
  try {
    const response = await fetch("/api/actors");

    if (!response.ok) {
      throw new Error("Could not load actors.");
    }

    const actors = await response.json();

    renderActors(actors);
  } catch (error) {
    console.log(error.message);
  }
}

// add movie

async function addMovie(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const status = document.getElementById("adminMovieMessage");

  const movie = Object.fromEntries(new FormData(form));

  movie.cast_names = movie.cast_names
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  try {
    const response = await fetch("/api/movies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(movie),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not add movie.");
    }

    movies.push(data.movie);

    updatePage();

    form.reset();

    status.textContent = "Movie added.";
    status.style.color = "#6be08a";
  } catch (error) {
    status.textContent = error.message;
    status.style.color = "#ff6b6b";
  }
}

// add actor

async function addActor(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const status = document.getElementById("adminActorMessage");

  try {
    const response = await fetch("/api/actors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not add actor.");
    }

    form.reset();

    status.textContent = "Actor added.";
    status.style.color = "#6be08a";

    loadActors();
  } catch (error) {
    status.textContent = error.message;
    status.style.color = "#ff6b6b";
  }
}

document.getElementById("searchBtn").addEventListener("click", () => {
  showMovies(getFilteredMovies());
});

searchInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    showMovies(getFilteredMovies());
  }
});

document.getElementById("adminMovieForm").addEventListener("submit", addMovie);

document.getElementById("adminActorForm").addEventListener("submit", addActor);

popup.addEventListener("click", (event) => {
  if (event.target === popup) {
    closeMovie();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMovie();
  }
});

// genre

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    currentGenre = tab.dataset.category;

    document.querySelector(".tab.active")?.classList.remove("active");

    tab.classList.add("active");

    showMovies(getFilteredMovies());
  });
});

document.addEventListener("auth-changed", (event) => {
  currentRole = event.detail?.role || null;
});

loadMovies();
loadActors();
