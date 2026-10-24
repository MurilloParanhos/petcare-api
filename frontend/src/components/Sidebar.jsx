import { usuarioLogado } from '../api';

const ABAS = [
    { id: 'resumo', nome: 'Dashboard', icone: 'fa-chart-pie' },
    { id: 'agenda', nome: 'Agenda', icone: 'fa-calendar-days' },
    { id: 'clientes', nome: 'Clientes', icone: 'fa-users' },
    { id: 'animais', nome: 'Animais', icone: 'fa-paw' },
    { id: 'atendimentos', nome: 'Atendimentos', icone: 'fa-calendar-check' },
    { id: 'servicos', nome: 'Serviços', icone: 'fa-tags' }
];

function Sidebar({ abaAtual, onTrocarAba, onSair, totalInativos }) {
    const nomeUsuario = usuarioLogado()?.nome ?? 'Usuário';

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span>PetCare</span>
                <i className="fa-solid fa-paw"></i>
            </div>

            <nav>
                <ul>
                    {ABAS.map((aba) => (
                        <li
                            key={aba.id}
                            className={aba.id === abaAtual ? 'ativo' : ''}
                            onClick={() => onTrocarAba(aba.id)}
                        >
                            <i className={`fa-solid ${aba.icone}`}></i>
                            {aba.nome}
                            {aba.id === 'atendimentos' && totalInativos > 0 && (
                                <span className="contador" title="Clientes inativos">{totalInativos}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-rodape">
                <div className="sidebar-usuario">
                    <span className="sidebar-avatar">{nomeUsuario.charAt(0).toUpperCase()}</span>
                    <span>{nomeUsuario}</span>
                </div>
                <button id="btnSair" onClick={onSair}>
                    <i className="fa-solid fa-right-from-bracket"></i>
                    Sair
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
