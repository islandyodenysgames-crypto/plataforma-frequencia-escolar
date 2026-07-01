require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importação das rotas
const frequenciaRoutes = require('./routes/frequenciaRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Configuração de Middlewares
app.use(cors());
app.use(express.json());

// Serve os arquivos estáticos da pasta "public"
app.use(express.static('public'));

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

// Vinculando as rotas do sistema
app.use('/api/frequencia', frequenciaRoutes);
app.use('/api/auth', authRoutes);

// Conexão com o Banco de Dados e Inicialização do Servidor
if (!MONGO_URI) {
    console.error('❌ ERRO: A variável MONGO_URI não foi definida no ambiente.');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Conexão com o MongoDB Atlas estabelecida com sucesso!');
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor rodando com sucesso na porta ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Erro ao conectar ao MongoDB Atlas:', error.message);
    });
