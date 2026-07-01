const express = require('express');
const router = express.Router();
const Aluno = require('../models/Aluno');
const Frequencia = require('../models/Frequencia');

// 1. Rota para listar alunos de uma turma específica (GET /api/frequencia/turma/1º Ano A)
router.get('/turma/:nomeTurma', async (req, res) => {
    try {
        const { nomeTurma } = req.params;
        const alunos = await Aluno.find({ turma: nomeTurma, ativo: true }).sort({ nome: 1 });
        res.json(alunos);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar alunos da turma', detalhes: error.message });
    }
});

// 2. Rota para salvar ou atualizar a chamada do dia (POST /api/frequencia/salvar)
router.post('/salvar', async (req, res) => {
    try {
        const { data, registros } = req.body; 
        if (!data || !registros || !Array.isArray(registros)) {
            return res.status(400).json({ erro: 'Dados incompletos ou formato inválido' });
        }

        const dataFormatada = new Date(data);
        dataFormatada.setUTCHours(0,0,0,0);
        const operacoesSalvas = [];

        for (const reg of registros) {
            const filtro = { aluno_id: reg.aluno_id, data: dataFormatada };
            const atualizacao = {
                turma: reg.turma,
                houve_falta: reg.houve_falta,
                motivo_falta: reg.houve_falta ? reg.motivo_falta : 'NENHUM',
                registrado_por: 'Biblioteca' 
            };
            const resultado = await Frequencia.findOneAndUpdate(filtro, atualizacao, {
                new: true,
                upsert: true
            });
            operacoesSalvas.push(resultado);
        }
        res.json({ mensagem: 'Frequência diária salva com sucesso! 📝', totalRegistros: operacoesSalvas.length });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao salvar frequência', detalhes: error.message });
    }
});

// 3. ROTA DO RANKING DIÁRIO (GET /api/frequencia/ranking-diario?data=2026-03-20)
router.get('/ranking-diario', async (req, res) => {
    try {
        const { data } = req.query;
        if (!data) return res.status(400).json({ erro: 'Data é obrigatória' });

        const dataBusca = new Date(data);
        dataBusca.setUTCHours(0,0,0,0);

        // Busca todas as faltas registradas no dia
        const chamadasDoDia = await Frequencia.find({ data: dataBusca });
        const totalAlunosCadastrados = await Aluno.countDocuments({ ativo: true });

        // Agrupando os dados por turma
        const turmasDados = {};

        // Inicializa as turmas que sabemos que existem a partir dos alunos
        const listaAlunos = await Aluno.find({ ativo: true });
        listaAlunos.forEach(aluno => {
            if (!turmasDados[aluno.turma]) {
                turmasDados[aluno.turma] = { totalAlunos: 0, faltasPenalizadas: 0, totalFaltas: 0, presentes: 0 };
            }
            turmasDados[aluno.turma].totalAlunos += 1;
        });

        // Contabiliza as faltas do dia de acordo com as regras de descarte do Ranking
        chamadasDoDia.forEach(registro => {
            if (turmasDados[registro.turma] && registro.houve_falta) {
                turmasDados[registro.turma].totalFaltas += 1;
                
                // Se for falta DIRETA, conta para o Ranking Negativo. 
                // Se for Ônibus, Atestado ou Justificada, NÃO penaliza no ranking.
                if (registro.motivo_falta === 'DIRETA') {
                    turmasDados[registro.turma].faltasPenalizadas += 1;
                }
            }
        });

        // Calcula os presentes e o percentual de cada turma
        let totalEscolaPresentes = 0;
        const ranking = Object.keys(turmasDados).map(nomeTurma => {
            const t = turmasDados[nomeTurma];
            t.presentes = t.totalAlunos - t.totalFaltas;
            totalEscolaPresentes += t.presentes;

            const percentualPresenca = ((t.presentes / t.totalAlunos) * 100).toFixed(1);

            return {
                turma: nomeTurma,
                totalAlunos: t.totalAlunos,
                presentes: t.presentes,
                faltasBrutas: t.totalFaltas,
                faltasParaRanking: t.faltasPenalizadas, // Usado para ordenar
                percentualPresenca: parseFloat(percentualPresenca)
            };
        });

        // Ordena o Ranking: Quem tem MENOS faltas penalizadas fica em primeiro!
        ranking.sort((a, b) => a.faltasParaRanking - b.faltasParaRanking);

        // Resumo geral da escola para os cards grandes da TV
        const percentualGeralEscola = totalAlunosCadastrados > 0 
            ? ((totalEscolaPresentes / totalAlunosCadastrados) * 100).toFixed(1) 
            : 0;

        res.json({
            data: data,
            resumoEscola: {
                totalAlunos: totalAlunosCadastrados,
                totalPresentes: totalEscolaPresentes,
                percentualPresencaGeral: parseFloat(percentualGeralEscola)
            },
            ranking: ranking
        });

    } catch (error) {
        res.status(500).json({ erro: 'Erro ao gerar ranking', detalhes: error.message });
    }
});

// 4. ROTA DE CONSULTA DO PROFESSOR (GET /api/frequencia/relatorio-professor?turma=1º Ano A&dataInicio=2026-03-01&dataFim=2026-04-30)
router.get('/relatorio-professor', async (req, res) => {
    try {
        const { turma, dataInicio, dataFim } = req.query;
        if (!turma || !dataInicio || !dataFim) {
            return res.status(400).json({ erro: 'Parâmetros turma, dataInicio e dataFim são obrigatórios.' });
        }

        const inicio = new Date(dataInicio);
        inicio.setUTCHours(0,0,0,0);
        const fim = new Date(dataFim);
        fim.setUTCHours(23,59,59,999);

        // 1. Buscar todos os alunos daquela turma
        const alunos = await Aluno.find({ turma, ativo: true }).sort({ nome: 1 });

        // 2. Buscar o histórico de faltas no intervalo solicitado
        const historico = await Frequencia.find({
            turma,
            data: { $gte: inicio, $lte: fim }
        });

        // 3. Estruturar o relatório aluno por aluno
        const relatorio = alunos.map(aluno => {
            const registrosDoAluno = historico.filter(h => h.aluno_id.toString() === aluno._id.toString());
            
            const faltasDiretas = registrosDoAluno.filter(r => r.houve_falta && r.motivo_falta === 'DIRETA').length;
            const justificadas = registrosDoAluno.filter(r => r.houve_falta && r.motivo_falta === 'JUSTIFICADA').length;
            const atestados = registrosDoAluno.filter(r => r.houve_falta && r.motivo_falta === 'ATESTADO').length;
            const onibus = registrosDoAluno.filter(r => r.houve_falta && r.motivo_falta === 'ONIBUS').length;
            const totalFaltas = registrosDoAluno.filter(r => r.houve_falta).length;

            return {
                aluno_id: aluno._id,
                nome: aluno.nome,
                faltasBrutas: totalFaltas,
                detalheFaltas: {
                    diretaSemJustificativa: faltasDiretas,
                    justificada: justificadas,
                    atestado: atestados,
                    onibus: onibus
                }
            };
        });

        res.json({
            turma,
            periodo: { de: dataInicio, ate: dataFim },
            totalAlunosNaTurma: alunos.length,
            relatorio
        });

    } catch (error) {
        res.status(500).json({ erro: 'Erro ao gerar relatório de professor', detalhes: error.message });
    }
});

module.exports = router;