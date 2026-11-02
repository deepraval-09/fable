import express from "express";
import cors from "cors";
import compression from "compression";
import "dotenv/config";

const app = express();
app.use(compression());
app.use(
  cors({
    origin: ["https://fable-movies.vercel.app/", "http://localhost:5173"],
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
  if (cache.size > 500) cache.clear(); // safety limit so memory never grows forever
  cache.set(path, { data, time: Date.now() });
  return data;
};

const send = (path) => async (req, res) => {
  try {
    const data = await tmdb(path);
    res.set("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed" });
  }
};

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.get("/api/trending", send("/trending/all/day"));
app.get("/api/movies/now-playing", send("/movie/now_playing?region=IN"));
app.get("/api/movies/upcoming", send("/movie/upcoming?region=IN"));
app.get("/api/series/on-air", send("/tv/on_the_air"));

app.get("/api/details/:type/:id", async (req, res) => {
  const { type, id } = req.params;
  if (!["movie", "tv"].includes(type) || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Bad request" });
  }
  try {
    const data = await tmdb(
      `/${type}/${id}?append_to_response=videos,credits,similar,watch/providers`
    );
    res.set("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 100);
  if (q.length < 2) return res.json({ results: [] });
  try {
    const data = await tmdb(
      `/search/multi?query=${encodeURIComponent(q)}&include_adult=false&page=1`
    );
    const results = (data.results || [])
      .filter((m) => (m.media_type === "movie" || m.media_type === "tv") && m.poster_path)
      .map(({ id, media_type, title, name, poster_path, release_date, first_air_date, vote_average }) => ({
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