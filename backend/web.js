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

// Assuming you have already imported necessary modules and configured your server

// Handle POST request to /login
// Handle POST request to /login

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      // If username or password is missing, return a 400 Bad Request response
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Perform database query to check user credentials
    const [users] = await pool.execute('SELECT * FROM users WHERE name = ? AND password = ?', [username, password]);

    if (users.length > 0) {
      // User exists and credentials are correct
      // Update the last_login time and login_count for the user
      await pool.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE name = ?', [username]);

      // Return success response
      return res.status(200).json({ message: 'Login successful', user: users[0] });
    } else {
      // User does not exist or credentials are incorrect
      return res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error during login:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/admin-login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      // If username or password is missing, return a 400 Bad Request response
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Perform database query to check if the user is an admin
    const [admin] = await pool.execute('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password]);

    if (admin.length > 0) {
      // User is an admin
      // Return success response
      return res.status(200).json({ message: 'Admin login successful', admin: admin[0] });

    } else {
      // User is not an admin or credentials are incorrect
      return res.status(401).json({ error: 'Invalid admin' });
    }
  } catch (error) {
    console.error('Error during admin login:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.get('/reviews/:carId', async (req, res) => {
  const carId = req.params.carId;

  try {
    // Fetch reviews for the specified car from the database
    const [reviews] = await pool.execute('SELECT * FROM reviews WHERE id = ?', [carId]);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Handle POST request to submit a review for a specific car
// Handle POST request to submit a review for a specific car
// Handle POST request to submit a review for a specific car
app.post('/submit-review', async (req, res) => {
  const { carName, category, model, year, reviewText } = req.body;

  try {
    const connection = await pool.getConnection();

    // Get the car ID from the database based on car details
    const [carIdRows] = await connection.execute('SELECT id FROM cars WHERE car_name = ? AND category = ? AND model = ? AND year = ?', [carName, category, model, year]);

    if (carIdRows.length === 0) {
      // If car not found, return a 404 Not Found response
      return res.status(404).json({ error: 'Car not found' });
    }

    const carId = carIdRows[0].id;

    // Insert the review into the database
    await connection.query('INSERT INTO reviews (car_id, review_text) VALUES (?, ?)', [carId, reviewText]);

    connection.release();

    // Return success response
    res.status(200).json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error submitting review:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




//ADMINLEVEL CODES
app.get('/data', async (req, res) => {
  const entity = req.query.entity;
  try {
    let tableData;
    switch (entity) {
      case 'users':
        const [userResults] = await pool.query('SELECT * FROM users');
        tableData = formatUserTable(userResults);
        break;
      case 'cars':
        const [carResults] = await pool.query('SELECT * FROM cars');
        tableData = formatCarTable(carResults);
        break;
      case 'categories':
        const [categoryResults] = await pool.query('SELECT * FROM category');
        tableData = formatCategoryTable(categoryResults);
        break;
      case 'reviews':
        const [reviewResults] = await pool.query('SELECT * FROM reviews');
        tableData = formatReviewTable(reviewResults);
        break;
      default:
        return res.status(400).send('Invalid entity specified');
    }
    res.json(tableData);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Helper functions to format data into table-like structure
function formatUserTable(data) {
  return { table: 'users', data };
}

function formatCarTable(data) {
  return { table: 'cars', data };
}

function formatCategoryTable(data) {
  return { table: 'categories', data };
}

function formatReviewTable(data) {
  return { table: 'reviews', data };
}
app.delete('/remove/:entity', async (req, res) => {
  const { entity } = req.params;
  const itemId = req.query.id; // Assuming the item ID is passed as a query parameter

  try {
    let tableName;
    let idColumnName;

    // Determine the table name and the primary key column based on the entity
    switch (entity) {
      case 'users':
        tableName = 'users';
        idColumnName = 'id'; // Adjust this based on your actual primary key column name for users
        break;
      case 'cars':
        tableName = 'cars';
        idColumnName = 'id'; // Adjust this based on your actual primary key column name for cars
        break;
      case 'categories':
        tableName = 'categories';
        idColumnName = 'id'; // Adjust this based on your actual primary key column name for categories
        break;
      case 'reviews':
        tableName = 'reviews';
        idColumnName = 'review_id'; // Adjust this based on your actual primary key column name for reviews
        break;
      default:
        return res.status(400).send('Invalid entity specified');
    }

    // Delete the item from the database
    const [result] = await pool.query(`DELETE FROM ${tableName} WHERE ${idColumnName} = ?`, [itemId]);

    if (result.affectedRows === 0) {
      // If no rows were affected, it means the item with the specified ID was not found
      return res.status(404).send('Item not found');
    }

    res.sendStatus(200); // Send a success status code if removal is successful
  } catch (error) {
    console.error('Error:', error);
    res.sendStatus(500); // Send an error status code if removal fails
  }
});







const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});