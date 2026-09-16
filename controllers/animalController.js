const pool = require ('../config/db');

async function criarAnimal(req,res){
    const {nome, especie, raca, idade, cliente_id} = req.body;

    try {
        const resultado = await pool.query(
          'INSERT INTO animais (nome, especie, raca, idade, cliente_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [nome, especie, raca, idade, cliente_id]
       
    );
        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: ' Erro ao cadastrar o animal.'});

    }

}

async function listarAnimais(req, res) {
    const { cliente_id } = req.query;

    try {
        let resultado;

        if (cliente_id) {
            resultado = await pool.query('SELECT * FROM animais WHERE cliente_id = $1 ORDER BY id', [cliente_id]);
        } else {
            resultado = await pool.query('SELECT * FROM animais ORDER BY id');
        }

        res.json(resultado.rows);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar animais.' });
    }
}

module.exports = { criarAnimal, listarAnimais};

  