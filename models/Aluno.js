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
        trim: true,
        index: true // Otimiza a velocidade de busca do banco de dados ao gerar relatórios e rankings por turma
    },
    ativo: {
        type: Boolean,
        default: true // Para o caso de um aluno ser transferido, apenas desativamos para não perder o histórico
    }
}, { timestamps: true }); // Cria automaticamente os campos createdAt e updatedAt no MongoDB

module.exports = mongoose.model('Aluno', AlunoSchema);
