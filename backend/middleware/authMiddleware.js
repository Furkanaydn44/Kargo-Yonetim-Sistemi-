const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Header'dan token'ı al
    const token = req.header('x-auth-token');

    // Token yoksa durdur
    if (!token) {
        return res.status(401).json({ message: 'Yetkisiz erişim. Token yok.' });
    }

    try {
        // Token'ı çöz
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Kullanıcı bilgisini request'e ekle
        next(); // Devam et
    } catch (error) {
        res.status(401).json({ message: 'Token geçersiz.' });
    }
};