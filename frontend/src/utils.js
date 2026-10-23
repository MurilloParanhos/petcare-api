// Deixa o texto sem acento e minusculo, para a busca achar "Patricia" digitando "patrícia"
export function normalizar(texto) {
    return (texto ?? '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

export function somenteNumeros(texto) {
    return (texto ?? '').toString().replace(/\D/g, '');
}

// (12) 98888-7777 para celular, (12) 3333-4444 para fixo.
// Numero fora desses tamanhos aparece como foi salvo, para nao esconder o erro.
export function formatarTelefone(telefone) {
    const numeros = somenteNumeros(telefone);

    if (numeros.length === 11) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }
    if (numeros.length === 10) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    }
    return telefone ?? '';
}

// Mascara aplicada enquanto a pessoa digita no formulario
export function mascaraTelefone(texto) {
    const numeros = somenteNumeros(texto).slice(0, 11);

    if (numeros.length <= 2) return numeros.length ? `(${numeros}` : '';
    if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

export const POR_PAGINA = 10;

// Recorta a lista na pagina pedida. Se a pagina passou do fim
// (por exemplo depois de excluir um item), usa a ultima.
export function paginar(lista, pagina) {
    const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const inicio = (paginaAtual - 1) * POR_PAGINA;

    return {
        itens: lista.slice(inicio, inicio + POR_PAGINA),
        paginaAtual,
        totalPaginas,
        inicio,
        total: lista.length
    };
}
