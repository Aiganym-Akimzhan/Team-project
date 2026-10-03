var movieGrid = document.getElementById("result");
var savedGrid = document.getElementById("favResult");
var popup = document.getElementById("popup");
var searchInput = document.getElementById("search");
var savedCount = document.getElementById("count");
var emptyMessage = document.getElementById("empty");

var movies = [];
var currentGenre = "";
var savedMovieIds = new Set(
  JSON.parse(localStorage.getItem("spirit-tv-favourites") || "[]").map(String),
);

var actorsTrack = document.getElementById("actorsTrack");

function renderActors(actors) {
  actorsTrack.innerHTML = `
    <div class="actors-inner">
      ${actors
        .map(function (actor) {
          return `
          <div class="actor">
            <div class="actor-photo">
              <img 
                src="${actor.photo || ""}" 
                alt="${actor.name}"
              >
            </div>

            <div class="actor-info">
              <div class="actor-ru">${actor.role || ""}</div>
              <div class="actor-en">${actor.name}</div>

            </div>
          </div>
        `;
        })
        .join("")}
    </div>`;
}

//
//FETCHHHHHHHHH
document.addEventListener("DOMContentLoaded", () => {
  // Fetch and load Navbar
  fetch("./navbar/index.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load navbar");
      }
      return response.text();
    })
    .then((data) => {
      document.getElementById("navbar").innerHTML = data;
      document.dispatchEvent(new Event("navbar-ready"));
    })
    .catch((error) => console.error("Error loading navbar:", error));

  // Fetch and load Footer
  fetch("./footer/footer.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load footer");
      }
      return response.text();
    })
    .then((data) => {
      document.getElementById("footer").innerHTML = data;
    })
    .catch((error) => console.error("Error loading footer:", error));
});
////
//
//

function posterHtml(movie) {
  if (movie.poster) {
    return `<img src="${movie.poster}" alt="${movie.title}"
      style="display: block; width: 100%; height: 100%; object-fit: cover;">`;
  }

  return `<div style="width: 100%; height: 100%; display: flex; align-items: flex-end;
      padding: 14px; box-sizing: border-box; font-family: Oswald, sans-serif;
      font-size: 28px; text-transform: uppercase;
      background: linear-gradient(160deg, ${movie.color}, #000);">${movie.title}</div>`;
}

function makeCard(movie) {
  var card = document.createElement("article");

  card.style.animation = "fade 0.5s both";

  card.onmouseenter = function () {
    card.querySelector(".poster").style.transform = "translateY(-6px)";
    card.querySelector(".poster").style.borderColor = "#fa003f";
    card.querySelector(".description").style.transform = "translateY(0)";
  };

  card.onmouseleave = function () {
    card.querySelector(".poster").style.transform = "translateY(0)";
    card.querySelector(".poster").style.borderColor = "#262626";
    card.querySelector(".description").style.transform = "translateY(100%)";
  };

  card.innerHTML = `
    <div class="poster" style="position: relative; aspect-ratio: 2 / 3;
        border: 1px solid #262626; border-radius: 12px; overflow: hidden;
        cursor: pointer; transition: transform 0.25s, border-color 0.25s;">
      ${posterHtml(movie)}
    <button
  class="heart"
  type="button"
  style="
    position: absolute;
    top: 10px;
    left: 10px;
    width: 34px;
    height: 34px;
    background: rgba(0, 0, 0, 0.7);
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    padding: 8px;
  "
>
  <img
    src="${movie.saved ? "/icons/red.png" : "/icons/white.png"}"
    alt="like"
    style="width: 100%; height: 100%; object-fit: contain;"
  >
</button>
      <span style="position: absolute; top: 10px; right: 10px; padding: 5px 10px;
          background: rgba(0, 0, 0, 0.7); border-radius: 20px; color: #6be08a;
          font-size: 13px; font-weight: 600;">★ ${movie.rating}</span>
      <div class="description" style="position: absolute; left: 0; right: 0; bottom: 0;
          padding: 16px; background: rgba(0, 0, 0, 0.9); font-size: 14px;
          line-height: 1.4; transform: translateY(100%);
          transition: transform 0.3s;">${movie.description}</div>
    </div>
    <h3 style="margin: 14px 0 2px; font-family: Oswald, sans-serif; font-size: 21px;
        text-transform: uppercase;">${movie.title}</h3>
    <div style="font-family: Oswald, sans-serif; font-size: 17px;
        text-transform: uppercase; color: #ff9500;">${movie.country}</div>
    <div style="margin-top: 2px; font-size: 14px; color: #8c8c8c;">${movie.year}, ${movie.genre}</div>
  `;

  card.querySelector(".heart").onclick = function (event) {
    event.stopPropagation();

    movie.saved = !movie.saved;
    if (movie.saved) savedMovieIds.add(String(movie.id));
    else savedMovieIds.delete(String(movie.id));
    localStorage.setItem(
      "spirit-tv-favourites",
      JSON.stringify(Array.from(savedMovieIds)),
    );

    var img = this.querySelector("img");

    if (movie.saved) {
      img.src = "/icons/red.png";
    } else {
      img.src = "/icons/white.png";
    }

    updatePage();
  };

  card.onclick = function () {
    openDetails(movie);
  };

  return card;
}

