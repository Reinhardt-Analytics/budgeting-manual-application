import { useState, useEffect, useMemo } from 'react'
import saielLogo from './assets/saiel-logo-transparent.png'
import Budget from './components/budget-creation.jsx'
import './App.css'

function App() {
  const companyName = "Saiel"

  const themes = useMemo(() => [
    { name: 'Light', value: 'light', icon: '☀️' },
    { name: 'Dark', value: 'dark', icon: '🌙' }
    // Future themes can be added here:
    // { name: 'Blue', value: 'blue', icon: '🔵' },
    // { name: 'Green', value: 'green', icon: '🟢' }
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
        return <div><h2>Transactions Page</h2><p>Transaction tracking coming soon!</p></div>
      case 'Dashboard':
        return <div><h2>Dashboard Page</h2><p>Dashboard coming soon!</p></div>
      case 'Home':
      default:
        return (
          <div className="home-content">
            <div className="content-section">
              <div className="text-content">
                <h3 className = "about-company">
                  {companyName} is a comprehensive tool built with <strong>you</strong> in mind, keeping your finances in-check through guiding healthy spending habits.
                </h3>
                <p>
                  Our company was organized under a single mission: to help people find financial balance and freedom. That all starts with helping consumers be more conscious of their spending.
                </p>
                <p>
                  Through visualizing your finanicial goals, {companyName} allows you the peace of mind in feeling confident in your financial progress. The best part is, our tools are <strong>free to use</strong>!
                </p>
                <p>
                  Select the buttons below to get started on your journey. Feel free to reach out to our organization using the informaiton listed in the contacts page.
                </p>
              </div>
              <div className="image-placeholder">
                {/* 30rem x 30rem empty flexbox */}
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
              {/* <img src ={ exampleBudget} alt = "Example budget" /> */}
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
    <main>
      <label className="switch">
        <input 
          type="checkbox" 
          checked={currentThemeIndex === 1} 
          onChange={toggleTheme}
        />
        <span className="slider round"></span>
      </label>
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
