var createError = require('http-errors');
var express = require('express');
var dontenv = require('dotenv').config();
var mongoose = require('mongoose');
var mongoDB = process.env.MONGO_URL; // add URL for database
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var helmet = require('helmet');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var multer = require('multer');
var flash = require('connect-flash');
var bcrypt = require('bcryptjs');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Handle sessions for logins
app.use(session({
	secret: process.env.SESSION_SECRET,
	saveUninitialized: true,
	resave: true,
  store: new MongoStore({mongooseConnection: db}),
  name: process.env.SESSION_NAME
}));

app.use(helmet());

//passport
app.use(passport.initialize());
app.use(passport.session());

//Express messages and connect-flash
app.use(require('connect-flash')());
app.use(function(req, res, next){
	res.locals.messages = require('express-messages')(req, res);
	next();
});

app.get('*', function(req, res, next) {
  res.locals.user = req.user || null;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
