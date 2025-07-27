const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.use(cors());
app.use(express.json());

// Simple in-memory store for demonstration purposes
let books = [
    { id: '1', title: 'The Hitchhiker\'s Guide to the Galaxy', author: 'Douglas Adams' },
    { id: '2', title: '1984', author: 'George Orwell' }
];

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.emit('initial-books', books);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// --- API Routes ---

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Book Management Backend is running with WebSockets!');
});

// Get all books
app.get('/api/books', (req, res) => {
    res.json(books);
});

// Add a new book
app.post('/api/books', (req, res) => {
    const newBook = { id: Date.now().toString(), ...req.body }; // Assigning a simple unique ID
    books.push(newBook);
    console.log('Book added:', newBook);
    io.emit('book-added', newBook);
    res.status(201).json(newBook);
});

// Update an existing book
app.put('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const updatedBookData = req.body;
    let bookUpdated = false;

    books = books.map(book => {
        if (book.id === id) {
            bookUpdated = true;
            const updatedBook = { ...book, ...updatedBookData };
            io.emit('book-updated', updatedBook);
            return updatedBook;
        }
        return book;
    });

    if (bookUpdated) {
        console.log('Book updated:', id, updatedBookData);
        res.json({ message: 'Book updated successfully' });
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
});

// Delete a book
app.delete('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const initialLength = books.length;
    books = books.filter(book => book.id !== id);

    if (books.length < initialLength) {
        console.log('Book deleted:', id);
        io.emit('book-deleted', id);
        res.status(200).json({ message: 'Book deleted successfully' });
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
});

server.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});