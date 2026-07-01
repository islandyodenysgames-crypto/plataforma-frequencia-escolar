require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importação das rotas
const frequenciaRoutes = require('./routes/frequenciaRoutes');
const authRoutes = require('./routes/authRoutes'); // <-- ADICIONADO: Importando suas rotas de login/cadastro

const app = express();

// Configuração de Middlewares
app.use(cors());
app.use(express.json());

// Forçamos a porta a escutar process.env.PORT (que será a 8080 definida no Railway)
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

// Rota de teste inicial para o navegador
app.get('/', (req, res) => {
    res.send('API da Plataforma de Frequência Escolar está ONLINE! 🚀');
});

// Vinculando as rotas do sistema
app.use('/api/frequencia', frequenciaRoutes);
app.use('/api/auth', authRoutes); // <-- ADICIONADO: Ativando as rotas de autenticação sob o prefixo /api/auth

// Conexão com o Banco de Dados e Inicialização do Servidor
if (!MONGO_URI) {
    console.error('❌ ERRO: A variável MONGO_URI não foi definida no ambiente.');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Conexão com o MongoDB Atlas estabelecida com sucesso!');
        
        // O '0.0.0.0' diz ao Node para aceitar conexões vindas da internet pública do Railway
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor rodando com sucesso na porta ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Erro ao conectar ao MongoDB Atlas:', error.message);
    });
