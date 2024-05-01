const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const ejs = require('ejs');

dotenv.config();

const app = express();
const port = 3000;

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/live', (req, res) => {
  res.render('live');
});

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/live-data', (req, res) => {
  connection.query('SELECT DATE_FORMAT(timestamp, "%H:%i") AS time, temperature, pressure, humidity, latitude, longitude, height, velocity FROM sarfad_data', (error, results, fields) => {
    if (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    res.json(results);
  });
});

app.get('/latest-location', (req, res) => {
  const query = 'SELECT latitude, longitude, MAX(timestamp) AS latest_timestamp, temperature, pressure, humidity, height, velocity FROM sarfad_data GROUP BY latitude, longitude ORDER BY latest_timestamp DESC LIMIT 1;';
  connection.query(query, (error, results, fields) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    res.json(results);
  });
});


const colors = {
  green: '\x1b[32m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

app.listen(port, () => {
  console.log(`${colors.green}App listening on the following routes:${colors.reset}`);
  console.log(`${colors.white}---------------------------------------${colors.reset}`);
  console.log(`${colors.green}Index Page: ${colors.reset}http://localhost:${port}`);
  console.log(`${colors.green}Live Web: ${colors.reset}http://localhost:${port}/live`);
  console.log(`${colors.white}---------------------------------------${colors.reset}`);
});
  