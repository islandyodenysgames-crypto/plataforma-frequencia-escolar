const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Pegar o token que vem no cabeçalho (Header) da requisição
    const token = req.header('x-auth-token');

    // 2. Verificar se o token foi enviado
    if (!token) {
        return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    }

    try {
        // 3. Validar o token com a nossa chave secreta JWT_SECRET
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Adicionar os dados do usuário na requisição para que as rotas saibam quem está acessando
        req.usuario = decodificado;
        
        next(); // Autorizado! Vai para a rota seguinte
    } catch (error) {
        res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
};