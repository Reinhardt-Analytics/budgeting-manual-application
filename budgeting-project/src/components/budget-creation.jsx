import { useState } from 'react';

function Budget() {
    const [category, setCategory] = useState('Select a Category');
    const [budget, setBudget] = useState('');

    const handleCategoryChange = (e) => {
        setCategory(e.target.value);
    };

    const handleBudgetChange = (e) => {
        setBudget(e.target.value);
    };

    return (
        <div>
            <select value={category} onChange={handleCategoryChange}>
                <option disabled>Select a Category</option>
                <option value="Housing">Housing</option>
                <option value="Utilities">Utilities</option>
                <option value="Transportation">Transportation</option>
                <option value="Groceries">Groceries</option>
                <option value="Dining Out">Dining Out</option>
                <option value="Health and Wellness">Health and Wellness</option>
                <option value="Insurance">Insurance</option>
                <option value="Debt Payments">Debt Payments</option>
                <option value="Savings and Investments">Savings and Investments</option>
                <option value="Personal Spending">Personal Spending</option>
                <option value="Entertainment and Travel">Entertainment and Travel</option>
                <option value="Gifts and Charity">Gifts and Charity</option>
            </select>

            <input 
                type="number"
                placeholder="$0.00"
                value={budget}
                onChange={handleBudgetChange}
                min="0"
                step="0.01"
            />
        </div>
    );
}

export default Budget;