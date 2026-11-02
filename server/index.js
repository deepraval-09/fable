import express from "express";
import cors from "cors";
import compression from "compression";
import ytSearch from "yt-search"; // New YouTube fallback API!
import "dotenv/config";

const app = express();
app.use(compression());
app.use(
  cors({
    origin: ["https://fable-movies.vercel.app", "http://localhost:5173"],
  })
);

const cache = new Map();
const TTL = 30 * 60 * 1000; // 30 minutes

const tmdb = async (path) => {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.time < TTL) return hit.data;

  const res = await fetch(`https://api.themoviedb.org/3${path}`, {
    headers: { Authorization: `Bearer ${process.env.TMDB_TOKEN}` },
  });
  if (!res.ok) throw new Error("TMDB error");

  const data = await res.json();
  if (cache.size > 500) cache.clear(); 
  cache.set(path, { data, time: Date.now() });
  return data;
};

const getDate = (days = 0) => new Date(Date.now() + days * 864e5).toISOString().split("T")[0];

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Updated: India-first Trending for the Hero Banner
app.get("/api/trending", async (req, res) => {
  const lang = req.query.lang && req.query.lang !== "all" ? `&with_original_language=${req.query.lang}` : "";
  try {
    const path = `/discover/movie?with_origin_country=IN&region=IN&sort_by=popularity.desc${lang}`;
    const data = await tmdb(path);
    res.set("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch { res.status(500).json({ error: "Failed" }); }
});

app.get("/api/movies/now-playing", async (req, res) => {
  const lang = req.query.lang && req.query.lang !== "all" ? `&with_original_language=${req.query.lang}` : "";
  try {
    const path = `/discover/movie?with_origin_country=IN&region=IN&with_release_type=2|3&primary_release_date.gte=${getDate(-45)}&primary_release_date.lte=${getDate(0)}&sort_by=popularity.desc${lang}`;
    res.set("Cache-Control", "public, max-age=300");
    res.json(await tmdb(path));
  } catch { res.status(500).json({ error: "Failed" }); }
});

app.get("/api/movies/upcoming", async (req, res) => {
  const lang = req.query.lang && req.query.lang !== "all" ? `&with_original_language=${req.query.lang}` : "";
  try {
    const path = `/discover/movie?with_origin_country=IN&region=IN&with_release_type=2|3&primary_release_date.gte=${getDate(1)}&primary_release_date.lte=${getDate(45)}&sort_by=popularity.desc${lang}`;
    res.set("Cache-Control", "public, max-age=300");
    res.json(await tmdb(path));
  } catch { res.status(500).json({ error: "Failed" }); }
});

app.get("/api/series/on-air", async (req, res) => {
  const lang = req.query.lang && req.query.lang !== "all" ? `&with_original_language=${req.query.lang}` : "";
  try {
    const path = `/discover/tv?with_origin_country=IN&first_air_date.gte=${getDate(-120)}&first_air_date.lte=${getDate(0)}&sort_by=popularity.desc${lang}`;
    res.set("Cache-Control", "public, max-age=300");
    res.json(await tmdb(path));
  } catch { res.status(500).json({ error: "Failed" }); }
});

// Updated: Details page now uses YouTube Fallback API
app.get("/api/details/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  if (!["movie", "tv"].includes(type) || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Bad request" });
  }
  try {
    const data = await tmdb(
      `/${type}/${id}?append_to_response=videos,credits,similar,watch/providers`
    );

    // 🚀 THE FIX: If TMDB has no YouTube trailer, we scrape it manually!
    const hasTrailer = data.videos?.results?.some(v => v.type === "Trailer" && v.site === "YouTube");
    
    if (!hasTrailer) {
      const title = data.title || data.name;
      const year = (data.release_date || data.first_air_date || "").substring(0, 4);
      
      try {
        const yt = await ytSearch(`${title} ${year} movie official trailer`);
        if (yt && yt.videos.length > 0) {
          if (!data.videos) data.videos = { results: [] };
          data.videos.results.push({
            key: yt.videos[0].videoId,
            type: "Trailer",
            site: "YouTube",
            name: "YouTube Search Result"
          });
        }
      } catch (err) {
        console.log("YouTube fallback failed for", title);
      }
    }

    res.set("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// Updated: Search now respects language filters
app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 100);
  const lang = req.query.lang || "all";
  
  if (q.length < 2) return res.json({ results: [] });
  try {
    const data = await tmdb(
      `/search/multi?query=${encodeURIComponent(q)}&include_adult=false&page=1`
    );
    
    let results = (data.results || [])
      .filter((m) => (m.media_type === "movie" || m.media_type === "tv") && m.poster_path);

    // Filter by language if the user selected one
    if (lang !== "all") {
      results = results.filter(m => m.original_language === lang);
    }

    results = results.map(({ id, media_type, title, name, poster_path, release_date, first_air_date, vote_average }) => ({
        id, media_type, title, name, poster_path, release_date, first_air_date, vote_average,
      }));
      
    res.set("Cache-Control", "public, max-age=300");
    res.json({ results });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/:type/:id/providers", async (req, res) => {
  const { type, id } = req.params;
  if (!["movie", "tv"].includes(type) || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Bad request" });
  }
  try {
    res.json(await tmdb(`/${type}/${id}/watch/providers`));
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

app.listen(process.env.PORT, () => console.log("Server running"));