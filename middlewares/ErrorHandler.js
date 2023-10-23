function errorHandler(err, req, res, next) {
  console.log(err);
  let status = 500;
  let message = "Internal Server Error";

  if (
    err.name === "SequelizeValidationError" ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    status = 400;
    message = err.errors[0].message;
  } else if (err.name == "NoTokenFound" || err.name == "UserNotFound" || err.name == 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid Token';
  } else if (err.name == 'LoginUserNotFound' || err.name == 'LoginInvalidPassword') {
    status = 401;
    message = 'Invalid email or password';
  } else if (err.name == 'LoginInvalidInput'){
    status = 400;
    message = 'Email and password is required';
  }

  res.status(status).json({ message });
}

module.exports = errorHandler;