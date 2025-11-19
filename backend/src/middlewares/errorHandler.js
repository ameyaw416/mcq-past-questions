export default function errorHandler(err, req, res, next) {
  console.error('Error handler:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Something went wrong.';

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
