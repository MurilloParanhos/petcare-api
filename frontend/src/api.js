// Le os dados do usuario que vem dentro do token ({ id, nome }).
// O meio do JWT e so um JSON em base64, qualquer um consegue ler; a
// seguranca esta na assinatura, que so o servidor confere.
export function usuarioLogado() {
    try {
        const conteudo = localStorage.getItem('token').split('.')[1];
        const base64 = conteudo.replace(/-/g, '+').replace(/_/g, '/');
        const bytes = Uint8Array.from(atob(base64), (letra) => letra.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        return null;
    }
}

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
