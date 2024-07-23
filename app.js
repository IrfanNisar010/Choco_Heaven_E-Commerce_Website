const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const path = require("path");
const nocache = require('nocache');

dotenv.config({ path: '.env' });

const app = express();

// View Engine and Static paths
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use nocache middleware to disable caching
app.use(nocache());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
}).then(() => {
    console.log('MongoDB connected');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Suppress deprecation warnings
process.noDeprecation = true;

// Flash messages
app.use(flash());

// import routes
const userRoute = require('./routes/userRoutes.js');
const adminRoute = require('./routes/adminRoute.js');

// Routes
app.use('/', userRoute);
app.use('/admin', adminRoute);

app.set('views','./views/users');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`App is running on port http://localhost:${PORT}`);
});
