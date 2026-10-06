const popularMovies = document.getElementById("popularMovies");
const popularMessage = document.getElementById("popularMessage");
b
async function showPopularMovies() {
  try {
    const response = await fetch("/api/movies");
    const data = await response.json();

    if (!response.ok) {
      console.error("Could not load movies.");
      return;
    }

    const movies = data.movies || [];
    popularMovies.innerHTML = movies
      .map(
        (movie) => `
      <article class="popular-movie">
        <img src="${movie.poster || ""}" alt="${movie.title || "Movie poster"}">
        <h3>${movie.title}</h3>
      </article>
    `,
      )
      .join("");

    popularMessage.textContent = movies.length ? "" : "No movies found.";
  } catch (error) {
    popularMessage.textContent = error.message;
  }
}

showPopularMovies();
