import { useEffect, useState } from 'react';
import { useFormularioAtendimento } from '../hooks/useFormularioAtendimento';
import FormularioAtendimento from './atendimentos/FormularioAtendimento';
import TabelaAtendimentos from './atendimentos/TabelaAtendimentos';
import ClientesInativos from './atendimentos/ClientesInativos';

function subirAoTopo() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Aba Atendimentos: junta o formulario, a tabela e a lista de inativos,
// e recebe os pedidos que chegam da Agenda (agendar num horario ou editar).
function Atendimentos({
    atendimentos, inativos, clientes, animais, servicos, profissionais, recarregar,
    mudarStatus, preenchimento, onPreenchido
}) {
    const [subAba, setSubAba] = useState('atendimentos');
    const formulario = useFormularioAtendimento({ atendimentos, animais, servicos, profissionais, recarregar });

    // Vindo da Agenda:
    // - clique num horario livre: abre o formulario com data, hora e
    //   profissional ja escolhidos (falta so o cliente e o servico);
    // - botao Editar no detalhe: abre o atendimento para edicao.
    useEffect(() => {
        if (!preenchimento) return;
        const { editarId, ...dados } = preenchimento;
        const paraEditar = editarId && atendimentos.find((a) => a.id === editarId);

        setSubAba('atendimentos');
        if (paraEditar) {
            formulario.editar(paraEditar);
        } else {
            formulario.novoCom(dados);
        }
        subirAoTopo();
        onPreenchido();
    }, [preenchimento]);

    function editar(atendimento) {
        formulario.editar(atendimento);
        subirAoTopo();
    }

    // Botao "Agendar" da lista de inativos: abre o formulario com o cliente escolhido
    function agendar(clienteId) {
        formulario.novoCom({ cliente_id: clienteId });
        setSubAba('atendimentos');
        subirAoTopo();
    }

    return (
        <div>
            <h2>Atendimentos</h2>

            <div className="sub-abas">
                <button
                    className={subAba === 'atendimentos' ? 'ativo' : ''}
                    onClick={() => setSubAba('atendimentos')}
                >
                    Atendimentos
                </button>
                <button
                    className={subAba === 'inativos' ? 'ativo' : ''}
                    onClick={() => setSubAba('inativos')}
                >
                    Clientes inativos
                    {inativos.length > 0 && <span className="contador">{inativos.length}</span>}
                </button>
            </div>

            {subAba === 'atendimentos' && (
                <>
                    <FormularioAtendimento formulario={formulario} clientes={clientes} />
                    <TabelaAtendimentos
                        atendimentos={atendimentos}
                        clientes={clientes}
                        animais={animais}
                        servicos={servicos}
                        profissionais={profissionais}
                        onEditar={editar}
                        mudarStatus={mudarStatus}
                    />
                </>
            )}

            {subAba === 'inativos' && <ClientesInativos inativos={inativos} onAgendar={agendar} />}
        </div>
    );
}

export default Atendimentos;
