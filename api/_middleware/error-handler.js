module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    switch (true) {
        case typeof err === 'string':
            // custom application error
            console.log(`errorHandler: ${JSON.stringify(err)}`);
            const is404 = err.toLowerCase().endsWith('not found');
            const statusCode = is404 ? 404 : 400;
            return res.status(statusCode).json({ message: err });
        case err.name === 'ValidationError':
            // mongoose validation error
            console.log(`ValidationError: ${JSON.stringify(err)}`);
            return res.status(400).json({ message: err.message });
        case err.name === 'UnauthorizedError':
            // jwt authentication error
            console.log(`Unauthorized error: ${JSON.stringify(err)}`);
            return res.status(401).json({ message: 'Unauthorized Error' });
        default:
            console.log(`errorHandler default`);
            return res.status(500).json({ message: err.message });
    }
}
