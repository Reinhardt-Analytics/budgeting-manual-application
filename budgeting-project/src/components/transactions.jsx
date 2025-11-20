import { useState, useEffect, useMemo, useCallback } from 'react'
import TransactionRadarChart from './transaction-radar-chart.jsx'
import budgetDataTemplate from '../data/budgetData.json'
import './transactions.css'

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [budgetData, setBudgetData] = useState(() => {
    try {
      const savedData = localStorage.getItem('budgetData')
      if (savedData) {
        return JSON.parse(savedData)
      } else {
        // Set default income to $3000 for new users
        const defaultData = { ...budgetDataTemplate }
        defaultData.monthlyIncome = 3000
        return defaultData
      }
    } catch (error) {
      console.error('Error loading budget data:', error)
      const defaultData = { ...budgetDataTemplate }
      defaultData.monthlyIncome = 3000
      return defaultData
    }
  })
  const [newTransaction, setNewTransaction] = useState({
    date: '',
    category: '',
    amount: ''
  })
  const [showAllTransactions, setShowAllTransactions] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'chart'
  const [categoryCount, setCategoryCount] = useState(12) // 8, 12, or 16 categories
  const [showDummyData, setShowDummyData] = useState(() => {
    const hasRealTransactions = localStorage.getItem('transactions')
    const parsedTransactions = hasRealTransactions ? JSON.parse(hasRealTransactions) : []
    return parsedTransactions.length === 0
  })

  // Load transactions from localStorage on component mount
  useEffect(() => {
    try {
      const savedTransactions = localStorage.getItem('transactions')
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions))
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }, [])

  // Listen for storage changes from other pages (like budgets page)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'budgetData' && e.newValue) {
        try {
          const newBudgetData = JSON.parse(e.newValue)
          setBudgetData(newBudgetData)
        } catch (error) {
          console.error('Error parsing budget data from storage event:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Save budget data to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(budgetData).length > 0) {
      localStorage.setItem('budgetData', JSON.stringify(budgetData))
    }
  }, [budgetData])

  // Save transactions to localStorage whenever transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('transactions', JSON.stringify(transactions))
    }
  }, [transactions])

  // Predefined category sets
  const categoryOptions = {
    8: ['Housing', 'Utilities', 'Groceries', 'Dining', 'Transport', 'Savings', 'Debt', 'Lifestyle'],
    12: ['Housing', 'Utilities', 'Groceries', 'Dining', 'Transport', 'Insurance', 'Health', 'Savings', 'Investing', 'Debt', 'Personal', 'Leisure'],
    16: ['Housing', 'Utilities', 'Groceries', 'Dining', 'Transport', 'Insurance', 'Health', 'Savings', 'Investing', 'Debt', 'Personal', 'Leisure', 'Education', 'Giving', 'Pets', 'Miscellaneous']
  }
  
  const availableCategories = useMemo(() => {
    return categoryOptions[categoryCount] || categoryOptions[8]
  }, [categoryCount])

  // Handle amount input formatting
  const handleAmountChange = (value) => {
    // Remove any non-digit, non-decimal characters except for $ symbol and commas
    let cleanValue = value.replace(/[^\d.]/g, '')
    
    // Handle empty value
    if (cleanValue === '') {
      setNewTransaction(prev => ({
        ...prev,
        amount: ''
      }))
      return
    }
    
    // Ensure only one decimal point
    const decimalParts = cleanValue.split('.')
    if (decimalParts.length > 2) {
      cleanValue = decimalParts[0] + '.' + decimalParts.slice(1).join('')
    }
    
    // Limit to 2 decimal places
    if (decimalParts.length === 2 && decimalParts[1].length > 2) {
      cleanValue = decimalParts[0] + '.' + decimalParts[1].substring(0, 2)
    }
    
    // Prevent leading zeros (except for decimal values like 0.xx)
    if (cleanValue.length > 1 && cleanValue[0] === '0' && cleanValue[1] !== '.') {
      cleanValue = cleanValue.substring(1)
    }
    
    // Prevent values that start with a decimal point without a leading zero
    if (cleanValue.startsWith('.')) {
      cleanValue = '0' + cleanValue
    }
    
    // Limit the total number of digits before decimal to prevent overflow
    const wholePart = decimalParts[0]
    if (wholePart.length > 10) {
      return // Don't update if trying to enter more than 10 digits
    }
    
    // Update the transaction amount
    setNewTransaction(prev => ({
      ...prev,
      amount: cleanValue
    }))
  }

  // Handle form input changes
  const handleInputChange = (field, value) => {
    if (field === 'amount') {
      handleAmountChange(value)
    } else {
      setNewTransaction(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  // Handle income input change
  const handleIncomeChange = (e) => {
    const rawValue = e.target.value.replace(/[,$]/g, '')
    const numValue = parseFloat(rawValue)
    
    if (rawValue === '' || (!isNaN(numValue) && numValue >= 0)) {
      setBudgetData(prev => ({
        ...prev,
        monthlyIncome: rawValue === '' ? 0 : numValue
      }))
    }
  }

  // Set monthly income
  const setMonthlyIncome = () => {
    if (budgetData.monthlyIncome > 0) {
      setBudgetData(prev => ({
        ...prev,
        monthlyIncome: parseFloat(prev.monthlyIncome)
      }))
    }
  }

  // Handle Enter key for income input
  const handleIncomeKeyPress = (e) => {
    if (e.key === 'Enter') {
      setMonthlyIncome()
    }
  }

  // Format currency for display
  const formatInputValue = (value) => {
    if (!value) return ''
    const numValue = parseFloat(value.toString().replace(/,/g, ''))
    if (isNaN(numValue)) return ''
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Create new category
  const createNewCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name')
      return
    }

    const trimmedName = newCategoryName.trim()
    const totalCategories = availableCategories.length

    // Check 16 category limit
    if (totalCategories >= 16) {
      alert('Maximum of 16 categories allowed')
      return
    }

    // Check if category already exists
    if (availableCategories.includes(trimmedName)) {
      alert('Category already exists')
      return
    }

    // Add new category to budget data
    setBudgetData(prev => ({
      ...prev,
      customCategories: [...prev.customCategories, trimmedName]
    }))

    // Reset form and hide add category section
    setNewCategoryName('')
    setShowAddCategory(false)
    
    // Auto-select the new category
    setNewTransaction(prev => ({
      ...prev,
      category: trimmedName
    }))
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!newTransaction.date || !newTransaction.category || !newTransaction.amount) {
      alert('Please fill in all required fields')
      return
    }

    // Validate amount is a positive number
    const amount = parseFloat(newTransaction.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount')
      return
    }

    // Round to 2 decimal places (to the penny)
    const roundedAmount = Math.round(amount * 100) / 100

    // Create new transaction with unique ID
    const transaction = {
      id: Date.now(),
      date: newTransaction.date,
      category: newTransaction.category,
      amount: roundedAmount,
      timestamp: new Date().toISOString()
    }

    // Add transaction to list
    setTransactions(prev => [transaction, ...prev])

    // Reset form
    setNewTransaction({
      date: '',
      category: '',
      amount: ''
    })

    // Hide dummy data when user adds their first real transaction
    if (showDummyData) {
      setShowDummyData(false)
    }
  }

  // Generate dummy transactions for demonstration
  const generateDummyTransactions = useCallback(() => {
    const income = budgetData.monthlyIncome || 3000
    const dummyTransactions = []
    
    // Housing (30% - $900) - Single transaction
    dummyTransactions.push({
      id: 'dummy-1',
      date: '2024-01-15',
      category: 'Housing',
      amount: Math.round(income * 0.30 * 100) / 100,
      timestamp: new Date('2024-01-15').toISOString(),
      isDummy: true
    })
    
    // Utilities (8% - $240) - Single transaction  
    dummyTransactions.push({
      id: 'dummy-2',
      date: '2024-01-10',
      category: 'Utilities',
      amount: Math.round(income * 0.08 * 100) / 100,
      timestamp: new Date('2024-01-10').toISOString(),
      isDummy: true
    })
    
    // Transportation (16% - $480) - Single transaction
    dummyTransactions.push({
      id: 'dummy-3',
      date: '2024-01-12',
      category: 'Transportation',
      amount: Math.round(income * 0.16 * 100) / 100,
      timestamp: new Date('2024-01-12').toISOString(),
      isDummy: true
    })

    // Generate multiple smaller transactions for other categories
    const otherCategories = [
      { name: 'Food', percentage: 0.12, count: 8 },
      { name: 'Entertainment', percentage: 0.06, count: 6 },
      { name: 'Shopping', percentage: 0.05, count: 6 },
      { name: 'Healthcare', percentage: 0.03, count: 4 },
      { name: 'Education', percentage: 0.02, count: 3 },
      { name: 'Personal Care', percentage: 0.015, count: 2 },
      { name: 'Gifts', percentage: 0.01, count: 2 }
    ]

    let dummyId = 4
    otherCategories.forEach(({ name, percentage, count }) => {
      const totalAmount = income * percentage
      const avgAmount = totalAmount / count
      
      for (let i = 0; i < count; i++) {
        // Vary the amounts slightly for realism
        const variation = (Math.random() - 0.5) * 0.3 // ±15% variation
        const amount = Math.round((avgAmount * (1 + variation)) * 100) / 100
        
        // Generate random dates within the month
        const day = Math.floor(Math.random() * 28) + 1
        const date = `2024-01-${day.toString().padStart(2, '0')}`
        
        dummyTransactions.push({
          id: `dummy-${dummyId++}`,
          date,
          category: name,
          amount: Math.max(amount, 0.01), // Ensure positive amount
          timestamp: new Date(date).toISOString(),
          isDummy: true
        })
      }
    })

    // Sort by date (newest first)
    return dummyTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [budgetData.monthlyIncome])

  // Get transactions to display (limited or all)
  const displayedTransactions = useMemo(() => {
    const baseTransactions = showDummyData ? generateDummyTransactions() : transactions
    return showAllTransactions ? baseTransactions : baseTransactions.slice(0, 15)
  }, [showDummyData, showAllTransactions, transactions, generateDummyTransactions])

  // Calculate transaction percentages by category for chart
  // Calculate transaction totals and remaining income
  const transactionsByCategory = useMemo(() => {
    const categoryTotals = {}
    let totalAmount = 0
    const sourceTransactions = showDummyData ? generateDummyTransactions() : transactions

    sourceTransactions.forEach(transaction => {
      categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount
      totalAmount += transaction.amount
    })

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
    }))
  }, [transactions, showDummyData, generateDummyTransactions])

  const totalTransactionAmount = useMemo(() => {
    const sourceTransactions = showDummyData ? generateDummyTransactions() : transactions
    return sourceTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  }, [transactions, showDummyData, generateDummyTransactions])

  const remainingIncome = useMemo(() => {
    const income = budgetData.monthlyIncome || 0
    return Math.max(0, income - totalTransactionAmount)
  }, [budgetData.monthlyIncome, totalTransactionAmount])

  const remainingPercentage = useMemo(() => {
    const income = budgetData.monthlyIncome || 0
    if (income === 0) return 0
    return Math.max(0, (remainingIncome / income) * 100)
  }, [remainingIncome, budgetData.monthlyIncome])

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="transactions-page">
      <div className="transactions-content">
        {/* Left side - Transaction Entry Form */}
        <div className="transaction-entry-card">
          <h2>New Entry</h2>
          
          {/* View Toggle moved here */}
          <div className="view-toggle">
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
            <button 
              className={viewMode === 'chart' ? 'active' : ''}
              onClick={() => setViewMode('chart')}
            >
              Chart View
            </button>
          </div>
          
          {/* Income Section */}
          <div className="income-section">
            <label htmlFor="monthly-income">Monthly Income:</label>
            <div className="income-input-group">
              <input
                id="monthly-income"
                type="text"
                value={budgetData.monthlyIncome ? formatInputValue(budgetData.monthlyIncome) : ''}
                onChange={handleIncomeChange}
                onKeyPress={handleIncomeKeyPress}
                placeholder="$0.00"
              />
              <button type="button" onClick={setMonthlyIncome} className="income-enter-btn">
                Enter
              </button>
            </div>
            <div className="remaining-info">
              <span>Remaining: {formatCurrency(remainingIncome)}</span>
            </div>
            <div className="remaining-bar-container">
              <div 
                className="remaining-bar" 
                style={{ width: `${remainingPercentage}%` }}
              ></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="transaction-form">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  id="date"
                  value={newTransaction.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                  className="date-input"
                />
                <div className="calendar-icon" onClick={() => {
                  const dateInput = document.getElementById('date');
                  if (dateInput && dateInput.showPicker) {
                    dateInput.showPicker();
                  } else {
                    dateInput.focus();
                  }
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"  
                value={newTransaction.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              
              {/* Category Count Toggle */}
              <div className="category-count-toggle">
                <button 
                  type="button"
                  className={categoryCount === 8 ? 'active' : ''}
                  onClick={() => setCategoryCount(8)}
                >
                  Eight
                </button>
                <button 
                  type="button"
                  className={categoryCount === 12 ? 'active' : ''}
                  onClick={() => setCategoryCount(12)}
                >
                  Twelve
                </button>
                <button 
                  type="button"
                  className={categoryCount === 16 ? 'active' : ''}
                  onClick={() => setCategoryCount(16)}
                >
                  Sixteen
                </button>
              </div>
              <label className="category-count-label">Number of Categories</label>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <div className="amount-input-wrapper">
                <span className="currency-symbol">$</span>
                <input
                  type="text"
                  id="amount"
                  placeholder="0.00"
                  value={newTransaction.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="amount-input"
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Add Transaction
            </button>
          </form>
        </div>

        {/* Right side - Transaction List or Chart */}
        <div className="transaction-display">

          {viewMode === 'list' ? (
            <div className="transaction-list-container">
              <div className="list-header">
                <h3>Recent Transactions</h3>
                {displayedTransactions.length > 0 && (
                  <div className="total-amount-display">
                    <span>Total Amount: {formatCurrency(totalTransactionAmount)}</span>
                  </div>
                )}
                {showDummyData && (
                  <p className="sample-data-tooltip">Sample data shown below. Enter in data to refresh page information.</p>
                )}
                {(showDummyData ? generateDummyTransactions().length : transactions.length) > 15 && (
                  <button 
                    className="view-all-btn"
                    onClick={() => setShowAllTransactions(!showAllTransactions)}
                  >
                    {showAllTransactions ? 'Show Less' : 'View All'}
                  </button>
                )}
              </div>

              {displayedTransactions.length === 0 ? (
                <div className="empty-state">
                  <p>No transactions yet. Add your first transaction to get started!</p>
                </div>
              ) : (
                <>
                  <div className="transaction-list">
                    {Object.entries(
                      displayedTransactions.reduce((groups, transaction) => {
                        const date = transaction.date;
                        if (!groups[date]) {
                          groups[date] = [];
                        }
                        groups[date].push(transaction);
                        return groups;
                      }, {})
                    )
                    .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                    .map(([date, transactions]) => (
                      <div key={date} className="date-group">
                        <div className="date-header">{formatDate(date)}</div>
                        <div className="date-transactions">
                          {transactions.map(transaction => (
                            <div key={transaction.id} className="transaction-entry">
                              <div className="transaction-category">{transaction.category}</div>
                              <div className="transaction-amount">
                                {formatCurrency(transaction.amount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}


            </div>
          ) : (
            <div className="transaction-chart-container">
              <h3>Transaction Distribution</h3>
              {displayedTransactions.length === 0 ? (
                <div className="empty-state">
                  <p>No transaction data available for chart visualization.</p>
                </div>
              ) : (
                <>
                  <TransactionRadarChart data={transactionsByCategory} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Transactions