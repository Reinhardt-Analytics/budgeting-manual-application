import { useState, useEffect, useMemo, useCallback } from "react";

import TransactionRadarChart from "./transaction-radar-chart.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import budgetDataTemplate from "../data/budgetData.json";
import "./transactions.css";

function toRomanNumeral(num) {
  const romanNumerals = [
    { value: 10, numeral: "X" },
    { value: 9, numeral: "IX" },
    { value: 8, numeral: "VIII" },
    { value: 7, numeral: "VII" },
    { value: 6, numeral: "VI" },
    { value: 5, numeral: "V" },
    { value: 4, numeral: "IV" },
    { value: 3, numeral: "III" },
    { value: 2, numeral: "II" },
    { value: 1, numeral: "I" },
  ];
  let result = "";
  for (let i = 0; i < romanNumerals.length; i++) {
    while (num >= romanNumerals[i].value) {
      result += romanNumerals[i].numeral;
      num -= romanNumerals[i].value;
    }
  }
  return result;
}

const categoryOptions = {
  8: [
    "Housing",
    "Utilities",
    "Groceries",
    "Dining",
    "Transport",
    "Savings",
    "Debt",
    "Lifestyle",
  ],
  12: [
    "Housing",
    "Utilities",
    "Groceries",
    "Dining",
    "Transport",
    "Insurance",
    "Health",
    "Savings",
    "Investing",
    "Debt",
    "Personal",
    "Leisure",
  ],
  16: [
    "Housing",
    "Utilities",
    "Groceries",
    "Dining",
    "Transport",
    "Insurance",
    "Health",
    "Savings",
    "Investing",
    "Debt",
    "Personal",
    "Leisure",
    "Education",
    "Giving",
    "Pets",
    "Miscellaneous",
  ],
};

