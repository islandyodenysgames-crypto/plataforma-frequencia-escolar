const express = require('express');
const router = express.Router();
const Midia = require('../models/Midia');
const auth = require('../middleware/auth'); // Seu middleware de login

// ➕ Cadastrar nova mídia (Biblioteca)
router.post('/', auth, async (req, res) => {
    try {
        const { tipo, titulo, url, duracao } = req.body;
        const novaMidia = new Midia({ tipo, titulo, url, duracao });
        await novaMidia.save();
        res.json({ msg: 'Mídia adicionada com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao salvar mídia.' });
    }
});

// 🗑️ Deletar mídia (Biblioteca)
router.delete('/:id', auth, async (req, res) => {
    try {
        await Midia.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Mídia removida!' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar mídia.' });
    }
});

// 🔓 Buscar mídias ativas (PÚBLICO - Para a TV ler)
router.get('/playlist', async (req, res) => {
    try {
        const playlist = await Midia.find({ ativo: true }).sort({ criadoEm: 1 });
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar playlist.' });
    }
});

module.exports = router;