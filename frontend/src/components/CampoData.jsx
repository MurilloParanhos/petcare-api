import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { dataISO } from '../agenda';

registerLocale('pt-BR', ptBR);

// Calendario em portugues no lugar do <input type="date"> do navegador,
// que nao deixa mudar o tamanho das letras. Recebe e devolve "2026-11-02".
function CampoData({ id, valor, onChange }) {
    // "2026-11-02" -> Date local (new Date("2026-11-02") seria meia-noite UTC)
    const selecionada = valor ? new Date(`${valor}T00:00:00`) : null;

    return (
        <DatePicker
            id={id}
            selected={selecionada}
            onChange={(data) => onChange(data ? dataISO(data) : '')}
            locale="pt-BR"
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/aaaa"
            autoComplete="off"
            // Abre o calendario fora do formulario, para o CSS do .formulario nao bagunca-lo
            portalId="calendario"
        />
    );
}

export default CampoData;
