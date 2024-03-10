import express from 'express';
import mysql from 'mysql2';  // Use 'mysql2/promise' for async/await support
import { config } from 'dotenv';

config({
  path: '.env'
});

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
}).promise();

const app = express();

app.get('/', async (req, res) => {
  try {
    const [brandResults] = await pool.execute('SELECT DISTINCT car_name FROM cars');

    res.send(`
    <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Car Brands</title>
          <link rel="stylesheet" href="index.css">
        <body>
          <h1>Car Brands</h1>
          <select id="carBrand">
            ${brandResults.map(brand => `<option value="${brand.car_name}">${brand.car_name}</option>`).join('')}
          </select>
          <h2>Car Models</h2>
          <select id="carModel"></select>
          <script>
            document.getElementById('carBrand').addEventListener('change', function () {
              const selectedBrand = this.value;
              fetch('/models?brand=' + selectedBrand)
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
          </script>
        </body>
      </html>`);
  } catch (error) {
    console.error('Error executing brand query:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/models', async (req, res) => {
  const selectedBrand = req.query.brand;

  try {
    const [modelResults] = await pool.execute('SELECT DISTINCT model FROM cars WHERE car_name = ?', [selectedBrand]);

    res.json(modelResults);
  } catch (error) {
    console.error('Error executing model query:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});