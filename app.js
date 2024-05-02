const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const ejs = require('ejs');
const crypto = require('crypto');

dotenv.config();

const app = express();
const port = 25576;
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
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

app.get('/control', (req, res) => {
  res.render('control');
});

app.get('/locate', (req, res) => {
  res.render('locate');
});

app.get('/countdown', (req, res) => {
  res.render('countdown');
});

app.get('/', (req, res) => {
  res.render('index');
});



app.get('/live-data', (req, res) => {
  connection.query(
      `SELECT DATE_FORMAT(timestamp, "%H:%i:%s") AS time,
              AVG(temperature) AS temperature,
              AVG(pressure) AS pressure,
              AVG(humidity) AS humidity,
              AVG(latitude) AS latitude,
              AVG(longitude) AS longitude,
              AVG(height) AS height,
              AVG(velocity) AS velocity
       FROM sarfad_data
       GROUP BY time
       ORDER BY time`,
      (error, results, fields) => {
          if (error) {
              console.error('Error executing query:', error);
              res.status(500).json({ error: 'Internal server error' });
              return;
          }
          res.json(results);
      }
  );
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

app.get('/check-password', (req, res) => {
  const userInputPassword = req.query.password;
  const correctPassword = process.env.PASSWORD;

  if (userInputPassword === correctPassword) {
    const sessionToken = crypto.randomBytes(16).toString('hex');
    res.json({ authorized: true, sessionToken });
  } else {
    res.json({ authorized: false });
  }
});

app.get('/save-launch-time', (req, res) => {
  const launchTimeISO = req.query.launchTime;
  if (launchTimeISO) {

      const launchTime = new Date(launchTimeISO);
      const formattedLaunchTime = `${launchTime.getFullYear()}-${String(launchTime.getMonth() + 1).padStart(2, '0')}-${String(launchTime.getDate()).padStart(2, '0')} ${String(launchTime.getHours()).padStart(2, '0')}:${String(launchTime.getMinutes()).padStart(2, '0')}:${String(launchTime.getSeconds()).padStart(2, '0')}`;

      const query = 'INSERT INTO launch_time (launch_time) VALUES (?) ON DUPLICATE KEY UPDATE launch_time = VALUES(launch_time)';
      connection.query(query, [formattedLaunchTime], (error) => {
          if (error) {
              console.error('Error saving launch time:', error);
              res.status(500).json({ error: 'Internal server error' });
              return;
          }
          res.status(200).end();
      });
  } else {
      res.status(400).json({ error: 'Missing launch time parameter' });
  }
});


app.get('/get-launch-time', (req, res) => {
  const query = 'SELECT launch_time FROM launch_time ORDER BY id DESC LIMIT 1';
  connection.query(query, (error, results) => {
      if (error) {
          console.error('Error fetching launch time:', error);
          res.status(500).json({ error: 'Internal server error' });
          return;
      }
      const launchTime = results[0] ? results[0].launch_time : null;
      res.json({ launchTime });
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
  console.log(`${colors.green}Index Page: ${colors.reset}http://localhost:${port}/`);
  console.log(`${colors.green}Live Web: ${colors.reset}http://localhost:${port}/live`);
  console.log(`${colors.green}Locate App: ${colors.reset}http://localhost:${port}/locate`);
  console.log(`${colors.green}Control center: ${colors.reset}http://localhost:${port}/control`);
  console.log(`${colors.white}---------------------------------------${colors.reset}`);
});
