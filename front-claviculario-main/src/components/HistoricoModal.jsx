import { Filter, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EventosService, getApiErrorMessage } from "../services/api";

const emptyFilters = {
  tipo: "",
  usuario: "",
  chave: "",
  sala: "",
};

const eventTypes = [
  { value: "retirada", label: "Retirada" },
  { value: "devolucao", label: "Devolução" },
  { value: "panico", label: "Pânico" },
  { value: "autorizacao", label: "Autorização" },
  { value: "atraso", label: "Atraso" },
  { value: "status_slot", label: "Status do slot" },
  { value: "erro", label: "Erro" },
  { value: "negado", label: "Acesso negado" },
];

const eventStyles = {
  retirada: "border-blue-200 bg-blue-50 text-blue-700",
  devolucao: "border-green-200 bg-green-50 text-green-700",
  panico: "border-red-200 bg-red-50 text-red-700",
  autorizacao: "border-violet-200 bg-violet-50 text-violet-700",
  atraso: "border-yellow-200 bg-yellow-50 text-yellow-700",
  status_slot: "border-cyan-200 bg-cyan-50 text-cyan-700",
  erro: "border-red-200 bg-red-50 text-red-700",
  negado: "border-gray-300 bg-gray-100 text-gray-700",
};

const eventLabel = (type) =>
  eventTypes.find((item) => item.value === type)?.label || type;

const formatTimestamp = (value) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

const formatDetailDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return formatTimestamp(date);
};

const normalizeReason = (reason) => {
  const labels = {
    "Autorizacao ativa": "autorização vigente",
    "Coordenacao autorizada": "autorização da coordenação",
    "Professor dentro do horario": "horário de aula cadastrado",
    "Sem autorizacao para retirar esta chave":
      "sem autorização para retirar esta chave",
    "Chave ja emprestada": "a chave já está emprestada",
    "Aluno sem autorização ativa": "aluno sem autorização vigente",
  };
  return labels[reason] || reason;
};

