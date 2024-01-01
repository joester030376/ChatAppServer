const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 8080;

// Create the connectiont to the database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'chatapp'
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected");
})

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});