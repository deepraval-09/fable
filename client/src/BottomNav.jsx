import { Link, useLocation } from "react-router-dom";
import { HomeIcon, FilmIcon, CalendarIcon, TvIcon, SearchIcon } from "./Icons";

const tabs = [
  { to: "/", label: "Home", Icon: HomeIcon },
  { to: "/#cinemas", label: "Cinemas", Icon: FilmIcon },
  { to: "/#soon", label: "Soon", Icon: CalendarIcon }, // Brought back 'Soon'
  { to: "/platforms", label: "OTT", Icon: TvIcon },    // 🚀 Swapped 'Series' for 'OTT', kept TvIcon
  { to: "/search", label: "Search", Icon: SearchIcon },
];

export default function BottomNav() {
  const { pathname, hash } = useLocation();

  const isActive = (to) => {
    if (to === "/search") return pathname.startsWith("/search");
    if (to === "/platforms") return pathname.startsWith("/platforms"); 
    const [p, h = ""] = to.split("#");
    return pathname === p && hash === (h ? `#${h}` : "");
  };

  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.map(({ to, label, Icon }) => (
        <Link key={to} to={to} className={isActive(to) ? "active" : ""}>
          <Icon />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}