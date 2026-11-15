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

  // YouTube Matcher States
  const [isSearchingYT, setIsSearchingYT] = useState(false);
  const [ytVideos, setYtVideos] = useState([]); 
  const [currentYtIndex, setCurrentYtIndex] = useState(0); 
  const [ytError, setYtError] = useState(null);
  const [ytLanguage, setYtLanguage] = useState("Hindi"); 

  // 🚀 Server 1 & 2 Restored. Server 4 maps directly to NetMirror's backend engine (vidsrc.cc) to bypass the Sandbox block.
  const SERVERS = [
    { 
      name: "Server 1 (AutoEmbed)", 
      isYouTube: false,
      getUrl: (t, i, s, e) => t === 'movie' ? `https://autoembed.co/movie/tmdb/${i}?lang=hi` : `https://autoembed.co/tv/tmdb/${i}-${s}-${e}?lang=hi` 
    },
    { 
      name: "Server 2 (VidLink)", 
      isYouTube: false,
      getUrl: (t, i, s, e) => t === 'movie' ? `https://vidlink.pro/movie/${i}?lang=hi` : `https://vidlink.pro/tv/${i}/${s}/${e}?lang=hi` 
    },
    {
      name: "Server 3 (YouTube Matches)",
      isYouTube: true, 
      getUrl: () => "" 
    },
    { 
      name: "Server 4 (NetMirror Backend)", 
      isYouTube: false,
      getUrl: (t, i, s, e) => t === 'movie' ? `https://vidsrc.cc/v2/embed/movie/${i}` : `https://vidsrc.cc/v2/embed/tv/${i}/${s}/${e}` 
    }
  ];

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/details/${type}/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        document.title = `Watching ${d.title || d.name} | Fable`;
      })
      .catch(() => {});
  }, [type, id]);

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

  // SERVER 3 FETCH
  useEffect(() => {
    if (SERVERS[activeServer].isYouTube) {
      setIsSearchingYT(true);
      setYtVideos([]);
      setCurrentYtIndex(0);
      setYtError(null);
      
      const query = type === "tv" ? `?season=${season}&episode=${episode}&lang=${ytLanguage}` : `?lang=${ytLanguage}`;
      
      fetch(`${import.meta.env.VITE_API_URL}/api/youtube-full/${type}/${id}${query}`)
        .then(r => r.json())
        .then(d => {
          if (d.videos && d.videos.length > 0) {
            setYtVideos(d.videos);
            setCurrentYtIndex(0); 
          } else {
            setYtError(d.error || "No matching movie found on YouTube.");
          }
          setIsSearchingYT(false);
        })
        .catch(() => {
          setYtError("Failed to search YouTube.");
          setIsSearchingYT(false);
        });
    }
  }, [activeServer, type, id, season, episode, ytLanguage]);

  const title = data?.title || data?.name || "Loading...";
  const seasonsCount = data?.number_of_seasons || 1;
  const episodesCount = seasonDetails?.episodes?.length || 20;

  return (
    <div style={{ padding: "20px max(4vw, 20px) 60px", maxWidth: "1400px", margin: "0 auto" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button onClick={() => navigate(-1)} className="btn" style={{ background: "rgba(255,255,255,0.1)", padding: "8px 16px", fontSize: "0.9rem" }}>
          ← Back to Details
        </button>
        <Link to="/" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.9rem" }}>Home</Link>
      </div>

      <h1 style={{ fontSize: "1.8rem", marginBottom: "15px", color: "#fff" }}>
        {title} {type === "tv" && <span style={{ color: "var(--muted)", fontSize: "1.2rem" }}>(S{season} E{episode})</span>}
      </h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "15px", overflowX: "auto", paddingBottom: "5px" }}>
        {SERVERS.map((server, index) => (
          <button
            key={index}
            onClick={() => setActiveServer(index)}
            style={{
              padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap",
              background: activeServer === index ? "#E50914" : "rgba(255,255,255,0.1)", color: "white", transition: "background 0.2s"
            }}
          >
            {server.name}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "15px", marginBottom: "15px", flexWrap: "wrap", alignItems: "flex-end" }}>
        
        {type === "tv" && (
          <>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "5px" }}>Season</label>
              <select value={season} onChange={(e) => { setSeason(Number(e.target.value)); setEpisode(1); }} style={{ background: "#1a1a1a", color: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)" }}>
                {Array.from({ length: seasonsCount }, (_, i) => (<option key={i + 1} value={i + 1}>Season {i + 1}</option>))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "5px" }}>Episode</label>
              <select value={episode} onChange={(e) => setEpisode(Number(e.target.value))} style={{ background: "#1a1a1a", color: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)" }}>
                {Array.from({ length: episodesCount }, (_, i) => (<option key={i + 1} value={i + 1}>Episode {i + 1}</option>))}
              </select>
            </div>
          </>
        )}

        {SERVERS[activeServer].isYouTube && (
          <>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "5px" }}>Language Selection</label>
              <select 
                value={ytLanguage} 
                onChange={(e) => setYtLanguage(e.target.value)} 
                style={{ background: "#1a1a1a", color: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #E50914", fontWeight: "bold", cursor: "pointer" }}
              >
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
                <option value="Gujarati">Gujarati</option>
              </select>
            </div>

            {ytVideos.length > 1 && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "5px" }}>Match Result (Top 10)</label>
                <select 
                  value={currentYtIndex} 
                  onChange={(e) => setCurrentYtIndex(Number(e.target.value))} 
                  style={{ background: "#1a1a1a", color: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}
                >
                  {ytVideos.map((video, idx) => (
                    <option key={idx} value={idx}>
                      Choice {idx + 1} (Runtime: {video.duration}m)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ width: "100%", aspectRatio: "16/9", background: "black", borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.8)" }}>
        
        {SERVERS[activeServer].isYouTube ? (
          <div style={{ width: "100%", height: "100%" }}>
            {isSearchingYT ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--muted)" }}>
                Fetching Top 10 matches from YouTube...
              </div>
            ) : ytError ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--muted)" }}>
                {ytError}
              </div>
            ) : ytVideos.length > 0 ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${ytVideos[currentYtIndex].videoId}?autoplay=1`}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="YouTube Player"
              />
            ) : null}
          </div>
        ) : (
          <iframe
            key={`${activeServer}-${type}-${id}-${season}-${episode}`}
            src={SERVERS[activeServer].getUrl(type, id, season, episode)}
            style={{ width: "100%", height: "100%", border: "none" }}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title="Fable Theater Player"
          />
        )}
        
      </div>
      
      <p style={{ marginTop: "15px", color: "var(--muted)", textAlign: "center", fontSize: "0.9rem" }}>
        * If a YouTube video is a fake, simply click the <strong>"Match Result"</strong> dropdown to load the next best choice.
      </p>

    </div>
  );
}