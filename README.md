Budgeting Manual Application
A modern, manual budgeting application built with React and Vite that helps users track expenses, visualize spending patterns, and manage their monthly finances effectively.

Features
📊 Dashboard
Visual Overview: Interactive radar chart displaying budget allocation across categories
Real-time Statistics: Monthly income tracking with remaining balance calculations
Progress Indicators: Visual progress bars showing spending vs. budget allocations
Category Management: Support for 8, 12, or 16 budget categories
💰 Budget Creation
Flexible Budgeting: Create custom budgets with multiple category options
Income-Based Planning: Set monthly income and allocate percentages to categories
Category Customization: Choose from predefined category sets or customize your own
Validation: Built-in validation to ensure budgets don't exceed 100%
📝 Transaction Tracking
Manual Entry: Simple form to log transactions with date, category, and amount
Dual View Modes:
List View: Chronological transaction list grouped by date
Chart View: Interactive radar chart showing transaction distribution by category
Smart Filtering: Filter transactions by month and year
Sample Data: Auto-generated dummy data for new users to explore features
Data Persistence: All transactions saved to browser's localStorage
🎨 Visualizations
D3.js Radar Charts: Beautiful, interactive radar charts for both budget planning and transaction analysis
Category Toggle: Show/hide categories in chart view with eye icon controls
Roman Numeral Indexing: Elegant category key with amounts and percentages
Responsive Design: Charts and layouts adapt to different screen sizes
Tech Stack
Frontend Framework: React 19.1.1
Build Tool: Vite 7.1.7
Visualization: D3.js 7.9.0
Styling: Custom CSS with modular component styles
Data Persistence: Browser localStorage API
Linting: ESLint with React hooks and React refresh plugins
Project Structure
Installation
Clone the repository

Install dependencies

Start development server

Build for production

Preview production build

Usage
Getting Started
Set Your Income: Navigate to the Transactions page and enter your monthly income
Create a Budget: Go to Budget Creation and allocate your income across categories
Track Expenses: Add transactions as you spend throughout the month
Monitor Progress: Check the Dashboard to see your spending vs. budget
Category Management
The app supports three category levels:

8 Categories: Basic budgeting (Housing, Utilities, Groceries, Dining, Transport, Savings, Debt, Lifestyle)
12 Categories: Standard budgeting (adds Insurance, Health, Investing, Personal, Leisure)
16 Categories: Detailed budgeting (adds Education, Giving, Pets, Miscellaneous)
Data Persistence
All budget data and transactions are automatically saved to your browser's localStorage. Data persists across sessions until you clear your browser data.

Key Features Explained
CategoriesManager
A shared utility object that manages category sets across the application, ensuring consistency between Budget Creation, Transactions, and Dashboard views.

Error Boundaries
React Error Boundaries wrap visualization components to gracefully handle rendering errors without crashing the entire application.

Dummy Data Generation
New users see sample transactions to understand the interface before entering real data. This feature automatically disables once real transactions are added.

Browser Compatibility
Modern browsers with ES6+ support
localStorage API required for data persistence
Optimized for Chrome, Firefox, Safari, and Edge
Contributing
This is a personal budgeting project. For suggestions or improvements, please open an issue on GitHub.

License
MIT License - Feel free to use this project for personal budgeting needs.

Author
Reinhardt Analytics

GitHub: @Reinhardt-Analytics
