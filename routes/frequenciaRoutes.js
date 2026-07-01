const express = require('express');
const router = express.Router();
const Aluno = require('../models/Aluno');
const Frequencia = require('../models/Frequencia');
const auth = require('../middlewares/authMiddleware');

// Rota de teste
router.get('/teste', (req, res) => {
    res.json({ msg: "Rota de frequência funcionando perfeitamente! 🏫" });
});

// 1. Cadastrar Aluno (POST /api/frequencia/alunos)
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

// 2. Listar Alunos de uma Turma (GET /api/frequencia/alunos/:turma)
router.get('/alunos/:turma', auth, async (req, res) => {
    try {
        const alunos = await Aluno.find({ turma: req.params.turma, ativo: true }).sort({ nome: 1 });
        res.json(alunos);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar alunos', detalhes: error.message });
    }
});

// 3. Salvar Chamada do Dia (POST /api/frequencia/lancar)
router.post('/lancar', auth, async (req, res) => {
    try {
        const { listaFrequencia } = req.body;

        if (!listaFrequencia || !Array.isArray(listaFrequencia) || listaFrequencia.length === 0) {
            return res.status(400).json({ erro: 'Nenhum dado de frequência enviado ou formato inválido.' });
        }

        const chamadasFormatadas = listaFrequencia.map(item => ({
            ...item,
            registrado_por: req.usuario.nome || 'Biblioteca'
        }));

        await Frequencia.insertMany(chamadasFormatadas, { ordered: false });
        res.status(201).json({ mensagem: 'Chamada registrada com sucesso! 📝✅' });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(201).json({ 
                mensagem: 'Chamada processada. Alguns registros já haviam sido lançados hoje e foram ignorados para evitar duplicidade.' 
            });
        }
        res.status(500).json({ erro: 'Erro ao salvar a chamada no servidor', detalhes: error.message });
    }
});

// 🔥 4. Atualizar/Transferir/Remover Aluno (PUT /api/frequencia/alunos/:id)
// Rota protegida para atualizar os dados do aluno de forma flexível usando findByIdAndUpdate
router.put('/alunos/:id', auth, async (req, res) => {
    try {
        const idAluno = req.params.id;
        const dadosAtualizados = req.body;

        // { new: true } faz o Mongoose retornar o aluno já com as modificações aplicadas
        const alunoModificado = await Aluno.findByIdAndUpdate(idAluno, dadosAtualizados, { new: true });

        if (!alunoModificado) {
            return res.status(404).json({ erro: 'Aluno não encontrado no sistema.' });
        }

        res.json({ mensagem: 'Aluno atualizado com sucesso! 🔄', aluno: alunoModificado });

    } catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar dados do aluno', detalhes: error.message });
    }
});

module.exports = router;
