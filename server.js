require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Importação das rotas
const frequenciaRoutes = require('./routes/frequenciaRoutes');

const app = express();

// Configuração de Middlewares
app.use(cors());
app.use(express.json());

// Definição da Porta (Dinâmica para a nuvem ou 5000 para local)
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Rota de teste inicial para o navegador
app.get('/', (req, res) => {
    res.send('API da Plataforma de Frequência Escolar está ONLINE! 🚀');
});

// Vinculando as rotas do sistema
app.use('/api/frequencia', frequenciaRoutes);

// Conexão com o Banco de Dados e Inicialização do Servidor
if (!MONGO_URI) {
    console.error('❌ ERRO: A variável MONGO_URI não foi definida no ambiente.');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Conexão com o MongoDB Atlas estabelecida com sucesso!');
        
        // O '0.0.0.0' obriga o servidor a escutar a rede pública da nuvem, resolvendo o erro 502
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor rodando com sucesso na porta ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Erro ao conectar ao MongoDB Atlas:', error.message);
    });
