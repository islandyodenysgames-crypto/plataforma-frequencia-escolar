const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Certifique-se de que o caminho do seu middleware está correto
const Aluno = require('../models/Aluno');
const Turma = require('../models/Turma');
const Frequencia = require('../models/Frequencia');

// 🏫 ROTAS DE TURMAS

// Buscar todas as turmas
router.get('/turmas', auth, async (req, res) => {
    try {
        const turmas = await Turma.find().sort({ nome: 1 });
        res.json(turmas);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar turmas.' });
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
        res.status(201).json(novaTurma);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao salvar turma.' });
    }
});

// Deletar turma
router.delete('/turmas/:id', auth, async (req, res) => {
    try {
        await Turma.findByIdAndDelete(req.params.id);
        res.json({ mensagem: 'Turma removida com sucesso.' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar turma.' });
    }
});


// 🎒 ROTAS DE ALUNOS

// Buscar alunos ativos de uma turma específica
router.get('/alunos/:turma', auth, async (req, res) => {
    try {
        const alunos = await Aluno.find({ turma: req.params.turma, ativo: true }).sort({ nome: 1 });
        res.json(alunos);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar alunos.' });
    }
});

// Cadastrar novo aluno
router.post('/alunos', auth, async (req, res) => {
    try {
        const { nome, turma } = req.body;
        if (!nome || !turma) return res.status(400).json({ erro: 'Nome e turma são obrigatórios.' });

        const novoAluno = new Aluno({ nome, turma, ativo: true });
        await novoAluno.save();
        res.status(201).json(novoAluno);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao cadastrar aluno.' });
    }
});

// Atualizar dados do aluno (Transferência ou Remoção/Desativação)
router.put('/alunos/:id', auth, async (req, res) => {
    try {
        const dadosAtualizados = req.body;
        const aluno = await Aluno.findByIdAndUpdate(req.params.id, dadosAtualizados, { new: true });
        if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });
        res.json(aluno);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar dados do aluno.' });
    }
});


// 🚀 ROTAS DE LANÇAMENTO DE FREQUÊNCIA

// Lançar ou atualizar chamada no banco (sobrescreve se já existir para o mesmo aluno na mesma data)
router.post('/lancar', auth, async (req, res) => {
    try {
        const { listaFrequencia } = req.body;
        if (!listaFrequencia || !Array.isArray(listaFrequencia)) {
            return res.status(400).json({ erro: 'Dados inválidos ou lista vazia.' });
        }

        // Executa uma operação de atualização/inserção (upsert) para cada aluno da lista
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

// 🔍 NOVO: Buscar histórico de chamada realizada em determinada data e turma
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

module.exports = router;
