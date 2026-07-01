const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Importar as rotas
const testeRoutes = require('./routes/testeRoutes');
const authRoutes = require('./routes/authRoutes');
const frequenciaRoutes = require('./routes/frequenciaRoutes'); // <-- Nova Linha

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de teste inicial
app.get('/', (req, res) => {
    res.send('API da Plataforma de Frequência Escolar está ONLINE! 🚀');
});

// Registrar as rotas no Express
app.use('/api/teste', testeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/frequencia', frequenciaRoutes); // <-- Nova Linha

// Conexão com o MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Conexão com o MongoDB Atlas estabelecida com sucesso!');
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando com sucesso na porta ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Erro ao conectar ao MongoDB Atlas:', error.message);
    });