const defaultRoomData = {
  messages: [
    {
      author: "Admin",
      value: "Welcome all",
    },
  ],
  members: [],
}

const rooms = {
  "room-1": JSON.parse(JSON.stringify(defaultRoomData)),
  "room-2": JSON.parse(JSON.stringify(defaultRoomData)),
}

const chat = io => {
  let _socket = null

  io.on("connection", socket => {
    _socket = socket
    console.log("new client connect to /chat: " + socket.id)
    _socket.emit("welcome", "Welcome to chat room")

    _socket.on("join-room", joinRoom)
    _socket.on("new-message", newMessages)
  })

  const joinRoom = ({ room_id, fullname }) => {
    console.log(fullname + " join room: " + room_id)
    _socket.join(room_id)
    rooms[room_id].members.push({
      socket_id: _socket.id,
      fullname,
    })

    _socket.emit("history-messages", rooms[room_id].messages)
  }

  const newMessages = ({ room_id, fullname, value }) => {
    const message = { author: fullname, value }
    rooms[room_id].messages.push(message)
    io.in(room_id).emit("new-message", message)
  }
}

module.exports = chat
