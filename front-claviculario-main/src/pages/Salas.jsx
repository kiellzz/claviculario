import { Filter, UserMinus, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getApiErrorMessage,
  SalasServices,
  SessionService,
} from "../services/api";

const statusStyles = {
  Disponível: "bg-green-50 text-green-700 border-green-200",
  "Em uso": "bg-orange-50 text-orange-700 border-orange-200",
  Atrasado: "bg-red-50 text-red-700 border-red-200",
  "Em trânsito": "bg-blue-50 text-blue-700 border-blue-200",
  Manutenção: "bg-gray-100 text-gray-700 border-gray-300",
  "Sem chave cadastrada": "bg-gray-50 text-gray-500 border-gray-200",
};

export default function Salas() {
  const coordinator = SessionService.isCoordinator();
  const [salas, setSalas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [filtroAndar, setFiltroAndar] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modal, setModal] = useState(null);
  const [professorSelecionado, setProfessorSelecionado] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSalas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rooms, teachers] = await Promise.all([
        SalasServices.getSalas(),
        coordinator ? SalasServices.getProfessores() : Promise.resolve([]),
      ]);
      setSalas(rooms);
      setProfessores(teachers);
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Não foi possível carregar as salas e o estado das chaves.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [coordinator]);

  useEffect(() => {
    let active = true;

    Promise.all([
      SalasServices.getSalas(),
      coordinator ? SalasServices.getProfessores() : Promise.resolve([]),
    ])
      .then(([rooms, teachers]) => {
        if (!active) return;
        setSalas(rooms);
        setProfessores(teachers);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            getApiErrorMessage(
              loadError,
              "Não foi possível carregar as salas e o estado das chaves.",
            ),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [coordinator]);

  const openModal = (mode, room) => {
    setModal({ mode, room });
    setProfessorSelecionado("");
    setActionError("");
    setFeedback("");
  };

  const closeModal = () => {
    if (!saving) setModal(null);
  };

  const handleResponsible = async (event) => {
    event.preventDefault();
    if (!modal?.room.chaveId) return;
    if (modal.mode === "add" && !professorSelecionado) {
      setActionError("Selecione um professor.");
      return;
    }

    setSaving(true);
    setActionError("");
    try {
      if (modal.mode === "add") {
        await SalasServices.adicionarResponsavel({
          usuarioId: professorSelecionado,
          chaveId: modal.room.chaveId,
        });
        setFeedback(`Responsável adicionado à sala ${modal.room.sala}.`);
      } else {
        await SalasServices.removerResponsavel(modal.room.chaveId);
        setFeedback(`Responsável removido da sala ${modal.room.sala}.`);
      }
      setModal(null);
      const rooms = await SalasServices.getSalas();
      setSalas(rooms);
    } catch (requestError) {
      setActionError(
        getApiErrorMessage(
          requestError,
          "Não foi possível atualizar o responsável pela sala.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const filterOptions = useMemo(
    () => ({
      andares: [...new Set(salas.map((item) => item.andar))].sort(),
      tipos: [...new Set(salas.map((item) => item.tipo))].sort(),
      statuses: [...new Set(salas.map((item) => item.status))].sort(),
    }),
    [salas],
  );

  const salasFiltradas = useMemo(
    () =>
      salas.filter(
        (item) =>
          (!filtroAndar || item.andar === filtroAndar) &&
          (!filtroTipo || item.tipo === filtroTipo) &&
          (!filtroStatus || item.status === filtroStatus),
      ),
    [filtroAndar, filtroStatus, filtroTipo, salas],
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-senac-blue-title">
            Gerenciamento de Salas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Situação atual das chaves e empréstimos por sala
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="mr-1 flex items-center gap-2 text-lg font-bold text-senac-blue">
          <Filter size={20} />
          <span>Filtros</span>
        </div>
        <FilterSelect
          label="Andar"
          value={filtroAndar}
          onChange={setFiltroAndar}
          options={filterOptions.andares}
        />
        <FilterSelect
          label="Tipo"
          value={filtroTipo}
          onChange={setFiltroTipo}
          options={filterOptions.tipos}
        />
        <FilterSelect
          label="Status"
          value={filtroStatus}
          onChange={setFiltroStatus}
          options={filterOptions.statuses}
        />
      </div>

      {feedback && (
        <p role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {feedback}
        </p>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-senac-blue" />
          <span className="ml-3 text-lg font-semibold text-senac-blue">
            Buscando salas...
          </span>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="mb-4 text-red-700">{error}</p>
          <button
            onClick={loadSalas}
            className="rounded-xl bg-senac-blue px-5 py-2 font-semibold text-white"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto pb-4">
          <div className="min-w-[780px] space-y-3 pr-2">
            <div className="grid grid-cols-[0.8fr_0.8fr_1.2fr_2.7fr] gap-3 text-center">
              <TableHeader>Andar</TableHeader>
              <TableHeader>Sala</TableHeader>
              <TableHeader>Tipo</TableHeader>
              <TableHeader>
                {coordinator ? "Responsável, horário e status" : "Status"}
              </TableHeader>
            </div>

            {salasFiltradas.map((item) => (
              <article
                key={item.id}
                className="grid grid-cols-[0.8fr_0.8fr_1.2fr_2.7fr] gap-3"
              >
                <TableCell>{item.andar}</TableCell>
                <TableCell>
                  <div>
                    <strong>{item.sala}</strong>
                    {item.descricao && (
                      <p className="mt-1 text-xs font-normal text-gray-400">
                        {item.descricao}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{item.tipo}</TableCell>
                <TableCell>
                  <div className="flex w-full items-center justify-between gap-3 px-2 text-left">
                    <div className="min-w-0">
                      {coordinator && item.ocupanteNome ? (
                        <>
                          <p className="truncate text-sm font-semibold text-gray-800">
                            {item.ocupanteTitulo} {item.ocupanteNome}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Retirada em {item.horario}
                          </p>
                        </>
                      ) : coordinator ? (
                        <p className="text-sm text-gray-400">
                          Nenhum empréstimo ativo
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[item.status] || "border-gray-200 bg-gray-50 text-gray-600"}`}
                      >
                        {item.status}
                      </span>
                      {coordinator &&
                        (item.ocupanteNome ? (
                          <button
                            type="button"
                            onClick={() => openModal("remove", item)}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                            title={`Remover responsável da sala ${item.sala}`}
                          >
                            <UserMinus size={15} />
                            Remover
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openModal("add", item)}
                            disabled={!item.chaveId || item.status !== "Disponível"}
                            className="flex items-center gap-1.5 rounded-lg bg-senac-blue px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                            title={`Adicionar responsável à sala ${item.sala}`}
                          >
                            <UserPlus size={15} />
                            Adicionar
                          </button>
                        ))}
                    </div>
                  </div>
                </TableCell>
              </article>
            ))}

            {!salasFiltradas.length && (
              <p className="py-12 text-center font-medium text-gray-500">
                Nenhuma sala encontrada com estes filtros.
              </p>
            )}
          </div>
        </div>
      )}

      {coordinator && modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="responsible-title"
            className="relative w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl md:p-8"
          >
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              aria-label="Fechar"
              className="absolute right-5 top-5 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            >
              <X size={21} />
            </button>

            <h2 id="responsible-title" className="pr-10 text-2xl font-bold text-senac-blue">
              {modal.mode === "add" ? "Adicionar responsável" : "Remover responsável"}
            </h2>
            <p className="mb-6 mt-2 text-sm text-gray-500">
              Sala {modal.room.sala} · Chave {modal.room.chaveNumero}
            </p>

            <form onSubmit={handleResponsible} className="space-y-5">
              {modal.mode === "add" ? (
                <label className="block text-sm font-semibold text-gray-700">
                  Professor
                  <select
                    value={professorSelecionado}
                    onChange={(event) => {
                      setProfessorSelecionado(event.target.value);
                      setActionError("");
                    }}
                    required
                    className="form-input"
                  >
                    <option value="">Selecionar professor</option>
                    {professores.map((professor) => (
                      <option key={professor.id} value={professor.id}>
                        {professor.nome} {professor.sobrenome} · {professor.matricula}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  Confirmar a devolução da chave atualmente vinculada a {modal.room.ocupanteNome}?
                </p>
              )}

              {actionError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {actionError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || (modal.mode === "add" && !professores.length)}
                  className={`rounded-xl px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 ${modal.mode === "add" ? "bg-senac-blue hover:bg-blue-800" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {saving
                    ? "Salvando..."
                    : modal.mode === "add"
                      ? "Adicionar"
                      : "Confirmar devolução"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label>
      <span className="sr-only">Filtrar por {label.toLowerCase()}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 font-medium text-senac-blue outline-none focus:ring-2 focus:ring-senac-blue"
      >
        <option value="">Todos: {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TableHeader({ children }) {
  return (
    <div className="rounded-xl bg-senac-blue px-3 py-3 font-semibold text-white shadow-sm">
      {children}
    </div>
  );
}

function TableCell({ children }) {
  return (
    <div className="flex min-h-16 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-3 text-center font-medium text-gray-700 shadow-sm">
      {children}
    </div>
  );
}
