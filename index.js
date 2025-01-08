require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const router = require('./routes/index');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/ErrorHandlingMiddleware');
const path = require('path');
const http = require('http');
const compression = require('compression');
const { connectRedis } = require('./redisClient');

const { PORT, DB_URL } = process.env;

const app = express();

app.use(compression());
app.use(cookieParser());

const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://web-shop-steel.vercel.app',
    ],
    methods: ['GET', 'POST', "PATCH"],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.set('io', io);

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://web-shop-steel.vercel.app',
    'https://next-project-production.up.railway.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json());  
app.use(express.static(path.resolve(__dirname, 'static')));
app.use(fileUpload({}));

// Routes
app.use('/api', router);

//
app.use(errorHandler);

//Redis
connectRedis();

const start = async () => {
  try {
    await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    server.listen(PORT, () =>
      console.log(`Server started on PORT = ${PORT}`)
    );
  } catch (error) {
    console.error(error);
  }
};

start();