function showMovies(list, grid) {
  grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML = "<p style='color: #8c8c8c;'>Nothing here yet.</p>";
    return;
  }

  list.forEach(function (movie) {
    grid.appendChild(makeCard(movie));
  });
}

function getMovies() {
  var text = searchInput.value.toLowerCase();

  return movies.filter(function (movie) {
    var titleMatch = movie.title.toLowerCase().includes(text);
    var genreMatch = movie.genre.toLowerCase().includes(currentGenre);
    return titleMatch && genreMatch;
  });
}

function showSaved() {
  var saved = movies.filter(function (movie) {
    return movie.saved;
  });

  if (savedCount) savedCount.textContent = saved.length;
  emptyMessage.style.display = saved.length === 0 ? "block" : "none";

  savedGrid.innerHTML = "";
  saved.forEach(function (movie) {
    savedGrid.appendChild(makeCard(movie));
  });
}

var tabs = document.querySelectorAll(".tab");

tabs.forEach(function (tab) {
  tab.onclick = function () {
    currentGenre = tab.dataset.category;

    tabs.forEach(function (other) {
      other.classList.remove("active");
    });
    tab.classList.add("active");

    showMovies(getMovies(), movieGrid);
  };
});

function updatePage() {
  showMovies(getMovies(), movieGrid);
  showSaved();
}

function row(label, value) {
  return `
    <div style="display: flex; gap: 16px; margin-bottom: 14px;">
      <b style="width: 130px; flex-shrink: 0;">${label}:</b>
      <span style="color: #ff9500;">${value}</span>
    </div>`;
}

