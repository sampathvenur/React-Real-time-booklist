import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000'); // Connect to backend Socket.IO server

function App() {
  const [message, setMessage] = useState('');
  const [books, setBooks] = useState([]);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');

  useEffect(() => {
    // Fetch initial message from backend (HTTP GET)
    fetch('http://localhost:5000/')
      .then(res => res.text())
      .then(data => setMessage(data))
      .catch(err => console.error('Error fetching message:', err));

    // --- WebSocket Event Listeners ---

    // Listen for initial books when connecting
    socket.on('initial-books', (initialBooks) => {
      console.log('Received initial books:', initialBooks);
      setBooks(initialBooks);
    });

    // Listen for 'book-added' events
    socket.on('book-added', (newBook) => {
      console.log('Book added via WebSocket:', newBook);
      setBooks((prevBooks) => [...prevBooks, newBook]);
    });

    // Listen for 'book-updated' events
    socket.on('book-updated', (updatedBook) => {
      console.log('Book updated via WebSocket:', updatedBook);
      setBooks((prevBooks) =>
        prevBooks.map((book) =>
          book.id === updatedBook.id ? updatedBook : book
        )
      );
    });

    // Listen for 'book-deleted' events
    socket.on('book-deleted', (deletedBookId) => {
      console.log('Book deleted via WebSocket:', deletedBookId);
      setBooks((prevBooks) =>
        prevBooks.filter((book) => book.id !== deletedBookId)
      );
    });

    // Cleanup function: Disconnect socket when component unmounts
    return () => {
      socket.off('initial-books');
      socket.off('book-added');
      socket.off('book-updated');
      socket.off('book-deleted');
    };
  }, []);

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBookTitle || !newBookAuthor) {
      alert('Please enter both title and author.');
      return;
    }

    const newBook = {
      title: newBookTitle,
      author: newBookAuthor,
    };

    try {
      const response = await fetch('http://localhost:5000/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBook),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // No need to manually update state here; WebSocket will handle it
      setNewBookTitle('');
      setNewBookAuthor('');
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  const handleDeleteBook = async (bookId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/books/${bookId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // No need to manually update state here; WebSocket will handle it
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };


  return (
    <div className="App">
      <header className="App-header">
        <h1>Book Management App</h1>
        <p>{message}</p>

        <h2>Add New Book</h2>
        <form onSubmit={handleAddBook}>
          <input
            type="text"
            placeholder="Book Title"
            value={newBookTitle}
            onChange={(e) => setNewBookTitle(e.target.value)}
            style={{ padding: '8px', marginRight: '5px' }}
          />
          <input
            type="text"
            placeholder="Author Name"
            value={newBookAuthor}
            onChange={(e) => setNewBookAuthor(e.target.value)}
            style={{ padding: '8px', marginRight: '5px' }}
          />
          <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer' }}>Add Book</button>
        </form>

        <h2>Current Books:</h2>
        {books.length === 0 ? (
          <p>No books found. Add some!</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {books.map((book) => (
              <li key={book.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                <span style={{ flexGrow: 1, textAlign: 'left' }}>
                  <strong>{book.title}</strong> by {book.author}
                </span>
                <button
                  onClick={() => handleDeleteBook(book.id)}
                  style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </header>
    </div>
  );
}

export default App;