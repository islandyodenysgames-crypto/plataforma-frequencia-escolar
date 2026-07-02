const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware'); // Middleware unificado e correto
const Aluno = require('../models/Aluno');
const Turma = require('../models/Turma');
const Frequencia = require('../models/Frequencia');

// ==========================================
// 🏫 ROTAS DE TURMAS
// ==========================================

// Buscar todas as turmas
router.get('/turmas', auth, async (req, res) => {
    try {
        const turmas = await Turma.find().sort({ nome: 1 });
        res.json(turmas);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar turmas.', detalhes: error.message });
    }
});

// Cadastrar nova turma
router.post('/turmas', auth, async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).json({ erro: 'O nome da turma é obrigatório.' });

        let turmaExiste = await Turma.findOne({ nome });
        if (turmaExiste) return res.status(400).json({ erro: 'Esta turma já está cadastrada.' });

        const novaTurma = new Turma({ nome });
        await novaTurma.save();
        res.status(201).json({ mensagem: 'Turma cadastrada com sucesso! 🏫', turma: novaTurma });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao cadastrar turma.', detalhes: error.message });
    }
});

// Deletar turma
router.delete('/turmas/:id', auth, async (req, res) => {
    try {
        const turmaDeletada = await Turma.findByIdAndDelete(req.params.id);
        if (!turmaDeletada) return res.status(404).json({ erro: 'Turma não encontrada.' });
        res.json({ mensagem: 'Turma removida com sucesso! 🗑️' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao deletar turma.', detalhes: error.message });
    }
});

// ==========================================
// 🎒 ROTAS DE ALUNOS
// ==========================================

// Buscar alunos ativos de uma turma específica
router.get('/alunos/:turma', auth, async (req, res) => {
    try {
        const alunos = await Aluno.find({ turma: req.params.turma, ativo: true }).sort({ nome: 1 });
        res.json(alunos);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar alunos.', detalhes: error.message });
    }
});

// Cadastrar novo aluno
router.post('/alunos', auth, async (req, res) => {
    try {
        const { nome, turma } = req.body;
        if (!nome || !turma) return res.status(400).json({ erro: 'Nome e turma são obrigatórios.' });

        const novoAluno = new Aluno({ nome, turma, ativo: true });
        await novoAluno.save();
        res.status(201).json({ mensagem: 'Aluno cadastrado com sucesso! 🎒', aluno: novoAluno });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao cadastrar aluno.', detalhes: error.message });
    }
});

// Atualizar dados do aluno (Transferência, Edição ou Desativação)
router.put('/alunos/:id', auth, async (req, res) => {
    try {
        const dadosAtualizados = req.body;
        const aluno = await Aluno.findByIdAndUpdate(req.params.id, dadosAtualizados, { new: true });
        if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });
        res.json({ margin: 'Aluno updated com sucesso! 🔄', aluno });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar dados do aluno.', detalhes: error.message });
    }
});

// ==========================================
// 🚀 ROTAS DE LANÇAMENTO E HISTÓRICO DE FREQUÊNCIA
// ==========================================

// Lançar ou atualizar chamada no banco (sobrescreve registros existentes na mesma data/aluno através do upsert)
router.post('/lancar', auth, async (req, res) => {
    try {
        const { listaFrequencia } = req.body;
        if (!listaFrequencia || !Array.isArray(listaFrequencia) || listaFrequencia.length === 0) {
            return res.status(400).json({ erro: 'Dados inválidos ou lista de frequência vazia.' });
        }

        // Executa uma operação de atualização/inserção (upsert) individual para cada aluno da lista
        const promessas = listaFrequencia.map(registro => {
            return Frequencia.findOneAndUpdate(
                { aluno_id: registro.aluno_id, data: registro.data },
                registro,
                { upsert: true, new: true }
            );
        });

        await Promise.all(promessas);
        res.json({ mensagem: '✅ Chamada salva e atualizada com sucesso no banco!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao salvar chamada no banco.', detalhes: error.message });
    }
});

// 🔍 Buscar histórico de chamada realizada em determinada data e turma
router.get('/historico/:turma/:data', auth, async (req, res) => {
    try {
        const { turma, data } = req.params;

        // Procura todos os registros correspondentes à turma e data informadas
        const registros = await Frequencia.find({ turma, data });
        res.json(registros);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar histórico de chamada.', detalhes: error.message });
    }
});

// 📅 NOVO: Buscar apenas as datas únicas que já possuem chamada para uma turma específica
router.get('/datas-concluidas/:turma', auth, async (req, res) => {
    try {
        const { turma } = req.params;

        // O método .distinct() filtra e traz apenas os valores únicos do campo 'data'
        const datasUnicas = await Frequencia.distinct('data', { turma });
        
        // Ordena as datas para que as mais recentes apareçam primeiro na lista de botões
        datasUnicas.sort((a, b) => new Date(b) - new Date(a));

        res.json(datasUnicas);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar datas concluídas.', detalhes: error.message });
    }
});

module.exports = router;
