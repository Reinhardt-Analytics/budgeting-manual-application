import { useState, useEffect, useMemo } from "react";
import saielLogo from "./assets/saiel-logo-transparent.png";
import Budget from "./components/budget-creation.jsx";
import HomeRadarChart from "./components/home-radar-chart.jsx";
import Transactions from "./components/transactions.jsx";
import Dashboard from "./components/dashboard.jsx";
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
  const [currentPage, setCurrentPage] = useState("Home");

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

  const navigateToPage = (pageName) => {
    setCurrentPage(pageName);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "Budgets":
        return <Budget />;
      case "Transactions":
        return <Transactions />;
      case "Dashboard":
        return <Dashboard />;
      case "Home":
      default:
        return (
          <div className="home-content">
            <div className="content-section">
              <div className="left-content">
                <div className="text-content">
                  <h2 className="company-slogan">
                    <span className="company-name-text">{companyName}</span> |
                    Simple, Made Better.
                  </h2>

                  {/* First Section */}
                  <div className="content-section-one">
                    <h3 className="section-heading">
                      Let Us Do the Heavy Lifting
                    </h3>
                    <p>
                      Here at{" "}
                      <span className="company-name-text">{companyName}</span>,
                      we're here to make financial planning easy and accessible
                      no matter your experience level. Our intuitive tools are
                      designed to simplify complex financial concepts and make
                      budgeting approachable for everyone. Saiel was founded
                      with a single mission: to help people find financial
                      balance and freedom. That all starts with helping
                      consumers become more conscious of their spending and
                      empowering them to make informed decisions for a better
                      future.
                    </p>
                    <p>
                      Through visualizing your financial goals, {companyName}{" "}
                      gives you peace of mind and confidence in your financial
                      progress. Whether you're just starting your financial
                      journey or looking to optimize your existing budget, our
                      platform provides the guidance and tools you need to
                      succeed. The best part is, our tools are free to use!
                      Saiel is built to support you every step of the way,
                      making budgeting simple, effective, and accessible for
                      everyone.
                    </p>
                    {/* New Section and Divider */}
                    <div className="section-divider"></div>
                    <div className="content-section-highlight">
                      <h3 className="section-heading">
                        First Time Making a Budget?
                      </h3>
                      <p>
                        Saiel is designed for beginners and anyone looking for a
                        simple way to start budgeting. Our user-friendly
                        template walks you through the basics, teaching you
                        essential budgeting practices and principles as you go.
                        With clear instructions and helpful tips, Saiel makes it
                        easy to understand your finances and build a budget that
                        works for you, even if you’ve never budgeted before.
                        Start your journey with confidence and learn as you
                        grow.
                      </p>
                      <p>
                        With Saiel, you can create a budget that fits your life,
                        save it, and update it whenever your needs change. Your
                        budget is always accessible, so you can bring it with
                        you and make edits over time. Saiel makes learning and
                        managing your money easy, so you can build confidence
                        and take control of your financial future. Our platform
                        is flexible and designed to grow with you, making it the
                        perfect companion for your financial journey.
                      </p>
                    </div>
                  </div>

                  {/* Section Divider */}
                  <div className="section-divider"></div>

                  {/* Second Section */}
                  <div className="content-section-two">
                    <h3 className="section-heading">
                      Here's How to Get Started
                    </h3>
                    <p>
                      <strong>Create Your Budget:</strong> Set up your monthly
                      income and organize your expenses with Saiel’s easy budget
                      tool. Our template helps you quickly build a budget that
                      fits your lifestyle and financial goals.
                    </p>
                    <p>
                      <strong>Track Your Spending:</strong> Keep an eye on your
                      transactions and see how they match your budget in real
                      time. Saiel makes it simple to monitor your spending and
                      stay on track with your financial plan.
                    </p>
                    <p>
                      <strong>Visualize Your Progress:</strong> Explore your
                      spending habits with Saiel’s interactive charts and
                      graphs. Spot trends, find areas to improve, and gain
                      insights to help you reach your financial goals.
                    </p>
                    <p>
                      <strong>Getting Started:</strong> Use the buttons below to
                      begin your budgeting journey. If you have questions or
                      need help, reach out to us anytime using the contact
                      information provided on our site.
                    </p>
                  </div>
                </div>
                <div className="button-section">
                  <button onClick={() => navigateToPage("Budgets")}>
                    Create a Budget
                  </button>
                  <button onClick={() => navigateToPage("Transactions")}>
                    Track Transactions
                  </button>
                </div>
              </div>
              <div className="chart-container">
                <HomeRadarChart />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <header className="header-ribbon">
        <div className="header-left">
          <img src={saielLogo} alt={`${companyName} Logo`} className="logo" />
          <p className="company-name">{companyName}</p>
        </div>
        <nav className="header-nav">
          <button onClick={() => navigateToPage("Home")}>Home</button>
          <button onClick={() => navigateToPage("Budgets")}>Budgets</button>
          <button onClick={() => navigateToPage("Transactions")}>
            Transactions
          </button>
          <button onClick={() => navigateToPage("Dashboard")}>Dashboard</button>
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
      <main>{renderCurrentPage()}</main>
      <footer>
        <div className="footer-top">© {companyName} 2025</div>
        <div className="footer-bottom">All Rights Reserved</div>
      </footer>
    </>
  );
}

export default App;
