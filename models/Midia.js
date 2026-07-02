const mongoose = require('mongoose');

const MidiaSchema = new mongoose.Schema({
    tipo: { 
        type: String, 
        required: true, 
        enum: ['imagem', 'video', 'musica'] 
    },
    titulo: { type: String, required: true },
    url: { type: String, required: true }, // Link do PNG, MP4, YouTube, ou MP3
    duracao: { type: Number, default: 15 }, // Tempo em segundos (relevante para imagens)
    ativo: { type: Boolean, default: true },
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Midia', MidiaSchema);