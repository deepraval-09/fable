import { useEffect, useState } from "react";

const IMG = "https://image.tmdb.org/t/p/w342";

export default function MovieRow({ title, endpoint }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}${endpoint}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setItems(d.results || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [endpoint]);

  return (
    <section className="row">
      <h2>{title}</h2>
      {loading && <p className="msg">Loading...</p>}
      {error && <p className="msg">Could not load data.</p>}
      <div className="cards">
        {items.map((m) => (
          <div className="card" key={m.id}>
            {m.poster_path ? (
              <img src={`${IMG}${m.poster_path}`} alt={m.title || m.name} />
            ) : (
              <div className="no-poster">No poster</div>
            )}
            <p className="name">{m.title || m.name}</p>
            <small>{m.release_date || m.first_air_date}</small>
          </div>
        ))}
      </div>
    </section>
  );
}