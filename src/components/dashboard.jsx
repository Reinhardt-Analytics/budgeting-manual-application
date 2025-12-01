import React, { useState, useEffect } from 'react';
import HomeRadarChart from './home-radar-chart.jsx';
import TransactionRadarChart from './transaction-radar-chart.jsx';
import './dashboard.css';

function getBudgetData() {
  try {
    const saved = localStorage.getItem('budgetData');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function getTransactions() {
  try {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function Dashboard() {
  const [view, setView] = useState('chart');
  const [budgetData, setBudgetData] = useState(getBudgetData());
  const [transactions, setTransactions] = useState(getTransactions());

  useEffect(() => {
    const handleStorage = () => {
      setBudgetData(getBudgetData());
      setTransactions(getTransactions());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Edge case checks
  const budgetCategories = budgetData && budgetData.budgets ? Object.keys(budgetData.budgets).filter(cat => budgetData.budgets[cat] && parseFloat(budgetData.budgets[cat]) > 0) : [];
  const transactionCount = transactions.length;
  let dashboardError = '';
  if (!budgetData || budgetCategories.length < 6) {
    dashboardError = 'Please enter at least six budget categories with amounts to view your dashboard.';
  } else if (transactionCount < 6) {
    dashboardError = 'Please enter at least six transactions to view your dashboard.';
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-toggle">
        <button
          className={view === 'chart' ? 'active' : ''}
          onClick={() => setView('chart')}
        >
          Chart View
        </button>
        <button
          className={view === 'analytics' ? 'active' : ''}
          onClick={() => setView('analytics')}
        >
          Analytics View
        </button>
      </div>
      <div className="dashboard-content">
        {dashboardError ? (
          <div className="dashboard-error-tooltip">
            <h3>Dashboard Unavailable</h3>
            <p>{dashboardError}</p>
            {budgetCategories.length < 6 && (
              <ul>
                <li>Make sure you have entered at least six budget categories with non-zero amounts.</li>
              </ul>
            )}
            {transactionCount < 6 && (
              <ul>
                <li>Make sure you have entered at least six transactions.</li>
              </ul>
            )}
          </div>
        ) : view === 'chart' ? (
          <div className="dashboard-charts">
            <div className="dashboard-chart-left">
              <HomeRadarChart budgetData={budgetData} />
            </div>
            <div className="dashboard-chart-right">
              <TransactionRadarChart data={budgetCategories.map(cat => {
                const total = transactions.filter(t => t.category === cat).reduce((sum, t) => sum + parseFloat(t.amount), 0);
                const allTotal = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
                return {
                  category: cat,
                  amount: total,
                  percentage: allTotal > 0 ? (total / allTotal) * 100 : 0
                };
              })} />
            </div>
          </div>
        ) : (
          <div className="dashboard-charts">
            <div className="dashboard-chart-left">
              <HomeRadarChart budgetData={budgetData} transactions={transactions} />
            </div>
            <div className="dashboard-chart-right dashboard-analytics-summary">
              <h3>Analytics Summary</h3>
              <p>Here you can add insights, trends, or summary statistics about the user's budgets and transactions.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
