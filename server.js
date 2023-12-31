const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io');
const { formatMessage } = require('./util/messages')
const { userJoin , getCurrentUser , getRoomUsers , userLeave } = require('./util/users')

const app =express();
const server = http.createServer(app)
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname , 'public')))

const botName = 'BOT'

// run when client connects
io.on('connection' , socket => {
   socket.on('joinRoom' , ({username , room})=>{
      const user = userJoin(socket.id , username , room);
      socket.join(user.room)
      // when your loged in
      socket.emit('message' ,formatMessage(botName , 'Welcome to chatApp'))

      // Broadcast when a user connects
      socket.broadcast.to(user.room).emit('message' ,formatMessage(botName , `${username} has joined the chat`));

      // Send users and room info
      io.to(user.room).emit('roomUsers' , {
         room : user.room,
         users : getRoomUsers(user.room)
      })
   })

   // listening incoming msg
   socket.on('chatMessage' , msg =>{
      const user = getCurrentUser(socket.id)
      io.to(user.room).emit('message' ,formatMessage(user.username , msg)); 
   })
   // runs when client disconnect
   socket.on('disconnect' , () =>{
      const user = userLeave(socket.id);
      if(user){
         io.to(user.room).emit('message' ,formatMessage(botName , `${user.username} has left the chat`));

         // Send users and room info
      io.to(user.room).emit('roomUsers' , {
         room : user.room,
         users : getRoomUsers(user.room)
      })
      }
   })
})

const PORT = 4000 || process.env.PORT
server.listen(PORT , ()=> console.log(`Server running on ${PORT}`))