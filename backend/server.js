const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Book Management Backend is running!');
});

app.get('/api/books', (req, res) => {
    res.json([]);
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});