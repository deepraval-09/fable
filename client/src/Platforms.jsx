import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

const IMG = "https://image.tmdb.org/t/p/w342";

const PLATFORMS = [
  { id: 8, name: "Netflix", color: "#E50914" },
  { id: 119, name: "Prime Video", color: "#00A8E1" },
  { id: 220, name: "JioCinema", color: "#D10074" },
  { id: 122, name: "Disney+ Hotstar", color: "#1F4C97" }
];

export default function Platforms() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "OTT Platforms | Fable";
    
    Promise.all(
      PLATFORMS.map(p => 
        Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/ott/${p.id}?type=movie`).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL}/api/ott/${p.id}?type=tv`).then(r => r.json())
        ]).then(([movies, tv]) => ({
          id: p.id,
          movies: (movies.results || []).slice(0, 10),
          tv: (tv.results || []).slice(0, 10)
        }))
      )
    ).then(results => {
      const newData = {};
      results.forEach(r => { 
        newData[r.id] = { movies: r.movies, tv: r.tv }; 
      });
      setData(newData);
      setLoading(false);
    });
  }, []);

  // UPDATED: Added Scroll Logic and fixed CSS aspect ratio for posters
  const Row = ({ items, type }) => {
    const rowRef = useRef(null);

    const scroll = (direction) => {
      if (rowRef.current) {
        const { scrollLeft, clientWidth } = rowRef.current;
        const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
        rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      }
    };

    return (
      <div style={{ position: "relative", marginBottom: "40px" }}>
        
        {/* Left Scroll Arrow */}
        <button 
          onClick={() => scroll('left')}
          style={{
            position: "absolute", left: "-20px", top: "45%", transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.6)", color: "white", border: "none", fontSize: "2rem",
            cursor: "pointer", zIndex: 10, padding: "10px", borderRadius: "50%", display: "none" 
          }}
          className="scroll-btn" // Added class so you can unhide it on desktop via CSS if desired
        >
          ‹
        </button>

        <div 
          ref={rowRef}
          style={{ 
            display: "flex", gap: "25px", overflowX: "auto", 
            padding: "20px 0 40px 15px", scrollbarWidth: "none", scrollBehavior: "smooth"
          }}
        >
          {loading ? (
            Array.from({ length: 10 }).map((_, n) => <div className="skeleton" key={n} style={{ minWidth: "160px", aspectRatio: "2/3" }} />)
          ) : (
            items?.map((m, index) => {
              const year = (m.release_date || m.first_air_date || "").slice(0, 4);
              return (
                <Link 
                  className="card" 
                  key={m.id} 
                  to={`/${type}/${m.id}`}
                  style={{ position: "relative", minWidth: "160px", flexShrink: 0 }}
                >
                  <div style={{
                    position: "absolute", top: "-5px", left: "-20px",
                    fontSize: "7rem", fontWeight: 900, lineHeight: 1,
                    color: "transparent", WebkitTextStroke: "2px white",
                    zIndex: 2, textShadow: "4px 4px 10px rgba(0,0,0,0.8)"
                  }}>
                    {index + 1}
                  </div>
                  
                  {/* FIXED: Aspect Ratio forces the poster not to crop */}
                  <div className="poster" style={{ aspectRatio: "2/3", overflow: "hidden", borderRadius: "8px" }}>
                    <img 
                      src={`${IMG}${m.poster_path}`} 
                      alt={m.title || m.name} 
                      loading="lazy" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {m.vote_average > 0 && (
                      <span className="rating" style={{ zIndex: 3 }}>★ {m.vote_average.toFixed(1)}</span>
                    )}
                  </div>
                  <p className="name" style={{ marginTop: "10px" }}>{m.title || m.name}</p>
                  <small>{type === 'movie' ? 'Movie' : 'Series'} {year && ` · ${year}`}</small>
                </Link>
              );
            })
          )}
        </div>

        {/* Right Scroll Arrow */}
        <button 
          onClick={() => scroll('right')}
          style={{
            position: "absolute", right: "-20px", top: "45%", transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.6)", color: "white", border: "none", fontSize: "2rem",
            cursor: "pointer", zIndex: 10, padding: "10px", borderRadius: "50%", display: "none"
          }}
          className="scroll-btn"
        >
          ›
        </button>
      </div>
    );
  };

  return (
    <main className="container" style={{ paddingBottom: "100px", paddingTop: "80px" }}>
      <h1 style={{ marginBottom: "40px", fontSize: "2rem" }}>Top 10 in India</h1>

      {PLATFORMS.map(platform => (
        <section key={platform.id} style={{ marginBottom: "80px" }}>
          
          <div style={{ marginBottom: "30px" }}>
            <h2 style={{ color: platform.color, margin: 0, fontSize: "2.5rem" }}>{platform.name}</h2>
          </div>

          <h3 style={{ marginBottom: "5px", fontSize: "1.2rem", color: "var(--muted)" }}>Top 10 Movies</h3>
          <Row items={data[platform.id]?.movies} type="movie" />

          <h3 style={{ marginBottom: "5px", fontSize: "1.2rem", color: "var(--muted)" }}>Top 10 Web Series</h3>
          <Row items={data[platform.id]?.tv} type="tv" />
          
        </section>
      ))}

      {/* Add quick CSS to unhide arrows only on desktop */}
      <style>{`
        @media (min-width: 768px) {
          .scroll-btn { display: block !important; }
        }
      `}</style>
    </main>
  );
}