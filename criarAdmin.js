require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./models/Usuario'); // Caminho para o seu modelo atual

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ Erro: MONGO_URI não encontrada nas variáveis de ambiente.');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Conectado ao MongoDB para criar o Admin...');

        // Dados do seu primeiro usuário (mude se quiser)
        const loginAdmin = 'admin_carminha';
        const senhaPlana = 'carminha2026'; // Escolha a senha que desejar

        // Verificar se já existe
        const existe = await Usuario.findOne({ login: loginAdmin });
        if (existe) {
            console.log(`⚠️ O usuário "${loginAdmin}" já existe no banco.`);
            process.exit(0);
        }

        // Criptografar a senha exatamente como sua rota faz
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senhaPlana, salt);

        // Criar o usuário seguindo o seu modelo exato
        const novoAdmin = new Usuario({
            nome: 'Administrador Carminha',
            login: loginAdmin,
            senha: senhaCriptografada,
            perfil: 'ADMIN'
        });

        await novoAdmin.save();
        console.log(`\n🚀 USUÁRIO CRIADO COM SUCESSO!`);
        console.log(`👤 Login: ${loginAdmin}`);
        console.log(`🔑 Senha: ${senhaPlana}`);
        console.log(`🛡️ Perfil: ADMIN\n`);

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Erro ao conectar ou salvar:', err);
        process.exit(1);
    });