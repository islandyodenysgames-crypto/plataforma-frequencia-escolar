const express = require('express');
const router = express.Router();
const Aluno = require('../models/Aluno');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

// Rota para cadastrar dados iniciais de teste no banco
router.post('/popular-banco', async (req, res) => {
    try {
        // 1. Limpa os dados de teste anteriores (opcional, para não duplicar)
        await Aluno.deleteMany({});
        await Usuario.deleteMany({});

        // 2. Cadastra Alunos de Teste (Turma A e Turma B)
        const alunosPreDefinidos = [
            { nome: 'Carlos Silva', turma: '1º Ano A' },
            { nome: 'Ana Souza', turma: '1º Ano A' },
            { nome: 'Bruno Lima', turma: '1º Ano A' },
            { nome: 'Mariana Costa', turma: '1º Ano B' },
            { nome: 'João Santos', turma: '1º Ano B' },
            { nome: 'Beatriz Rodrigues', turma: '1º Ano B' }
        ];
        await Aluno.insertMany(alunosPreDefinidos);

        // 3. Cadastra um Usuário de Teste com a senha criptografada
        const senhaCriptografada = await bcrypt.hash('biblioteca123', 10);
        const usuarioTeste = new Usuario({
            nome: 'Responsável Biblioteca',
            login: 'biblioteca',
            senha: senhaCriptografada,
            perfil: 'OPERADOR'
        });
        await usuarioTeste.save();

        res.status(201).json({
            mensagem: 'Banco de dados populado com sucesso! 🎉',
            alunosInseridos: alunosPreDefinidos.length,
            usuarioCriado: { login: 'biblioteca', senhaOriginal: 'biblioteca123' }
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao popular banco', detalhes: error.message });
    }
});

module.exports = router;