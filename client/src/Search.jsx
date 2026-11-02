import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SearchIcon } from "./Icons";

const IMG = "https://image.tmdb.org/t/p/w342";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const lang = params.get("lang") || "all"; // Catch the language from the URL if present
  
  const [text, setText] = useState(q);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    document.title = "Search | Fable";
    return () => {
      document.title = "Fable | New Movies & Web Series";
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = text.trim();
      if (next !== q) setParams(next ? { q: next, lang } : { lang }, { replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [text, lang, q, setParams]); 

  useEffect(() => {
    setText((t) => (t.trim() === q ? t : q));
  }, [q]);

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    
    // Updated: Send the language parameter to the backend
    fetch(`${import.meta.env.VITE_API_URL}/api/search?q=${encodeURIComponent(q)}&lang=${lang}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        if (!cancelled) setResults(d.results || []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, lang]);

  return (
    <main className="container search-page">
      <div className="search-box">
        <span className="s-icon"><SearchIcon /></span>
        <input
          ref={inputRef}
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search movies and web series..."
          aria-label="Search"
        />
        {text && (
          <button className="clear" onClick={() => setText("")} aria-label="Clear">×</button>
        )}
      </div>

      {q.length < 2 && !loading && (
        <p className="msg center">Type at least 2 letters to search.</p>
      )}
      {error && <p className="msg center">Search failed. Please try again.</p>}
      {!loading && !error && q.length >= 2 && results.length === 0 && (
        <p className="msg center">No results for “{q}”.</p>
      )}

      <div className="grid">
        {loading &&
          Array.from({ length: 10 }).map((_, n) => <div className="skeleton" key={n} />)}

        {!loading &&
          results.map((m) => {
            const year = (m.release_date || m.first_air_date || "").slice(0, 4);
            return (
              <Link className="card" key={`${m.media_type}-${m.id}`} to={`/${m.media_type}/${m.id}`}>
                <div className="poster">
                  <img src={`${IMG}${m.poster_path}`} alt={m.title || m.name} loading="lazy" />
                  {m.vote_average > 0 && (
                    <span className="rating">★ {m.vote_average.toFixed(1)}</span>
                  )}
                </div>
                <p className="name">{m.title || m.name}</p>
                <small>
                  {m.media_type === "tv" ? "Series" : "Movie"}
                  {year && ` · ${year}`}
                </small>
              </Link>
            );
          })}
      </div>
    </main>
  );
}