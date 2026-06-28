import { NavLink, Outlet } from "react-router-dom";

export default function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="app-logo">
          DevMetrics
        </NavLink>
        <nav className="app-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/compare">Compare</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
