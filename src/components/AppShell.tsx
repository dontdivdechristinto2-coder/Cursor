import { BookOpen, Home, LayoutDashboard, Search, Settings } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { CloudLogo } from "./CloudLogo";

export function AppShell() {
  const { profile } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand-lockup" aria-label="CopticCloud home">
          <CloudLogo compact />
          <span>CopticCloud</span>
        </NavLink>
        {profile?.role === "Admin" ? (
          <NavLink className="admin-pill" to="/admin">
            Admin
          </NavLink>
        ) : null}
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Primary navigation">
        <NavLink to="/" end>
          <Home />
          <span>Home</span>
        </NavLink>
        <NavLink to="/browse">
          <BookOpen />
          <span>Browse</span>
        </NavLink>
        <NavLink to="/search">
          <Search />
          <span>Search</span>
        </NavLink>
        <NavLink to="/settings">
          <Settings />
          <span>Settings</span>
        </NavLink>
        {profile?.role === "Admin" ? (
          <NavLink to="/admin">
            <LayoutDashboard />
            <span>Admin</span>
          </NavLink>
        ) : null}
      </nav>
    </div>
  );
}
