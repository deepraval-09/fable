import { useRef } from "react";

export default function Scroller({ className = "cards", arrowTop = 120, children }) {
  const ref = useRef(null);
  const scroll = (dir) =>
    ref.current?.scrollBy({ left: dir * 640, behavior: "smooth" });

  return (
    <div className="scroller" style={{ "--arrow-top": `${arrowTop}px` }}>
      <button className="arrow left" onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
      <button className="arrow right" onClick={() => scroll(1)} aria-label="Scroll right">›</button>
      <div className={className} ref={ref}>{children}</div>
    </div>
  );
}