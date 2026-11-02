
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Menu, X } from "lucide-react";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <ShieldCheck size={30} strokeWidth={2.2} />
          <span>DisasterConnect</span>
        </Link>

        <button
          className="mobile-menu-button"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav
          className={`navbar-links ${menuOpen ? "navbar-links-open" : ""}`}
          aria-label="Main navigation"
        >
          <Link to="/" onClick={closeMenu}>
            Home
          </Link>

          <a href="/#about" onClick={closeMenu}>
            About
          </a>

          <a href="/#features" onClick={closeMenu}>
            Features
          </a>

          <div className="navbar-actions">
            <Link
              to="/login"
              className="login-link"
              onClick={closeMenu}
            >
              Login
            </Link>

            <Link
              to="/createAcount"
              className="register-button"
              onClick={closeMenu}
            >
              Get Started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