const formatDetails = (event) => {
  const details = event.detalhes || {};

  if (event.tipo === "retirada") {
    const reason = normalizeReason(details.motivo);
    return reason
      ? `Retirada autorizada por ${reason}.`
      : "Retirada da chave registrada com sucesso.";
  }

  if (event.tipo === "devolucao") {
    return "Chave devolvida e empréstimo encerrado.";
  }

  if (event.tipo === "negado") {
    const reason = normalizeReason(details.motivo);
    return reason
      ? `Retirada negada: ${reason}.`
      : "Acesso à chave negado.";
  }

  if (event.tipo === "autorizacao") {
    const action = details.acao === "revogada" ? "revogada" : "criada";
    const validityStart = formatDetailDate(details.valida_de);
    const validityEnd = formatDetailDate(details.valida_ate);
    const validity =
      validityStart && validityEnd
        ? ` Vigência: ${validityStart} até ${validityEnd}.`
        : validityEnd
          ? ` Válida até ${validityEnd}.`
          : "";
    const reason = details.motivo ? ` ${details.motivo}` : "";
    return `Autorização ${action}.${validity}${reason}`.trim();
  }

  if (event.tipo === "atraso") {
    const deadline = formatDetailDate(details.limite_devolucao);
    return deadline
      ? `Prazo de devolução encerrado em ${deadline}.`
      : "Chave não devolvida dentro do prazo.";
  }

  if (event.tipo === "panico") {
    return details.origem
      ? `Alerta de pânico acionado via ${details.origem}.`
      : "Alerta de pânico acionado.";
  }

  if (event.tipo === "status_slot") {
    if (typeof details.ocupado === "boolean") {
      return details.ocupado
        ? "Sensor confirmou a chave presente no slot."
        : "Sensor identificou o slot vazio.";
    }
    return "Estado do slot atualizado.";
  }

  if (event.tipo === "erro") {
    return details.mensagem || details.motivo || "Erro registrado pelo sistema.";
  }

  const visibleDetails = Object.entries(details).filter(
    ([key]) => !key.endsWith("_id") && !["autorizacao_id"].includes(key),
  );
  if (!visibleDetails.length) return "Sem detalhes adicionais.";
  return visibleDetails
    .map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`)
    .join(" · ");
};

export default function HistoricoModal({ onClose }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [events, setEvents] = useState([]);
  const [options, setOptions] = useState({ users: [], keys: [], rooms: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      EventosService.getFilterOptions(),
      EventosService.getEventos(),
    ])
      .then(([filterOptions, eventList]) => {
        if (!active) return;
        setOptions(filterOptions);
        setEvents(eventList);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            getApiErrorMessage(loadError, "Não foi possível carregar o histórico."),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadEvents = useCallback(async (nextFilters) => {
    setLoading(true);
    setError("");
    try {
      setEvents(await EventosService.getEventos(nextFilters));
    } catch (loadError) {
      setError(
        getApiErrorMessage(loadError, "Não foi possível aplicar os filtros."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const roomById = useMemo(
    () => new Map(options.rooms.map((room) => [room.id, room])),
    [options.rooms],
  );
  const userById = useMemo(
    () => new Map(options.users.map((user) => [user.id, user])),
    [options.users],
  );
  const keyById = useMemo(
    () => new Map(options.keys.map((key) => [key.id, key])),
    [options.keys],
  );

  const setFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    loadEvents(emptyFilters);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        className="relative flex max-h-[90vh] w-full max-w-6xl flex-col rounded-[24px] bg-white p-5 shadow-2xl md:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4 pr-10">
          <div>
            <h2 id="history-title" className="text-2xl font-bold text-senac-blue">
              Histórico completo de chaves
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Retiradas, devoluções, atrasos, alertas e demais eventos registrados
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar histórico"
            className="absolute right-5 top-5 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 md:right-7 md:top-7"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold text-senac-blue">
            <Filter size={18} />
            Filtros do histórico
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              label="Tipo de evento"
              value={filters.tipo}
              onChange={(value) => setFilter("tipo", value)}
              options={eventTypes}
            />
            <FilterSelect
              label="Usuário"
              value={filters.usuario}
              onChange={(value) => setFilter("usuario", value)}
              options={options.users.map((user) => ({
                value: user.id,
                label: `${user.nome} ${user.sobrenome}`.trim(),
              }))}
            />
            <FilterSelect
              label="Chave"
              value={filters.chave}
              onChange={(value) => setFilter("chave", value)}
              options={options.keys.map((key) => ({
                value: key.id,
                label: `Chave ${key.numero} · Sala ${roomById.get(key.sala)?.codigo || "-"}`,
              }))}
            />
            <FilterSelect
              label="Sala"
              value={filters.sala}
              onChange={(value) => setFilter("sala", value)}
              options={options.rooms.map((room) => ({
                value: room.id,
                label: `Sala ${room.codigo}`,
              }))}
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button
              onClick={clearFilters}
              disabled={loading}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-60"
            >
              Limpar filtros
            </button>
            <button
              onClick={() => loadEvents(filters)}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-senac-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Aplicar filtros
            </button>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
          <span>{events.length} evento(s) encontrado(s)</span>
        </div>

        <div className="min-h-48 flex-1 overflow-auto rounded-xl border border-gray-200">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-senac-blue" />
              <span className="ml-3 font-semibold text-senac-blue">
                Carregando histórico...
              </span>
            </div>
          ) : error ? (
            <div className="flex h-48 flex-col items-center justify-center p-6 text-center">
              <p className="mb-4 text-red-700">{error}</p>
              <button
                onClick={() => loadEvents(filters)}
                className="rounded-xl bg-senac-blue px-5 py-2 font-semibold text-white"
              >
                Tentar novamente
              </button>
            </div>
          ) : events.length ? (
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-gray-100 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Data e hora</th>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Chave</th>
                  <th className="px-4 py-3">Sala</th>
                  <th className="px-4 py-3">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((event) => {
                  const user = userById.get(event.usuario);
                  const key = keyById.get(event.chave);
                  const room = roomById.get(event.sala || key?.sala);
                  const details = formatDetails(event);

                  return (
                    <tr key={event.id} className="align-top hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-4 text-gray-500">
                        {formatTimestamp(event.timestamp)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${eventStyles[event.tipo] || "border-gray-200 bg-gray-50 text-gray-600"}`}
                        >
                          {eventLabel(event.tipo)}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-700">
                        {user
                          ? `${user.nome} ${user.sobrenome}`.trim()
                          : event.usuario_nome || "Sistema"}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {key
                          ? `Chave ${key.numero}`
                          : event.chave_numero
                            ? `Chave ${event.chave_numero}`
                            : "-"}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {room
                          ? `Sala ${room.codigo}`
                          : event.sala_codigo
                            ? `Sala ${event.sala_codigo}`
                            : "-"}
                      </td>
                      <td className="max-w-80 break-words px-4 py-4 text-xs leading-relaxed text-gray-500">
                        <span title={details}>{details}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex h-48 items-center justify-center p-6 text-center text-gray-500">
              Nenhum evento encontrado para os filtros selecionados.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="text-sm font-semibold text-gray-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 font-normal text-gray-700 outline-none focus:border-senac-blue focus:ring-2 focus:ring-blue-100"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
