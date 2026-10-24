import Select from 'react-select';

// Mesmas cores e tamanho de fonte do calendario (CampoData)
const VERDE_ESCURO = '#1f3d2c';
const VERDE = '#2e5940';
const VERDE_CLARO = '#e6f4ea';

const estilos = {
    control: (base, { isFocused, isDisabled }) => ({
        ...base,
        minHeight: 36,
        minWidth: 180,
        fontSize: 14,
        borderRadius: 4,
        borderColor: isFocused ? VERDE : '#ccc',
        boxShadow: isFocused ? `0 0 0 1px ${VERDE}` : 'none',
        backgroundColor: isDisabled ? '#f3f3f3' : 'white',
        '&:hover': { borderColor: isFocused ? VERDE : '#999' }
    }),
    placeholder: (base) => ({ ...base, color: '#888' }),
    menu: (base) => ({
        ...base,
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
    }),
    menuList: (base) => ({ ...base, padding: 0 }),
    menuPortal: (base) => ({ ...base, zIndex: 1000 }),
    option: (base, { isSelected, isFocused }) => ({
        ...base,
        fontSize: 15,
        padding: '10px 12px',
        cursor: 'pointer',
        backgroundColor: isSelected ? VERDE : isFocused ? VERDE_CLARO : 'white',
        color: isSelected ? 'white' : VERDE_ESCURO,
        fontWeight: isSelected ? 'bold' : 'normal'
    }),
    noOptionsMessage: (base) => ({ ...base, fontSize: 14 })
};

// Lista de selecao no lugar do <select> do navegador, que nao deixa
// estilizar as opcoes. Da para digitar para buscar quando "buscavel".
// opcoes: [{ valor, rotulo }]. onChange recebe so o valor ('' quando vazio).
function CampoSelecao({
    id,
    valor,
    opcoes,
    onChange,
    placeholder = 'Selecione...',
    desabilitado = false,
    buscavel = true,
    semOpcoes = 'Nenhuma opção encontrada'
}) {
    const selecionada = opcoes.find((opcao) => String(opcao.valor) === String(valor)) ?? null;

    return (
        <Select
            inputId={id}
            className="campo-selecao"
            classNamePrefix="campo-selecao"
            value={selecionada}
            options={opcoes}
            getOptionLabel={(opcao) => opcao.rotulo}
            getOptionValue={(opcao) => String(opcao.valor)}
            onChange={(opcao) => onChange(opcao ? opcao.valor : '')}
            placeholder={placeholder}
            isDisabled={desabilitado}
            isSearchable={buscavel}
            noOptionsMessage={() => semOpcoes}
            styles={estilos}
            // Abre a lista no body, para nao ser cortada por tabelas e paineis
            menuPortalTarget={document.body}
        />
    );
}

export default CampoSelecao;
