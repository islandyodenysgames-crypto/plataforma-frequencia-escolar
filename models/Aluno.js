const mongoose = require('mongoose');

const AlunoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
    turma: {
        type: String,
        required: true, // Ex: "1º Ano A", "2º Ano B"
        trim: true
    },
    ativo: {
        type: Boolean,
        default: true // Para o caso de um aluno ser transferido, apenas desativamos
    }
}, { timestamps: true }); // Cria automaticamente a data de cadastro e atualização

module.exports = mongoose.model('Aluno', AlunoSchema);