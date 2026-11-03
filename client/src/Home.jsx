import { useState } from "react";
import Hero from "./Hero";
import MovieRow from "./MovieRow";

const LANGUAGES = [
  { id: "all", label: "All India" },
  { id: "hi", label: "Hindi" },
  { id: "gu", label: "Gujarati" },
  { id: "ta", label: "Tamil" },
  { id: "te", label: "Telugu" },
  { id: "ml", label: "Malayalam" },
];

export default function Home() {
  const [lang, setLang] = useState("all");

  return (
    <>
      <Hero lang={lang} />
      <main className="container">
        
        <div style={{
          display: "flex", gap: "10px", overflowX: "auto",
          padding: "10px 0 24px", scrollbarWidth: "none"
        }}>
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              className="chip"
              style={{
                border: "none", cursor: "pointer", fontWeight: 600,
                whiteSpace: "nowrap", padding: "8px 16px",
                background: lang === l.id ? "var(--accent)" : "rgba(255,255,255,.08)",
                color: lang === l.id ? "#fff" : "var(--muted)", 
                transition: "all 0.2s"
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Core Rows */}
        <MovieRow id="cinemas" title="In Cinemas Now" endpoint={`/api/movies/now-playing?lang=${lang}`} sort="newest" type="movie" />
        <MovieRow id="soon" title="Coming Soon" endpoint={`/api/movies/upcoming?lang=${lang}`} sort="soonest" type="movie" />
        <MovieRow id="series" title="New Web Series" endpoint={`/api/series/on-air?lang=${lang}`} sort="newest" type="tv" />

        {/* OTT Rows - Only Netflix and Prime Video remain */}
        <div className="ott-section" style={{ marginTop: "40px" }}>
          <h2 style={{ marginBottom: "20px", fontSize: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Streaming Now</h2>
          <MovieRow id="netflix" title="Trending on Netflix" endpoint={`/api/ott/8?type=movie&lang=${lang}`} sort="newest" type="movie" />
          <MovieRow id="prime" title="Trending on Prime Video" endpoint={`/api/ott/119?type=movie&lang=${lang}`} sort="newest" type="movie" />
        </div>
        
      </main>
    </>
  );
}