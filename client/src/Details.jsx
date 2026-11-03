import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Scroller from "./Scroller";

const BACK = "https://image.tmdb.org/t/p/w1280";
const POSTER = "https://image.tmdb.org/t/p/w500";
const CARD = "https://image.tmdb.org/t/p/w342";
const PROFILE = "https://image.tmdb.org/t/p/w185";
const LOGO = "https://image.tmdb.org/t/p/w92";

export default function Details({ type }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setData(null);
    setError(false);
    setPlaying(false);
    fetch(`${import.meta.env.VITE_API_URL}/api/details/${type}/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, [type, id]);

  useEffect(() => {
    if (data) document.title = `${data.title || data.name} | Fable`;
    return () => {
      document.title = "Fable | New Movies & Web Series";
    };
  }, [data]);

  if (error)
    return (
      <div className="page-msg">
        Could not load this title. <Link to="/">Go home</Link>
      </div>
    );
  if (!data) return <div className="page-msg">Loading...</div>;

  const title = data.title || data.name;
  const date = data.release_date || data.first_air_date || "";
  const runtime = data.runtime
    ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m`
    : data.episode_run_time?.[0]
    ? `${data.episode_run_time[0]} min/episode`
    : null;
  const vids = data.videos?.results || [];
  const trailer =
    vids.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    vids.find((v) => v.site === "YouTube");
  const cast = (data.credits?.cast || []).slice(0, 12);
  const similar = (data.similar?.results || [])
    .filter((m) => m.poster_path)
    .slice(0, 12);
  const prov = data["watch/providers"]?.results?.IN;
  const groups = [
    ["Stream", prov?.flatrate],
    ["Rent", prov?.rent],
    ["Buy", prov?.buy],
  ].filter(([, list]) => list?.length);

  return (
    <>
      <section
        className="d-hero"
        style={{
          backgroundImage: data.backdrop_path
            ? `url(${BACK}${data.backdrop_path})`
            : "none",
        }}
      >
        <div className="hero-shade" />
        <div className="d-inner">
          {data.poster_path && (
            <img className="d-poster" src={`${POSTER}${data.poster_path}`} alt={title} />
          )}
          <div className="d-info">
            <h1>{title}</h1>
            {data.tagline && <p className="tagline">{data.tagline}</p>}
            
            <div className="meta" style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "center" }}>
              {/* TMDB Rating */}
              {data.vote_average > 0 && <span style={{ background: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: "4px" }}>TMDB ★ {data.vote_average.toFixed(1)}</span>}
              
              {/* 🚀 NEW: IMDb Rating from OMDb API */}
              {data.imdb_rating && <span style={{ background: "#f5c518", color: "black", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" }}>IMDb ★ {data.imdb_rating}</span>}

              {date && (
                <span>
                  {new Date(date).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              )}
              {runtime && <span>{runtime}</span>}

              {/* 🚀 NEW: TVmaze Network & Status (Only shows for TV series) */}
              {data.tvmaze_network && <span>Network: {data.tvmaze_network}</span>}
              {data.tvmaze_status && <span style={{ color: data.tvmaze_status === "Ended" ? "var(--muted)" : "#4ade80" }}>{data.tvmaze_status}</span>}
            </div>

            <div className="chips" style={{ marginTop: "15px" }}>
              {(data.genres || []).map((g) => (
                <span className="chip" key={g.id}>{g.name}</span>
              ))}
            </div>
            <p className="overview">{data.overview || "No overview available yet."}</p>
            {trailer && (
              <button className="btn" onClick={() => setPlaying((p) => !p)}>
                {playing ? "Close trailer" : "▶ Watch trailer"}
              </button>
            )}
          </div>
        </div>
      </section>

      <main className="container d-main">
        {playing && trailer && (
          <div className="trailer">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1`}
              title="Trailer"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <section className="d-section">
          <h2>Where to watch in India</h2>
          {groups.length ? (
            groups.map(([label, list]) => (
              <div className="prov-group" key={label}>
                <span className="prov-label">{label}</span>
                <div className="prov-list">
                  {list.map((p) => (
                    <div className="prov" key={p.provider_id}>
                      <img src={`${LOGO}${p.logo_path}`} alt="" />
                      <span>{p.provider_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="msg">
              No streaming info yet. It may still be in cinemas or not announced.
            </p>
          )}
          <small className="credit">Streaming data by JustWatch, via TMDB.</small>
        </section>

        {cast.length > 0 && (
          <section className="d-section">
            <h2>Cast</h2>
            <Scroller className="cast" arrowTop={55}>
              {cast.map((c) => (
                <div className="cast-card" key={c.id}>
                  {c.profile_path ? (
                    <img src={`${PROFILE}${c.profile_path}`} alt={c.name} loading="lazy" />
                  ) : (
                    <div className="cast-ph">{c.name[0]}</div>
                  )}
                  <p>{c.name}</p>
                  <small>{c.character}</small>
                </div>
              ))}
            </Scroller>
          </section>
        )}

        {similar.length > 0 && (
          <section className="d-section">
            <h2>More like this</h2>
            <Scroller>
              {similar.map((m) => (
                <Link className="card" key={m.id} to={`/${type}/${m.id}`}>
                  <div className="poster">
                    <img src={`${CARD}${m.poster_path}`} alt={m.title || m.name} loading="lazy" />
                  </div>
                  <p className="name">{m.title || m.name}</p>
                </Link>
              ))}
            </Scroller>
          </section>
        )}
      </main>
    </>
  );
}