function openDetails(movie) {
  popup.innerHTML = `
    <article class="popup-box" style="position: relative; width: 100%; max-width: 860px;
        margin: auto; padding: 32px; box-sizing: border-box; background: #0d0d0d;
        border: 1px solid #262626; border-radius: 16px; animation: fade 0.35s both;">

      <button class="close" type="button" style="position: absolute; top: 16px; right: 16px;
          width: 36px; height: 36px; background: #1a1a1a; border: 0;
          border-radius: 50%; color: #fff; cursor: pointer;">✕</button>

      <h2 style="margin: 0; padding-right: 48px; font-family: Oswald, sans-serif;
          font-size: 42px; text-transform: uppercase;">${movie.title}</h2>

      <p style="margin: 6px 0 28px; font-size: 16px; color: #8c8c8c;">${movie.description}</p>

      <div class="popup-details" style="display: flex; flex-wrap: wrap; gap: 32px;">
        <div style="width: 250px;">
          <div style="padding: 6px; background: #000; border: 1px solid #262626;
              border-radius: 6px;">${posterHtml(movie)}</div>
        </div>

        <div style="flex: 1 1 320px; line-height: 1.5;">
          ${row("Рейтинг", "★ " + movie.rating)}
          ${row("Страна", movie.country)}
          ${row("Режиссёр", movie.director)}
          ${row("Жанр", movie.genre)}
          ${row("В ролях", movie.actors.join(", "))}
          ${row("Дата выхода", movie.releaseDate)}

          <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px;">
            <button class="trailer" type="button" style="padding: 14px 28px; background: #262626;
                border: 0; border-radius: 8px; color: #fff; font-size: 15px;
                font-weight: 600; cursor: pointer;">▶ Watch trailer</button>
            <button class="watch" type="button" style="padding: 14px 28px; background: #fa003f;
                border: 0; border-radius: 8px; color: #fff; font-size: 15px;
                font-weight: 600; cursor: pointer;">▶ Watch movie</button>
          </div>
        </div>
      </div>
    </article>
  `;

  popup.style.display = "flex";

  popup.querySelector(".close").onclick = closePopup;

  popup.querySelector(".trailer").onclick = function () {
    var search = movie.title + " " + movie.year + " official trailer";
    var url =
      "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(search);
    window.open(url, "_blank");
  };

  popup.querySelector(".watch").onclick = function () {
    window.location.href = "subscription/index.html";
  };
}

function closePopup() {
  popup.style.display = "none";
  popup.innerHTML = "";
}

function showSection(name) {
  document.getElementById("home").style.display = "none";
  document.getElementById("fav").style.display = "none";
  document.getElementById(name).style.display = "block";
}

fetch("/api/movies")
  .then(function (response) {
    if (!response.ok) throw new Error("Movie API unavailable");
    return response.json();
  })
  .then(function (data) {
    movies = data.movies.map(function (movie) {
      return { ...movie, saved: savedMovieIds.has(String(movie.id)) };
    });
    updatePage();
  })
  .catch(function (error) {
    console.error("Could not load movies:", error);
    movieGrid.innerHTML =
      "<p>Could not load movies. Check that the backend and database are running.</p>";
  });

fetch("/api/actors")
  .then(function (response) {
    if (!response.ok) throw new Error("Actor API unavailable");
    return response.json();
  })
  .then(renderActors)
  .catch(function (error) {
    console.error("Could not load actors:", error);
  });

document.getElementById("searchBtn").onclick = function () {
  showMovies(getMovies(), movieGrid);
};

searchInput.onkeyup = function (event) {
  if (event.key === "Enter") showMovies(getMovies(), movieGrid);
};

popup.onclick = function (event) {
  if (event.target === popup) closePopup();
};

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closePopup();
});

document.getElementById("adminMovieForm").addEventListener("submit", async function (event) {
  event.preventDefault();
  var form = event.currentTarget;
  var status = document.getElementById("adminMovieMessage");
  var values = Object.fromEntries(new FormData(form));
  values.cast_names = values.cast_names.split(",").map((name) => name.trim()).filter(Boolean);
  try {
    var response = await fetch("/api/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("spirit-tv-token") || ""}` },
      body: JSON.stringify(values),
    });
    var result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not add movie.");
    movies.push({ ...result.movie, saved: false });
    updatePage();
    form.reset();
    status.style.color = "#6be08a";
    status.textContent = "Movie added to the database and catalogue.";
  } catch (error) {
    status.style.color = "#ff6b6b";
    status.textContent = error.message;
  }
});

var tabs = document.querySelectorAll(".tab");

tabs.forEach(function (tab) {
  tab.onclick = function () {
    currentGenre = tab.dataset.category;

    tabs.forEach(function (other) {
      other.classList.remove("active");
    });
    tab.classList.add("active");

    showMovies(getMovies(), movieGrid);
  };
});
