import { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, RadialLinearScale } from 'chart.js';
import { PolarArea } from 'react-chartjs-2';
import budgetDataTemplate from '../data/budgetData.json';
import './budget-creation.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, RadialLinearScale);

function Budget() {
    // Initialize state from template only (no localStorage persistence)
    const [budgetData, setBudgetData] = useState(() => {
        return { ...budgetDataTemplate };
    });

    const [selectedCategory, setSelectedCategory] = useState('');
    const [budgetAmount, setBudgetAmount] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showViewAll, setShowViewAll] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showLimitWarning, setShowLimitWarning] = useState(false);

    // Session-only storage (no persistence between sessions)
    // useEffect(() => {
    //     localStorage.setItem('budgetData', JSON.stringify(budgetData));
    // }, [budgetData]);

    // Get all categories (default + custom)
    const getAllCategories = () => {
        return [...budgetData.defaultCategories, ...budgetData.customCategories];
    };

    // Format currency with commas
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Format input value with commas and decimals
    const formatInputValue = (value) => {
        if (!value) return '';
        const numValue = parseFloat(value.toString().replace(/,/g, ''));
        if (isNaN(numValue)) return '';
        return numValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Format percentage
    const formatPercentage = (amount) => {
        if (!amount && amount !== 0) return '0%';
        return `${parseFloat(amount).toFixed(1)}%`;
    };

    // Validate budget input
    const validateBudgetInput = (value, category) => {
        const numValue = parseFloat(value);
        
        // Check for negative numbers
        if (numValue < 0) return false;
        
        if (budgetData.currencyMode === 'dollars') {
            // Cap at $10,000
            return numValue <= 10000;
        } else {
            // Check total percentage doesn't exceed 100%
            const currentTotal = Object.entries(budgetData.budgets)
                .filter(([cat]) => cat !== category)
                .reduce((sum, [, amount]) => sum + parseFloat(amount || 0), 0);
            
            return (currentTotal + numValue) <= 100;
        }
    };

    // Prepare chart data for polar area chart
    const getChartData = () => {
        const budgetEntries = Object.entries(budgetData.budgets);
        
        if (budgetEntries.length === 0) {
            return {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            };
        }

        const totalBudget = budgetEntries.reduce((sum, [, amount]) => sum + (parseFloat(amount) || 0), 0);
        
        const labels = [];
        const data = [];
        const backgroundColor = [];

        budgetEntries.forEach(([category, amount]) => {
            const numericAmount = parseFloat(amount) || 0;
            if (numericAmount > 0) {
                labels.push(category);
                // Calculate percentage of total budget
                const percentage = totalBudget > 0 ? (numericAmount / totalBudget) * 100 : 0;
                data.push(percentage);
                backgroundColor.push('#88C0FC');
            }
        });

        return {
            labels,
            datasets: [{
                data,
                backgroundColor,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    };

    // Chart options with animations
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 800,
            easing: 'easeInOutQuart'
        },
        transitions: {
            active: {
                animation: {
                    duration: 400
                }
            }
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const budgetAmount = budgetData.budgets[label] || 0;
                        return `${label}: ${value.toFixed(1)}% (${budgetData.currencyMode === 'dollars' ? formatCurrency(budgetAmount) : formatPercentage(budgetAmount)})`;
                    }
                }
            }
        },
        scales: {
            r: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                angleLines: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                pointLabels: {
                    font: {
                        size: 10
                    }
                }
            }
        }
    };

    // Handle category selection
    const handleCategoryChange = (e) => {
        const category = e.target.value;
        if (category === 'ADD_NEW_CATEGORY') {
            if (getAllCategories().length >= 16) {
                setShowLimitWarning(true);
                return;
            }
            setShowAddCategory(true);
            setSelectedCategory('');
            setBudgetAmount('');
        } else {
            setSelectedCategory(category);
            // Show current budget value in input field
            const currentBudget = budgetData.budgets[category];
            setBudgetAmount(currentBudget ? currentBudget.toString() : '');
            setShowAddCategory(false);
        }
    };

    // Handle budget amount input
    const handleBudgetChange = (e) => {
        const input = e.target;
        const cursorPosition = input.selectionStart;
        const rawValue = input.value.replace(/[,$%]/g, '');
        const numValue = parseFloat(rawValue);
        
        if (rawValue === '' || (!isNaN(numValue) && validateBudgetInput(numValue, selectedCategory))) {
            const newValue = rawValue === '' ? '' : rawValue;
            setBudgetAmount(newValue);
            
            // Restore cursor position after state update
            setTimeout(() => {
                const adjustedPosition = Math.min(cursorPosition, newValue.length);
                input.setSelectionRange(adjustedPosition, adjustedPosition);
            }, 0);
        }
    };

    // Set budget for selected category
    const setBudget = () => {
        if (selectedCategory && budgetAmount !== '') {
            setBudgetData(prev => ({
                ...prev,
                budgets: {
                    ...prev.budgets,
                    [selectedCategory]: parseFloat(budgetAmount)
                }
            }));
        }
    };

    // Handle Enter key for setting budget
    const handleBudgetKeyPress = (e) => {
        if (e.key === 'Enter') {
            setBudget();
        }
    };

    // Create new category with budget value
    const createCategoryWithBudget = () => {
        if (newCategoryName.trim() && budgetAmount !== '' && getAllCategories().length < 16) {
            const trimmedName = newCategoryName.trim();
            if (!getAllCategories().includes(trimmedName)) {
                setBudgetData(prev => ({
                    ...prev,
                    customCategories: [...prev.customCategories, trimmedName],
                    budgets: {
                        ...prev.budgets,
                        [trimmedName]: parseFloat(budgetAmount)
                    }
                }));
                setNewCategoryName('');
                setBudgetAmount('');
                setShowAddCategory(false);
                setSelectedCategory(trimmedName);
            }
        }
    };

    // Handle Enter key for creating category with budget
    const handleNewCategoryKeyPress = (e) => {
        if (e.key === 'Enter') {
            createCategoryWithBudget();
        }
    };

    // Toggle currency mode
    const toggleCurrencyMode = () => {
        setBudgetData(prev => ({
            ...prev,
            currencyMode: prev.currencyMode === 'dollars' ? 'percentage' : 'dollars',
            budgets: {} // Clear budgets when switching modes
        }));
        setBudgetAmount('');
    };

    // Remove category
    const removeCategory = (category) => {
        setBudgetData(prev => {
            const newBudgets = { ...prev.budgets };
            delete newBudgets[category];
            
            return {
                ...prev,
                budgets: newBudgets,
                customCategories: prev.customCategories.filter(cat => cat !== category)
            };
        });
        
        if (selectedCategory === category) {
            setSelectedCategory('');
            setBudgetAmount('');
        }
    };

    // Handle monthly income change
    const handleIncomeChange = (e) => {
        const input = e.target;
        const cursorPosition = input.selectionStart;
        const rawValue = input.value.replace(/[,$]/g, '');
        const numValue = parseFloat(rawValue);
        
        if (rawValue === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 10000000)) {
            setBudgetData(prev => ({
                ...prev,
                monthlyIncome: rawValue === '' ? 0 : numValue
            }));
            
            // Restore cursor position after state update
            setTimeout(() => {
                const adjustedPosition = Math.min(cursorPosition, rawValue.length);
                input.setSelectionRange(adjustedPosition, adjustedPosition);
            }, 0);
        }
    };

    // Set monthly income
    const setMonthlyIncome = () => {
        // Format the current income value
        if (budgetData.monthlyIncome > 0) {
            setBudgetData(prev => ({
                ...prev,
                monthlyIncome: parseFloat(prev.monthlyIncome)
            }));
        }
    };

    // Handle Enter key for income
    const handleIncomeKeyPress = (e) => {
        if (e.key === 'Enter') {
            setMonthlyIncome();
        }
    };

    return (
        <div className="budget-container">
            <div className="budget-card">
                <div className="card-header">
                    <h2>Configure Budget</h2>
                    <p className="card-subtitle">Select a category and assign a value to continue.</p>
                </div>
                
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
                        <button onClick={setMonthlyIncome} className="income-enter-btn">
                            Enter
                        </button>
                    </div>
                </div>

                <div className="budget-setting">
                    <select 
                        value={selectedCategory} 
                        onChange={handleCategoryChange}
                        className="category-select"
                    >
                        <option value="" disabled>Select a Category</option>
                        {getAllCategories().map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                        <option value="ADD_NEW_CATEGORY">Add a Category</option>
                    </select>
                    <p className="category-limit-text">Maximum Category Limit: 16</p>

                    {showAddCategory && (
                        <div className="add-category-section">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyPress={handleNewCategoryKeyPress}
                                placeholder="Enter category name"
                                maxLength={30}
                                className="new-category-input"
                            />
                        </div>
                    )}

                    <div className="budget-input-section">
                        <span className="budget-label">Set Budget:</span>
                        <input
                            type="text"
                            value={budgetAmount ? (budgetData.currencyMode === 'dollars' ? formatInputValue(budgetAmount) : parseFloat(budgetAmount).toFixed(1)) : ''}
                            onChange={handleBudgetChange}
                            onKeyPress={showAddCategory ? handleNewCategoryKeyPress : handleBudgetKeyPress}
                            placeholder={budgetData.currencyMode === 'dollars' ? '$0.00' : '0.00%'}
                        />
                        <div className="currency-toggle-slider" onClick={toggleCurrencyMode}>
                            <span className={`slider-option ${budgetData.currencyMode === 'dollars' ? 'active' : ''}`}>$</span>
                            <span className={`slider-option ${budgetData.currencyMode === 'percentage' ? 'active' : ''}`}>%</span>
                        </div>
                    </div>

                    <button 
                        onClick={showAddCategory ? createCategoryWithBudget : setBudget} 
                        className="set-budget-btn"
                    >
                        Enter
                    </button>
                </div>

                {selectedCategory && !showAddCategory && (
                    <div className="remove-category-section">
                        <button 
                            onClick={() => removeCategory(selectedCategory)}
                            className="remove-category-btn"
                        >
                            Remove Category
                        </button>
                    </div>
                )}

                <div className="view-all-section">
                    <button 
                        onClick={() => setShowViewAll(true)}
                        className="view-all-btn"
                    >
                        View All
                    </button>
                </div>

                {showLimitWarning && (
                    <div className="modal-overlay" onClick={() => setShowLimitWarning(false)}>
                        <div className="modal-content warning-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>Category Limit Reached</h3>
                            <p>You have reached the maximum limit of 16 categories. Please delete a category before creating a new one.</p>
                            <button 
                                onClick={() => setShowLimitWarning(false)}
                                className="close-modal-btn"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {showViewAll && (
                    <div className="modal-overlay" onClick={() => setShowViewAll(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>All Budget Categories</h3>
                            
                            <div className="summary-section">
                                <div className="summary-item large-item underlined">
                                    <span className="summary-label">Total</span>
                                    <span className="summary-amount">
                                        {budgetData.currencyMode === 'dollars' 
                                            ? formatCurrency(Object.values(budgetData.budgets).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0))
                                            : formatPercentage(Object.values(budgetData.budgets).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0))
                                        }
                                    </span>
                                </div>
                                
                                <div className="summary-item large-item">
                                    <span className="summary-label">Income</span>
                                    <span className="summary-amount">
                                        {formatCurrency(budgetData.monthlyIncome || 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="categories-list">
                                {getAllCategories().map(category => (
                                    <div key={category} className="category-item">
                                        <span className="category-name">{category}</span>
                                        <span className="category-amount">
                                            {budgetData.currencyMode === 'dollars' 
                                                ? formatCurrency(budgetData.budgets[category] || 0)
                                                : formatPercentage(budgetData.budgets[category] || 0)
                                            }
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="summary-section">
                                <div className="summary-item large-item">
                                    <span className="summary-label">Remaining</span>
                                    <span className="summary-amount">
                                        {budgetData.currencyMode === 'dollars' 
                                            ? formatCurrency(Math.max(0, (budgetData.monthlyIncome || 0) - Object.values(budgetData.budgets).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0)))
                                            : formatPercentage(Math.max(0, 100 - Object.values(budgetData.budgets).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0)))
                                        }
                                    </span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setShowViewAll(false)}
                                className="close-modal-btn"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Chart Container */}
            <div className="budget-chart-container">
                <h3 className="chart-title">Budget Distribution</h3>
                <div className="chart-wrapper">
                    <PolarArea 
                        data={getChartData()} 
                        options={chartOptions}
                    />
                </div>
            </div>
        </div>
    );
}

export default Budget;