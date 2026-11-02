import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import Home from "./Home";
import Details from "./Details";
import Search from "./Search";

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      setTimeout(
        () => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:id" element={<Details type="movie" />} />
        <Route path="/tv/:id" element={<Details type="tv" />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<div className="page-msg">Page not found.</div>} />
      </Routes>
      <footer>
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
      <BottomNav />
    </>
  );
}