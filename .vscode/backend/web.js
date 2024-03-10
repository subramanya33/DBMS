import express from 'express';
import mysql from 'mysql2/promise'; // Using 'mysql2/promise' for async/await support
import { config } from 'dotenv';

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve your static files like CSS from a directory named 'public'
app.use(express.static('public'));

app.get('/', async (req, res) => {
  try {
    const [brandResults] = await pool.execute('SELECT DISTINCT car_name FROM cars');
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Car Selection</title>
          <link rel="stylesheet" href="index.css">
        </head>
        <body>
          <h1>Car Selection</h1>
          <label for="carBrand">Car Name:</label>
          <select id="carBrand">
            ${brandResults.map(brand => `<option value="${brand.car_name}">${brand.car_name}</option>`).join('')}
          </select>

          <label for="carCategory">Car Category:</label>
          <select id="carCategory"></select>

          <label for="carModel">Car Model:</label>
          <select id="carModel"></select>

          <label for="carYear">Car Year:</label>
          <select id="carYear"></select>

          <script>
            document.getElementById('carBrand').addEventListener('change', function () {
              const selectedBrand = this.value;
              fetch('/categories?brand=' + selectedBrand)
                .then(response => response.json())
                .then(categories => {
                  const carCategoryDropdown = document.getElementById('carCategory');
                  carCategoryDropdown.innerHTML = '';
                  categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.category;
                    option.textContent = category.category;
                    carCategoryDropdown.appendChild(option);
                  });
                })
                .catch(error => console.error('Error fetching categories:', error.message));
            });

            document.getElementById('carCategory').addEventListener('change', function () {
              const selectedBrand = document.getElementById('carBrand').value;
              const selectedCategory = this.value;
              fetch('/models?brand=' + selectedBrand + '&category=' + selectedCategory)
                .then(response => response.json())
                .then(models => {
                  const carModelDropdown = document.getElementById('carModel');
                  carModelDropdown.innerHTML = '';
                  models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.model;
                    option.textContent = model.model;
                    carModelDropdown.appendChild(option);
                  });
                })
                .catch(error => console.error('Error fetching models:', error.message));
            });

            document.getElementById('carModel').addEventListener('change', function () {
              const selectedBrand = document.getElementById('carBrand').value;
              const selectedCategory = document.getElementById('carCategory').value;
              const selectedModel = this.value;
              fetch('/years?brand=' + selectedBrand + '&category=' + selectedCategory + '&model=' + selectedModel)
                .then(response => response.json())
                .then(years => {
                  const carYearDropdown = document.getElementById('carYear');
                  carYearDropdown.innerHTML = '';
                  years.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year.year;
                    option.textContent = year.year;
                    carYearDropdown.appendChild(option);
                  });
                })
                .catch(error => console.error('Error fetching years:', error.message));
            });
          </script>
        </body>
      </html>
    `);
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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
