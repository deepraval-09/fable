import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SearchIcon } from "./Icons";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={scrolled ? "nav scrolled" : "nav"}>
      <div className="nav-inner">
        <Link to="/" className="logo">
          <img src="/favicon.svg" alt="Fable Logo" className="logo-icon" />
          FABLE
        </Link>
        <div className="links">
          <Link to="/#cinemas">In Cinemas</Link>
          <Link to="/#soon">Coming Soon</Link>
          <Link to="/#series">Web Series</Link>
          <Link to="/platforms">OTT Platforms</Link> {/* NEW LINK */}
          <Link to="/search" className="nav-search" aria-label="Search">
            <SearchIcon />
          </Link>
        </div>
      </div>
    </nav>
  );
}