import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { EyeIcon } from "./EyeIcon";
import "./home-radar-chart.css";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const HomeRadarChart = () => {
  // Define categories and their ranges (updated to match budgets page)
  // Category options for toggle
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
      "Savings",
      "Debt",
      "Lifestyle",
      "Healthcare",
      "Education",
      "Insurance",
      "Entertainment",
    ],
    16: [
      "Housing",
      "Utilities",
      "Groceries",
      "Dining",
      "Transport",
      "Savings",
      "Debt",
      "Lifestyle",
      "Healthcare",
      "Education",
      "Insurance",
      "Entertainment",
      "Pets",
      "Gifts",
      "Travel",
      "Miscellaneous",
    ],
  };
  // State for selected category count
  const [categoryCount, setCategoryCount] = useState(8);
  const categories = categoryOptions[categoryCount];

  // State to track theme changes and force re-render
  const [currentTheme, setCurrentTheme] = useState(
    () => document.body.getAttribute("data-theme") || "light"
  );

  // State to track hidden categories
  const [hiddenCategories, setHiddenCategories] = useState([]);

  // Regenerate chart data when category count changes
  useEffect(() => {
    const initialData = generateRandomData();
    setFullData({
      budgetData: initialData.budgetData,
      transactionPercentages: initialData.transactionPercentages,
    });
    // Modern accessible color scheme
    const isDark =
      (document.body.getAttribute("data-theme") || "light") === "dark";
    const budgetBorderColor = isDark ? "#63B3ED" : "#2B6CB0";
    const budgetBackgroundColor = isDark
      ? "rgba(99,179,237,0.25)"
      : "rgba(43,108,176,0.15)";
    const transactionBorderColor = isDark ? "#F56565" : "#C53030";
    const transactionBackgroundColor = isDark
      ? "rgba(245,101,101,0.25)"
      : "rgba(197,48,48,0.15)";
    setChartData({
      labels: categories.map((_, index) => toRomanNumeral(index + 1)),
      datasets: [
        {
          label: "Budget Categories (% of Total Budget)",
          data: initialData.budgetData,
          backgroundColor: budgetBackgroundColor,
          borderColor: budgetBorderColor,
          borderWidth: 2,
          pointBackgroundColor: budgetBorderColor,
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: budgetBorderColor,
        },
        {
          label: "Transaction Percentages",
          data: initialData.transactionPercentages,
          backgroundColor: transactionBackgroundColor,
          borderColor: transactionBorderColor,
          borderWidth: 2,
          pointBackgroundColor: transactionBorderColor,
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: transactionBorderColor,
        },
      ],
    });
    setHiddenCategories([]); // Reset hidden categories when changing count
  }, [categoryCount]);

  // Convert number to Roman numeral
  const toRomanNumeral = (num) => {
    const romanNumerals = [
      { value: 10, numeral: "X" },
      { value: 9, numeral: "IX" },
      { value: 8, numeral: "IIX" },
      { value: 5, numeral: "V" },
      { value: 4, numeral: "IV" },
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
  };

  // Toggle category visibility
  const toggleCategoryVisibility = (category) => {
    setHiddenCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((cat) => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Function to get current theme text color
  const getThemeTextColor = () => {
    return currentTheme === "dark" ? "#f3f4f6" : "#374151";
  };

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-theme"
        ) {
          const newTheme = document.body.getAttribute("data-theme") || "light";
          setCurrentTheme(newTheme);
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // Budget dataset ranges (percentage of total budget)
  // Based on standard financial planning principles (50/30/20 rule and similar guidelines)
  const getBudgetRanges = (cats) => {
    const base = {
      Housing: [25, 35], // Housing: 25-35% (standard recommendation: 25-30%, max 35%)
      Utilities: [5, 10], // Utilities: 5-10% (typically 5-10% of budget)
      Groceries: [10, 15], // Groceries: 10-15% (food at home)
      Dining: [3, 8], // Dining Out: 3-8% (eating out/restaurants)
      Transport: [10, 20], // Transportation: 10-20% (car payment, gas, insurance, maintenance)
      Savings: [10, 20], // Savings: 10-20% (emergency fund, retirement, goals)
      Debt: [0, 15], // Debt Repayment: 0-15% (excluding mortgage)
      Lifestyle: [5, 12], // Lifestyle: 5-12% (personal care, clothing, subscriptions)
      Healthcare: [5, 12], // Healthcare: 5-12% (insurance premiums, medical expenses)
      Education: [0, 10], // Education: 0-10% (student loans, courses, training)
      Insurance: [3, 8], // Insurance: 3-8% (life, disability, not including health/auto)
      Entertainment: [3, 8], // Entertainment: 3-8% (hobbies, recreation, streaming)
      Pets: [1, 5], // Pets: 1-5% (food, vet, supplies)
      Gifts: [1, 5], // Gifts: 1-5% (holidays, birthdays, charitable giving)
      Travel: [2, 10], // Travel: 2-10% (vacations, trips)
      Miscellaneous: [2, 8], // Miscellaneous: 2-8% (unexpected expenses, other)
    };
    // Only return ranges for selected categories
    const ranges = {};
    cats.forEach((cat) => {
      ranges[cat] = base[cat] || [1, 8];
    });
    return ranges;
  };

  // Actual spending dataset ranges (percentage of category budget - can exceed 100%)
  const getSpendingRanges = (cats) => {
    const ranges = {};
    cats.forEach((cat, idx) => {
      if (idx % 2 === 0) {
        ranges[cat] = [80, 140];
      } else {
        ranges[cat] = [60, 120];
      }
    });
    return ranges;
  };

  // Function to generate random data within ranges that adds up to 100%
  const generateRandomData = () => {
    const budgetRanges = getBudgetRanges(categories);
    const spendingRanges = getSpendingRanges(categories);
    // Generate random numbers within ranges for each category, rounded to nearest tenth
    const generateRandomTenthInRange = (min, max) => {
      const value = Math.random() * (max - min) + min;
      return Math.round(value * 10) / 10;
    };

    // Generate initial budget data
    let budgetData = categories.map((category) => {
      const [min, max] = budgetRanges[category];
      return Math.abs(generateRandomTenthInRange(min, max));
    });

    // Adjust to make total exactly 100 (rounded to nearest tenth)
    let total = budgetData.reduce((sum, val) => sum + val, 0);
    const targetTotal = 100;
    let diff = Math.round((targetTotal - total) * 10) / 10;
    if (diff !== 0) {
      // Distribute the difference to a random category, ensuring no negative values
      const categoryIndex = Math.floor(Math.random() * categories.length);
      const newValue = budgetData[categoryIndex] + diff;
      budgetData[categoryIndex] = Math.abs(Math.round(newValue * 10) / 10);
    }

    // Generate spending percentages (rounded to nearest tenth)
    const spendingPercentages = categories.map((category) => {
      const [min, max] = spendingRanges[category];
      return Math.abs(generateRandomTenthInRange(min, max));
    });

    // Calculate transaction percentages (budget decimal × transaction decimal)
    // Then convert back to percentage scale for visualization and round to nearest tenth
    const transactionPercentages = budgetData.map((budgetPercent, index) => {
      const budgetDecimal = Math.abs(budgetPercent) / 100;
      const transactionDecimal = Math.abs(spendingPercentages[index]) / 100;
      const result = budgetDecimal * transactionDecimal;
      // Convert back to percentage scale and round to nearest tenth
      return Math.abs(Math.round(result * 1000) / 10);
    });

    return { budgetData, spendingPercentages, transactionPercentages };
  };

  // Initialize chart data with random values
  const [chartData, setChartData] = useState(() => {
    const initialData = generateRandomData();
    // Modern accessible color scheme
    const isDark =
      (document.body.getAttribute("data-theme") || "light") === "dark";
    const budgetBorderColor = isDark ? "#63B3ED" : "#2B6CB0";
    const budgetBackgroundColor = isDark
      ? "rgba(99,179,237,0.25)"
      : "rgba(43,108,176,0.15)";
    const transactionBorderColor = isDark ? "#F56565" : "#C53030";
    const transactionBackgroundColor = isDark
      ? "rgba(245,101,101,0.25)"
      : "rgba(197,48,48,0.15)";
    return {
      labels: categories.map((_, index) => toRomanNumeral(index + 1)),
      datasets: [
        {
          label: "Budget Categories (% of Total Budget)",
          data: initialData.budgetData,
          backgroundColor: budgetBackgroundColor,
          borderColor: budgetBorderColor,
          borderWidth: 2,
          pointBackgroundColor: budgetBorderColor,
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: budgetBorderColor,
        },
        {
          label: "Transaction Percentages",
          data: initialData.transactionPercentages,
          backgroundColor: transactionBackgroundColor,
          borderColor: transactionBorderColor,
          borderWidth: 2,
          pointBackgroundColor: transactionBorderColor,
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: transactionBorderColor,
        },
      ],
    };
  });

  // Store full data for key display
  const [fullData, setFullData] = useState(() => {
    const initialData = generateRandomData();
    return {
      budgetData: initialData.budgetData,
      transactionPercentages: initialData.transactionPercentages,
    };
  });

  // Function to randomize the chart data
  const randomizeData = () => {
    const newData = generateRandomData();

    // Debug: Verify budget data adds up to 100
    const budgetTotal = newData.budgetData.reduce((sum, val) => sum + val, 0);
    console.log(
      "Budget percentages:",
      newData.budgetData,
      "Total:",
      budgetTotal
    );
    console.log("Spending percentages:", newData.spendingPercentages);
    console.log("Transaction percentages:", newData.transactionPercentages);

    // Store full data
    setFullData({
      budgetData: newData.budgetData,
      transactionPercentages: newData.transactionPercentages,
    });

    // Modern accessible color scheme
    const isDark =
      (document.body.getAttribute("data-theme") || "light") === "dark";
    const budgetBorderColor = isDark ? "#63B3ED" : "#2B6CB0";
    const budgetBackgroundColor = isDark
      ? "rgba(99,179,237,0.25)"
      : "rgba(43,108,176,0.15)";
    const transactionBorderColor = isDark ? "#F56565" : "#C53030";
    const transactionBackgroundColor = isDark
      ? "rgba(245,101,101,0.25)"
      : "rgba(197,48,48,0.15)";
    setChartData((prevData) => ({
      ...prevData,
      labels: categories.map((_, index) => toRomanNumeral(index + 1)),
      datasets: [
        {
          ...prevData.datasets[0],
          data: newData.budgetData,
          backgroundColor: budgetBackgroundColor,
          borderColor: budgetBorderColor,
          pointBackgroundColor: budgetBorderColor,
          pointHoverBorderColor: budgetBorderColor,
        },
        {
          ...prevData.datasets[1],
          data: newData.transactionPercentages,
          backgroundColor: transactionBackgroundColor,
          borderColor: transactionBorderColor,
          pointBackgroundColor: transactionBorderColor,
          pointHoverBorderColor: transactionBorderColor,
        },
      ],
    }));
  };

  // Update chart data when hidden categories change
  useEffect(() => {
    // Modern accessible color scheme
    const isDark =
      (document.body.getAttribute("data-theme") || "light") === "dark";
    const budgetBorderColor = isDark ? "#63B3ED" : "#2B6CB0";
    const budgetBackgroundColor = isDark
      ? "rgba(99,179,237,0.25)"
      : "rgba(43,108,176,0.15)";
    const transactionBorderColor = isDark ? "#F56565" : "#C53030";
    const transactionBackgroundColor = isDark
      ? "rgba(245,101,101,0.25)"
      : "rgba(197,48,48,0.15)";
    setChartData((prevData) => {
      const visibleIndices = categories
        .map((cat, index) => (!hiddenCategories.includes(cat) ? index : -1))
        .filter((index) => index !== -1);
      return {
        labels: visibleIndices.map((_, visibleIdx) =>
          toRomanNumeral(visibleIdx + 1)
        ),
        datasets: [
          {
            ...prevData.datasets[0],
            data: visibleIndices.map((index) => fullData.budgetData[index]),
            backgroundColor: budgetBackgroundColor,
            borderColor: budgetBorderColor,
            pointBackgroundColor: budgetBorderColor,
            pointHoverBorderColor: budgetBorderColor,
          },
          {
            ...prevData.datasets[1],
            data: visibleIndices.map(
              (index) => fullData.transactionPercentages[index]
            ),
            backgroundColor: transactionBackgroundColor,
            borderColor: transactionBorderColor,
            pointBackgroundColor: transactionBorderColor,
            pointHoverBorderColor: transactionBorderColor,
          },
        ],
      };
    });
  }, [hiddenCategories, fullData]);

  // Create chart options that dynamically get theme colors
  const getChartOptions = () => {
    const currentThemeColor = getThemeTextColor();
    // Filter labels for visible categories only
    const visibleLabels = categories
      .map((cat, index) =>
        !hiddenCategories.includes(cat) ? toRomanNumeral(index + 1) : null
      )
      .filter((label) => label !== null);

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Hide the top legend
        },
        tooltip: {
          enabled: false, // Disable tooltips
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 50, // Accommodate budget percentages (0-50%) and calculated transaction percentages (typically 0-0.8)
          ticks: {
            stepSize: 10, // Creates 5 rings (10, 20, 30, 40, 50)
            color: "#9ca3af", // Gray color for both light and dark mode
            font: {
              size: 12,
              weight: "bold",
            },
            display: true,
            showLabelBackdrop: false, // Remove background
            z: 1000, // High z-index to appear above colored areas
          },
          grid: {
            color: "rgba(128, 128, 128, 0.3)",
            lineWidth: 2,
            display: true,
          },
          angleLines: {
            color: "rgba(128, 128, 128, 0.3)",
            lineWidth: 2,
            display: true,
          },
          pointLabels: {
            color: currentThemeColor,
            font: {
              size: 12,
              weight: "600",
            },
          },
        },
      },
    };
  };

  // State for income
  const [income, setIncome] = useState(3000);

  // Calculate total amount spent across all categories
  const calculateTotalSpent = () => {
    return chartData.datasets[0].data.reduce((sum, budgetPercent, index) => {
      const transactionPercent = chartData.datasets[1].data[index];
      // 1. Budget Allocation = Income × (Budget% / 100)
      // 2. Actual Spending = Budget Allocation × (Transaction% / 100)
      // Combined: Income × (Budget% / 100) × (Transaction% / 100)
      const budgetAllocation =
        Math.abs(income) * (Math.abs(budgetPercent) / 100);
      const actualSpending =
        budgetAllocation * (Math.abs(transactionPercent) / 100);
      return sum + Math.abs(actualSpending);
    }, 0);
  };

  // Calculate remaining money: Income - Total Amount Spent
  const calculateRemaining = () => {
    const totalSpent = calculateTotalSpent();
    return Math.abs(income) - totalSpent;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="radar-chart-full-container">
      <div className="radar-chart-container">
        <h3 className="chart-title">Budget vs Spending Overview</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            margin: "8px 0 18px 0",
          }}
        >
          <p
            className="chart-tooltip"
            style={{
              textAlign: "center",
              fontSize: "1.08em",
              fontWeight: 500,
              letterSpacing: "0.01em",
              maxWidth: "480px",
            }}
          >
            Your dashboard will look like this once you enter your information.
            Categories and details are fully customizable with Saiel.
          </p>
        </div>
        {/* Controls and info below title/subtitle and above chart */}
        <div
          className="chart-controls-top"
          style={{ textAlign: "center", marginBottom: "20px" }}
        >
          {/* Category count toggle - consistent with other pages */}
          <div className="category-toggle-group">
            <button
              className={`category-toggle-btn${
                categoryCount === 8 ? " active" : ""
              }`}
              onClick={() => setCategoryCount(8)}
            >
              Eight
            </button>
            <button
              className={`category-toggle-btn${
                categoryCount === 12 ? " active" : ""
              }`}
              onClick={() => setCategoryCount(12)}
            >
              Twelve
            </button>
            <button
              className={`category-toggle-btn${
                categoryCount === 16 ? " active" : ""
              }`}
              onClick={() => setCategoryCount(16)}
            >
              Sixteen
            </button>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "32px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                color: currentTheme === "dark" ? "#FFFFFF" : "#1A202C",
                fontWeight: 500,
              }}
            >
              &#9679; Budget Distribution (%)
            </span>
            <span
              style={{
                color: currentTheme === "dark" ? "#2D3748" : "#1A202C",
                fontWeight: 500,
              }}
            >
              &#9679; Transaction vs. Budget (%)
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <label
              htmlFor="income-input"
              style={{ marginBottom: "4px", fontFamily: "inherit" }}
            >
              Set Income:
            </label>
            <input
              id="income-input"
              type="text"
              inputMode="decimal"
              value={formatCurrency(income)}
              onChange={(e) => {
                // Remove non-numeric and non-decimal characters
                const raw = e.target.value.replace(/[^\d.]/g, "");
                // Parse and round to two decimals
                let num = parseFloat(raw);
                if (isNaN(num)) num = 0;
                setIncome(Math.round(num * 100) / 100);
              }}
              className="income-input"
              style={{
                textAlign: "center",
                fontWeight: 500,
                fontSize: "1.1em",
                width: "120px",
                fontFamily: "inherit",
              }}
              autoComplete="off"
            />
          </div>
        </div>
        {/* Chart below controls/info */}
        <div className="chart-wrapper-centered">
          <div className="chart-content">
            <Radar data={chartData} options={getChartOptions()} />
          </div>
        </div>
        <button
          onClick={randomizeData}
          className="randomize-btn"
          style={{ margin: "18px auto 0 auto", display: "block" }}
        >
          Randomize Data
        </button>
        <div className="financial-summary-inside">
          <div className="total-spent-display">
            <span>Total Spent: {formatCurrency(calculateRemaining())}</span>
          </div>
          <div className="remaining-display">
            <span>Remaining: {formatCurrency(calculateTotalSpent())}</span>
          </div>
        </div>
        {/* Category Key Table */}
        <div
          className="category-key-container"
          style={{
            marginTop: "32px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            padding: "24px",
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <h4
            style={{
              textAlign: "center",
              marginBottom: "18px",
              fontWeight: 600,
            }}
          >
            Category Key
          </h4>
          <table
            className="category-key-table"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #e3eafc",
                  fontWeight: 600,
                  fontSize: "1em",
                }}
              >
                <th style={{ padding: "8px" }}>VIEW</th>
                <th style={{ padding: "8px" }}>NO.</th>
                <th style={{ padding: "8px" }}>CATEGORY</th>
                <th style={{ padding: "8px" }}>VALUE</th>
                <th style={{ padding: "8px" }}>PERCENTAGE</th>
              </tr>
            </thead>
            <tbody>
              {categories
                .map((cat, idx) => ({ cat, idx }))
                .filter(({ cat }) => !hiddenCategories.includes(cat))
                .map(({ cat, idx }, visibleIdx) => {
                  const budgetValue = fullData.budgetData[idx]
                    ? Math.abs(income) *
                      (Math.abs(fullData.budgetData[idx]) / 100)
                    : 0;
                  const transactionValue = fullData.transactionPercentages[idx]
                    ? Math.abs(income) *
                      (Math.abs(fullData.transactionPercentages[idx]) / 100)
                    : 0;
                  const percentage =
                    budgetValue > 0
                      ? (Math.abs(transactionValue) / Math.abs(budgetValue)) *
                        100
                      : 0;
                  return (
                    <tr
                      key={cat}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        fontWeight: 500,
                        fontSize: "0.98em",
                      }}
                    >
                      <td style={{ textAlign: "center", padding: "6px" }}>
                        <span
                          style={{
                            cursor: "pointer",
                            opacity: 1,
                          }}
                          onClick={() => toggleCategoryVisibility(cat)}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
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
                          </svg>
                        </span>
                      </td>
                      <td style={{ textAlign: "center", padding: "6px" }}>
                        {toRomanNumeral(visibleIdx + 1)}
                      </td>
                      <td style={{ padding: "6px" }}>{cat}</td>
                      <td style={{ textAlign: "right", padding: "6px" }}>
                        {formatCurrency(budgetValue)}
                      </td>
                      <td style={{ textAlign: "right", padding: "6px" }}>
                        {percentage ? percentage.toFixed(1) : "0.0"}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HomeRadarChart;
