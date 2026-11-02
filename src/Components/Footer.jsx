import {
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Footer(){

  return(
  <>
    <footer className="site-footer">
        <div className="footer-container">
          <Link to="/" className="footer-brand">
            <ShieldCheck size={22} />
            <span>DisasterConnect</span>
          </Link>

          <p>Connecting communities through coordinated support.</p>

          <span className="footer-copy">
            © {new Date().getFullYear()} DisasterConnect
          </span>
        </div>
      </footer>  
  </>
  );
}

export default Footer;