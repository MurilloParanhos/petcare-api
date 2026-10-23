// Recebe o resultado de paginar() e a funcao que troca de pagina
function Paginacao({ paginacao, onTrocarPagina }) {
    const { itens, paginaAtual, totalPaginas, inicio, total } = paginacao;

    if (total === 0) return null;

    return (
        <div className="paginacao">
            <span>
                Mostrando {inicio + 1}–{inicio + itens.length} de {total}
            </span>
            <div>
                <button disabled={paginaAtual === 1} onClick={() => onTrocarPagina(paginaAtual - 1)}>
                    Anterior
                </button>
                <span>Página {paginaAtual} de {totalPaginas}</span>
                <button disabled={paginaAtual === totalPaginas} onClick={() => onTrocarPagina(paginaAtual + 1)}>
                    Próxima
                </button>
            </div>
        </div>
    );
}

export default Paginacao;
