import { Link } from "react-router-dom"
import "./App.css"
import Logo from "./assets/logo.png"

export default function Header() {
	return (
		<nav className="nav-container">
			<Link to="/">
				<img src={Logo} className="logo-img" />
			</Link>
			<div className="nav-bar">
				<Link to="/problems">Problems</Link>
				<Link to="/contests">Contests</Link>
				<Link to="/leaderboard">Leaderboard</Link>
				<div className="nav-user">
					<Link to="/login">Login</Link>
					<span style={{ color: "white" }}> / </span>
					<Link to="/register">Register</Link>
				</div>
			</div>
		</nav>
	)
}
