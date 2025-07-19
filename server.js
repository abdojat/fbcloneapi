// server.js

const app = require('./app');
const { connectDB } = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/message');
const Notification = require('./models/notification');
const { initializeNotificationSocket, createNotification, setOnlineUsersMap } = require('./controllers/notificationController');

connectDB();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://fbclone-p5q2.onrender.com',
        methods: ['GET', 'POST', 'PATCH', "DELETE"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

let onlineUsers = new Map();
initializeNotificationSocket(io);
setOnlineUsersMap(onlineUsers);

io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        onlineUsers.set(userId, socket.id);
        // Broadcast updated online users to all clients
        io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    });

    socket.on('getOnlineUsers', () => {
        socket.emit('onlineUsers', Array.from(onlineUsers.keys()));
    });

    socket.on('sendMessage', async (data) => {
        try {
            const { sender, recipient, text, timestamp } = data;
            const newMessage = await Message.create({
                sender,
                recipient,
                text,
                timestamp,
            });
            createNotification(recipient, sender, 'message', newMessage._id, text.substring(0, 50));
            const newMsg = newMessage;
            const recipientSocketId = onlineUsers.get(data.recipient);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('receiveMessage', newMsg);
            }
        } catch (err) {
            console.log(err);
        }
    });

    socket.on('markAsRead', async ({ sender, recipient }) => {
        await Message.updateMany(
            { sender, recipient, read: false },
            { read: true, readAt: new Date() }
        );
        await Notification.updateMany(
            { sender, recipient, isRead: false },
            { isRead: true, readAt: new Date() }
        );
        if (onlineUsers.has(sender)) {
            io.to(onlineUsers.get(sender)).emit('readReceipt', { sender, recipient });
        }
    });

    socket.on('typing', ({ sender, recipient }) => {
        const recipientSocketId = onlineUsers.get(recipient);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('typing', { sender });
        }
    });

    socket.on('stopTyping', ({ sender, recipient }) => {
        const recipientSocketId = onlineUsers.get(recipient);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('stopTyping', { sender });
        }
    });


    socket.on('disconnect', () => {
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                // Broadcast updated online users to all clients
                io.emit('onlineUsers', Array.from(onlineUsers.keys()));
                break;
            }
        }
    });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
