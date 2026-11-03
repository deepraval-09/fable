import express from "express";
import cors from "cors";
import compression from "compression";
import ytSearch from "yt-search"; 
import "dotenv/config";

const app = express();
app.use(compression());
app.use(
  cors({
    origin: ["https://fable-movies.vercel.app", "http://localhost:5173"],
  })
);

const cache = new Map();
const TTL = 30 * 60 * 1000; 

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

// 🚀 UPDATED: Merging TMDB, OMDb (IMDb Ratings), and TVmaze APIs
app.get("/api/details/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  if (!["movie", "tv"].includes(type) || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Bad request" });
  }
  try {
    // 1. Fetch primary data from TMDB (We added 'external_ids' to get the IMDb ID)
    const data = await tmdb(`/${type}/${id}?append_to_response=videos,credits,similar,watch/providers,external_ids`);

    // 2. Extract IMDB ID to use with the other APIs
    const imdbId = data.external_ids?.imdb_id;
    let omdbData = null;
    let tvmazeData = null;

    // 3. Concurrently fetch supplemental data if we have an IMDb ID
    if (imdbId) {
      const fetchPromises = [];
      
      // Fetch OMDb (for IMDb Ratings)
      if (process.env.OMDB_API_KEY) {
        fetchPromises.push(
          fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${process.env.OMDB_API_KEY}`)
            .then(r => r.json())
            .then(d => omdbData = d)
            .catch(() => console.log("OMDb fetch failed"))
        );
      }

      // Fetch TVmaze (only for TV Shows to get accurate network/status)
      if (type === "tv") {
        fetchPromises.push(
          fetch(`https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`)
            .then(r => r.json())
            .then(d => tvmazeData = d)
            .catch(() => console.log("TVmaze fetch failed"))
        );
      }

      await Promise.allSettled(fetchPromises);
    }

    // 4. Attach the supplemental data to our TMDB object so the frontend can read it
    data.imdb_rating = omdbData?.imdbRating && omdbData.imdbRating !== "N/A" ? omdbData.imdbRating : null;
    data.tvmaze_network = tvmazeData?.network?.name || tvmazeData?.webChannel?.name || null;
    data.tvmaze_status = tvmazeData?.status || null;

    // 5. YouTube Trailer Fallback (Existing logic)
    const hasTrailer = data.videos?.results?.some(v => v.type === "Trailer" && v.site === "YouTube");
    if (!hasTrailer) {
      const title = data.title || data.name;
      const year = (data.release_date || data.first_air_date || "").substring(0, 4);
      try {
        const yt = await ytSearch(`${title} ${year} official trailer`);
        if (yt && yt.videos.length > 0) {
          if (!data.videos) data.videos = { results: [] };
          data.videos.results.push({
            key: yt.videos[0].videoId, type: "Trailer", site: "YouTube", name: "YouTube Search Result"
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

app.get("/api/ott/:providerId", async (req, res) => {
  const { providerId } = req.params;
  const lang = req.query.lang && req.query.lang !== "all" ? `&with_original_language=${req.query.lang}` : "";
  const type = req.query.type || "movie"; 
  
  try {
    const dateQuery = type === "movie" 
      ? `&primary_release_date.gte=${getDate(-1095)}` 
      : `&first_air_date.gte=${getDate(-1095)}`;

    const primaryPath = `/discover/${type}?watch_region=IN&with_watch_providers=${providerId}&sort_by=popularity.desc${dateQuery}${lang}`;
    const primaryData = await tmdb(primaryPath);
    let results = primaryData.results || [];

    if (results.length < 10) {
      const fallbackPath = `/discover/${type}?with_origin_country=IN&region=IN&sort_by=popularity.desc${lang}`;
      const fallbackData = await tmdb(fallbackPath);
      
      const existingIds = new Set(results.map(item => item.id));
      const newItems = (fallbackData.results || []).filter(item => !existingIds.has(item.id));
      
      results = [...results, ...newItems].slice(0, 10);
      primaryData.results = results;
    }

    res.set("Cache-Control", "public, max-age=300");
    res.json(primaryData);
  } catch { res.status(500).json({ error: "Failed" }); }
});

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