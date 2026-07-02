const mongoose = require('mongoose');

const TurmaSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        unique: true, // Impede turmas com nomes duplicados
        trim: true
    },
    fotoUrl: {
        type: String,
        default: '' // Armazenará a URL da imagem da turma para o destaque de 1º lugar na TV
    }
}, { timestamps: true }); // Mantém o controle automático de data de criação e modificação

module.exports = mongoose.model('Turma', TurmaSchema);
