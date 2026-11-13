import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function Watch() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeServer, setActiveServer] = useState(0);
  
  // Web Series States
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [seasonDetails, setSeasonDetails] = useState(null);

  // Clean, ad-free / reliable servers
  const SERVERS = [
    { 
      name: "Server 1 (AutoEmbed)", 
      getUrl: (t, i, s, e) => t === 'movie' 
        ? `https://autoembed.co/movie/tmdb/${i}` 
        : `https://autoembed.co/tv/tmdb/${i}-${s}-${e}` 
    },
    { 
      name: "Server 2 (VidLink)", 
      getUrl: (t, i, s, e) => t === 'movie' 
        ? `https://vidlink.pro/movie/${i}` 
        : `https://vidlink.pro/tv/${i}/${s}/${e}` 
    },
    { 
      name: "Server 3 (Multiembed)", 
      getUrl: (t, i, s, e) => t === 'movie' 
        ? `https://multiembed.mov/?video_id=${i}&tmdb=1` 
        : `https://multiembed.mov/?video_id=${i}&tmdb=1&s=${s}&e=${e}` 
    },
    { 
      name: "Server 4 (Vidsrc VIP)", 
      getUrl: (t, i, s, e) => t === 'movie' 
        ? `https://vidsrc.pro/embed/movie/${i}` 
        : `https://vidsrc.pro/embed/tv/${i}/${s}/${e}` 
    }
  ];

  // Fetch title details & seasons (for TV shows)
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/details/${type}/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        document.title = `Watching ${d.title || d.name} | Fable`;
      })
      .catch(() => {});
  }, [type, id]);

  // Fetch specific season episode count when season changes for TV shows
  useEffect(() => {
    if (type === "tv") {
      fetch(`https://api.themoviedb.org/3/tv/${id}/season/${season}`, {
        headers: { Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN || ""}` }
      })
      .then(r => r.json())
      .then(setSeasonDetails)
      .catch(() => setSeasonDetails(null));
    }
  }, [type, id, season]);

  const title = data?.title || data?.name || "Loading...";
  const seasonsCount = data?.number_of_seasons || 1;
  const episodesCount = seasonDetails?.episodes?.length || 20;

  return (
    <div style={{ padding: "20px max(4vw, 20px) 60px", maxWidth: "1400px", margin: "0 auto" }}>
      
      {/* Top Bar / Back Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button 
          onClick={() => navigate(-1)} 
          className="btn"
          style={{ background: "rgba(255,255,255,0.1)", padding: "8px 16px", fontSize: "0.9rem" }}
        >
          ← Back to Details
        </button>
        <Link to="/" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.9rem" }}>Home</Link>
      </div>

      <h1 style={{ fontSize: "1.8rem", marginBottom: "15px", color: "#fff" }}>
        {title} {type === "tv" && <span style={{ color: "var(--muted)", fontSize: "1.2rem" }}>(S{season} E{episode})</span>}
      </h1>

      {/* Server Switcher */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px", overflowX: "auto", paddingBottom: "5px" }}>
        {SERVERS.map((server, index) => (
          <button
            key={index}
            onClick={() => setActiveServer(index)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              whiteSpace: "nowrap",
              background: activeServer === index ? "#E50914" : "rgba(255,255,255,0.1)",
              color: "white",
              transition: "background 0.2s"
            }}
          >
            {server.name}
          </button>
        ))}
      </div>

      {/* TV Show Season & Episode Selectors */}
      {type === "tv" && (
        <div style={{ display: "flex", gap: "15px", marginBottom: "15px", flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "5px" }}>Season</label>
            <select 
              value={season} 
              onChange={(e) => { setSeason(Number(e.target.value)); setEpisode(1); }}
              style={{ background: "#1a1a1a", color: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              {Array.from({ length: seasonsCount }, (_, i) => (
                <option key={i + 1} value={i + 1}>Season {i + 1}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "5px" }}>Episode</label>
            <select 
              value={episode} 
              onChange={(e) => setEpisode(Number(e.target.value))}
              style={{ background: "#1a1a1a", color: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              {Array.from({ length: episodesCount }, (_, i) => (
                <option key={i + 1} value={i + 1}>Episode {i + 1}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Video Frame */}
      <div style={{ width: "100%", aspectRatio: "16/9", background: "black", borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.8)" }}>
        <iframe
          src={SERVERS[activeServer].getUrl(type, id, season, episode)}
          style={{ width: "100%", height: "100%", border: "none" }}
          allowFullScreen
          title="Fable Theater Player"
        />
      </div>

      <p style={{ marginTop: "15px", color: "var(--muted)", textAlign: "center", fontSize: "0.9rem" }}>
        * If a server fails to load or shows a black screen, instantly switch to another server above.
      </p>

    </div>
  );
}