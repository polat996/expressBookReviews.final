const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  // check username is a non-empty string
  return typeof username === 'string' && username.trim().length > 0;
}

const authenticatedUser = (username,password)=>{ //returns boolean
  // check if username and password match the one we have in records.
  return users.some(u => u.username === username && u.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign({ username }, 'access', { expiresIn: '1h' });

  // save token in session authorization if session middleware is used
  if (!req.session) req.session = {};
  req.session.authorization = { accessToken: token, username };

  return res.status(200).json({ message: "Login successful", token });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;

  // require logged-in user stored in session
  if (!req.session || !req.session.authorization || !req.session.authorization.username) {
    return res.status(401).json({ message: "User not logged in" });
  }
  const username = req.session.authorization.username;

  if (!review) {
    return res.status(400).json({ message: "Review query parameter is required" });
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // ensure reviews is an object keyed by username
  if (!book.reviews || typeof book.reviews !== 'object') {
    book.reviews = {};
  }

  const isUpdate = Boolean(book.reviews[username]);
  book.reviews[username] = review;

  return res.status(200).json({
    message: `Review ${isUpdate ? 'updated' : 'added'} successfully`,
    reviews: book.reviews
  });
});

// Delete a book review (only the logged-in user's review)
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;

  // require logged-in user stored in session
  if (!req.session || !req.session.authorization || !req.session.authorization.username) {
    return res.status(401).json({ message: "User not logged in" });
  }
  const username = req.session.authorization.username;

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (!book.reviews || typeof book.reviews !== 'object' || !book.reviews[username]) {
    return res.status(404).json({ message: "Review by this user not found" });
  }

  delete book.reviews[username];

  return res.status(200).json({
    message: "Review deleted successfully",
    reviews: book.reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
