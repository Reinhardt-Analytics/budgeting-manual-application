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
    // Define categories and their ranges (updated to match budgets page)
    const categories = ['Housing', 'Utilities', 'Groceries', 'Dining', 'Transport', 'Savings', 'Debt', 'Lifestyle'];
    
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
        'Utilities': [12, 18],
        'Groceries': [14, 22],
        'Dining': [8, 14],
        'Transport': [8, 18],
        'Savings': [14, 26],
        'Debt': [8, 18],
        'Lifestyle': [8, 16]
    };

    // Actual spending dataset ranges (percentage of category budget - can exceed 100%)
    // Even index categories: 80–140%, Odd index categories: 60–120%, and cannot be between 90% and 110%
    const spendingRanges = {};
    categories.forEach((cat, idx) => {
        if (idx % 2 === 0) {
            spendingRanges[cat] = [80, 140];
        } else {
            spendingRanges[cat] = [60, 120];
        }
    });

    // Function to generate random data within ranges that adds up to 100%
    const generateRandomData = () => {
        // Generate random numbers within ranges for each category, rounded to nearest tenth
        const generateRandomTenthInRange = (min, max) => {
            const value = Math.random() * (max - min) + min;
            return Math.round(value * 10) / 10;
        };

        // Generate initial budget data
        let budgetData = categories.map(category => {
            const [min, max] = budgetRanges[category];
            return generateRandomTenthInRange(min, max);
        });

        // Adjust to make total exactly 100 (rounded to nearest tenth)
        let total = budgetData.reduce((sum, val) => sum + val, 0);
        const targetTotal = 100;
        let diff = Math.round((targetTotal - total) * 10) / 10;
        if (diff !== 0) {
            // Distribute the difference to a random category
            const categoryIndex = Math.floor(Math.random() * categories.length);
            budgetData[categoryIndex] = Math.round((budgetData[categoryIndex] + diff) * 10) / 10;
        }

        // Generate spending percentages (rounded to nearest tenth)
        const spendingPercentages = categories.map(category => {
            const [min, max] = spendingRanges[category];
            return generateRandomTenthInRange(min, max);
        });

        // Calculate transaction percentages (budget decimal × transaction decimal)
        // Then convert back to percentage scale for visualization and round to nearest tenth
        const transactionPercentages = budgetData.map((budgetPercent, index) => {
            const budgetDecimal = budgetPercent / 100;
            const transactionDecimal = spendingPercentages[index] / 100;
            const result = budgetDecimal * transactionDecimal;
            // Convert back to percentage scale and round to nearest tenth
            return Math.round(result * 1000) / 10;
        });

        return { budgetData, spendingPercentages, transactionPercentages };
    };

    // Initialize chart data with random values
    const [chartData, setChartData] = useState(() => {
        const initialData = generateRandomData();
        // Modern accessible color scheme
        const isDark = (document.body.getAttribute('data-theme') || 'light') === 'dark';
        const budgetBorderColor = isDark ? '#63B3ED' : '#2B6CB0';
        const budgetBackgroundColor = isDark ? 'rgba(99,179,237,0.25)' : 'rgba(43,108,176,0.15)';
        const transactionBorderColor = isDark ? '#F56565' : '#C53030';
        const transactionBackgroundColor = isDark ? 'rgba(245,101,101,0.25)' : 'rgba(197,48,48,0.15)';
        return {
            labels: categories.map((_, index) => toRomanNumeral(index + 1)),
            datasets: [
                {
                    label: 'Budget Categories (% of Total Budget)',
                    data: initialData.budgetData,
                    backgroundColor: budgetBackgroundColor,
                    borderColor: budgetBorderColor,
                    borderWidth: 2,
                    pointBackgroundColor: budgetBorderColor,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: budgetBorderColor,
                },
                {
                    label: 'Transaction Percentages',
                    data: initialData.transactionPercentages,
                    backgroundColor: transactionBackgroundColor,
                    borderColor: transactionBorderColor,
                    borderWidth: 2,
                    pointBackgroundColor: transactionBorderColor,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: transactionBorderColor,
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
        
        // Modern accessible color scheme
        const isDark = (document.body.getAttribute('data-theme') || 'light') === 'dark';
        const budgetBorderColor = isDark ? '#63B3ED' : '#2B6CB0';
        const budgetBackgroundColor = isDark ? 'rgba(99,179,237,0.25)' : 'rgba(43,108,176,0.15)';
        const transactionBorderColor = isDark ? '#F56565' : '#C53030';
        const transactionBackgroundColor = isDark ? 'rgba(245,101,101,0.25)' : 'rgba(197,48,48,0.15)';
        setChartData(prevData => ({
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
                }
            ]
        }));
        

    };
    
    // Update chart data when hidden categories change
    useEffect(() => {
        // Modern accessible color scheme
        const isDark = (document.body.getAttribute('data-theme') || 'light') === 'dark';
        const budgetBorderColor = isDark ? '#63B3ED' : '#2B6CB0';
        const budgetBackgroundColor = isDark ? 'rgba(99,179,237,0.25)' : 'rgba(43,108,176,0.15)';
        const transactionBorderColor = isDark ? '#F56565' : '#C53030';
        const transactionBackgroundColor = isDark ? 'rgba(245,101,101,0.25)' : 'rgba(197,48,48,0.15)';
        setChartData(prevData => {
            const visibleIndices = categories
                .map((cat, index) => !hiddenCategories.includes(cat) ? index : -1)
                .filter(index => index !== -1);
            return {
                labels: visibleIndices.map(index => toRomanNumeral(index + 1)),
                datasets: [
                    {
                        ...prevData.datasets[0],
                        data: visibleIndices.map(index => fullData.budgetData[index]),
                        backgroundColor: budgetBackgroundColor,
                        borderColor: budgetBorderColor,
                        pointBackgroundColor: budgetBorderColor,
                        pointHoverBorderColor: budgetBorderColor,
                    },
                    {
                        ...prevData.datasets[1],
                        data: visibleIndices.map(index => fullData.transactionPercentages[index]),
                        backgroundColor: transactionBackgroundColor,
                        borderColor: transactionBorderColor,
                        pointBackgroundColor: transactionBorderColor,
                        pointHoverBorderColor: transactionBorderColor,
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
                {/* Controls and info below title/subtitle and above chart */}
                <div className="chart-controls-top" style={{textAlign: 'center', marginBottom: '20px'}}>
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', marginBottom: '8px'}}>
                        <span
                            style={{
                                color: currentTheme === 'dark' ? '#FFFFFF' : '#1A202C',
                                fontWeight: 500
                            }}
                        >&#9679; Budget Distribution (%)</span>
                        <span
                            style={{
                                color: currentTheme === 'dark' ? '#2D3748' : '#1A202C',
                                fontWeight: 500
                            }}
                        >&#9679; Transaction vs. Budget (%)</span>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px'}}>
                        <label htmlFor="income-input" style={{marginBottom: '4px'}}>Set Income:</label>
                        <input
                            id="income-input"
                            type="text"
                            value={formatCurrency(income)}
                            onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                setIncome(Number(numericValue) || 0);
                            }}
                            className="income-input"
                            style={{textAlign: 'center', fontWeight: 500, fontSize: '1.1em', width: '120px'}}
                        />
                    </div>
                    <button onClick={randomizeData} className="randomize-btn" style={{margin: '12px 0'}}>
                        Randomize Data
                    </button>
                    <p className="chart-tooltip" style={{marginTop: '12px'}}>
                        Your dashboard will look like this once you enter your information. Categories and details are fully customizable with Saiel.
                    </p>
                </div>
                {/* Chart below controls/info */}
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
                {/* Category Key and other content can go here if needed */}
            </div>
        </div>
    );
};

export default HomeRadarChart;