const mongoose = require('mongoose');

const TurmaSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        unique: true, // Impede turmas com nomes duplicados
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Turma', TurmaSchema);