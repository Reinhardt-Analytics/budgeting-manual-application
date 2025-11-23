import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import './home-radar-chart.css';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const HomeRadarChart = () => {
    // Define categories and their ranges
    const categories = ['Housing', 'Utilities', 'Transport', 'Medical', 'Groceries', 'Savings'];
    
    // State to track theme changes and force re-render
    const [currentTheme, setCurrentTheme] = useState(() => 
        document.body.getAttribute('data-theme') || 'light'
    );
    
    // Function to get current theme text color
    const getThemeTextColor = () => {
        return currentTheme === 'dark' ? '#f3f4f6' : '#374151';
    };
    

    
    // Listen for theme changes
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const newTheme = document.body.getAttribute('data-theme') || 'light';
                    setCurrentTheme(newTheme);
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => observer.disconnect();
    }, []);
    

    

    
    // Budget dataset ranges (percentage of total budget)
    const budgetRanges = {
        'Housing': [22, 36],
        'Utilities': [10, 18],
        'Transport': [6, 16],
        'Medical': [6, 22],
        'Groceries': [12, 24],
        'Savings': [14, 26]
    };
    
    // Actual spending dataset ranges (percentage of category budget - can exceed 100%)
    const spendingRanges = {
        'Housing': [60, 140],
        'Utilities': [60, 140],
        'Transport': [60, 140],
        'Medical': [60, 140],
        'Groceries': [60, 140],
        'Savings': [60, 140]
    };

    // Function to generate random data within ranges that adds up to 100%
    const generateRandomData = () => {
        // Generate random even numbers within ranges for each category
        const generateEvenInRange = (min, max) => {
            const range = Math.floor((max - min) / 2) + 1;
            return (Math.floor(Math.random() * range) * 2) + (min % 2 === 0 ? min : min + 1);
        };

        // Generate initial budget data
        let budgetData = categories.map(category => {
            const [min, max] = budgetRanges[category];
            return generateEvenInRange(min, max);
        });

        // Adjust to make total exactly 100
        let total = budgetData.reduce((sum, val) => sum + val, 0);
        const targetTotal = 100;
        
        // Distribute the difference to make it exactly 100
        while (total !== targetTotal) {
            const diff = targetTotal - total;
            const categoryIndex = Math.floor(Math.random() * categories.length);
            const [min, max] = budgetRanges[categories[categoryIndex]];
            
            if (diff > 0) {
                // Need to add
                if (budgetData[categoryIndex] + 2 <= max) {
                    budgetData[categoryIndex] += 2;
                    total += 2;
                }
            } else {
                // Need to subtract
                if (budgetData[categoryIndex] - 2 >= min) {
                    budgetData[categoryIndex] -= 2;
                    total -= 2;
                }
            }
            
            // Prevent infinite loop
            if (Math.abs(diff) === 1) {
                // Find a category that can be adjusted by 1
                for (let i = 0; i < categories.length; i++) {
                    const [min, max] = budgetRanges[categories[i]];
                    if (diff > 0 && budgetData[i] + 1 <= max && (budgetData[i] + 1) % 2 === 0) {
                        budgetData[i] += 1;
                        total += 1;
                        break;
                    } else if (diff < 0 && budgetData[i] - 1 >= min && (budgetData[i] - 1) % 2 === 0) {
                        budgetData[i] -= 1;
                        total -= 1;
                        break;
                    }
                }
                break;
            }
        }
        
        // Generate spending percentages (even numbers within ranges)
        const spendingPercentages = categories.map(category => {
            const [min, max] = spendingRanges[category];
            return generateEvenInRange(min, max);
        });
        
        // Calculate transaction percentages (budget decimal × transaction decimal)
        // Then convert back to percentage scale for visualization and round to nearest even integer at second decimal place
        const transactionPercentages = budgetData.map((budgetPercent, index) => {
            const budgetDecimal = budgetPercent / 100; // Convert 28% to 0.28
            const transactionDecimal = spendingPercentages[index] / 100; // Convert 140% to 1.4
            const result = budgetDecimal * transactionDecimal; // 0.28 × 1.4 = 0.392
            
            // Convert back to percentage scale for better visualization (0.392 → 39.2)
            const resultPercent = result * 100;
            
            // Round to nearest even integer at second decimal place
            const rounded = Math.round(resultPercent * 100) / 100; // Round to 2 decimal places
            const secondDecimal = Math.round(rounded * 100) % 10;
            
            // If second decimal is odd, adjust to make it even
            if (secondDecimal % 2 === 1) {
                const adjustment = secondDecimal === 9 ? -0.01 : 0.01;
                return Math.round((rounded + adjustment) * 100) / 100;
            }
            
            return rounded;
        });
        
        return { budgetData, spendingPercentages, transactionPercentages };
    };

    // Initialize chart data with random values
    const [chartData, setChartData] = useState(() => {
        const initialData = generateRandomData();
        return {
            labels: categories,
            datasets: [
                {
                    label: 'Budget Categories (% of Total Budget)',
                    data: initialData.budgetData,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
                },
                {
                    label: 'Transaction Percentages',
                    data: initialData.transactionPercentages,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
                }
            ]
        };
    });

    // Function to randomize the chart data
    const randomizeData = () => {
        const newData = generateRandomData();
        
        // Debug: Verify budget data adds up to 100
        const budgetTotal = newData.budgetData.reduce((sum, val) => sum + val, 0);
        console.log('Budget percentages:', newData.budgetData, 'Total:', budgetTotal);
        console.log('Spending percentages:', newData.spendingPercentages);
        console.log('Transaction percentages:', newData.transactionPercentages);
        
        setChartData(prevData => ({
            ...prevData,
            datasets: [
                {
                    ...prevData.datasets[0],
                    data: newData.budgetData
                },
                {
                    ...prevData.datasets[1],
                    data: newData.transactionPercentages
                }
            ]
        }));
        

    };
    


    // Create chart options that dynamically get theme colors
    const getChartOptions = () => {
        const currentThemeColor = getThemeTextColor();
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Hide the top legend
                },
                tooltip: {
                    enabled: false // Disable tooltips
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 50, // Accommodate budget percentages (0-50%) and calculated transaction percentages (typically 0-0.8)
                    ticks: {
                        stepSize: 10, // Creates 5 rings (10, 20, 30, 40, 50)
                        color: '#9ca3af', // Gray color for both light and dark mode
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        display: true,
                        showLabelBackdrop: false, // Remove background
                        z: 1000 // High z-index to appear above colored areas
                    },
                    grid: {
                        color: 'rgba(128, 128, 128, 0.3)',
                        lineWidth: 2,
                        display: true
                    },
                    angleLines: {
                        color: 'rgba(128, 128, 128, 0.3)',
                        lineWidth: 2,
                        display: true
                    },
                    pointLabels: {
                        color: currentThemeColor,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                }
            }
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
            const budgetAllocation = income * (budgetPercent / 100);
            const actualSpending = budgetAllocation * (transactionPercent / 100);
            return sum + actualSpending;
        }, 0);
    };

    // Calculate remaining money: Income - Total Amount Spent
    const calculateRemaining = () => {
        const totalSpent = calculateTotalSpent();
        return income - totalSpent;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className="radar-chart-full-container">
            <div className="radar-chart-container">
                <h3 className="chart-title">Budget vs Spending Overview</h3>
                <p className="chart-subtitle">Sample Data</p>
                <div className="chart-wrapper-centered">
                    <div className="chart-content">
                        <Radar data={chartData} options={getChartOptions()} />
                        {/* Display values under category names */}
                        <div className="category-values">
                            {categories.map((category, index) => (
                                <div key={category} className={`category-value category-${index}`}>
                                    <div className="budget-value">
                                        <span className="value-color-box budget-color"></span>
                                        <span className="value-text">{Math.round(chartData.datasets[0].data[index])}%</span>
                                    </div>
                                    <div className="transaction-value">
                                        <span className="value-color-box transaction-color"></span>
                                        <span className="value-text">{Math.round(chartData.datasets[1].data[index])}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="financial-summary-inside">
                    <div className="total-spent-display">
                        <span>Total Spent: {formatCurrency(calculateRemaining())}</span>
                    </div>
                    <div className="remaining-display">
                        <span>Remaining: {formatCurrency(calculateTotalSpent())}</span>
                    </div>
                </div>
            </div>
            
            {/* Controls outside the card */}
            <div className="external-controls">
                <div className="chart-legend">
                    <div className="legend-item">
                        <span className="legend-color" style={{backgroundColor: 'rgba(54, 162, 235, 0.7)'}}></span>
                        <span>Budget Distribution (%)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color" style={{backgroundColor: 'rgba(255, 99, 132, 0.7)'}}></span>
                        <span>Transaction vs. Budget (%)</span>
                    </div>
                </div>
                <div className="income-control">
                    <div className="income-input-wrapper">
                        <span className="income-label">Set Income:</span>
                        <input
                            id="income-input"
                            type="text"
                            value={formatCurrency(income)}
                            onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                setIncome(Number(numericValue) || 0);
                            }}
                            className="income-input"
                        />
                    </div>
                </div>
                <div className="chart-controls">
                    <button onClick={randomizeData} className="randomize-btn">
                        Randomize Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomeRadarChart;