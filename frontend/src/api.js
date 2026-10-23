// Faz uma chamada para a API ja com o token e o JSON.
// Se der erro, lanca um Error com a mensagem que veio do servidor.
export async function api(url, { method = 'GET', body } = {}) {
    let resposta;

    try {
        resposta = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: body ? JSON.stringify(body) : undefined
        });
    } catch {
        throw new Error('Erro ao conectar com o servidor.');
    }

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro na requisição.');
    }

    return dados;
}
