import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import Home from "./Home";
import Details from "./Details";
import Search from "./Search";
import Platforms from "./Platforms";

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
        <Route path="/platforms" element={<Platforms />} />
        <Route path="/movie/:id" element={<Details type="movie" />} />
        <Route path="/tv/:id" element={<Details type="tv" />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<div className="page-msg">Page not found.</div>} />
      </Routes>
      
      {/* 🚀 UPDATED: Professional Fable Footer */}
      <footer style={{
        textAlign: "center",
        padding: "30px 20px 100px", // 100px bottom padding ensures the mobile BottomNav doesn't cover it
        marginTop: "40px",
        color: "var(--muted, #888)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        fontSize: "0.9rem"
      }}>
        <div style={{ fontWeight: "bold", letterSpacing: "1px", marginBottom: "10px", color: "#fff" }}>
          FABLE
        </div>
        <div>&copy; {new Date().getFullYear()} Fable. All rights reserved.</div>
        <div style={{ marginTop: "12px", display: "flex", justifyContent: "center", gap: "20px" }}>
          <a href="#" style={{ color: "var(--muted, #888)", textDecoration: "none" }}>Privacy Policy</a>
          <a href="#" style={{ color: "var(--muted, #888)", textDecoration: "none" }}>Terms of Service</a>
          <a href="#" style={{ color: "var(--muted, #888)", textDecoration: "none" }}>Help Center</a>
        </div>
      </footer>
      
      <BottomNav />
    </>
  );
}