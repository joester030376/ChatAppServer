const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({path: "./config.env"});

// const {Server} = require("socket.io");

process.on("uncaughtException", (err) => {
    console.log(err);
    process.exit(1);
});

const http = require("http");
const User = require('./models/user');
const server = http.createServer(app);

// const io = new Server(server, {
//     cors: {
//         origin: "http://localhost:3000",
//         methods: ["GET", "POST"]
//     }
// });

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

// io.on("connection", async (socket) => {
//     console.log(socket);
//     const user_id = socket.handshake.query("user_id");
//     const socket_id = socket.id;

//     console.log(`User connected ${socket_id}`);

//     if(user_id) {
//         await User.findByIdAndUpdate(user_id, {socket_id,});
//     }

//     // We can write our socket event listeners here ...

//     socket.on("friend_request", async(data) => {
//         console.log(data.to);

//         // {to: "526956"}

//         const to = await User.findById(data.to);

//         // TODO => Create a friend request

//         io.to(to.socket_id).emit("new_friend_request", {
//             // 
//         });
//     });
// });

process.on("unhandledRejection", (err) => {
    console.log(err);
    server.close(() => {
        process.exit(1);
    })
});
