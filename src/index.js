const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("../src/utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app); // to be able to access server or express will crete ir in background
const io = socketio(server);

const port = process.env.PORT;

/////////////////// Define paths for Express config /////////////////////////
const publicDirectoryPath = path.join(__dirname, "../public");

////////////////////////// Setup static directory to serve ///////////////
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New Websocket connection");

  // socket.emit("message", generateMessage("Welcome!")); // to respond to specific connnection
  // socket.broadcast.emit("message", generateMessage("A new user has joined!")); // to response to every body but not to who is connecting
  // socket.emit('countUpdated', count)

  // socket.on('increment', () => {
  //     count++;
  //     // socket.emit('countUpdated', count) // just for this connection
  //     io.emit('countUpdated', count) // for every connected user
  // })

  // socket.on("join", ({ username, room }, callback) => {
    socket.on("join", (options, callback) => {
      // console.log('Joining ', socket.id)
    // const {error, user} = addUser({ id: socket.id, username, room });

    const {error, user} = addUser({ id: socket.id, ...options}); // using spread operator instead of object destructuring

    if(error) {
      return callback(error)
    }

    socket.join(user.room);

    socket.emit("message", generateMessage('Admin', "Welcome!")); // to respond to specific connnection
    socket.broadcast.to(user.room).emit("message", generateMessage('Admin', `${user.username} has joined!`)); // to response to every body but not to who is connecting

    // socket.emit, io.emit, socket.broadcast.emit
    // io.to.emit // send a messages to every body in a specific chat room
    // socket.broackcast.to.emit // send a message to any conected client except to the sender to specific room
    
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback();
  });

  socket.on("sendMessage", (msg, callback) => {
    
    const user = getUser(socket.id)
    
    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return callback("Profanity is not allowed!");
    }

    // socket.broadcast.emit('message', msg);
    io.to(user.room).emit("message", generateMessage(user.username, msg));

    callback("ACK");
  });

  socket.on("sendLocation", ({lat, lng}, callback) => {
    const user = getUser(socket.id);
    const url = `https://google.com/maps?q=${lat},${lng}`;
    // socket.broadcast.emit('locationMessage', msg)
    io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, url));

    callback();
  });

  socket.on("disconnect", () => {
    console.log('Disconnecting ', socket.id)
    const user = removeUser(socket.id)
    console.log('User has left', user)
    
    if(user) {
      io.to(user.room).emit("message", generateMessage('Admin', `${user.username} has left!`)); // send a message to every connected user
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
    // io.emit("message", generateMessage("A user has left!")); // send a message to every connected user
  });
});

// app.listen(port, () => {
//     console.log(`Listenning on port ${port}`);
// })
server.listen(port, () => {
  console.log(`Listenning on port ${port}`);
});
