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

// Serve os arquivos estáticos da pasta "public" (Onde ficam seus HTMLs, CSS e imagens)
app.use(express.static('public'));

// ==========================================
// 📺 MEMÓRIA DA PLAYLIST (CENTRAL DE MÍDIAS)
// ==========================================
// Criamos uma estrutura volátil para armazenar os itens da playlist temporariamente.
// Se preferir persistência pesada no futuro, pode mover para um Model do Mongoose.
let playlistCentralMidias = [
    { id: 1, tipo: 'video', titulo: 'Vídeo Educativo Institucional', url: 'https://www.w3schools.com/html/mov_bbb.mp4', tempoExibicao: 15 }
];

// Rota para buscar todos os itens da playlist
app.get('/api/playlist', (req, res) => {
    try {
        res.json(playlistCentralMidias);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar itens da playlist.' });
    }
});

// Rota para adicionar um novo item à playlist da TV
app.post('/api/playlist', (req, res) => {
    try {
        // CORREÇÃO: Adicionado tempoExibicao na desestruturação do corpo da requisição
        const { tipo, titulo, url, tempoExibicao } = req.body;
        
        if (!tipo || !titulo || !url) {
            return res.status(400).json({ erro: 'Tipo, título e URL são obrigatórios.' });
        }

        const novoItem = {
            id: Date.now(), // Gera um ID numérico único usando o timestamp atual
            tipo,
            titulo,
            url,
            // CORREÇÃO: Garante o salvamento do tempo vindo do front ou assume 15 segundos por padrão
            tempoExibicao: parseInt(tempoExibicao, 10) || 15
        };

        playlistCentralMidias.push(novoItem);
        res.status(201).json({ mensagem: 'Mídia adicionada à playlist com sucesso! 🎬', item: novoItem });
    } catch (error) {
        res.status(500).json({ erro: 'Erro interno ao salvar na playlist.' });
    }
});

// Rota para remover um item da playlist pelo ID
app.delete('/api/playlist/:id', (req, res) => {
    try {
        const idMidia = parseInt(req.params.id, 10);
        playlistCentralMidias = playlistCentralMidias.filter(item => item.id !== idMidia);
        res.json({ mensagem: 'Mídia removida da playlist com sucesso! 🗑️' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao remover item da playlist.' });
    }
});

// ==========================================
// 🔀 VINCULAÇÃO DAS ROTAS DO SISTEMA
// ==========================================
app.use('/api/frequencia', frequenciaRoutes);
app.use('/api/auth', authRoutes);

// Configurações de Porta e URI do Banco
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

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
