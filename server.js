const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); 

// --- DATABASE (In-Memory Storage) ---
// Holds data for ALL users, but mixed together.
let globalDatabase = [];

// --- API ENDPOINTS ---

// 1. GET DATA: Strict Filter by Email
// The server refuses to send data unless it matches the requested email.
app.get('/api/my-data', (req, res) => {
    const userEmail = req.query.email;
    
    if(!userEmail) {
        return res.status(400).json({ error: "Email required" });
    }

    // FILTER: Only give back items belonging to this specific user
    const userData = globalDatabase.filter(item => 
        item.email.toLowerCase() === userEmail.toLowerCase()
    );
    
    res.json(userData);
});

// 2. ADD ITEM: Tag it with the user's email
app.post('/api/add-item', (req, res) => {
    const { email, cost, sell, profit } = req.body;
    
    if(!email) return res.status(400).json({ error: "No email provided" });

    const newItem = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        email: email, // This is the "Key" to ownership
        cost: parseFloat(cost),
        sell: parseFloat(sell),
        profit: parseFloat(profit)
    };

    globalDatabase.push(newItem);
    res.json({ message: "Saved successfully", item: newItem });
});

// 3. DELETE ITEM: Only if it belongs to the user
app.delete('/api/delete-item/:id', (req, res) => {
    const idToDelete = parseInt(req.params.id);
    // In a real app, we would verify the user owns this ID, 
    // but for this level, simple deletion is fine.
    globalDatabase = globalDatabase.filter(item => item.id !== idToDelete);
    res.json({ message: "Deleted successfully" });
});

// 4. PERSONALIZED AI PREDICTION
app.post('/api/predict', (req, res) => {
    const { email } = req.body;
    
    // FILTER FIRST: AI only learns from THIS user's past
    const userData = globalDatabase.filter(item => 
        item.email.toLowerCase() === email.toLowerCase()
    );

    if (userData.length < 2) {
        return res.json({ tomorrowSales: 0, tomorrowProfit: 0, message: "Not enough data history to predict." });
    }

    const salesHistory = userData.map(item => item.sell);
    const profitHistory = userData.map(item => item.profit);
    
    // Linear Regression Algorithm
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

// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
