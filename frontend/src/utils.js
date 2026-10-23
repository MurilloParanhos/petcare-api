// Deixa o texto sem acento e minusculo, para a busca achar "Patricia" digitando "patrícia"
export function normalizar(texto) {
    return (texto ?? '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
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
