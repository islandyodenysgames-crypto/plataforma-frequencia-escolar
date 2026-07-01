const express = require('express');
const router = express.Router();
const Aluno = require('../models/Aluno');
const Frequencia = require('../models/Frequencia');
const Turma = require('../models/Turma'); // <-- Importando o novo modelo
const auth = require('../middlewares/authMiddleware');

// === ROTAS DE TURMAS ===

// A. Listar Turmas (GET /api/frequencia/turmas)
router.get('/turmas', auth, async (req, res) => {
    try {
        const turmas = await Turma.find().sort({ nome: 1 });
        res.json(turmas);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar turmas', detalhes: error.message });
    }
});

// B. Cadastrar Turma (POST /api/frequencia/turmas)
router.post('/turmas', auth, async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).json({ erro: 'O nome da turma é obrigatório.' });

        const novaTurma = new Turma({ nome });
        await novaTurma.save();
        res.status(201).json({ mensagem: 'Turma cadastrada com sucesso! 🏫', turma: novaTurma });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ erro: 'Esta turma já está cadastrada.' });
        res.status(500).json({ erro: 'Erro ao cadastrar turma', detalhes: error.message });
    }
});

// C. Remover Turma (DELETE /api/frequencia/turmas/:id)
router.delete('/turmas/:id', auth, async (req, res) => {
    try {
        await Turma.findByIdAndDelete(req.params.id);
        res.json({ mensagem: 'Turma removida com sucesso! 🗑️' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao remover turma', detalhes: error.message });
    }
});


// === ROTAS DE ALUNOS ===

// 1. Cadastrar Aluno
router.post('/alunos', auth, async (req, res) => {
    try {
        const { nome, turma } = req.body;
        if (!nome || !turma) return res.status(400).json({ erro: 'Nome e turma são obrigatórios.' });

        const novoAluno = new Aluno({ nome, turma });
        await novoAluno.save();
        res.status(201).json({ mensagem: 'Aluno cadastrado com sucesso! 🎒', aluno: novoAluno });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao cadastrar aluno', detalhes: error.message });
    }
});

// 2. Listar Alunos de uma Turma
router.get('/alunos/:turma', auth, async (req, res) => {
    try {
        const alunos = await Aluno.find({ turma: req.params.turma, ativo: true }).sort({ nome: 1 });
        res.json(alunos);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar alunos', detalhes: error.message });
    }
});

// 3. Salvar Chamada do Dia
router.post('/lancar', auth, async (req, res) => {
    try {
        const { listaFrequencia } = req.body;
        if (!listaFrequencia || !Array.isArray(listaFrequencia) || listaFrequencia.length === 0) {
            return res.status(400).json({ erro: 'Nenhum dado de frequência enviado.' });
        }
        const chamadasFormatadas = listaFrequencia.map(item => ({
            ...item,
            registrado_por: req.usuario.nome || 'Biblioteca'
        }));
        await Frequencia.insertMany(chamadasFormatadas, { ordered: false });
        res.status(201).json({ mensagem: 'Chamada registrada com sucesso! 📝✅' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(201).json({ mensagem: 'Chamada processada. Registros duplicados ignorados.' });
        }
        res.status(500).json({ erro: 'Erro ao salvar a chamada', detalhes: error.message });
    }
});

// 4. Atualizar/Transferir/Remover Aluno
router.put('/alunos/:id', auth, async (req, res) => {
    try {
        const alunoModificado = await Aluno.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!alunoModificado) return res.status(404).json({ erro: 'Aluno não encontrado.' });
        res.json({ mensagem: 'Aluno atualizado com sucesso! 🔄', aluno: alunoModificado });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar aluno', detalhes: error.message });
    }
});

module.exports = router;
