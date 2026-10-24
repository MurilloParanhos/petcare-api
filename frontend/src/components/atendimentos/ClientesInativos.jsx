import { formatarTelefone } from '../../utils';

// Clientes sem atendimento ha mais de 60 dias, com atalho para agendar
function ClientesInativos({ inativos, onAgendar }) {
    return (
        <>
            <p className="subtitulo-inativos">Sem atendimento há mais de 60 dias.</p>
            <table>
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Telefone</th>
                        <th>Último Atendimento</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {inativos.map((cliente) => (
                        <tr key={cliente.id}>
                            <td>{cliente.nome}</td>
                            <td>{formatarTelefone(cliente.telefone) || '-'}</td>
                            <td>
                                {cliente.ultimo_atendimento
                                    ? new Date(cliente.ultimo_atendimento).toLocaleDateString('pt-BR')
                                    : 'Nunca atendido'}
                            </td>
                            <td>
                                <button className="btn-editar" onClick={() => onAgendar(cliente.id)}>Agendar</button>
                            </td>
                        </tr>
                    ))}
                    {inativos.length === 0 && (
                        <tr>
                            <td colSpan="4">Nenhum cliente inativo. 🎉</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </>
    );
}

export default ClientesInativos;
