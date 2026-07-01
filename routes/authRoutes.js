const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Rota de Cadastro de Usuário (POST /api/auth/register)
router.post('/register', async (req, res) => {
    try {
        const { nome, login, senha, perfil } = req.body;

        // Verificar se o usuário já existe
        const usuarioExiste = await Usuario.findOne({ login });
        if (usuarioExiste) {
            return res.status(400).json({ erro: 'Este login já está em uso.' });
        }

        // Criptografar a senha
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        // Criar o novo usuário
        const novoUsuario = new Usuario({
            nome,
            login,
            senha: senhaCriptografada,
            perfil: perfil || 'OPERADOR' // Se não enviar perfil, assume OPERADOR
        });

        // Salvar no MongoDB
        await novoUsuario.save();

        res.status(201).json({ 
            mensagem: 'Usuário cadastrado com sucesso! 👤',
            usuario: {
                nome: novoUsuario.nome,
                login: novoUsuario.login,
                perfil: novoUsuario.perfil
            }
        });

    } catch (error) {
        res.status(500).json({ erro: 'Erro no servidor ao cadastrar usuário', detalhes: error.message });
    }
});

// 2. Rota de Login (POST /api/auth/login) - Sua rota original mantida intacta
router.post('/login', async (req, res) => {
    try {
        const { login, senha } = req.body;

        const usuario = await Usuario.findOne({ login });
        if (!usuario) {
            return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
        }

        const token = jwt.sign(
            { id: usuario._id, perfil: usuario.perfil },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

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
