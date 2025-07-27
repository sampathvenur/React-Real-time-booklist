import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

// Environment variable for backend URL, fallback to localhost for development
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const socket = io(BACKEND_URL);

function App() {
  const [message, setMessage] = useState('');
  const [books, setBooks] = useState([]);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');

  // State for editing
  const [editingBookId, setEditingBookId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');

  useEffect(() => {
    // Fetch initial message from backend (HTTP GET)
    fetch(`${BACKEND_URL}/`)
      .then(res => res.text())
      .then(data => setMessage(data))
      .catch(err => console.error('Error fetching message:', err));

    // --- WebSocket Event Listeners ---
    socket.on('initial-books', (initialBooks) => {
      console.log('Received initial books:', initialBooks);
      setBooks(initialBooks);
    });

    socket.on('book-added', (newBook) => {
      console.log('Book added via WebSocket:', newBook);
      setBooks((prevBooks) => [...prevBooks, newBook]);
    });

    socket.on('book-updated', (updatedBook) => {
      console.log('Book updated via WebSocket:', updatedBook);
      setBooks((prevBooks) =>
        prevBooks.map((book) =>
          book.id === updatedBook.id ? updatedBook : book
        )
      );
    });

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
      const response = await fetch(`${BACKEND_URL}/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBook),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setNewBookTitle('');
      setNewBookAuthor('');
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  const handleDeleteBook = async (bookId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/books/${bookId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const handleEditClick = (book) => {
    setEditingBookId(book.id);
    setEditTitle(book.title);
    setEditAuthor(book.author);
  };

  const handleCancelEdit = () => {
    setEditingBookId(null);
    setEditTitle('');
    setEditAuthor('');
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    if (!editTitle || !editAuthor) {
      alert('Please enter both title and author for update.');
      return;
    }

    const updatedBook = {
      id: editingBookId,
      title: editTitle,
      author: editAuthor,
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/books/${editingBookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedBook),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      handleCancelEdit();
    } catch (error) {
      console.error('Error updating book:', error);
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
              <li key={book.id} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                {editingBookId === book.id ? (
                  // Edit Form
                  <form onSubmit={handleUpdateBook} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{ padding: '8px' }}
                    />
                    <input
                      type="text"
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      style={{ padding: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                      <button type="submit" style={{ backgroundColor: 'green', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>Save</button>
                      <button type="button" onClick={handleCancelEdit} style={{ backgroundColor: 'gray', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  // Display Book with buttons
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flexGrow: 1, textAlign: 'left' }}>
                      <strong>{book.title}</strong> by {book.author}
                    </span>
                    <button
                      onClick={() => handleEditClick(book)}
                      style={{ backgroundColor: 'blue', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </header>
    </div>
  );
}

export default App;