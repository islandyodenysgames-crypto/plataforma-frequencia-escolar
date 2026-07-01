const mongoose = require('mongoose');

const FrequenciaSchema = new mongoose.Schema({
    aluno_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Aluno', // Conecta diretamente com o modelo de Alunos
        required: true
    },
    turma: {
        type: String,
        required: true // Guardamos a turma aqui também para acelerar o cálculo do ranking
    },
    data: {
        type: Date,
        required: true // Data do dia da chamada (Ex: 2026-03-20)
    },
    houve_falta: {
        type: Boolean,
        default: false // Falso = Presente, Verdadeiro = Faltou
    },
    motivo_falta: {
        type: String,
        enum: ['NENHUM', 'DIRETA', 'JUSTIFICADA', 'ATESTADO', 'ONIBUS'],
        default: 'NENHUM'
    },
    registrado_por: {
        type: String, 
        default: 'Biblioteca' // Mais para frente mudaremos para o ID do usuário logado
    }
}, { timestamps: true });

// Criamos um índice único para garantir que não haja duas chamadas para o mesmo aluno no mesmo dia
FrequenciaSchema.index({ aluno_id: 1, data: 1 }, { unique: true });

module.exports = mongoose.model('Frequencia', FrequenciaSchema);