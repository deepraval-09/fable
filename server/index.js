import express from "express";
import cors from "cors";
import compression from "compression";
import "dotenv/config";

const app = express();
app.use(compression());
app.use(
  cors({
    origin: ["https://freehour-psi.vercel.app", "http://localhost:5173"],
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