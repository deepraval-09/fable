import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(
  cors({
    origin: ["https://freehour-psi.vercel.app", "http://localhost:5173"],
  })
);

const tmdb = async (path) => {
  const res = await fetch(`https://api.themoviedb.org/3${path}`, {
    headers: { Authorization: `Bearer ${process.env.TMDB_TOKEN}` },
  });
  if (!res.ok) throw new Error("TMDB error");
  return res.json();
};

app.get("/api/movies/now-playing", async (req, res) => {
  try { res.json(await tmdb("/movie/now_playing?region=IN")); }
  catch { res.status(500).json({ error: "Failed" }); }
});

app.get("/api/movies/upcoming", async (req, res) => {
  try { res.json(await tmdb("/movie/upcoming?region=IN")); }
  catch { res.status(500).json({ error: "Failed" }); }
});

app.get("/api/series/on-air", async (req, res) => {
  try { res.json(await tmdb("/tv/on_the_air")); }
  catch { res.status(500).json({ error: "Failed" }); }
});
app.get("/api/trending", async (req, res) => {
  try { res.json(await tmdb("/trending/all/day")); }
  catch { res.status(500).json({ error: "Failed" }); }
});
app.get("/api/:type/:id/providers", async (req, res) => {
  try {
    const { type, id } = req.params;
    res.json(await tmdb(`/${type}/${id}/watch/providers`));
  } catch { res.status(500).json({ error: "Failed" }); }
});

app.listen(process.env.PORT, () => console.log("Server running"));