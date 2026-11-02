import { useEffect, useRef, useState } from "react";

const IMG = "https://image.tmdb.org/t/p/w342";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBA";

export default function MovieRow({ id, title, endpoint, sort }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}${endpoint}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        let list = (d.results || []).filter((m) => m.poster_path);
        const dateOf = (m) => m.release_date || m.first_air_date || "";
        if (sort === "newest")
          list.sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
        if (sort === "soonest")
          list.sort((a, b) => dateOf(a).localeCompare(dateOf(b)));
        setItems(list);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [endpoint, sort]);

  const scroll = (dir) =>
    ref.current?.scrollBy({ left: dir * 640, behavior: "smooth" });

  return (
    <section className="row" id={id}>
      <h2>{title}</h2>
      {error && <p className="msg">Could not load data. Please try again.</p>}

      <button className="arrow left" onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
      <button className="arrow right" onClick={() => scroll(1)} aria-label="Scroll right">›</button>

      <div className="cards" ref={ref}>
        {loading &&
          Array.from({ length: 8 }).map((_, n) => (
            <div className="skeleton" key={n} />
          ))}

        {items.map((m) => (
          <div className="card" key={m.id}>
            <div className="poster">
              <img
                src={`${IMG}${m.poster_path}`}
                alt={m.title || m.name}
                loading="lazy"
              />
              {m.vote_average > 0 && (
                <span className="rating">★ {m.vote_average.toFixed(1)}</span>
              )}
            </div>
            <p className="name">{m.title || m.name}</p>
            <small>{fmt(m.release_date || m.first_air_date)}</small>
          </div>
        ))}
      </div>
    </section>
  );
}