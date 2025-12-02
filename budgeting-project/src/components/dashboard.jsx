import React from "react";
import "./dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-dev-notice">
        <div className="dev-notice-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="var(--accent-color)"
            />
          </svg>
        </div>
        <h1>Dashboard - In Development</h1>
        <p className="dev-notice-subtitle">
          This feature is currently under construction
        </p>

        <div className="planned-features">
          <h2>Planned Features</h2>
          <ul>
            <li>
              <strong>Budget vs. Transaction Comparison</strong>
              <p>
                View and compare your budget allocations against actual
                transactions with interactive visualizations
              </p>
            </li>
            <li>
              <strong>Interactive Chart Views</strong>
              <p>
                Toggle between budget and transaction radar charts to analyze
                spending patterns across categories
              </p>
            </li>
            <li>
              <strong>Data Configuration Tools</strong>
              <p>
                Configure and customize your financial data for deeper insights
                into your spending habits
              </p>
            </li>
            <li>
              <strong>Financial Analytics</strong>
              <p>
                Gain additional insights into your finances with advanced
                analytics and trend analysis
              </p>
            </li>
          </ul>
        </div>

        <div className="dev-status">
          <p>Check back soon for updates!</p>
        </div>
      </div>
    </div>
  );
}
