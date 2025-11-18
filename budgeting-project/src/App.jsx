import { useState, useEffect, useMemo } from 'react'
import saielLogo from './assets/saiel-logo-transparent.png'
import Budget from './components/budget-creation.jsx'
import HomeRadarChart from './components/home-radar-chart.jsx'
import Transactions from './components/transactions.jsx'
import './App.css'

function App() {
  const companyName = "Saiel"

  const themes = useMemo(() => [
    { name: 'Light', value: 'light' },
    { name: 'Dark', value: 'dark' }
  ], [])
  
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState('Home')
  
  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themes[currentThemeIndex].value)
  }, [currentThemeIndex, themes])

  const toggleTheme = () => {
    setCurrentThemeIndex(prev => (prev + 1) % themes.length)
  }

  const navigateToPage = (pageName) => {
    setCurrentPage(pageName)
  }

  const renderCurrentPage = () => {
    switch(currentPage) {
      case 'Budgets':
        return <Budget />
      case 'Transactions':
        return <Transactions />
      case 'Dashboard':
        return <div><h2>Dashboard Page</h2><p>Dashboard coming soon!</p></div>
      case 'Home':
      default:
        return (
          <div className="home-content">
            <div className="content-section">
              <div className="left-content">
                <div className="text-content">
                  <h2 className="company-slogan">
                    <span className="company-name-text">{companyName}</span> | Simple, Made Better.
                  </h2>
                  
                  {/* First Section */}
                  <div className="content-section-one">
                    <h3 className="section-heading">
                      Budgeting doesn't have to be complicated. Let us do the heavy lifting!
                    </h3>
                    <p>
                      Here at <span className="company-name-text">{companyName}</span>, we're here to make financial planning easy and accessible no matter your experience level. Our intuitive tools are designed to simplify complex financial concepts and make budgeting approachable for everyone. Our company was organized under a single mission: to help people find financial balance and freedom. That all starts with helping consumers be more conscious of their spending.
                    </p>
                    <p>
                      Through visualizing your financial goals, {companyName} allows you the peace of mind in feeling confident in your financial progress. Whether you're just starting your financial journey or looking to optimize your existing budget, our platform provides the guidance and tools you need to succeed. The best part is, our tools are <strong>free to use</strong>!
                    </p>
                  </div>

                  {/* Section Divider */}
                  <div className="section-divider"></div>

                  {/* Second Section */}
                  <div className="content-section-two">
                    <h3 className="section-heading">
                      Setting up {companyName} is easy and painless. Here's how to get started:
                    </h3>
                    <p>
                      <strong>Create Your Budget:</strong> Start by setting up your monthly income and categorizing your expenses using our intuitive budget creation tool.
                    </p>
                    <p>
                      <strong>Track Your Spending:</strong> Monitor your transactions and see how they align with your budget goals in real-time.
                    </p>
                    <p>
                      <strong>Visualize Your Progress:</strong> Use our interactive charts and graphs to understand your spending patterns and identify areas for improvement.
                    </p>
                    <p>
                      Select the buttons below to get started on your journey. Feel free to reach out to our organization using the information listed in the contacts page.
                    </p>
                  </div>
                </div>
                <div className="button-section">
                  <button onClick={() => navigateToPage('Budgets')}>
                    Create a Budget
                  </button>
                  <button onClick={() => navigateToPage('Transactions')}>
                    Track Transactions
                  </button>
                </div>
              </div>
              <div className="image-placeholder">
                  <HomeRadarChart />
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <>
    <header className = "header-ribbon">
      <div className = "header-left">
        <img src={saielLogo} alt = {`${companyName} Logo`} className = "logo" />
        <p className = "company-name">
          {companyName}
        </p>
      </div>
      <nav className = "header-nav">
        <button onClick={() => navigateToPage('Home')}>Home</button>
        <button onClick={() => navigateToPage('Budgets')}>Budgets</button>
        <button onClick={() => navigateToPage('Transactions')}>Transactions</button>
        <button onClick={() => navigateToPage('Dashboard')}>Dashboard</button>
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
      {renderCurrentPage()}
    </main>
    <footer>
      <div className="footer-top">© {companyName} 2025</div>
      <div className="footer-bottom">All Rights Reserved</div>
    </footer>
    </>
  )
}

export default App
