import { useState } from 'react';
import { api } from '../api';
import { dataISO, horariosLivres, profissionaisLivres } from '../agenda';

export const FORM_VAZIO = {
    cliente_id: '', animal_id: '', servico_id: '', valor: '',
    data_atendimento: '', hora_atendimento: '', profissional_id: '', status: '', observacoes: ''
};

// Toda a logica do formulario de atendimento, sem nada de tela:
// estado dos campos, sugestao de horario e profissional, editar e salvar.
// O componente FormularioAtendimento so desenha o que este hook devolve.
export function useFormularioAtendimento({ atendimentos, animais, servicos, profissionais, recarregar }) {
    const [form, setForm] = useState(FORM_VAZIO);
    const [editandoId, setEditandoId] = useState(null);
    const [msg, setMsg] = useState('');

    function animaisDoCliente(clienteId) {
        return animais.filter((a) => a.cliente_id === Number(clienteId));
    }

    // Se o cliente tem um animal so, ele ja vem escolhido
    function animalPadrao(clienteId) {
        const doCliente = animaisDoCliente(clienteId);
        return doCliente.length === 1 ? doCliente[0].id : '';
    }

    function servicoDoForm(dadosDoForm) {
        return servicos.find((s) => s.id === Number(dadosDoForm.servico_id));
    }

    // Profissionais que realizam o servico escolhido (tosador ou veterinario)
    function profissionaisDoServico(dadosDoForm) {
        const funcao = servicoDoForm(dadosDoForm)?.funcao;
        return profissionais.filter((p) => p.funcao === funcao && (p.ativo || p.id === Number(dadosDoForm.profissional_id)));
    }

    // Horarios em que algum profissional do servico esta livre no dia escolhido
    function livresPara(dadosDoForm, idIgnorado = editandoId) {
        if (!dadosDoForm.data_atendimento || !dadosDoForm.servico_id) return [];
        return horariosLivres({
            data: dadosDoForm.data_atendimento,
            duracao: servicoDoForm(dadosDoForm)?.duracao_minutos ?? 60,
            profissionais: profissionaisDoServico(dadosDoForm),
            atendimentos,
            servicos,
            ignorarId: idIgnorado
        });
    }

    // Profissionais livres no horario escolhido, do que tem menos atendimentos
    // no dia para o que tem mais (assim o trabalho fica dividido)
    function livresNoHorario(dadosDoForm, idIgnorado = editandoId) {
        if (!dadosDoForm.data_atendimento || !dadosDoForm.servico_id || !dadosDoForm.hora_atendimento) return [];
        const cargaNoDia = (p) => atendimentos.filter((a) =>
            a.profissional_id === p.id && a.id !== idIgnorado && dataISO(a.data_atendimento) === dadosDoForm.data_atendimento
        ).length;

        return profissionaisLivres({
            data: dadosDoForm.data_atendimento,
            hora: dadosDoForm.hora_atendimento,
            duracao: servicoDoForm(dadosDoForm)?.duracao_minutos ?? 60,
            profissionais: profissionaisDoServico(dadosDoForm),
            atendimentos,
            servicos,
            ignorarId: idIgnorado
        }).sort((a, b) => cargaNoDia(a) - cargaNoDia(b));
    }

    // Mantem horario e profissional escolhidos se ainda estiverem livres;
    // se nao, sugere o primeiro horario livre e o profissional menos ocupado
    function comAgendaSugerida(dadosDoForm, idIgnorado = editandoId) {
        const horas = livresPara(dadosDoForm, idIgnorado);
        const hora = horas.includes(dadosDoForm.hora_atendimento) ? dadosDoForm.hora_atendimento : (horas[0] ?? '');

        const comHora = { ...dadosDoForm, hora_atendimento: hora };
        const livres = livresNoHorario(comHora, idIgnorado);
        const continuaLivre = livres.some((p) => p.id === Number(dadosDoForm.profissional_id));

        return { ...comHora, profissional_id: continuaLivre ? dadosDoForm.profissional_id : (livres[0]?.id ?? '') };
    }

    // ----- Opcoes das listas do formulario -----

    // So os servicos ativos, mais o servico do atendimento em edicao
    // (caso ele tenha sido desativado depois)
    const servicosDoFormulario = servicos.filter((s) => s.ativo || s.id === Number(form.servico_id));

    const horariosDoFormulario = livresPara(form);
    // Ao editar, o horario atual aparece mesmo se nao estiver na grade de 30 em 30 min
    if (form.hora_atendimento && !horariosDoFormulario.includes(form.hora_atendimento)) {
        horariosDoFormulario.unshift(form.hora_atendimento);
    }

    const profissionaisDoFormulario = livresNoHorario(form);
    // Ao editar, o profissional atual aparece mesmo se a agenda dele mudou
    const profissionalAtual = profissionais.find((p) => p.id === Number(form.profissional_id));
    if (profissionalAtual && !profissionaisDoFormulario.some((p) => p.id === profissionalAtual.id)) {
        profissionaisDoFormulario.unshift(profissionalAtual);
    }

    // ----- Acoes dos campos -----

    function alterarCampo(evento) {
        setForm({ ...form, [evento.target.name]: evento.target.value });
    }

    // Para os campos de selecao, que entregam o valor direto (sem evento)
    function definirCampo(nome, valor) {
        setForm({ ...form, [nome]: valor });
    }

    // Trocar o cliente limpa o animal, porque o animal anterior era de outro dono
    function escolherCliente(clienteId) {
        setForm({ ...form, cliente_id: clienteId, animal_id: animalPadrao(clienteId) });
    }

    // Escolher o servico preenche o valor com o preco do catalogo (pode ser alterado)
    function escolherServico(servicoId) {
        const preco = servicos.find((s) => s.id === Number(servicoId))?.preco ?? '';
        setForm(comAgendaSugerida({ ...form, servico_id: servicoId, valor: preco }));
    }

    // Escolher a data ja sugere o primeiro horario livre do dia e um profissional
    function escolherData(data) {
        setForm(comAgendaSugerida({ ...form, data_atendimento: data }));
    }

    // Trocar o horario mantem o profissional se ele estiver livre; se nao, troca por outro
    function escolherHora(hora) {
        setForm(comAgendaSugerida({ ...form, hora_atendimento: hora }));
    }

    // ----- Abrir, limpar e salvar -----

    function editar(atendimento) {
        setForm({
            cliente_id: atendimento.cliente_id,
            animal_id: atendimento.animal_id ?? animalPadrao(atendimento.cliente_id),
            servico_id: atendimento.servico_id ?? '',
            valor: atendimento.valor ?? '',
            data_atendimento: dataISO(atendimento.data_atendimento),
            hora_atendimento: atendimento.hora_atendimento?.slice(0, 5) ?? '',
            profissional_id: atendimento.profissional_id ?? '',
            status: atendimento.status,
            observacoes: atendimento.observacoes ?? ''
        });
        setEditandoId(atendimento.id);
        setMsg('');
    }

    // Atendimento novo ja com alguns campos preenchidos
    // (cliente vindo dos inativos, ou data/hora/profissional vindos da Agenda)
    function novoCom(dados) {
        const comAnimal = dados.cliente_id ? { animal_id: animalPadrao(dados.cliente_id) } : {};
        setForm({ ...FORM_VAZIO, ...comAnimal, ...dados });
        setEditandoId(null);
        setMsg('');
    }

    function cancelar() {
        setForm(FORM_VAZIO);
        setEditandoId(null);
        setMsg('');
    }

    async function salvar(evento) {
        evento.preventDefault();
        setMsg('');

        const { cliente_id, animal_id, servico_id, valor, data_atendimento, hora_atendimento, profissional_id } = form;
        // Atendimento novo: a API define o status pela data. Na edicao, vai o escolhido no formulario
        const status = editandoId ? form.status : undefined;
        const observacoes = form.observacoes.trim();

        if (!cliente_id || !servico_id || !data_atendimento) {
            setMsg('Preencha cliente, serviço e data.');
            return;
        }

        if (!hora_atendimento || !profissional_id) {
            setMsg('Não há horário livre para esse serviço nesse dia. Escolha outra data.');
            return;
        }

        if (valor === '' || Number(valor) < 0) {
            setMsg('Informe um valor válido.');
            return;
        }

        if (!animal_id && animaisDoCliente(cliente_id).length > 0) {
            setMsg('Escolha qual animal foi atendido.');
            return;
        }

        const url = editandoId ? `/api/atendimentos/${editandoId}` : '/api/atendimentos';
        const method = editandoId ? 'PUT' : 'POST';

        try {
            await api(url, {
                method,
                body: { cliente_id, animal_id, servico_id, profissional_id, valor, data_atendimento, hora_atendimento, status, observacoes }
            });
            cancelar();
            recarregar();
        } catch (erro) {
            setMsg(erro.message);
        }
    }

    return {
        form, editandoId, msg,
        animaisDoCliente, servicosDoFormulario, horariosDoFormulario, profissionaisDoFormulario,
        alterarCampo, definirCampo, escolherCliente, escolherServico, escolherData, escolherHora,
        editar, novoCom, cancelar, salvar
    };
}
