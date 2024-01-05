const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({path: "./config.env"});

process.on("uncaughtException", (err) => {
    console.log(err);
    process.exit(1);
});

const http = require("http");

const server = http.createServer(app);

const DB = process.env.DBURI.replace("<PASSWORD>", process.env.DBPASSWORD);

mongoose.connect(DB, {
   
}).then((con) => {
    console.log("Connected to mongo database");
}).catch((err) => {
    console.log("Did not connect to the mongo databse: ", err)
});

const port = process.env.PORT || 8808;

server.listen(port, () => {
    console.log(`Server is listening to ${port}`);
});

process.on("unhandledRejection", (err) => {
    console.log(err);
    server.close(() => {
        process.exit(1);
    })
});
