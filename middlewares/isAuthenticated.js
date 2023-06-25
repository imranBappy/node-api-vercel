const jwt = require('jsonwebtoken');
const JWT_SECRET = '123';
const isAuthenticated = (req, res, next) => {
    try {
        const { authorization } = req.headers;
        if (!authorization) return res.json({
            isAuthintication: false,
            message: 'User Unauthorized',
            error: true
        })
        const decode = jwt.verify(authorization, JWT_SECRET);
        req.user = decode.data;
        next();
    } catch (error) {
        error.status = 401;
        next(error)
    }
}
module.exports = isAuthenticated;