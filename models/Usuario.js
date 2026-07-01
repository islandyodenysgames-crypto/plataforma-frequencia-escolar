const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    login: {
        type: String,
        required: true,
        unique: true, // Não permite dois usuários com o mesmo login
        trim: true
    },
    senha: {
        type: String,
        required: true
    },
    perfil: {
        type: String,
        enum: ['ADMIN', 'OPERADOR'], // ADMIN pode tudo, OPERADOR (biblioteca) só lança chamada
        default: 'OPERADOR'
    }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', UsuarioSchema);