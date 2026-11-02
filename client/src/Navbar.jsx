export default function Navbar() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <span className="logo">Free<span>hour</span></span>
        <div className="links">
          <a href="#cinemas">In Cinemas</a>
          <a href="#soon">Coming Soon</a>
          <a href="#series">Web Series</a>
        </div>
      </div>
    </nav>
  );
}