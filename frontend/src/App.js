import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [books, setBooks] = useState([]);

  useEffect(() => {
    // Fetch message from backend
    fetch('http://localhost:5000/')
      .then(res => res.text())
      .then(data => setMessage(data))
      .catch(err => console.error('Error fetching message:', err));

    // Fetch books from backend
    fetch('http://localhost:5000/api/books')
      .then(res => res.json())
      .then(data => setBooks(data))
      .catch(err => console.error('Error fetching books:', err));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Book Management App</h1>
        <p>{message}</p>
        <h2>Books:</h2>
        {books.length === 0 ? (
          <p>No books found. Add some!</p>
        ) : (
          <ul>
            {books.map((book, index) => (
              <li key={index}>{book.title} by {book.author}</li>
            ))}
          </ul>
        )}
      </header>
    </div>
  );
}

export default App;