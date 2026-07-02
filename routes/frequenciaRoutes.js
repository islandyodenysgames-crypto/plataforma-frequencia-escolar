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

// Aktualizar foto da turma (Exige autenticação do professor)
router.put('/turmas/foto/:id', auth, async (req, res) => {
    try {
        const { fotoUrl } = req.body;
        const turma = await Turma.findByIdAndUpdate(req.params.id, { fotoUrl }, { new: true });
        if (!turma) return res.status(404).json({ erro: 'Turma não encontrada.' });
        res.json({ mensagem: 'Foto da turma updated com sucesso! 📸', turma });
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

        const novaAluno = new Aluno({ nome, turma, ativo: true });
        await novaAluno.save();
        res.status(201).json({ mensagem: 'Aluno cadastrado com sucesso! 🎒', aluno: novaAluno });
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
        res.json({ message: '✅ Chamada salva e atualizada com sucesso no banco!' });
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

// 📊 GERAR RELATÓRIO ESTATÍSTICO DA TURMA POR INTERVALO DE DIAS PERSONALIZADO
router.get('/relatorio/:turma/:dataInicio/:dataFim', auth, async (req, res) => {
    try {
        const { turma, dataInicio, dataFim } = req.params;
        
        const [anoI, mesI, diaI] = dataInicio.split('-').map(Number);
        const [anoF, mesF, diaF] = dataFim.split('-').map(Number);
        
        const deData = new Date(Date.UTC(anoI, mesI - 1, diaI, 0, 0, 0));
        const ateData = new Date(Date.UTC(anoF, mesF - 1, diaF, 23, 59, 59, 999));

        const alunos = await Aluno.find({ turma, ativo: true }).sort({ nome: 1 });
        
        const registros = await Frequencia.find({
            turma,
            $or: [
                { data: { $gte: deData, $lte: ateData } },
                { data: { $gte: dataInicio, $lte: dataFim } }
            ]
        });

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
        res.status(500).json({ erro: error.message });
    }
});

// ==========================================
// 🏆🏆 RANKING DIÁRIO RETIFICADO (TV + DASHBOARD) 🏆🏆
// ==========================================
router.get('/ranking-diario/:data', async (req, res) => {
    try {
        const { data } = req.params;

        const turmas = await Turma.find().sort({ nome: 1 });
        const registrosDia = await Frequencia.find({ data });

        // 🔥 CRITICAL FIX: Se o dia ainda não tiver NENHUMA chamada feita no banco de dados,
        // não retornamos mais o array vazio []. Em vez disso, montamos a lista inicial com 0% 
        // para manter as fotos ativas e impedir o front-end do Dashboard de colapsar no catch.
        const promessasRanking = turmas.map(async (turma) => {
            const totalAlunosTurma = await Aluno.countDocuments({ turma: turma.nome, ativo: true });
            
            if (totalAlunosTurma === 0) return null;

            const chamadasDaTurma = registrosDia.filter(r => r.turma === turma.nome);

            // Caso não haja chamada feita para esta turma específica (ou para nenhuma no dia)
            if (chamadasDaTurma.length === 0) {
                return {
                    turma: turma.nome,
                    totalAlunos: totalAlunosTurma,
                    faltasDiretas: 0,
                    totalFaltas: 0,
                    faltasJustificadas: 0,
                    aproveitamento: 0,
                    porcentagem: 0, 
                    fotoUrl: turma.fotoUrl || '' // Envia a foto mesmo com o dia zerado
                };
            }

            // Caso existam chamadas, computa as penalidades por faltas diretas
            const faltasPenalizadas = chamadasDaTurma.filter(r => {
                if (r.houve_falta === true) {
                    const motivo = r.motivo_falta ? r.motivo_falta.toString().toUpperCase() : 'DIRETA';
                    return motivo === 'DIRETA'; 
                }
                return false;
            }).length;

            const totalFaltasGerais = chamadasDaTurma.filter(r => r.houve_falta === true).length;
            const faltasJustificadas = chamadasDaTurma.filter(
                r => r.houve_falta === true && r.motivo_falta !== 'DIRETA' && r.motivo_falta !== 'NENHUM'
            ).length;

            const alunosPresentesVirtuais = totalAlunosTurma - faltasPenalizadas;
            const indicePresenca = Math.round((alunosPresentesVirtuais / totalAlunosTurma) * 100);

            return {
                turma: turma.nome,
                totalAlunos: totalAlunosTurma,
                faltasDiretas: faltasPenalizadas,
                totalFaltas: totalFaltasGerais,
                faltasJustificadas: faltasJustificadas,
                aproveitamento: Math.max(0, indicePresenca),
                porcentagem: Math.max(0, indicePresenca),
                fotoUrl: turma.fotoUrl || ''
            };
        });

        const resultadoBruto = await Promise.all(promessasRanking);
        
        const rankingOrdenado = resultadoBruto
            .filter(item => item !== null)
            .sort((a, b) => b.aproveitamento - a.aproveitamento);

        res.json(rankingOrdenado);
    } catch (error) {
        res.status(500).json({ erro: 'Erro interno ao computar ranking diário.', detalhes: error.message });
    }
});

module.exports = router;
