import { useEffect, useState } from "react";

const BACK = "https://image.tmdb.org/t/p/w1280";

export default function Hero() {
  const [items, setItems] = useState([]);
  const [i, setI] = useState(0);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/trending`)
      .then((r) => r.json())
      .then((d) =>
        setItems((d.results || []).filter((m) => m.backdrop_path).slice(0, 5))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items]);

  if (!items.length) return <div className="hero hero-skeleton" />;

  const m = items[i];
  const date = m.release_date || m.first_air_date || "";

  return (
    <section
      className="hero"
      style={{ backgroundImage: `url(${BACK}${m.backdrop_path})` }}
    >
      <div className="hero-shade" />
      <div className="hero-content" key={m.id}>
        <span className="badge">
          {m.media_type === "tv" ? "Web Series" : "Movie"}
        </span>
        <h1>{m.title || m.name}</h1>
        <div className="meta">
          <span>★ {m.vote_average?.toFixed(1)}</span>
          <span>{date.slice(0, 4)}</span>
        </div>
        <p>{m.overview}</p>
      </div>
      <div className="dots">
        {items.map((_, n) => (
          <button
            key={n}
            className={n === i ? "dot active" : "dot"}
            onClick={() => setI(n)}
            aria-label={`Show slide ${n + 1}`}
          />
        ))}
      </div>
    </section>
  );
}