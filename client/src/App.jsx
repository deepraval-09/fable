import MovieRow from "./MovieRow";

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>Freehour</h1>
        <p>New movies and web series, all in one place</p>
      </header>

      <MovieRow title="In Cinemas Now" endpoint="/api/movies/now-playing" />
      <MovieRow title="Coming Soon" endpoint="/api/movies/upcoming" />
      <MovieRow title="New Web Series" endpoint="/api/series/on-air" />

      <footer>
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </div>
  );
}