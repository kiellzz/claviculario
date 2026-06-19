import { ArrowRight, Clock, KeyRound, Plus, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  GerenciamentoChavesService,
  getApiErrorMessage,
  SessionService,
} from "../services/api";

const emptyForm = {
  emprestimo: "",
  representante: "",
  valida_ate: "",
  observacao: "",
};

const formatDateTime = (value) => {
  if (!value) return "Sem expiração";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export default function GerenciamentoChaves() {
  const coordinator = SessionService.getCurrentUser();
  const [context, setContext] = useState({
    users: [],
    keys: [],
    rooms: [],
    loans: [],
    authorizations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    GerenciamentoChavesService.getContext()
      .then((data) => {
        if (active) setContext(data);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            getApiErrorMessage(
              loadError,
              "Não foi possível carregar o gerenciamento de chaves.",
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
  }, []);

  const reloadContext = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setContext(await GerenciamentoChavesService.getContext());
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Não foi possível atualizar o gerenciamento de chaves.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const usersById = useMemo(
    () => new Map(context.users.map((user) => [user.id, user])),
    [context.users],
  );
  const keysById = useMemo(
    () => new Map(context.keys.map((key) => [key.id, key])),
    [context.keys],
  );
  const roomsById = useMemo(
    () => new Map(context.rooms.map((room) => [room.id, room])),
    [context.rooms],
  );

  const professorLoans = useMemo(
    () =>
      context.loans
        .map((loan) => {
          const professor = usersById.get(loan.usuario);
          const key = keysById.get(loan.chave);
          const room = key ? roomsById.get(key.sala) : null;
          return { loan, professor, key, room };
        })
        .filter((item) => item.professor?.papel === "professor" && item.key && item.room),
    [context.loans, keysById, roomsById, usersById],
  );

  const representatives = useMemo(
    () => context.users.filter((user) => user.papel === "aluno" && user.ativo),
    [context.users],
  );

  const activeAuthorizations = useMemo(
    () =>
      context.authorizations
        .filter(
          (authorization) => authorization.ativa && authorization.vigente,
        )
        .slice(0, 8),
    [context.authorizations],
  );

  const openModal = () => {
    setForm(emptyForm);
    setFormError("");
    setFeedback("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!saving) setModalOpen(false);
  };

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const selectedLoan = professorLoans.find(
      (item) => item.loan.id === form.emprestimo,
    );
    const representative = usersById.get(form.representante);

    if (!selectedLoan || !representative || !coordinator?.id) {
      setFormError("Selecione o professor e o aluno representante.");
      return;
    }

    const validUntil = new Date(form.valida_ate);
    if (Number.isNaN(validUntil.getTime()) || validUntil <= new Date()) {
      setFormError("Informe uma validade futura para a autorização.");
      return;
    }

    const professorName = `${selectedLoan.professor.nome} ${selectedLoan.professor.sobrenome}`.trim();
    const representativeName = `${representative.nome} ${representative.sobrenome}`.trim();
    const reasonParts = [
      `Repasse de posse: ${professorName} repassou a chave ${selectedLoan.key.numero} da sala ${selectedLoan.room.codigo} para ${representativeName}.`,
    ];
    if (form.observacao.trim()) reasonParts.push(form.observacao.trim());

    setSaving(true);
    setFormError("");
    try {
      await GerenciamentoChavesService.createTransferAuthorization({
        usuario: representative.id,
        sala: selectedLoan.room.id,
        concedida_por: coordinator.id,
        valida_de: new Date().toISOString(),
        valida_ate: validUntil.toISOString(),
        ativa: true,
        motivo: reasonParts.join(" "),
      });
      setFeedback("Repasse autorizado com sucesso.");
      setModalOpen(false);
      await reloadContext();
    } catch (submitError) {
      setFormError(
        getApiErrorMessage(submitError, "Não foi possível autorizar o repasse."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[20px] border border-gray-300 bg-white p-5 shadow-md">
      <div className="mb-5 text-center">
        <h2 className="text-xl font-bold text-senac-blue-title">
          Gerenciamento de chaves
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Repasses autorizados para alunos representantes
        </p>
      </div>

      {feedback && (
        <p className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {feedback}
        </p>
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex h-28 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-senac-blue" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-3 text-center text-xs text-red-700">
            <p>{error}</p>
            <button onClick={reloadContext} className="mt-2 font-bold underline">
              Tentar novamente
            </button>
          </div>
        ) : activeAuthorizations.length ? (
          activeAuthorizations.map((authorization) => {
            const representative = usersById.get(authorization.usuario);
            const room = roomsById.get(authorization.sala);
            return (
              <article
                key={authorization.id}
                className="border-b border-gray-200 pb-3 last:border-0"
              >
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-senac-blue">
                    <KeyRound size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs leading-relaxed text-gray-700">
                      {authorization.motivo ||
                        `${representative?.nome || "Aluno"} autorizado para a sala ${room?.codigo || "-"}.`}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock size={11} />
                      Válida até {formatDateTime(authorization.valida_ate)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <p className="py-8 text-center text-xs text-gray-400">
            Nenhum repasse ativo.
          </p>
        )}
      </div>

      <button
        onClick={openModal}
        disabled={loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-senac-blue px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
      >
        <Plus size={17} />
        Autorizar repasse
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-title"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl md:p-8"
          >
            <button
              onClick={closeModal}
              disabled={saving}
              aria-label="Fechar autorização de repasse"
              className="absolute right-5 top-5 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            >
              <X size={22} />
            </button>

            <h2 id="transfer-title" className="pr-10 text-2xl font-bold text-senac-blue">
              Autorizar repasse de chave
            </h2>
            <p className="mb-6 mt-2 text-sm text-gray-500">
              O professor continuará responsável pelo empréstimo. O aluno receberá
              autorização temporária para a mesma sala.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Professor com chave emprestada
                <select
                  value={form.emprestimo}
                  onChange={(event) => setField("emprestimo", event.target.value)}
                  required
                  className="form-input"
                >
                  <option value="">Selecione o professor</option>
                  {professorLoans.map(({ loan, professor, key, room }) => (
                    <option key={loan.id} value={loan.id}>
                      {professor.nome} {professor.sobrenome} · Chave {key.numero} · Sala {room.codigo}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center justify-center text-senac-blue">
                <ArrowRight size={24} />
              </div>

              <label className="block text-sm font-semibold text-gray-700">
                Aluno representante
                <select
                  value={form.representante}
                  onChange={(event) => setField("representante", event.target.value)}
                  required
                  className="form-input"
                >
                  <option value="">Selecione o aluno</option>
                  {representatives.map((representative) => (
                    <option key={representative.id} value={representative.id}>
                      {representative.nome} {representative.sobrenome} · {representative.matricula}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Validade da autorização
                <input
                  type="datetime-local"
                  value={form.valida_ate}
                  onChange={(event) => setField("valida_ate", event.target.value)}
                  required
                  className="form-input"
                />
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Observação <span className="font-normal text-gray-400">(opcional)</span>
                <textarea
                  value={form.observacao}
                  onChange={(event) => setField("observacao", event.target.value)}
                  rows={3}
                  className="form-input resize-none"
                />
              </label>

              {!professorLoans.length && (
                <p className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                  Não há professor com empréstimo ativo para realizar o repasse.
                </p>
              )}
              {!representatives.length && (
                <p className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                  Não há aluno ativo cadastrado para atuar como representante.
                </p>
              )}
              {formError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
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
                  disabled={saving || !professorLoans.length || !representatives.length}
                  className="flex items-center gap-2 rounded-xl bg-senac-blue px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserRound size={18} />
                  {saving ? "Autorizando..." : "Confirmar autorização"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
