const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// --- CHANGE: Serve files from the MAIN directory now ---
app.use(express.static(__dirname)); 

// --- DATABASE (In-Memory Storage) ---
let salesDatabase = [];

// --- API ENDPOINTS ---
app.get('/api/sales', (req, res) => {
    res.json(salesDatabase);
});

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

app.delete('/api/delete-item/:id', (req, res) => {
    const idToDelete = parseInt(req.params.id);
    salesDatabase = salesDatabase.filter(item => item.id !== idToDelete);
    res.json({ message: "Deleted successfully" });
});

// --- AI PREDICTION LOGIC ---
function predictNextValue(data) {
    const n = data.length;
    if(n === 0) return 0;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += data[i];
        sumXY += i * data[i];
        sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return (slope * n) + intercept;
}

app.post('/api/predict', (req, res) => {
    if (salesDatabase.length < 2) {
        return res.json({ tomorrowSales: 0, tomorrowProfit: 0, message: "Not enough data" });
    }
    const salesHistory = salesDatabase.map(item => item.sell);
    const profitHistory = salesDatabase.map(item => item.profit);
    const predictedSales = predictNextValue(salesHistory);
    const predictedProfit = predictNextValue(profitHistory);

    res.json({
        tomorrowSales: predictedSales.toFixed(2),
        tomorrowProfit: predictedProfit.toFixed(2)
    });
});

// --- CHANGE: Look for index.html in the main folder ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
