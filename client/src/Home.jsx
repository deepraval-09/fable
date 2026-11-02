import Hero from "./Hero";
import MovieRow from "./MovieRow";

export default function Home() {
  return (
    <>
      <Hero />
      <main className="container">
        <MovieRow id="cinemas" title="In Cinemas Now" endpoint="/api/movies/now-playing" sort="newest" type="movie" />
        <MovieRow id="soon" title="Coming Soon" endpoint="/api/movies/upcoming" sort="soonest" type="movie" />
        <MovieRow id="series" title="New Web Series" endpoint="/api/series/on-air" sort="newest" type="tv" />
      </main>
    </>
  );
}