'use strict';

require('dotenv').config({
    path: __dirname + '/../.env'
  });

const io = require("socket.io")(3005, {
    cors: {
      origin: process.env.SOCKET_CHAT_ORIGIN,
    },
    handlePreflightRequest: (rea, res) => {
        res.writeHead(200, {
            "Acces-Control-Allow-Origin": "*",
            "Acces-Control-Allow-Methods": "GET, POST",
            "Acces-Control-Allow-Headers":"Custom-Header"
        });
        res.end()
    }
});
console.log('IO STAY CREATED OK');
  
let users = [];

const addUser = (userId, socketId) => {
!users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
    return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {

    console.log("User connected.");

    //take userId/socketId from user
    socket.on("addUser", (userId, socketId) => {
        addUser(userId, socketId);
    });

    //send/get message
    socket.on("sendMessage", ({ senderId, receiverId, text }) => {
        const user = getUser(receiverId);
        io.emit("getMessage", {
            senderId,
            text,
        });
    });

    //when disconnect
    socket.on("disconnect", () => {
        console.log("a user disconnected!");
        removeUser(socket.id);
        io.emit("getUsers", users);
    });
});
  
