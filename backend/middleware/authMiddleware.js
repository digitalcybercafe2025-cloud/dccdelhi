const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.admin = await Admin.findById(decoded.id).select('-password');
            if (!req.admin) return res.status(401).json({ message: 'Not authorized' });
            next();
        } catch (error) {
            res.status(401).json({ message: 'Token invalid or expired' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.admin && req.admin.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

const isStaff = (req, res, next) => {
    if (req.admin && (req.admin.role === 'admin' || req.admin.role === 'staff')) {
        next();
    } else {
        res.status(403).json({ message: 'Staff or Admin access required' });
    }
};

module.exports = { protect, isAdmin, isStaff };
