// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create MySQL connection
const db = mysql.createConnection({
  host: 'sql12.freesqldatabase.com',
  user: 'sql12730076',
  password: 'a15sz3ueNz',
  database: 'sql12730076',
  port: 3306, // You can specify the port here if it's different from the default (3306)
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to the database.');
});


// API Routes

// Fetch all pending orders
app.get('/api/pending-orders', (req, res) => {
  db.query('SELECT * FROM pending_orders', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Fetch all completed orders
app.get('/api/completed-orders', (req, res) => {
  db.query('SELECT * FROM completed_orders', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Place new order and check for matches
app.post('/api/place-order', (req, res) => {
  const { buyer_qty, buyer_price } = req.body;
// console.log(req.body);

  // Try to match with seller orders
  db.query('SELECT * FROM pending_orders WHERE seller_price <= ? LIMIT 1', [buyer_price], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      const order = results[0];
      const qtyToMatch = Math.min(buyer_qty, order.seller_qty);

      // Move to completed orders
      db.query('INSERT INTO completed_orders (price, qty) VALUES (?, ?)', [buyer_price, qtyToMatch], (err) => {
        if (err) throw err;

        // Update or remove the seller's order from pending orders
        if (order.seller_qty === qtyToMatch) {
          db.query('DELETE FROM pending_orders WHERE id = ?', [order.id], (err) => {
            if (err) throw err;
            res.json({ message: 'Order matched and completed.' });
          });
        } else {
          db.query('UPDATE pending_orders SET seller_qty = seller_qty - ? WHERE id = ?', [qtyToMatch, order.id], (err) => {
            if (err) throw err;
            res.json({ message: 'Order partially matched.' });
          });
        }
      });
    } else {
      res.json({ message: 'No matching seller found.' });
    }
  });
});

// Add a new pending order
app.post('/api/pending-orders', (req, res) => {
  const { buyer_qty, buyer_price, seller_qty, seller_price } = req.body;
  // console.log(req.body);
  
  db.query('INSERT INTO pending_orders (buyer_qty, buyer_price, seller_qty, seller_price) VALUES (?, ?, ?, ?)',
    [buyer_qty, buyer_price, seller_qty, seller_price], (err, result) => {
      if (err) throw err;
      res.json({ message: 'Order added!', result });
    });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
