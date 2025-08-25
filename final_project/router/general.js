const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// helper that returns a Promise for a book by ISBN
const getBookByISBN = (isbn) => {
  return new Promise((resolve, reject) => {
    const book = books[isbn];
    if (book) {
      resolve(book);
    } else {
      reject(new Error("Book not found"));
    }
  });
};

// helper that returns a Promise for books by author
const getBooksByAuthor = (author) => {
  return new Promise((resolve, reject) => {
    if (!author) return reject(new Error("Author is required"));
    const q = author.toLowerCase();
    const results = Object.keys(books)
      .map(k => books[k])
      .filter(b => b.author && b.author.toLowerCase() === q);
    if (results.length > 0) resolve(results);
    else reject(new Error("No books found for that author"));
  });
};

// helper that returns a Promise for books by title
const getBooksByTitle = (title) => {
  return new Promise((resolve, reject) => {
    if (!title) return reject(new Error("Title is required"));
    const q = title.toLowerCase();
    const results = Object.keys(books)
      .map(k => books[k])
      .filter(b => b.title && b.title.toLowerCase() === q);
    if (results.length > 0) resolve(results);
    else reject(new Error("No books found for that title"));
  });
};

public_users.post("/register", (req,res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const userExists = users.find(u => u.username === username);
  if (userExists) {
    return res.status(409).json({ message: "User already exists" });
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully" });
});

// Get the book list available in the shop
public_users.get('/', function (req, res) {
  // Use a Promise to simulate asynchronous retrieval (can be switched to async/await)
  const getBooksAsync = () => new Promise((resolve, reject) => {
    if (books && Object.keys(books).length > 0) {
      resolve(books);
    } else {
      reject(new Error('No books available'));
    }
  });

  getBooksAsync()
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).json({ message: err.message }));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  getBookByISBN(isbn)
    .then(book => res.status(200).json(book))
    .catch(() => res.status(404).json({ message: "Book not found!" }));
});
  
// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;
  try {
    const results = await getBooksByAuthor(author);
    return res.status(200).json(results);
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title;
  try {
    const results = await getBooksByTitle(title);
    return res.status(200).json(results);
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (book && book.reviews) {
    return res.status(200).json(book.reviews);
  } else if (book && !book.reviews) {
    return res.status(200).json({ message: "No reviews for this book" });
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

module.exports.general = public_users;
