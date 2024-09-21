const { admin } = require("../config/firebase");

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        console.error('No token found');
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken); 
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('No token found');
        return res.status(403).json({ error: 'Unauthorized access. Please log in again.' });
    }
};

module.exports = verifyToken;