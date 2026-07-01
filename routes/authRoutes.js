const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Rota de Login (POST /api/auth/login)
router.post('/login', async (req, res) => {
    try {
        const { login, senha } = req.body;

        // 1. Verificar se o usuário existe
        const usuario = await Usuario.findOne({ login });
        if (!usuario) {
            return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
        }

        // 2. Verificar se a senha está correta (compara a senha digitada com a criptografada)
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
        }

        // 3. Gerar o Token JWT (O "crachá" de acesso que expira em 1 dia)
        const token = jwt.sign(
            { id: usuario._id, perfil: usuario.perfil },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 4. Retornar os dados do usuário e o token para o tablet
        res.json({
            mensagem: 'Login realizado com sucesso! 🔓',
            token,
            usuario: {
                nome: usuario.nome,
                perfil: usuario.perfil
            }
        });

    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor ao tentar logar', detalhes: error.message });
    }
});

module.exports = router;