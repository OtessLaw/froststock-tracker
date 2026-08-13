const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again.';

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `A record with this ${field} already exists.`;
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages[0];
    statusCode = 400;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = 'Invalid ID format.';
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Your session is invalid. Please log in again.';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Your session has expired. Please log in again.';
    statusCode = 401;
  }

  // Don't expose internal server errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Something went wrong. Please try again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
