const app = require('./app');
const db = require('./models/user.js');

process.on("uncaughtException", (err) => {
    console.log(err);
    process.exit(1);
});

const http = require("http");

const server = http.createServer(app);

const port = process.env.PORT || 8080;

const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql' 
});

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch((error) => {
    console.err('Unable to connect to the database: ', error);
});

server.listen(port, () => {
    console.log(`Server is listening to ${port}`);
});

process.on("unhandledRejection", (err) => {
    console.log(err);
    server.close(() => {
        process.exit(1);
    })
});



