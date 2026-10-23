const ABAS = [
    { id: 'resumo', nome: 'Dashboard' },
    { id: 'clientes', nome: 'Clientes' },
    { id: 'animais', nome: 'Animais' },
    { id: 'atendimentos', nome: 'Atendimentos' }
];

function Sidebar({ abaAtual, onTrocarAba, onSair }) {
    return (
        <aside className="sidebar">
            <h2>🐾 PetCare</h2>
            <nav>
                <ul>
                    {ABAS.map((aba) => (
                        <li
                            key={aba.id}
                            className={aba.id === abaAtual ? 'ativo' : ''}
                            onClick={() => onTrocarAba(aba.id)}
                        >
                            {aba.nome}
                        </li>
                    ))}
                </ul>
            </nav>
            <button id="btnSair" onClick={onSair}>Sair</button>
        </aside>
    );
}

export default Sidebar;
