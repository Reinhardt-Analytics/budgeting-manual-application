import { useState, useEffect, useMemo } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import saielLogo from "./assets/saiel-logo-transparent.png";
import Budget from "./components/budget-creation.jsx";
import Transactions from "./components/transactions.jsx";
import Dashboard from "./components/dashboard.jsx";
import Home from "./components/Home.jsx";
import "./App.css";

function App() {
  const companyName = "Saiel";

  const themes = useMemo(
    () => [
      { name: "Light", value: "light" },
      { name: "Dark", value: "dark" },
    ],
    []
  );

  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      themes[currentThemeIndex].value
    );
  }, [currentThemeIndex, themes]);

  const toggleTheme = () => {
    setCurrentThemeIndex((prev) => (prev + 1) % themes.length);
  };

  return (
    <>
      <header className="header-ribbon">
        <div className="header-left">
          <img src={saielLogo} alt={`${companyName} Logo`} className="logo" />
          <p className="company-name">{companyName}</p>
        </div>
        <nav className="header-nav">
          <NavLink to="/" end>
            {({ isActive }) => (
              <button className={isActive ? "active" : ""}>Home</button>
            )}
          </NavLink>
          <NavLink to="/budgets">
            {({ isActive }) => (
              <button className={isActive ? "active" : ""}>Budgets</button>
            )}
          </NavLink>
          <NavLink to="/transactions">
            {({ isActive }) => (
              <button className={isActive ? "active" : ""}>Transactions</button>
            )}
          </NavLink>
          <NavLink to="/dashboard">
            {({ isActive }) => (
              <button className={isActive ? "active" : ""}>Dashboard</button>
            )}
          </NavLink>
        </nav>
      </header>
      <div className="theme-toggle-container">
        <label className="switch">
          <input
            type="checkbox"
            checked={currentThemeIndex === 1}
            onChange={toggleTheme}
          />
          <span className="slider round"></span>
        </label>
      </div>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/budgets" element={<Budget />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      <footer>
        <div className="footer-top">© {companyName} 2025</div>
        <div className="footer-bottom">All Rights Reserved</div>
      </footer>
    </>
  );
}

export default App;
