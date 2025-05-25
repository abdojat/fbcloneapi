// /middlewares/auth.js


const jwt = require('jsonwebtoken');
const Token = require('../models/token');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) throw new Error();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(401).send({ error: 'Please authenticate' });
    }
};

module.exports = auth;