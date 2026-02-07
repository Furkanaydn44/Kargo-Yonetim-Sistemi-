const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// KULLANICI KAYDI (REGISTER)
exports.register = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Kullanıcı var mı kontrol et
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu kullanıcı adı zaten alınmış.' });
        }

        // Şifreyi şifrele (Hash)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Yeni kullanıcı oluştur
        const newUser = await User.create({
            username,
            password: hashedPassword,
            role: role || 'user' // Eğer rol gelmezse standart user yap
        });

        res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu.' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};

// GİRİŞ YAPMA (LOGIN)
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Kullanıcıyı bul
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(400).json({ message: 'Kullanıcı adı veya şifre hatalı.' });
        }

        // Şifreyi kontrol et
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Kullanıcı adı veya şifre hatalı.' });
        }

        // Token oluştur (Bu token ile diğer işlemleri yapacak)
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // 1 gün geçerli
        );

        res.json({
            message: 'Giriş başarılı',
            token,
            user: { id: user.id, username: user.username, role: user.role }
        });

    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};