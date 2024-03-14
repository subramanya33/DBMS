import express from 'express';
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import path from 'path';
import cors from 'cors';

config({
  path: '.env'
});

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors());

// Serve your static files like CSS from a directory named 'public'
app.use(express.static('../frontend'));

app.get('/', async (req, res) => {
  try {
    const [brandResults] = await pool.execute('SELECT DISTINCT car_name FROM cars');
    res.sendFile('index.html', { root: 'frontend' });
  } catch (error) {
    console.error('Error executing brand query:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/categories', async (req, res) => {
  const selectedBrand = req.query.brand;

  try {
    const [categoryResults] = await pool.execute('SELECT DISTINCT category FROM cars WHERE car_name = ?', [selectedBrand]);
    res.json(categoryResults);
  } catch (error) {
    console.error('Error executing category query:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/models', async (req, res) => {
  const selectedBrand = req.query.brand;
  const selectedCategory = req.query.category;

  try {
    const [modelResults] = await pool.execute('SELECT DISTINCT model FROM cars WHERE car_name = ? AND category = ?', [selectedBrand, selectedCategory]);
    res.json(modelResults);
  } catch (error) {
    console.error('Error executing model query:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/years', async (req, res) => {
  const selectedBrand = req.query.brand;
  const selectedCategory = req.query.category;
  const selectedModel = req.query.model;

  try {
    const [yearResults] = await pool.execute('SELECT DISTINCT year FROM cars WHERE car_name = ? AND category = ? AND model = ?', [selectedBrand, selectedCategory, selectedModel]);
    res.json(yearResults);
  } catch (error) {
    console.error('Error executing year query:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/process_registration', async (req, res) => {
  const { name, contact, email, add, passw, gender, rc_no } = req.body;

  try {
    const connection = await pool.getConnection();

    // Check if the user already exists
    const [userExists] = await connection.execute('SELECT COUNT(*) AS count FROM users WHERE email = ? OR contact = ?', [email, contact]);

    if (userExists[0].count > 0) {
      // User already exists
      res.status(400).send('User already exists with this email or phone number!');
    } else {
      // Insert the new user into the database
      await connection.query('INSERT INTO users (name, contact, email, address, password, gender, rc_no) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, contact, email, add, passw, gender, rc_no]);
      connection.release();

      // Registration successful
      res.status(200).send('Registration successful!');
    }
  } catch (error) {
    console.error('Error processing registration:', error.message);
    res.status(500).send('Internal Server Error');
  }
});




const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});