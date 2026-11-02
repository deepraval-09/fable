import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const BACK = "https://image.tmdb.org/t/p/w1280";

export default function Hero({ lang = "all" }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [i, setI] = useState(0);
  const [slow, setSlow] = useState(false);
  const startX = useRef(null);
  const dragged = useRef(false);

  useEffect(() => {
    // Updated: Fetch India-first trending based on language prop
    fetch(`${import.meta.env.VITE_API_URL}/api/trending?lang=${lang}`)
      .then((r) => r.json())
      .then((d) =>
        setItems((d.results || []).filter((m) => m.backdrop_path).slice(0, 5))
      )
      .catch(() => {});
  }, [lang]); // Re-fetch if language changes

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % items.length), 6000);
    return () => clearTimeout(t);
  }, [i, items]);

  if (!items.length)
    return (
      <div className="hero hero-skeleton">
        {slow && (
          <p className="wake">
            Waking up the server... this can take up to a minute on the first visit.
          </p>
        )}
      </div>
    );

  const m = items[i];
  const date = m.release_date || m.first_air_date || "";
  const path = `/${m.media_type === "tv" ? "tv" : "movie"}/${m.id}`;
  const go = (dir) => setI((x) => (x + dir + items.length) % items.length);

  const onPointerDown = (e) => {
    if (e.button > 0) return;
    startX.current = e.clientX;
    dragged.current = false;
  };

  const onPointerUp = (e) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 50) {
      dragged.current = true;
      go(dx < 0 ? 1 : -1);
    }
  };

  const cancelDrag = () => {
    startX.current = null;
  };

  const onClick = (e) => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    if (e.target.closest("button, a")) return;
    navigate(path);
  };

  return (
    <section
      className="hero"
      style={{ backgroundImage: `url(${BACK}${m.backdrop_path})` }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={cancelDrag}
      onPointerCancel={cancelDrag}
      onClick={onClick}
    >
      <div className="hero-shade" />

      <button className="hero-arrow prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
      <button className="hero-arrow next" onClick={() => go(1)} aria-label="Next">›</button>

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
        <Link className="btn" to={path}>More info</Link>
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