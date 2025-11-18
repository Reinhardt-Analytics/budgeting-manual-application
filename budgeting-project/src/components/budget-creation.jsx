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
    const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
    const [showChart, setShowChart] = useState(false);

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

    // Prepare chart data for polar area chart (excluding housing)
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

        const labels = [];
        const data = [];
        const backgroundColor = [];

        budgetEntries.forEach(([category, amount]) => {
            const numericAmount = parseFloat(amount) || 0;
            // Exclude housing from the chart
            if (numericAmount > 0 && category.toLowerCase() !== 'housing') {
                labels.push(category);
                data.push(numericAmount);
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

    // Get housing budget amount to display separately
    const getHousingBudget = () => {
        const housingEntries = Object.entries(budgetData.budgets).filter(([category]) => 
            category.toLowerCase() === 'housing'
        );
        return housingEntries.length > 0 ? parseFloat(housingEntries[0][1]) || 0 : 0;
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
                ticks: {
                    stepSize: 20, // This will create exactly 5 rings (0, 20, 40, 60, 80, 100)
                    max: 100,
                    display: true
                },
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



    // Calculate remaining income
    const calculateRemaining = () => {
        const totalBudget = Object.values(budgetData.budgets).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
        const income = budgetData.monthlyIncome || 0;
        return Math.max(0, income - totalBudget);
    };

    // Calculate remaining percentage for the bar
    const calculateRemainingPercentage = () => {
        const income = budgetData.monthlyIncome || 0;
        if (income === 0) return 0;
        const remaining = calculateRemaining();
        return (remaining / income) * 100;
    };

    // Carousel content
    const carouselContent = [
        {
            title: "Budget Foundation & Purpose",
            content: `Your budget must serve as a comprehensive tool to project necessary resources, measure current financial performance, and detect significant changes in your financial circumstances. Establish realistic and attainable budget targets based on thorough analysis of your financial needs and goals.

Budget planning requires a clear identification of your financial purpose, comprehensive assessment of needs, and a strategic plan to increase resources or modify objectives when current resources fall short of meeting your goals.

A thorough analysis must include clear identification of your budget's purpose in relation to your financial mission, goals, and objectives. Conduct comprehensive assessment of your financial needs and develop a plan to increase resources or modify goals if current resources fall short.

Regular monitoring ensures your budget serves as an effective measurement tool for tracking progress toward your financial objectives while maintaining flexibility to adapt to changing circumstances.`
        },
        {
            title: "Monitoring & Performance Management",
            content: `Compare actual financial results to your budget regularly to detect changes in circumstances, discover transaction errors, and measure financial performance. When actual results vary significantly from your budget, determine the cause, evaluate the activity, and take corrective action.

Operate within your budget constraints. Expenditures that exceed budget require justification and a formal plan to eliminate deficits. Ensure anticipated benefits are greater than costs for all planned activities, and provide adequate safeguards to protect against unauthorized use of financial resources.

Monthly financial reports must be appropriate and accurate, providing clear identification of all revenue sources and expenditures. Include budget versus actual comparisons and highlight exception items that require immediate attention.

Implement control procedures to address recurring reporting exceptions and ensure timely corrective action before issues compound into larger financial problems.`
        },
        {
            title: "Strategic Financial Analysis",
            content: `Before significantly adding, changing, or eliminating budget categories, conduct thorough cost-benefit analysis. Include quantified statements of benefits, comprehensive assessment of direct and indirect costs, identification of funding sources, and assessment of all financial risks.

Maintain detailed documentation of budget decisions, track variances from planned allocations, and implement corrective measures when necessary. Regular re-evaluation of assumptions and financial projections ensures your budget reflects current economic conditions and personal circumstances.

Management must weigh costs and risks before deciding to significantly modify financial activities. Analysis should include clear statements of purpose, quantified benefits, thorough cost assessments, and identification of potential problems and underlying assumptions.

Documentation of corrective actions must include why variances occurred, how budgets were revised, what accounts were affected, when actions were taken, and who authorized the changes.`
        }
    ];

    // Carousel navigation
    const nextSlide = () => {
        setCurrentCarouselIndex((prev) => (prev + 1) % carouselContent.length);
    };

    const prevSlide = () => {
        setCurrentCarouselIndex((prev) => (prev - 1 + carouselContent.length) % carouselContent.length);
    };

    // Check if user has budget data to enable View Budget button
    const hasBudgetData = () => {
        return Object.values(budgetData.budgets).some(amount => parseFloat(amount) > 0);
    };

    return (
        <>
            <div className="budget-background"></div>
            <div className="budget-page-container">
                <div className="budget-content-section">
                    {/* Configure Budget Card */}
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
                            <div className="remaining-bar-container">
                                <div 
                                    className="remaining-bar" 
                                    style={{ width: `${calculateRemainingPercentage()}%` }}
                                ></div>
                            </div>
                            <div className="remaining-income">
                                Remaining: {formatCurrency(calculateRemaining())}
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
                                    value={budgetAmount ? formatInputValue(budgetAmount) : ''}
                                    onChange={handleBudgetChange}
                                    onKeyPress={showAddCategory ? handleNewCategoryKeyPress : handleBudgetKeyPress}
                                    placeholder="$0.00"
                                />
                            </div>

                            <button 
                                onClick={showAddCategory ? createCategoryWithBudget : setBudget} 
                                className="set-budget-btn"
                            >
                                Enter
                            </button>
                        </div>

                        <div className="view-all-section">
                            <button 
                                onClick={() => setShowViewAll(true)}
                                className="view-all-btn"
                            >
                                View All
                            </button>
                        </div>
                    </div>

                    {/* User Guide with Carousel */}
                    <div className={`budget-user-guide ${showChart ? 'hide' : 'show'}`}>
                        <h3 className="guide-section-heading">Financial Management Principles</h3>
                        <div className="guide-carousel-container">
                            <div className="carousel-nav-buttons">
                                <button 
                                    className="carousel-nav-btn" 
                                    onClick={prevSlide}
                                    disabled={currentCarouselIndex === 0}
                                >
                                    ‹
                                </button>
                                <button 
                                    className="carousel-nav-btn" 
                                    onClick={nextSlide}
                                    disabled={currentCarouselIndex === carouselContent.length - 1}
                                >
                                    ›
                                </button>
                            </div>
                            <div 
                                className="guide-carousel-wrapper" 
                                style={{ transform: `translateX(-${currentCarouselIndex * 33.33}%)` }}
                            >
                                {carouselContent.map((item, index) => (
                                    <div key={index} className="guide-section">
                                        <h4 className="guide-subsection-title">{item.title}</h4>
                                        {item.content.split('\n\n').map((paragraph, pIndex) => (
                                            <p key={pIndex}>{paragraph}</p>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Carousel indicator */}
                        <div className="carousel-indicator">
                            {currentCarouselIndex + 1} of {carouselContent.length}
                        </div>
                        <button 
                            className={`view-budget-btn ${hasBudgetData() ? 'enabled' : 'disabled'}`}
                            onClick={() => setShowChart(true)}
                            disabled={!hasBudgetData()}
                        >
                            View Budget
                        </button>
                    </div>

                    {/* Chart Container */}
                    <div className={`budget-chart-container ${showChart ? 'show' : 'hide'}`}>
                        <h3 className="chart-title">Budget Distribution</h3>
                        <div className="chart-wrapper">
                            <PolarArea 
                                data={getChartData()} 
                                options={chartOptions}
                            />
                        </div>
                        {/* Housing category display */}
                        {getHousingBudget() > 0 && (
                            <div className="housing-display">
                                <p>Housing: {formatCurrency(getHousingBudget())}</p>
                                <small>(Excluded from chart for better visualization)</small>
                            </div>
                        )}
                        <button 
                            className="back-to-guide-btn"
                            onClick={() => setShowChart(false)}
                        >
                            Back to Guide
                        </button>
                    </div>
                </div>
            </div>

        {/* Modals - Outside budget container */}
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
        </>
    );
}

export default Budget;