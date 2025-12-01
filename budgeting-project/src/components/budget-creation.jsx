import { useState, useEffect, useRef } from 'react';
import { useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import budgetDataTemplate from '../data/budgetData.json';
import { EyeIcon } from './EyeIcon';
import './budget-creation.css';

function Budget() {
    // Initialize state with localStorage persistence
    const [budgetData, setBudgetData] = useState(() => {
        try {
            const savedData = localStorage.getItem('budgetData');
            return savedData ? JSON.parse(savedData) : { ...budgetDataTemplate };
        } catch (error) {
            console.error('Error loading budget data:', error);
            return { ...budgetDataTemplate };
        }
    });

    const [selectedCategory, setSelectedCategory] = useState('');``
    const [budgetAmount, setBudgetAmount] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showViewAll, setShowViewAll] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showLimitWarning, setShowLimitWarning] = useState(false);
    const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
    const [showKey, setShowKey] = useState(false);
    const [viewMode, setViewMode] = useState('guide'); // 'guide' or 'chart'
    const [hiddenCategories, setHiddenCategories] = useState(['Housing']);
    const [categoryCount, setCategoryCount] = useState(16);
    const svgRef = useRef();

    // Save to localStorage whenever budgetData changes
    useEffect(() => {
        localStorage.setItem('budgetData', JSON.stringify(budgetData));
    }, [budgetData]);

    // Predefined category sets (matching transactions page)
    const categoryOptions = useMemo(() => ({
        8: ['Housing', 'Utilities', 'Groceries', 'Dining', 'Transport', 'Savings', 'Debt', 'Lifestyle'],
        12: ['Housing', 'Utilities', 'Groceries', 'Dining', 'Transport', 'Insurance', 'Health', 'Savings', 'Investing', 'Debt', 'Personal', 'Leisure'],
        16: ['Housing', 'Utilities', 'Groceries', 'Dining', 'Transport', 'Insurance', 'Health', 'Savings', 'Investing', 'Debt', 'Personal', 'Leisure', 'Education', 'Giving', 'Pets', 'Miscellaneous']
    }), []);

    // Get all categories (based on selected category count only)
    const getAllCategories = useCallback(() => {
        return categoryOptions[categoryCount] || categoryOptions[16];
    }, [categoryOptions, categoryCount]);

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

    // Format currency with commas
    const formatCurrency = useCallback((amount) => {
        if (!amount && amount !== 0) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    }, []);

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

    // Prepare chart data for D3 radar chart (excluding hidden categories)
    const prepareRadarData = () => {
        const budgetEntries = Object.entries(budgetData.budgets);
        const allCategories = Object.keys(budgetData.budgets);
        // Always show all categories, even if value is empty
        return allCategories.map(category => {
            const amount = budgetData.budgets[category];
            const numericAmount = parseFloat(amount) || 0;
            return {
                category: category,
                percentage: numericAmount,
                amount: numericAmount
            };
        });
    };

    // Prepare full list for key (including Housing as first item and all other categories)
    const prepareKeyData = () => {
        const budgetEntries = Object.entries(budgetData.budgets);
        
        const keyData = [];
        
        // First, add Housing if it exists
        const housingEntry = budgetEntries.find(([category]) => category.toLowerCase() === 'housing');
        if (housingEntry) {
            const numericAmount = parseFloat(housingEntry[1]) || 0;
            if (numericAmount > 0) {
                keyData.push({
                    category: housingEntry[0],
                    percentage: numericAmount,
                    amount: numericAmount
                });
            }
        }
        
        // Then add all other categories
        budgetEntries.forEach(([category, amount]) => {
            const numericAmount = parseFloat(amount) || 0;
            // Exclude housing (already added)
            if (numericAmount > 0 && category.toLowerCase() !== 'housing') {
                keyData.push({
                    category: category,
                    percentage: numericAmount,
                    amount: numericAmount
                });
            }
        });

        return keyData;
    };

    // D3 Radar Chart Effect
    useEffect(() => {
        if (viewMode === 'chart' || (viewMode === 'guide' && document.querySelector('.guide-chart-section svg'))) {
            const targetSvg = viewMode === 'chart' ? svgRef.current : document.querySelector('.guide-chart-section svg');
            if (!targetSvg) return;

            // Get all selected categories, excluding hidden ones
            const allCategories = getAllCategories().filter(cat => !hiddenCategories.includes(cat));
            // Prepare data for radar chart, but if no data, fill with zeroes
            const data = allCategories.map((category) => {
                const amount = budgetData.budgets[category];
                const numericAmount = parseFloat(amount) || 0;
                return {
                    category: category,
                    percentage: numericAmount,
                    amount: numericAmount
                };
            });

            const svg = d3.select(targetSvg);
            svg.selectAll("*").remove();

            const margin = { top: 50, right: 50, bottom: 50, left: 50 };
            const width = 400 - margin.left - margin.right;
            const height = 400 - margin.top - margin.bottom;
            const radius = Math.min(width, height) / 2;

            const container = svg
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`);

            // Prepare data - calculate each category as percentage of total
            const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);
            const normalizedData = data.map(d => ({
                ...d,
                normalizedValue: totalAmount > 0 ? (d.amount / totalAmount) * 100 : 0
            }));

            // Find the maximum percentage and round up to nearest 10
            const maxPercentage = Math.max(...normalizedData.map(d => d.normalizedValue));
            const maxScale = Math.ceil(maxPercentage / 10) * 10 || 10;

            // Always use the number of selected categories for axes
            const angleSlice = (Math.PI * 2) / (allCategories.length || 1);

            // Create radial scale - use dynamic max instead of 100
            const rScale = d3.scaleLinear()
                .range([0, radius])
                .domain([0, maxScale]);

            // Create the background circles
            const levels = 5;
        for (let level = 1; level <= levels; level++) {
            const levelRadius = (radius / levels) * level;
            
            container.append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", levelRadius)
                .style("fill", "none")
                .style("stroke", "rgba(128, 128, 128, 0.3)")
                .style("stroke-opacity", 0.3)
                .style("stroke-width", "1px");

            // Add level labels with dynamic scale
            if (level < levels) {
                container.append("text")
                    .attr("x", 4)
                    .attr("y", -levelRadius)
                    .attr("dy", "0.4em")
                    .style("font-size", "10px")
                    .style("fill", "#9ca3af")
                    .text(`${(maxScale / levels) * level}%`);
            }
        }

        // Create the radial lines
        normalizedData.forEach((d, i) => {
            container.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", radius * Math.cos(angleSlice * i - Math.PI / 2))
                .attr("y2", radius * Math.sin(angleSlice * i - Math.PI / 2))
                .style("stroke", "rgba(128, 128, 128, 0.3)")
                .style("stroke-opacity", 0.3)
                .style("stroke-width", "1px");
        });

        // Create the radar chart area
        const radarLine = d3.lineRadial()
            .angle((d, i) => angleSlice * i)
            .radius(d => rScale(d.normalizedValue))
            .curve(d3.curveLinearClosed);

        // Add the area fill
        container.append("path")
            .datum(normalizedData)
            .attr("d", radarLine)
            .style("fill", "#394353")
            .style("fill-opacity", 0.2)
            .style("stroke", "#394353")
            .style("stroke-width", "2px");

        // Add data points
        container.selectAll(".radarCircle")
            .data(normalizedData)
            .enter().append("circle")
            .attr("class", "radarCircle")
            .attr("r", 4)
            .attr("cx", (d, i) => rScale(d.normalizedValue) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("cy", (d, i) => rScale(d.normalizedValue) * Math.sin(angleSlice * i - Math.PI / 2))
            .style("fill", "#394353")
            .style("stroke", "white")
            .style("stroke-width", "2px");

        // Add category labels with Roman numerals
        container.selectAll(".radarLabel")
            .data(normalizedData)
            .enter().append("text")
            .attr("class", "radarLabel")
            .attr("x", (d, i) => (radius + 20) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => (radius + 20) * Math.sin(angleSlice * i - Math.PI / 2))
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "var(--text-color)")
            .style("cursor", "help")
            .style("text-anchor", (d, i) => {
                const angle = (angleSlice * i) * (180 / Math.PI);
                return angle > 90 && angle < 270 ? "end" : "start";
            })
            .text((d, i) => toRomanNumeral(i + 1))
            .append("title")
            .text((d, i) => allCategories[i]);


        }
    }, [budgetData, viewMode, formatCurrency, hiddenCategories, getAllCategories]);

    // Get housing budget amount to display separately
    const getHousingBudget = () => {
        const housingEntries = Object.entries(budgetData.budgets).filter(([category]) => 
            category.toLowerCase() === 'housing'
        );
        return housingEntries.length > 0 ? parseFloat(housingEntries[0][1]) || 0 : 0;
    };

    // Calculate housing to income percentage
    const getHousingPercentage = () => {
        const income = budgetData.monthlyIncome || 0;
        if (income === 0) return 0;
        const housing = getHousingBudget();
        return Math.min((housing / income) * 100, 100);
    };

    // Calculate total budget (all categories)
    const getTotalBudget = () => {
        return Object.entries(budgetData.budgets)
            .reduce((sum, [, amount]) => sum + (parseFloat(amount) || 0), 0);
    };

    // Get category percentage of total budget (all categories)
    const getCategoryPercentage = (amount) => {
        const total = getTotalBudget();
        if (total === 0) return 0;
        return ((parseFloat(amount) || 0) / total) * 100;
    };

    // Handle category selection
    const handleCategoryChange = (e) => {
        const category = e.target.value;
        setSelectedCategory(category);
        // Show current budget value in input field
        const currentBudget = budgetData.budgets[category];
        setBudgetAmount(currentBudget ? currentBudget.toString() : '');
        setShowAddCategory(false);
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
            title: "Step One: Know Your Numbers Before You Spend a Dollar",
            content: `The first rule of thumb is simple. You cannot manage what you do not measure. Your budget begins with a clear picture of what comes in and what goes out each month. Think of this as turning on the lights in a room you have walked through in the dark for a long time. Suddenly everything becomes easier to navigate.

Start by listing your income sources. Even irregular amounts count because awareness is the goal. Then review your spending from the last few weeks. Many people discover surprising patterns once the data is in front of them. Seeing it written down creates a sense of control that feels encouraging right away.

Use your budget builder to select the preset categories that match your real life. Essentials like housing and groceries, lifestyle choices like dining out or hobbies, and occasional expenses like travel or gifts. Keeping it simple at the start helps you stay consistent without feeling overwhelmed.

Take a moment to reflect on what these numbers tell you. You may spot a few habits you want to change and that is completely normal. This step is about clarity rather than judgment. Knowing where you stand today gives you the power to make better choices tomorrow.`
        },
        {
            title: "Step Two: Assign Every Dollar a Job",
            content: `The second rule of thumb is to direct every dollar with intention. A budget works best when money has a purpose. Think of this like giving your resources a clear mission. You become the one in charge of where everything goes rather than letting the month decide for you.

Begin with the essential categories inside your budget builder. Housing, food, transportation, utilities. Putting these in order first provides a solid base and removes a lot of anxiety that comes from not knowing if the basics are covered.

Next, choose the preset categories that relate to your goals. Maybe you want to build savings, reduce debt, or set aside money for something meaningful. Even small contributions create momentum. Progress comes from doing the right things steadily, not from trying to be perfect on the first attempt.

While you assign dollars, make space for a small buffer. Life is unpredictable, and a little flexibility prevents frustration. A realistic plan is always better than a strict one that collapses the moment real life shows up. Give yourself grace and room to breathe.`
        },
        {
            title: "Step Three: Review, Adjust, and Make It Livable",
            content: `The third rule of thumb is to return to your plan regularly. A budget is not meant to be a fixed contract. It is better understood as a living document that grows with your needs and experiences. The more you interact with it, the more confident you become.

Start with a quick review each week. This keeps everything fresh without taking much time. You will notice patterns as you go. Maybe one category always feels tight or another always has extra room. Awareness like this helps you make smart adjustments.

Once you see the patterns, adjust the preset categories in your builder to better match reality. Maybe groceries need a little more or entertainment needs a little less. These tweaks are a sign of progress, not failure. They show that you are learning what works for you.

Finally, consider how the budget feels. A good plan supports your life instead of restricting it. If you can meet your needs, enjoy some wants, and make steady movement toward your goals, you are building something strong. With each review, your confidence grows and the process becomes more natural.`
        }
    ];

    // Carousel navigation - cycles through all cards
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
                <div className="budget-content-centered">
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

                        {/* Category Key - Always visible */}
                        <div className="budget-card-key">
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
                                {getAllCategories().map((category, index) => {
                                    const amount = parseFloat(budgetData.budgets[category]) || 0;
                                    return (
                                        <div key={category} className="key-item-static">
                                            <span className="key-view-static">
                                                <EyeIcon 
                                                    visible={!hiddenCategories.includes(category)}
                                                    onClick={() => toggleCategoryVisibility(category)}
                                                    size={18}
                                                />
                                            </span>
                                            <span className="key-numeral-static">{toRomanNumeral(index + 1)}</span>
                                            <span className="key-category-static">{category}</span>
                                            <span className="key-amount-static">{formatCurrency(amount)}</span>
                                            <span className="key-percentage-static">{amount > 0 ? getCategoryPercentage(amount).toFixed(1) : '0.0'}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* User Guide with Carousel */}
                    <div className="budget-user-guide">
                        <h3 className="guide-section-heading">Financial Management Principles</h3>
                        <div className="guide-carousel-container">
                            <div className="carousel-nav-buttons">
                                <button 
                                    className="carousel-nav-btn" 
                                    onClick={prevSlide}
                                >
                                    Previous
                                </button>
                                <div className="carousel-indicator">
                                    {currentCarouselIndex + 1} of {carouselContent.length}
                                </div>
                                <button 
                                    className="carousel-nav-btn" 
                                    onClick={nextSlide}
                                >
                                    Next
                                </button>
                            </div>
                            <div 
                                className="guide-carousel-wrapper" 
                                style={{ transform: `translateX(-${currentCarouselIndex * 33.333}%)` }}
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
                        
                        {/* Divider */}
                        <div className="guide-chart-divider"></div>
                        
                        {/* Chart Section */}
                        <div className="guide-chart-section">
                            <h3 className="chart-title">Budget Distribution</h3>
                            <p className="chart-tooltip">Each axis represents a category, and the shaded area shows the relative proportion of your total budget.</p>
                            
                            <div className="chart-content-wrapper">
                                <div className="chart-wrapper">
                                    <svg ref={svgRef}></svg>
                                </div>
                            </div>
                            
                            <p className="chart-bottom-tooltip">The chart adjusts its scale based on your highest budget percentage. Concentric circles represent percentage intervals, helping you visualize how your budget is distributed across all categories.</p>
                        </div>
                        
                        {/* Bottom Divider */}
                        <div className="guide-chart-divider"></div>
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