const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');


const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidos na porta: ${port}`);
});


const JWT_SECRET = 'MargarethTatchere100%sexy'; //:)


const users = [
    { "username": "user", "password": "123456", "id": 123, "email": "user@dominio.com", "perfil": "user" },
    { "username": "admin", "password": "123456789", "id": 124, "email": "admin@dominio.com", "perfil": "admin" },
    { "username": "colab", "password": "123", "id": 125, "email": "colab@dominio.com", "perfil": "user" },
];


app.post('/api/auth/login', [
    check('username').isString(),
    check('password').isString()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const userData = doLogin(username, password);

    if (userData) {

        const token = jwt.sign({ id: userData.id, perfil: userData.perfil }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token });
    } else {
        return res.status(401).json({ message: 'Credenciais inválidas' });
    }
});


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ message: 'Token não fornecido' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token inválido' });
        req.user = user;
        next();
    });
}


app.get('/api/users', authenticateToken, (req, res) => {
    if (req.user.perfil !== 'admin') {
        return res.status(403).json({ message: 'Acesso não autorizado' });
    } else {
        return res.status(200).json({ data: users });
    }
});


app.get('/api/user/me', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (user) {
        return res.status(200).json({ data: user });
    } else {
        return res.status(404).json({ message: 'Usuário não encontrado' });
    }
});


app.get('/api/contracts/:empresa/:inicio', [
    check('empresa').isString(),
    check('inicio').isISO8601()
], authenticateToken, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const empresa = req.params.empresa;
    const dtInicio = req.params.inicio;

    const result = getContracts(empresa, dtInicio);
    if (result && req.user.perfil === 'admin') {
        return res.status(200).json({ data: result });
    } else {
        return res.status(404).json({ message: 'Dados não encontrados ou acesso não autorizado' });
    }
});



function doLogin(username, password) {
    return users.find(user => user.username === username && user.password === password);
}


class Repository {
    execute(query, params) {

        return []; 
    }
}

function getContracts(empresa, inicio) {
    const repository = new Repository();
    const query = 'SELECT * FROM contracts WHERE empresa = ? AND data_inicio = ?';
    const result = repository.execute(query, [empresa, inicio]);
    return result;
}