function Transactions() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [transactions, setTransactions] = useState(() => {
    try {
      const savedTransactions = sessionStorage.getItem("transactions");
      return savedTransactions ? JSON.parse(savedTransactions) : [];
    } catch (error) {
      console.error("Error loading transactions from sessionStorage:", error);
      return [];
    }
  });
  const [budgetData, setBudgetData] = useState(() => {
    try {
      const savedData = sessionStorage.getItem("budgetData");
      return savedData ? JSON.parse(savedData) : { ...budgetDataTemplate };
    } catch (error) {
      return { ...budgetDataTemplate };
    }
  });
  const [newTransaction, setNewTransaction] = useState({
    date: "",
    category: "",
    amount: "",
  });
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'chart'
  const [categoryCount, setCategoryCount] = useState(12); // 8, 12, or 16 categories
  const [showDummyData, setShowDummyData] = useState(() => {
    const hasRealTransactions = sessionStorage.getItem("transactions");
    const parsedTransactions = hasRealTransactions
      ? JSON.parse(hasRealTransactions)
      : [];
    return parsedTransactions.length === 0;
  });

  // Filter transactions helper
  const filterTransactions = useCallback(
    (txs) => {
      return txs.filter((tx) => {
        if (!tx.date) return false;
        const dateObj = new Date(tx.date);
        const monthMatch = selectedMonth
          ? dateObj.getMonth() + 1 === parseInt(selectedMonth)
          : true;
        const yearMatch = selectedYear
          ? dateObj.getFullYear() === parseInt(selectedYear)
          : true;
        return monthMatch && yearMatch;
      });
    },
    [selectedMonth, selectedYear]
  );

  // Listen for storage changes from other pages (like budgets page)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "budgetData" && e.newValue) {
        try {
          const newBudgetData = JSON.parse(e.newValue);
          setBudgetData(newBudgetData);
        } catch (error) {
          console.error("Error parsing budget data from storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save budget data to sessionStorage whenever it changes
  useEffect(() => {
    if (Object.keys(budgetData).length > 0) {
      sessionStorage.setItem("budgetData", JSON.stringify(budgetData));
    }
  }, [budgetData]);

  // Save transactions to sessionStorage whenever transactions change
  useEffect(() => {
    sessionStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  // Predefined category sets
  const categoryOptions = {
    8: [
      "Housing",
      "Utilities",
      "Groceries",
      "Dining",
      "Transport",
      "Savings",
      "Debt",
      "Lifestyle",
    ],
    12: [
      "Housing",
      "Utilities",
      "Groceries",
      "Dining",
      "Transport",
      "Insurance",
      "Health",
      "Savings",
      "Investing",
      "Debt",
      "Personal",
      "Leisure",
    ],
    16: [
      "Housing",
      "Utilities",
      "Groceries",
      "Dining",
      "Transport",
      "Insurance",
      "Health",
      "Savings",
      "Investing",
      "Debt",
      "Personal",
      "Leisure",
      "Education",
      "Giving",
      "Pets",
      "Miscellaneous",
    ],
  };

  const availableCategories = useMemo(() => {
    return categoryOptions[categoryCount] || categoryOptions[8];
  }, [categoryCount, categoryOptions]);

  // Handle amount input formatting
  const handleAmountChange = (value) => {
    // Remove any non-digit, non-decimal characters except for $ symbol and commas
    let cleanValue = value.replace(/[^\d.]/g, "");

    // Handle empty value
    if (cleanValue === "") {
      setNewTransaction((prev) => ({
        ...prev,
        amount: "",
      }));
      return;
    }

    // Ensure only one decimal point
    const decimalParts = cleanValue.split(".");
    if (decimalParts.length > 2) {
      cleanValue = decimalParts[0] + "." + decimalParts.slice(1).join("");
    }

    // Limit to 2 decimal places
    if (decimalParts.length === 2 && decimalParts[1].length > 2) {
      cleanValue = decimalParts[0] + "." + decimalParts[1].substring(0, 2);
    }

    // Prevent leading zeros (except for decimal values like 0.xx)
    if (
      cleanValue.length > 1 &&
      cleanValue[0] === "0" &&
      cleanValue[1] !== "."
    ) {
      cleanValue = cleanValue.substring(1);
    }

    // Prevent values that start with a decimal point without a leading zero
    if (cleanValue.startsWith(".")) {
      cleanValue = "0" + cleanValue;
    }

    // Limit the total number of digits before decimal to prevent overflow
    const wholePart = decimalParts[0];
    if (wholePart.length > 10) {
      return; // Don't update if trying to enter more than 10 digits
    }

    // Update the transaction amount
    setNewTransaction((prev) => ({
      ...prev,
      amount: cleanValue,
    }));
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    if (field === "amount") {
      handleAmountChange(value);
    } else {
      setNewTransaction((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Handle income input change
  const handleIncomeChange = (e) => {
    const rawValue = e.target.value.replace(/[,$]/g, "");
    const numValue = parseFloat(rawValue);

    if (rawValue === "" || (!isNaN(numValue) && numValue >= 0)) {
      setBudgetData((prev) => ({
        ...prev,
        monthlyIncome: rawValue === "" ? 0 : numValue,
      }));
    }
  };

  // Set monthly income
  const setMonthlyIncome = () => {
    if (budgetData.monthlyIncome > 0) {
      setBudgetData((prev) => ({
        ...prev,
        monthlyIncome: parseFloat(prev.monthlyIncome),
      }));
    }
  };

  // Handle Enter key for income input
  const handleIncomeKeyPress = (e) => {
    if (e.key === "Enter") {
      setMonthlyIncome();
    }
  };

  // Format currency for display
  const formatInputValue = (value) => {
    if (!value) return "";
    const numValue = parseFloat(value.toString().replace(/,/g, ""));
    if (isNaN(numValue)) return "";
    return numValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Create new category
  const createNewCategory = () => {
    if (!newCategoryName.trim()) {
      alert("Please enter a category name");
      return;
    }

    const trimmedName = newCategoryName.trim();
    const totalCategories = availableCategories.length;

    // Check 16 category limit
    if (totalCategories >= 16) {
      alert("Maximum of 16 categories allowed");
      return;
    }

    // Check if category already exists
    if (availableCategories.includes(trimmedName)) {
      alert("Category already exists");
      return;
    }

    // Add new category to budget data
    setBudgetData((prev) => ({
      ...prev,
      customCategories: [...prev.customCategories, trimmedName],
    }));

    // Reset form and hide add category section
    setNewCategoryName("");
    setShowAddCategory(false);

    // Auto-select the new category
    setNewTransaction((prev) => ({
      ...prev,
      category: trimmedName,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !newTransaction.date ||
      !newTransaction.category ||
      !newTransaction.amount
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate amount is a positive number
    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive amount");
      return;
    }

    // Round to 2 decimal places (to the penny)
    const roundedAmount = Math.round(amount * 100) / 100;

    // Create new transaction with unique ID
    const transaction = {
      id: Date.now(),
      date: newTransaction.date,
      category: newTransaction.category,
      amount: roundedAmount,
      timestamp: new Date().toISOString(),
    };

    // Add transaction to list
    setTransactions((prev) => [transaction, ...prev]);

    // Reset form
    setNewTransaction({
      date: "",
      category: "",
      amount: "",
    });

    // Hide dummy data when user adds their first real transaction
    if (showDummyData) {
      setShowDummyData(false);
    }
  };

  // Delete a transaction
  const deleteTransaction = (transactionId) => {
    setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
  };

  // Generate dummy transactions for demonstration
  const generateDummyTransactions = useCallback(() => {
    const income = budgetData.monthlyIncome || 3000;
    const dummyTransactions = [];

    // Housing (30% - $900) - Single transaction
    dummyTransactions.push({
      id: "dummy-1",
      date: "2024-01-15",
      category: "Housing",
      amount: Math.round(income * 0.3 * 100) / 100,
      timestamp: new Date("2024-01-15").toISOString(),
      isDummy: true,
    });

    // Utilities (8% - $240) - Single transaction
    dummyTransactions.push({
      id: "dummy-2",
      date: "2024-01-10",
      category: "Utilities",
      amount: Math.round(income * 0.08 * 100) / 100,
      timestamp: new Date("2024-01-10").toISOString(),
      isDummy: true,
    });

    // Transportation (16% - $480) - Single transaction
    dummyTransactions.push({
      id: "dummy-3",
      date: "2024-01-12",
      category: "Transportation",
      amount: Math.round(income * 0.16 * 100) / 100,
      timestamp: new Date("2024-01-12").toISOString(),
      isDummy: true,
    });

    // Generate multiple smaller transactions for other categories
    const otherCategories = [
      { name: "Food", percentage: 0.12, count: 8 },
      { name: "Entertainment", percentage: 0.06, count: 6 },
      { name: "Shopping", percentage: 0.05, count: 6 },
      { name: "Healthcare", percentage: 0.03, count: 4 },
      { name: "Education", percentage: 0.02, count: 3 },
      { name: "Personal Care", percentage: 0.015, count: 2 },
      { name: "Gifts", percentage: 0.01, count: 2 },
    ];

    let dummyId = 4;
    otherCategories.forEach(({ name, percentage, count }) => {
      const totalAmount = income * percentage;
      const avgAmount = totalAmount / count;

      for (let i = 0; i < count; i++) {
        // Vary the amounts slightly for realism
        const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
        const amount = Math.round(avgAmount * (1 + variation) * 100) / 100;

        // Generate random dates within the month
        const day = Math.floor(Math.random() * 28) + 1;
        const date = `2024-01-${day.toString().padStart(2, "0")}`;

        dummyTransactions.push({
          id: `dummy-${dummyId++}`,
          date,
          category: name,
          amount: Math.max(amount, 0.01), // Ensure positive amount
          timestamp: new Date(date).toISOString(),
          isDummy: true,
        });
      }
    });

    // Sort by date (newest first)
    return dummyTransactions.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [budgetData.monthlyIncome]);

  // Get transactions to display (limited or all)
  // Show dummy or real transactions, filtered by month/year
  const displayedTransactions = useMemo(() => {
    const txs = showDummyData ? generateDummyTransactions() : transactions;
    return filterTransactions(txs);
  }, [
    showDummyData,
    transactions,
    filterTransactions,
    generateDummyTransactions,
  ]);

  // Calculate transaction percentages by category for chart
  // Calculate transaction totals and remaining income
  const transactionsByCategory = useMemo(() => {
    const categoryTotals = {};
    let totalAmount = 0;
    const sourceTransactions = showDummyData
      ? generateDummyTransactions()
      : transactions;

    sourceTransactions.forEach((transaction) => {
      categoryTotals[transaction.category] =
        (categoryTotals[transaction.category] || 0) + transaction.amount;
      totalAmount += transaction.amount;
    });

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    }));
  }, [transactions, showDummyData, generateDummyTransactions]);

  const totalTransactionAmount = useMemo(() => {
    const sourceTransactions = showDummyData
      ? generateDummyTransactions()
      : transactions;
    return sourceTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
  }, [transactions, showDummyData, generateDummyTransactions]);

  const remainingIncome = useMemo(() => {
    const income = budgetData.monthlyIncome || 0;
    return Math.max(0, income - totalTransactionAmount);
  }, [budgetData.monthlyIncome, totalTransactionAmount]);

  const remainingPercentage = useMemo(() => {
    const income = budgetData.monthlyIncome || 0;
    if (income === 0) return 0;
    return Math.max(0, (remainingIncome / income) * 100);
  }, [remainingIncome, budgetData.monthlyIncome]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Toggle category visibility in chart
  const toggleCategoryVisibility = (category) => {
    setHiddenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="transactions-page">
      <div className="transactions-content">
        {/* Left side - Transaction Entry Form */}
        <div className="transaction-entry-card">
          <h2>New Entry</h2>

          {/* View Toggle moved here */}
          <div className="view-toggle">
            <button
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
            >
              List View
            </button>
            <button
              className={viewMode === "chart" ? "active" : ""}
              onClick={() => setViewMode("chart")}
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
                value={
                  budgetData.monthlyIncome
                    ? formatInputValue(budgetData.monthlyIncome)
                    : ""
                }
                onChange={handleIncomeChange}
                onKeyPress={handleIncomeKeyPress}
                placeholder="$0.00"
              />
              <button
                type="button"
                onClick={setMonthlyIncome}
                className="income-enter-btn"
              >
                Enter
              </button>
            </div>
            <div className="remaining-bar-container">
              <div
                className="remaining-bar"
                style={{ width: `${remainingPercentage}%` }}
              ></div>
            </div>
            <div className="remaining-info">
              <span>Remaining: {formatCurrency(remainingIncome)}</span>
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
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                  className="date-input"
                />
                <div
                  className="calendar-icon"
                  onClick={() => {
                    const dateInput = document.getElementById("date");
                    if (dateInput && dateInput.showPicker) {
                      dateInput.showPicker();
                    } else {
                      dateInput.focus();
                    }
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={newTransaction.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {/* Category Count Toggle */}
              <div className="category-count-toggle">
                <button
                  type="button"
                  className={categoryCount === 8 ? "active" : ""}
                  onClick={() => setCategoryCount(8)}
                >
                  Eight
                </button>
                <button
                  type="button"
                  className={categoryCount === 12 ? "active" : ""}
                  onClick={() => setCategoryCount(12)}
                >
                  Twelve
                </button>
                <button
                  type="button"
                  className={categoryCount === 16 ? "active" : ""}
                  onClick={() => setCategoryCount(16)}
                >
                  Sixteen
                </button>
              </div>
              <label className="category-count-label">
                Number of Categories
              </label>
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
                  onChange={(e) => handleInputChange("amount", e.target.value)}
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
          {viewMode === "list" ? (
            <div className="transaction-list-container">
              <div className="list-header">
                <h3>Recent Transactions</h3>
                {displayedTransactions.length > 0 && (
                  <div className="total-amount-display">
                    <span>
                      Total Amount: {formatCurrency(totalTransactionAmount)}
                    </span>
                  </div>
                )}
                {/* Month and Year Dropdowns */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "12px",
                    gap: "16px",
                  }}
                >
                  <select
                    style={{
                      padding: "6px 12px",
                      fontSize: "1em",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E0",
                    }}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="">Select Month</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                  <select
                    style={{
                      padding: "6px 12px",
                      fontSize: "1em",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E0",
                    }}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 6 }, (_, i) => 2020 + i).map(
                      (year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
              {/* Move tooltip and button below header */}
              <div className="list-header-extras">
                {showDummyData && (
                  <p className="sample-data-tooltip">
                    Sample data shown below. Enter in data to refresh page
                    information.
                  </p>
                )}
              </div>

              {displayedTransactions.length === 0 ? (
                <div className="empty-state">
                  <p>
                    No transactions yet. Add your first transaction to get
                    started!
                  </p>
                </div>
              ) : (
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
                    .sort(
                      ([dateA], [dateB]) => new Date(dateB) - new Date(dateA)
                    )
                    .map(([date, transactions]) => (
                      <div key={date} className="date-group">
                        <div className="date-header">{formatDate(date)}</div>
                        <div className="date-transactions">
                          {transactions.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="transaction-entry"
                            >
                              <button
                                className="delete-transaction-btn"
                                onClick={() =>
                                  deleteTransaction(transaction.id)
                                }
                                aria-label="Delete transaction"
                              >
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6m4-6v6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                              <div className="transaction-category">
                                {transaction.category}
                              </div>
                              <div className="transaction-amount">
                                {formatCurrency(transaction.amount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
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
                <ErrorBoundary>
                  <div className="chart-with-key">
                    <TransactionRadarChart
                      data={transactionsByCategory.filter(
                        (item) => !hiddenCategories.includes(item.category)
                      )}
                      categories={transactionsByCategory.map(
                        (item) => item.category
                      )}
                    />
                    {/* Category Key below chart */}
                    <div className="chart-key">
                      <h4 className="key-heading">Category Key</h4>

                      {/* Column Headers */}
                      <div className="key-column-headers">
                        <span className="header-view">View</span>
                        <span className="header-no">No.</span>
                        <span className="header-category">Category</span>
                        <span className="header-value">Value</span>
                        <span className="header-percentage">Percentage</span>
                      </div>

                      <div className="key-list-static">
                        {transactionsByCategory.map((item, index) => (
                          <div key={item.category} className="key-item-static">
                            <span className="key-view-static">
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{
                                  cursor: "pointer",
                                  opacity: hiddenCategories.includes(
                                    item.category
                                  )
                                    ? 0.4
                                    : 1,
                                }}
                                onClick={() =>
                                  toggleCategoryVisibility(item.category)
                                }
                              >
                                {hiddenCategories.includes(item.category) ? (
                                  <g>
                                    <path
                                      d="M2 12C4.5 7 8.5 4 12 4c3.5 0 7.5 3 10 8-2.5 5-6.5 8-10 8-3.5 0-7.5-3-10-8z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      fill="none"
                                    />
                                    <line
                                      x1="3"
                                      y1="21"
                                      x2="21"
                                      y2="3"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    />
                                  </g>
                                ) : (
                                  <g>
                                    <path
                                      d="M2 12C4.5 7 8.5 4 12 4c3.5 0 7.5 3 10 8-2.5 5-6.5 8-10 8-3.5 0-7.5-3-10-8z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      fill="none"
                                    />
                                    <circle
                                      cx="12"
                                      cy="12"
                                      r="3"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      fill="none"
                                    />
                                  </g>
                                )}
                              </svg>
                            </span>
                            <span className="key-numeral-static">
                              {toRomanNumeral(index + 1)}
                            </span>
                            <span className="key-category-static">
                              {item.category}
                            </span>
                            <span className="key-amount-static">
                              {item.amount
                                ? `$${item.amount.toFixed(2)}`
                                : "$0.00"}
                            </span>
                            <span className="key-percentage-static">
                              {item.percentage
                                ? item.percentage.toFixed(1)
                                : "0.0"}
                              %
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ErrorBoundary>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Transactions;
