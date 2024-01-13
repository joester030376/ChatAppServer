const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({path: "./config.env"});

const path = require("path");

const {Server} = require("socket.io");

process.on("uncaughtException", (err) => {
    console.log(err);
    process.exit(1);
});

const http = require("http");
const User = require('./models/user');
const FriendRequest = require('./models/friendRequest');
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: `http://localhost:${process.env.PORT}}`,
        methods: ["GET", "POST"]
    }
});

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

io.on("connection", async (socket) => {
    console.log(JSON.stringify(socket.handshake.query));

    // console.log(socket);
    const user_id = socket.handshake.query("user_id");
    const socket_id = socket.id;

    console.log(`User connected ${socket_id}`);

    if(Boolean(user_id)) {
        await User.findByIdAndUpdate(user_id, {socket_id, status: "Online" });
    }

    // We can write our socket event listeners here ...

    socket.on("friend_request", async(data) => {
        console.log(data.to);

        // data => {to, from}

        const to_user = await User.findById(data.to).select("socket_id");
        const from_user = await User.findById(data.from).select("socket_id");

        // create a friend request
        await FriendRequest({
            sender: data.from,
            recipient: data.to
        });

        // TODO => Create a friend request

        // emit event => "new_friend_request"
        
        io.to(to_user.socket_id).emit("new_friend_request", {
            // 
            message: "New Friend Request Recieved"
        });

        // emit event => "request_sent"
        io.to(from_user.socket_id).emit("request_sent", {
            message: "Request sent successfully"
        })
    });

    socket.on("accept_request", async (data) => {
        console.log(data);

        const request_doc = await FriendRequest.findById(data.request_id);
        
        console.log(request_doc);

        // request_id

        const sender = await User.findById(request_doc.sender);
        const receiver = await User.findById(request_doc.recipient);

        sender.friends.push(request_doc.recipient);
        receiver.friends.push(request_doc.sender);

        await receiver.save({new: true, validateModifiedOnly: true});
        await sender.save({new: true, validateModifiedOnly: true});

        await FriendRequest.findByIdAndDelete(data.request_id);

        io.to(sender.socket_id).emit("request_accepted", {
            message: "Friend Request Accepted"
        });
        io.to(receiver.socket_id).emit("request_accepted", {
            message: "Friend Request Accepted"
        });        
    });

    // Handle incoming text and link messages.
    socket.on("text_message", async(data) => {

        // data: {to, from, text}

        // Create a new conversation subject to a condition if it doesnt exist and add one new message to messages list


        // Save changes to database

        // Emit incoming_message -> to user

        // Emit outgoing_message -> from user
    });

    // Handle incoming media and documents
    socket.on("file_message", async(data) => {
        console.log("Received Message", data);

        // data: {to, from, text, file}

        // get the file extension
        const fileExtension = path.extname(data.file.name);

        // generate a unique filename
        const fileName = `${Date.now()}_${Math.floor(Math.random() * 10000)}${fileExtension}`
        
        // Upload file to AWS s3

        // Create a new conversation subject to a condition if it doesnt exist and add one new message to messages list

        // Save changes to database

        // Emit incoming_message -> to user

        // Emit outgoing_message -> from user

    });

    socket.on("end", async (data) => {
        // Find user by _id and set the status to Offline
        if(data.user_id) {
            await User.findByIdAndUpdate(data.user_id, {
                status: "Offline"
            });
        }

        // Broadcast user is disconnected

        console.log("Closing connection");
        socket.disconnect(0);
    });
});

process.on("unhandledRejection", (err) => {
    console.log(err);
    server.close(() => {
        process.exit(1);
    })
});
