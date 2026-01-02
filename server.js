const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); 

// --- DATABASE (In-Memory) ---
let salesDatabase = [];

// --- API ENDPOINTS ---

// 1. ADMIN: Get ALL data (For you)
app.get('/api/admin/all-sales', (req, res) => {
    res.json(salesDatabase);
});

// 2. CUSTOMER: Get ONLY their data (For them)
app.get('/api/customer/history/:email', (req, res) => {
    const email = req.params.email.toLowerCase(); // Convert to lowercase to match easily
    const customerData = salesDatabase.filter(item => item.email.toLowerCase() === email);
    res.json(customerData);
});

// 3. Add New Sale
app.post('/api/add-item', (req, res) => {
    const { email, cost, sell, profit } = req.body;
    const newItem = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        email: email,
        cost: parseFloat(cost),
        sell: parseFloat(sell),
        profit: parseFloat(profit)
    };
    salesDatabase.push(newItem);
    res.json({ message: "Saved successfully", item: newItem });
});

// 4. Delete Item
app.delete('/api/delete-item/:id', (req, res) => {
    const idToDelete = parseInt(req.params.id);
    salesDatabase = salesDatabase.filter(item => item.id !== idToDelete);
    res.json({ message: "Deleted successfully" });
});

// 5. AI Prediction (Uses all data)
app.post('/api/predict', (req, res) => {
    if (salesDatabase.length < 2) {
        return res.json({ tomorrowSales: 0, tomorrowProfit: 0, message: "Not enough data" });
    }
    const salesHistory = salesDatabase.map(item => item.sell);
    const profitHistory = salesDatabase.map(item => item.profit);
    
    // Simple Linear Regression
    const predict = (data) => {
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
            sumX += i; sumY += data[i]; sumXY += i * data[i]; sumXX += i * i;
        }
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        return (slope * n) + intercept;
    };

    const pSales = predict(salesHistory);
    const pProfit = predict(profitHistory);

    res.json({ tomorrowSales: pSales.toFixed(2), tomorrowProfit: pProfit.toFixed(2) });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
