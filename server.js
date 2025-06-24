const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const usersFile = path.join(__dirname, 'users.json');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ✅ تسجيل الدخول
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  }
});

// ✅ تسجيل مستخدم جديد
app.post('/register', (req, res) => {
  const { username, password, avatar } = req.body;
  let users = [];

  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  }

  const userExists = users.find(u => u.username === username);
  if (userExists) {
    return res.json({ success: false, message: 'المستخدم موجود مسبقًا' });
  }

  users.push({ username, password, avatar });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');

  res.json({ success: true });
});

// ✅ WebSocket + إدارة المتصلين
let connectedUsers = [];

io.on('connection', socket => {
  console.log('📡 مستخدم متصل');

  socket.on("new user", username => {
    if (!connectedUsers.includes(username)) {
      connectedUsers.push(username);
    }
    io.emit("update users", connectedUsers);
  });

  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    // ملاحظة: هنا يمكن إضافة منطق لتحديث قائمة المتصلين عند الانفصال
    console.log('❌ مستخدم خرج');
  });
});

server.listen(3000, () => {
  console.log('✅ السيرفر يعمل على http://localhost:3000');
});
;
