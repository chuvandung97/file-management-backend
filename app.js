var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser')
var cors = require('cors')
const bearerToken = require('express-bearer-token');

var indexRouter = require('./routes/index');
var registerRouter = require('./routes/register');
var loginRouter = require('./routes/login')
var logoutRouter = require('./routes/logout')
var userRouter = require('./routes/user')
var roleRouter = require('./routes/role')
var groupRouter = require('./routes/group')
var menuRouter = require('./routes/menu')
var folderRouter = require('./routes/folder')
var fileRouter = require('./routes/file')
var folderFileRouter = require('./routes/folderfile')
var fileTypeDetailRouter = require('./routes/filetypedetail')

var app = express();

app.use(cors())
app.use(bodyParser.json())
app.use(bearerToken());

var minioClient = require('./config/minio');
var Minio = require('minio')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/users', userRouter)
app.use('/roles', roleRouter)
app.use('/groups', groupRouter)
app.use('/menus', menuRouter)
app.use('/folders', folderRouter)
app.use('/files', fileRouter)
app.use('/folderfiles', folderFileRouter)
app.use('/filetypedetails', fileTypeDetailRouter)

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
