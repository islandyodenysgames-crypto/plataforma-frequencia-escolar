const express = require('express');
const router = express.Router();
const Aluno = require('../models/Aluno');
const auth = require('../middlewares/authMiddleware'); // Importa a nossa trava de segurança

// Rota de teste que você já tinha
router.get('/teste', (req, res) => {
    res.json({ msg: "Rota de frequência funcionando perfeitamente! 🏫" });
});

// 1. Rota para Cadastrar Aluno (POST /api/frequencia/alunos)
// Protegida por token (apenas usuários logados podem cadastrar)
router.post('/alunos', auth, async (req, res) => {
    try {
        const { nome, turma } = req.body;

        if (!nome || !turma) {
            return res.status(400).json({ erro: 'Nome e turma são obrigatórios.' });
        }

        const novoAluno = new Aluno({
            nome,
            turma
        });

        await novoAluno.save();
        res.status(201).json({ mensagem: 'Aluno cadastrado com sucesso! 🎒', aluno: novoAluno });

    } catch (error) {
        res.status(500).json({ erro: 'Erro ao cadastrar aluno', detalhes: error.message });
    }
});

// 2. Rota para Listar Alunos Ativos de uma Turma (GET /api/frequencia/alunos/:turma)
// O tablet vai disparar isso escolhendo a turma (Ex: /api/frequencia/alunos/1º Ano A)
router.get('/alunos/:turma', auth, async (req, res) => {
    try {
        const turmaSelecionada = req.params.turma;

        // Busca apenas alunos daquela turma E que estejam ativos no sistema
        const alunos = await Aluno.find({ turma: turmaSelecionada, ativo: true }).sort({ nome: 1 }); // sort(1) organiza em ordem alfabética de A-Z

        res.json(alunos);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar alunos da turma', detalhes: error.message });
    }
});

module.exports = router;
