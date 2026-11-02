import Navbar from "./Navbar";
import Hero from "./Hero";
import MovieRow from "./MovieRow";

export default function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <main className="container">
        <MovieRow id="cinemas" title="In Cinemas Now" endpoint="/api/movies/now-playing" sort="newest" />
        <MovieRow id="soon" title="Coming Soon" endpoint="/api/movies/upcoming" sort="soonest" />
        <MovieRow id="series" title="New Web Series" endpoint="/api/series/on-air" sort="newest" />
      </main>
      <footer>
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </>
  );
}