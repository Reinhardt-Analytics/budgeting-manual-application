import { useState, useEffect, useMemo } from 'react'
import saielLogo from './assets/saiel-logo-transparent.png'
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
  
  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themes[currentThemeIndex].value)
  }, [currentThemeIndex, themes])

  const toggleTheme = () => {
    setCurrentThemeIndex(prev => (prev + 1) % themes.length)
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
        <a href = "#Home"><button>Home</button></a>
        <a href = "#Budgets"><button>Budgets</button></a>
        <a href = "#Transactions"><button>Transactions</button></a>
        <a href = "#Dashboards"><button>Dashboard</button></a>
      </nav>
    </header>
    <main>
      <button className="theme-toggle" onClick={toggleTheme}>
        {themes[currentThemeIndex].icon} {themes[currentThemeIndex].name}
      </button>
      <div>
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
        <a href = "#Budgets">
          <button>Create a Budget</button>
        </a>
        <a href = "#Transactions">
          <button>Track Transactions</button>
        </a>
          {/* <img src ={ exampleBudget} alt = "Example budget" /> */}
      </div>
    </main>
    <footer>
    </footer>
    </>
  )
}

export default App
