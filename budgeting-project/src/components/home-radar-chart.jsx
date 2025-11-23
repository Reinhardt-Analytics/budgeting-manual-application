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
import { EyeIcon } from './EyeIcon';
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
    
    // State to track hidden categories
    const [hiddenCategories, setHiddenCategories] = useState([]);
    
    // Convert number to Roman numeral
    const toRomanNumeral = (num) => {
        const romanNumerals = [
            { value: 10, numeral: 'X' },
            { value: 9, numeral: 'IX' },
            { value: 8, numeral: 'IIX' },
            { value: 5, numeral: 'V' },
            { value: 4, numeral: 'IV' },
            { value: 1, numeral: 'I' }
        ];
        let result = '';
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
        setHiddenCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(cat => cat !== category);
            } else {
                return [...prev, category];
            }
        });
    };
    
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
            labels: categories.map((_, index) => toRomanNumeral(index + 1)),
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
    
    // Store full data for key display
    const [fullData, setFullData] = useState(() => {
        const initialData = generateRandomData();
        return {
            budgetData: initialData.budgetData,
            transactionPercentages: initialData.transactionPercentages
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
        
        // Store full data
        setFullData({
            budgetData: newData.budgetData,
            transactionPercentages: newData.transactionPercentages
        });
        
        setChartData(prevData => ({
            ...prevData,
            labels: categories.map((_, index) => toRomanNumeral(index + 1)),
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
    
    // Update chart data when hidden categories change
    useEffect(() => {
        setChartData(prevData => {
            const visibleIndices = categories
                .map((cat, index) => !hiddenCategories.includes(cat) ? index : -1)
                .filter(index => index !== -1);
            
            return {
                labels: visibleIndices.map(index => toRomanNumeral(index + 1)),
                datasets: [
                    {
                        ...prevData.datasets[0],
                        data: visibleIndices.map(index => fullData.budgetData[index])
                    },
                    {
                        ...prevData.datasets[1],
                        data: visibleIndices.map(index => fullData.transactionPercentages[index])
                    }
                ]
            };
        });
    }, [hiddenCategories, fullData]);
    


    // Create chart options that dynamically get theme colors
    const getChartOptions = () => {
        const currentThemeColor = getThemeTextColor();
        // Filter labels for visible categories only
        const visibleLabels = categories
            .map((cat, index) => !hiddenCategories.includes(cat) ? toRomanNumeral(index + 1) : null)
            .filter(label => label !== null);
        
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
                   <p className="chart-tooltip" style={{marginTop: '12px'}}>
                       Your dashboard will look like this once you enter your information. Categories and details are fully customizable with Saiel.
                   </p>
                <div className="chart-wrapper-centered">
                    <div className="chart-content">
                        <Radar data={chartData} options={getChartOptions()} />
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
                
                {/* Category Key */}
                <div className="budget-card-key">
                    <h4 className="key-heading">Category Key</h4>

                    {/* Column Headers */}
                    <div className="key-column-headers">
                        <span className="header-view">View</span>
                        <span className="header-no">No.</span>
                        <span className="header-category">Category</span>
                        <span className="header-budget">Budget</span>
                        <span className="header-transaction">Transaction</span>
                    </div>

                    <div className="key-list-static">
                        {categories.map((category, index) => (
                            <div key={index} className="key-item-static">
                                <span className="key-view-static">
                                    <EyeIcon 
                                        visible={!hiddenCategories.includes(category)}
                                        onClick={() => toggleCategoryVisibility(category)}
                                        size={18}
                                    />
                                </span>
                                <span className="key-numeral-static">{toRomanNumeral(index + 1)}</span>
                                <span className="key-category-static">{category}</span>
                                <span className="key-budget-static">{fullData.budgetData[index].toFixed(1)}%</span>
                                <span className="key-transaction-static">{fullData.transactionPercentages[index].toFixed(1)}%</span>
                            </div>
                        ))}
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