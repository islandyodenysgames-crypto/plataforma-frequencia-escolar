const express = require('express');
const router = express.Router();
const Aluno = require('../models/Aluno');
const Frequencia = require('../models/Frequencia'); // <-- Importando o modelo de frequência
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
// O tablet vai enviar um array (lista) com as frequências de todos os alunos da turma de uma vez só
router.post('/lancar', auth, async (req, res) => {
    try {
        const { listaFrequencia } = req.body; // Espera uma lista/array de chamadas

        if (!listaFrequencia || !Array.isArray(listaFrequencia) || listaFrequencia.length === 0) {
            return res.status(400).json({ erro: 'Nenhum dado de frequência enviado ou formato inválido.' });
        }

        // Adiciona quem gravou a chamada com base no usuário logado no token
        const chamadasFormatadas = listaFrequencia.map(item => ({
            ...item,
            registrado_por: req.usuario.nome || 'Biblioteca' // Usando o nome vindo do token JWT
        }));

        // Salva todos os registros de uma vez só no banco de dados.
        // O "ordered: false" garante que se um aluno falhar (ex: duplicado), ele continua salvando os outros!
        await Frequencia.insertMany(chamadasFormatadas, { ordered: false });

        res.status(201).json({ mensagem: 'Chamada registrada com sucesso! 📝✅' });

    } catch (error) {
        // Se o erro for de índice duplicado (código 11000 del Mongoose)
        if (error.code === 11000) {
            return res.status(201).json({ 
                mensagem: 'Chamada processada. Alguns registros já haviam sido lançados hoje e foram ignorados para evitar duplicidade.' 
            });
        }
        res.status(500).json({ erro: 'Erro ao salvar a chamada no servidor', detalhes: error.message });
    }
});

module.exports = router;
