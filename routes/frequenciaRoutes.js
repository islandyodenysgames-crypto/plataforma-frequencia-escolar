const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
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
        res.status(500).json({ erro: error.message });
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
        res.status(500).json({ erro: error.message });
    }
});

// Deletar turma
router.delete('/turmas/:id', auth, async (req, res) => {
    try {
        const turmaDeletada = await Turma.findByIdAndDelete(req.params.id);
        if (!turmaDeletada) return res.status(404).json({ erro: 'Turma não encontrada.' });
        res.json({ mensagem: 'Turma removida com sucesso! 🗑️' });
    } catch (error) {
        res.status(500).json({ erro: error.message });
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
        res.status(500).json({ erro: error.message });
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
        res.status(500).json({ erro: error.message });
    }
});

// Atualizar dados do aluno (Transferência, Edição ou Desativação)
router.put('/alunos/:id', auth, async (req, res) => {
    try {
        const dadosAtualizados = req.body;
        const aluno = await Aluno.findByIdAndUpdate(req.params.id, dadosAtualizados, { new: true });
        if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });
        res.json({ mensagem: 'Aluno atualizado com sucesso! 🔄', aluno });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// ==========================================
// 🚀 ROTAS DE LANÇAMENTO E HISTÓRICO DE FREQUÊNCIA
// ==========================================

// Lançar ou atualizar chamada no banco
router.post('/lancar', auth, async (req, res) => {
    try {
        const { listaFrequencia } = req.body;
        if (!listaFrequencia || !Array.isArray(listaFrequencia) || listaFrequencia.length === 0) {
            return res.status(400).json({ erro: 'Dados inválidos ou lista de frequência vazia.' });
        }

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
        res.status(500).json({ erro: error.message });
    }
});

// Buscar histórico de chamada realizada em determinada data e turma
router.get('/historico/:turma/:data', auth, async (req, res) => {
    try {
        const { turma, data } = req.params;
        const registros = await Frequencia.find({ turma, data });
        res.json(registros);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Buscar apenas as datas únicas que já possuem chamada para uma turma específica
router.get('/datas-concluidas/:turma', auth, async (req, res) => {
    try {
        const { turma } = req.params;
        const registros = await Frequencia.find({ turma }, 'data');
        
        const datasTratadas = registros.map(reg => {
            if (!reg.data) return null;
            const dataString = reg.data instanceof Date ? reg.data.toISOString() : String(reg.data);
            return dataString.split('T')[0];
        }).filter(Boolean);

        const datasUnicas = [...new Set(datasTratadas)].sort((a, b) => new Date(b) - new Date(a));
        res.json(datasUnicas);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Deletar todos os registros de chamada de uma data e turma específicas
router.delete('/deletar-chamada/:turma/:data', auth, async (req, res) => {
    try {
        const { turma, data } = req.params;
        
        const resultado = await Frequencia.deleteMany({ turma, data });
        
        if (resultado.deletedCount === 0) {
            return res.status(404).json({ erro: 'Nenhum registro encontrado para exclusão.' });
        }
        
        res.json({ mensagem: `🗑️ Chamada do dia ${data.split('-').reverse().join('/')} excluída com sucesso!` });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// 📊 GERAR RELATÓRIO ESTATÍSTICO DA TURMA FILTRADO POR MÊS/ANO
router.get('/relatorio/:turma/:anoMes', auth, async (req, res) => {
    try {
        const { turma, anoMes } = req.params;
        
        const [ano, mes] = anoMes.split('-').map(Number);
        
        const dataInicio = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0));
        const dataFim = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

        // 1. Busca alunos ativos
        const alunos = await Aluno.find({ turma, ativo: true }).sort({ nome: 1 });
        
        // 2. Busca registros do mês de forma simplificada
        const registros = await Frequencia.find({
            turma,
            $or: [
                { data: { $gte: dataInicio, $lte: dataFim } },
                { data: { $gte: `${anoMes}-01`, $lte: `${anoMes}-31` } }
            ]
        });

        // 3. Mapeia e calcula as estatísticas
        const relatorio = alunos.map(aluno => {
            const idString = aluno._id.toString();
            
            const chamadasAluno = registros.filter(r => {
                const rAlunoId = r.aluno_id ? r.aluno_id.toString() : '';
                return rAlunoId === idString;
            });
            
            const totalDias = chamadasAluno.length;
            const totalFaltas = chamadasAluno.filter(r => r.houve_falta === true).length;
            const totalPresencas = totalDias - totalFaltas;
            
            const percentualPresenca = totalDias > 0 
                ? Math.round((totalPresencas / totalDias) * 100) 
                : 100;

            const motivos = { DIRETA: 0, JUSTIFICADA: 0, ATESTADO: 0, ONIBUS: 0 };
            
            chamadasAluno.forEach(r => {
                if (r.houve_falta && r.motivo_falta) {
                    const motivoChave = r.motivo_falta.toString().toUpperCase();
                    if (motivos[motivoChave] !== undefined) {
                        motivos[motivoChave]++;
                    }
                }
            });

            return {
                aluno_id: idString,
                nome: aluno.nome,
                totalDias,
                totalPresencas,
                totalFaltas,
                percentualPresenca,
                motivosDetails: motivos
            };
        });

        res.json(relatorio);
    } catch (error) {
        // Retorna a mensagem de erro original do JavaScript/Mongoose para sabermos o ponto exato da quebra
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;
