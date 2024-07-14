const errorMiddleware = (error, req, res, next) => {
    const status = error.status || 500; // Default to 500 if no status is provided
    const message = error.message || 'Internal Server Error'; // Default message

    if (status === 404) {
        res.render('error', { status: 404, error: message });
    } else {
        res.render('error', { status: 500, error: message });
    }
}

module.exports = errorMiddleware;
