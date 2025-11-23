import { useState, useEffect, useRef } from 'react';
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
    const svgRef = useRef();

    // Save to localStorage whenever budgetData changes
    useEffect(() => {
        localStorage.setItem('budgetData', JSON.stringify(budgetData));
    }, [budgetData]);

    // Get all categories (default + custom)
    const getAllCategories = () => {
        return [...budgetData.defaultCategories, ...budgetData.customCategories];
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

    // Prepare chart data for D3 radar chart (excluding hidden categories)
    const prepareRadarData = () => {
        const budgetEntries = Object.entries(budgetData.budgets);
        
        const radarData = [];
        budgetEntries.forEach(([category, amount]) => {
            const numericAmount = parseFloat(amount) || 0;
            // Exclude only hidden categories from the chart
            if (numericAmount > 0 && !hiddenCategories.includes(category)) {
                radarData.push({
                    category: category,
                    percentage: numericAmount,
                    amount: numericAmount
                });
            }
        });

        return radarData;
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
        if (viewMode !== 'chart') return;
        
        const data = prepareRadarData();
        if (!data || data.length === 0) return;

        const svg = d3.select(svgRef.current);
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
        const maxScale = Math.ceil(maxPercentage / 10) * 10;

        const angleSlice = (Math.PI * 2) / normalizedData.length;

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
            .style("text-anchor", (d, i) => {
                const angle = (angleSlice * i) * (180 / Math.PI);
                return angle > 90 && angle < 270 ? "end" : "start";
            })
            .text((d, i) => toRomanNumeral(i + 1));

        // Add percentage labels on hover
        const tooltip = container.append("g")
            .attr("class", "tooltip")
            .style("opacity", 0);

        tooltip.append("rect")
            .attr("width", 80)
            .attr("height", 30)
            .attr("x", -40)
            .attr("y", -35)
            .style("fill", "var(--card-background)")
            .style("stroke", "var(--border-color)")
            .style("stroke-width", "1px")
            .style("rx", "4");

        const tooltipText = tooltip.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "-0.5em")
            .style("font-size", "11px")
            .style("font-weight", "600")
            .style("fill", "var(--text-color)");

        const tooltipAmount = tooltip.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.8em")
            .style("font-size", "10px")
            .style("fill", "#9ca3af");

        // Add hover events to data points
        container.selectAll(".radarCircle")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 6)
                    .style("fill", "#2d3441");

                tooltip
                    .style("opacity", 1)
                    .attr("transform", `translate(${d3.select(this).attr("cx")}, ${d3.select(this).attr("cy")})`);

                tooltipText.text(`${d.percentage.toFixed(1)}%`);
                tooltipAmount.text(`${formatCurrency(d.amount)}`);
            })
            .on("mouseout", function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 4)
                    .style("fill", "#394353");

                tooltip.style("opacity", 0);
            });

    }, [budgetData, viewMode, formatCurrency, hiddenCategories]);

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
            title: "Financial Planning Fundamentals",
            content: `Effective budgeting begins with establishing a clear financial foundation that serves as your roadmap to financial success. Your budget should function as a comprehensive tool that projects necessary resources, measures current financial performance, and detects significant changes in your financial circumstances.

Start by identifying your core financial objectives and aligning them with realistic, attainable targets. This requires thorough analysis of your income sources, fixed expenses, variable costs, and discretionary spending patterns. Understanding these elements allows you to create a budget that reflects your actual financial situation rather than idealistic projections.

Consider your budget as a living document that evolves with your circumstances. Regular assessment ensures your financial plan remains relevant and effective. Establish clear priorities for your spending categories, distinguishing between needs and wants while maintaining flexibility for unexpected opportunities or challenges.

Successful budgeting also involves setting aside emergency funds and planning for both short-term and long-term financial goals. This comprehensive approach creates a stable foundation that supports your financial well-being and provides security against unforeseen circumstances.

Remember that budgeting is not about restriction but about making informed choices that align with your values and objectives. When your spending reflects your priorities, you'll find greater satisfaction and success in reaching your financial goals.`
        },
        {
            title: "Performance Monitoring & Control",
            content: `Regular monitoring transforms your budget from a static plan into a dynamic financial management tool. Compare actual results to your budget consistently to identify trends, detect errors, and measure progress toward your financial objectives.

Establish a routine for reviewing your financial performance, whether weekly, bi-weekly, or monthly. During these reviews, analyze variances between planned and actual spending, investigating significant differences to understand their causes. This practice helps you identify spending patterns and make informed adjustments to stay on track.

When expenditures exceed budget allocations, take immediate corrective action. This might involve reducing spending in other categories, finding additional income sources, or adjusting future budget periods. The key is addressing issues promptly before they compound into larger financial problems.

Implement control procedures that prevent unauthorized or excessive spending. This could include setting spending limits on credit cards, requiring approval for large purchases, or using separate accounts for different budget categories. These safeguards help maintain financial discipline and protect your resources.

Create comprehensive financial reports that provide clear visibility into your income and expenses. Include budget-versus-actual comparisons and highlight areas requiring attention. This documentation serves as valuable input for future budget planning and helps identify opportunities for improvement.

Develop accountability measures that keep you motivated and on track. This might involve sharing your progress with a trusted advisor, using financial tracking apps, or setting up automatic alerts when spending approaches budget limits.`
        },
        {
            title: "Strategic Financial Decision Making",
            content: `Strategic financial analysis elevates your budgeting from simple expense tracking to comprehensive financial planning. Before making significant changes to your budget categories or financial commitments, conduct thorough cost-benefit analysis to ensure optimal resource allocation.

Evaluate all financial decisions through the lens of opportunity cost. When considering new expenses or investments, assess not just their direct costs but also what opportunities you might forgo. This analysis helps prioritize spending and ensures resources flow toward activities that provide the greatest value.

Maintain detailed documentation of your financial decisions and their outcomes. Track how budget changes affect your overall financial health and document lessons learned for future reference. This historical perspective improves your decision-making capabilities over time.

Regularly reassess your financial assumptions and projections to ensure they remain valid. Economic conditions, personal circumstances, and life priorities change, requiring corresponding adjustments to your financial strategy. Stay flexible and willing to modify your approach when circumstances warrant.

Consider the long-term implications of your financial choices. Decisions made today can have lasting effects on your financial security and ability to achieve future goals. Balance immediate needs with long-term objectives to create sustainable financial success.

When significant variances occur, conduct root cause analysis to understand underlying factors. Document corrective actions taken, including which accounts were affected, when changes were implemented, and who authorized the modifications. This systematic approach ensures continuous improvement in your financial management practices.

Remember that strategic financial management is an ongoing process that requires patience, discipline, and regular adjustment. By maintaining focus on your long-term objectives while remaining flexible in your tactics, you'll build a robust financial foundation that supports your aspirations.`
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

                        {/* Category Key */}
                        {viewMode === 'chart' && prepareKeyData().length > 0 && (
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
                                    {prepareKeyData().map((item, index) => (
                                        <div key={index} className="key-item-static">
                                            <span className="key-view-static">
                                                <EyeIcon 
                                                    visible={!hiddenCategories.includes(item.category)}
                                                    onClick={() => toggleCategoryVisibility(item.category)}
                                                    size={18}
                                                />
                                            </span>
                                            <span className="key-numeral-static">{toRomanNumeral(index + 1)}</span>
                                            <span className="key-category-static">{item.category}</span>
                                            <span className="key-amount-static">{formatCurrency(item.amount)}</span>
                                            <span className="key-percentage-static">{getCategoryPercentage(item.amount).toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Guide with Carousel */}
                    <div className="budget-user-guide">
                        <h3 className="guide-section-heading">Financial Management Principles</h3>
                        <div className="view-toggle-container">
                            <button 
                                className={`toggle-btn ${viewMode === 'guide' ? 'active' : ''}`}
                                onClick={() => setViewMode('guide')}
                            >
                                Guide View
                            </button>
                            <button 
                                className={`toggle-btn ${viewMode === 'chart' ? 'active' : ''}`}
                                onClick={() => setViewMode('chart')}
                            >
                                Chart View
                            </button>
                        </div>
                        {viewMode === 'guide' ? (
                        <>
                        <div className="guide-carousel-container">
                            <div className="carousel-nav-buttons">
                                <button 
                                    className="carousel-nav-btn" 
                                    onClick={prevSlide}
                                >
                                    ‹
                                </button>
                                <button 
                                    className="carousel-nav-btn" 
                                    onClick={nextSlide}
                                >
                                    ›
                                </button>
                            </div>
                            <div 
                                className="guide-carousel-wrapper" 
                                style={{ transform: `translateX(-${currentCarouselIndex * 100}%)` }}
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
                        </>
                        ) : (
                        <>
                    <h3 className="chart-title">Budget Distribution</h3>
                    
                    <div className="chart-content-wrapper">
                        <div className="chart-wrapper">
                            <svg ref={svgRef}></svg>
                        </div>
                    </div>
                        </>
                        )}
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