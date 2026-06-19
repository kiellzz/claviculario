import { ArrowDown, CheckCircle2, Clock, ShieldCheck, UserCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AutorizacoesAtivasModal from "../components/AutorizacoesAtivasModal";
import {
  AutorizacoesService,
  getApiErrorMessage,
  SessionService,
} from "../services/api";

const initialRepasseForm = {
  emprestimo: "",
  representante: "",
  valida_ate: "",
  observacao: "",
};

const initialForaHorarioForm = {
  professor: "",
  sala: "",
  valida_de: "",
  valida_ate: "",
  motivo: "",
};

export default function Autorizacoes() {
  const coordinator = SessionService.getCurrentUser();
  const [context, setContext] = useState({
    users: [],
    keys: [],
    rooms: [],
    loans: [],
    authorizations: [],
  });
  const [mode, setMode] = useState("repasse"); // "repasse" | "fora_horario"
  const [repasseForm, setRepasseForm] = useState(initialRepasseForm);
  const [foraHorarioForm, setForaHorarioForm] = useState(initialForaHorarioForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeModalOpen, setActiveModalOpen] = useState(false);
  const [authorizationToRevoke, setAuthorizationToRevoke] = useState(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    let active = true;

    AutorizacoesService.getContext()
      .then((data) => {
        if (active) setContext(data);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            getApiErrorMessage(
              loadError,
              "Não foi possível carregar os dados de autorização.",
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
  const keyByRoomId = useMemo(() => {
    const map = new Map();
    context.keys.forEach((key) => {
      if (!map.has(key.sala)) map.set(key.sala, key);
    });
    return map;
  }, [context.keys]);

  const professorLoans = useMemo(
    () =>
      context.loans
        .map((loan) => {
          const professor = usersById.get(loan.usuario);
          const key = keysById.get(loan.chave);
          const room = key ? roomsById.get(key.sala) : null;
          return { loan, professor, key, room };
        })
        .filter(
          ({ professor, key, room }) =>
            professor?.papel === "professor" && key && room,
        ),
    [context.loans, keysById, roomsById, usersById],
  );

  const students = useMemo(
    () => context.users.filter((user) => user.papel === "aluno" && user.ativo),
    [context.users],
  );

  const professors = useMemo(
    () =>
      context.users.filter((user) => user.papel === "professor" && user.ativo),
    [context.users],
  );

  const activeAuthorizations = useMemo(
    () =>
      context.authorizations.filter(
        (authorization) => authorization.ativa && authorization.vigente,
      ),
    [context.authorizations],
  );

  const reloadAuthorizations = async () => {
    setContext(await AutorizacoesService.getContext());
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
  };

  const setRepasseField = (field, value) => {
    setRepasseForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  };

  const setForaHorarioField = (field, value) => {
    setForaHorarioForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmitRepasse = async (event) => {
    event.preventDefault();
    const selectedLoan = professorLoans.find(
      ({ loan }) => loan.id === repasseForm.emprestimo,
    );
    const student = usersById.get(repasseForm.representante);
    const validUntil = new Date(repasseForm.valida_ate);

    if (!selectedLoan || !student || !coordinator?.id) {
      setError("Selecione o professor e o aluno representante.");
      return;
    }
    if (Number.isNaN(validUntil.getTime()) || validUntil <= new Date()) {
      setError("Informe uma validade futura para a autorização.");
      return;
    }

    const professorName =
      `${selectedLoan.professor.nome} ${selectedLoan.professor.sobrenome}`.trim();
    const studentName = `${student.nome} ${student.sobrenome}`.trim();
    const reason = [
      `${professorName} repassou a chave ${selectedLoan.key.numero} da sala ${selectedLoan.room.codigo} para o aluno ${studentName}.`,
      repasseForm.observacao.trim(),
    ]
      .filter(Boolean)
      .join(" ");

    setSaving(true);
    setError("");
    try {
      await AutorizacoesService.create({
        usuario: student.id,
        sala: selectedLoan.room.id,
        concedida_por: coordinator.id,
        valida_de: new Date().toISOString(),
        valida_ate: validUntil.toISOString(),
        ativa: true,
        motivo: reason,
      });
      setRepasseForm(initialRepasseForm);
      setSuccess("Autorização registrada com sucesso.");
      await reloadAuthorizations();
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "Não foi possível registrar a autorização.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForaHorario = async (event) => {
    event.preventDefault();
    const professor = usersById.get(foraHorarioForm.professor);
    const room = roomsById.get(foraHorarioForm.sala);
    const key = keyByRoomId.get(foraHorarioForm.sala);
    const validFrom = new Date(foraHorarioForm.valida_de);
    const validUntil = new Date(foraHorarioForm.valida_ate);
    const motivo = foraHorarioForm.motivo.trim();

    if (!professor || !room || !coordinator?.id) {
      setError("Selecione o professor e a sala.");
      return;
    }
    if (!motivo) {
      setError("A justificativa é obrigatória.");
      return;
    }
    if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validUntil.getTime())) {
      setError("Informe a validade inicial e final da autorização.");
      return;
    }
    if (validUntil <= validFrom) {
      setError("A validade final deve ser posterior à validade inicial.");
      return;
    }
    if (validUntil <= new Date()) {
      setError("Informe uma validade futura para a autorização.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const professorName = `${professor.nome} ${professor.sobrenome}`.trim();
      const authorizationDescription = [
        `${professorName} foi autorizado a retirar`,
        key ? `a chave ${key.numero}` : "a chave",
        `da sala ${room.codigo} fora do horário.`,
        motivo,
      ].join(" ");

      await AutorizacoesService.create({
        usuario: professor.id,
        sala: room.id,
        concedida_por: coordinator.id,
        valida_de: validFrom.toISOString(),
        valida_ate: validUntil.toISOString(),
        ativa: true,
        motivo: authorizationDescription,
      });
      setForaHorarioForm(initialForaHorarioForm);
      setSuccess("Autorização registrada com sucesso.");
      await reloadAuthorizations();
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "Não foi possível registrar a autorização.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!authorizationToRevoke) return;
    setRevoking(true);
    setError("");
    try {
      await AutorizacoesService.revoke(authorizationToRevoke.id);
      setAuthorizationToRevoke(null);
      setSuccess("Autorização revogada e registrada no histórico.");
      await reloadAuthorizations();
    } catch (revokeError) {
      setError(
        getApiErrorMessage(
          revokeError,
          "Não foi possível revogar a autorização.",
        ),
      );
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-senac-blue" />
        <span className="ml-3 text-lg font-semibold text-senac-blue">
          Carregando dados...
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full items-center justify-center px-4 py-8">
      <section className="w-full max-w-2xl rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm md:p-10">
        <h1 className="mb-2 text-center text-3xl font-bold text-senac-blue">
          Autorização de posse de chave
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          {mode === "repasse"
            ? "O professor permanece responsável pela chave durante o repasse."
            : "A coordenação concede acesso temporário ao professor fora do horário de aula cadastrado."}
        </p>

        <div className="mb-8 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => switchMode("repasse")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              mode === "repasse"
                ? "bg-white text-senac-blue shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <UserCheck size={16} />
            Repasse para aluno
          </button>
          <button
            type="button"
            onClick={() => switchMode("fora_horario")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              mode === "fora_horario"
                ? "bg-white text-senac-blue shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Clock size={16} />
            Professor fora do horário
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveModalOpen(true)}
          className="mb-8 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-senac-blue transition-colors hover:bg-blue-100"
        >
          <ShieldCheck size={18} />
          Ver autorizações ativas ({activeAuthorizations.length})
        </button>

        {mode === "repasse" ? (
          <form onSubmit={handleSubmitRepasse} className="space-y-5">
            <label className="block text-sm font-semibold text-gray-700">
              Professor com chave emprestada
              <select
                value={repasseForm.emprestimo}
                onChange={(event) =>
                  setRepasseField("emprestimo", event.target.value)
                }
                required
                className="form-input"
              >
                <option value="">Selecionar professor</option>
                {professorLoans.map(({ loan, professor, key, room }) => (
                  <option key={loan.id} value={loan.id}>
                    {professor.nome} {professor.sobrenome} · Chave {key.numero} · Sala {room.codigo}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-center text-senac-blue" aria-hidden="true">
              <ArrowDown size={24} />
            </div>

            <label className="block text-sm font-semibold text-gray-700">
              Aluno representante
              <select
                value={repasseForm.representante}
                onChange={(event) =>
                  setRepasseField("representante", event.target.value)
                }
                required
                className="form-input"
              >
                <option value="">Selecionar aluno</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.nome} {student.sobrenome} · {student.matricula}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Validade da autorização
              <input
                type="datetime-local"
                value={repasseForm.valida_ate}
                onChange={(event) =>
                  setRepasseField("valida_ate", event.target.value)
                }
                required
                className="form-input"
              />
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Observação <span className="font-normal text-gray-400">(opcional)</span>
              <textarea
                value={repasseForm.observacao}
                onChange={(event) =>
                  setRepasseField("observacao", event.target.value)
                }
                rows={3}
                className="form-input resize-none"
              />
            </label>

            {!professorLoans.length && (
              <p className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                Não há professor com empréstimo ativo no momento.
              </p>
            )}
            {!students.length && (
              <p className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                Não há aluno ativo cadastrado para atuar como representante.
              </p>
            )}
            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {success && (
              <p role="status" className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle2 size={18} />
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !professorLoans.length || !students.length}
              className="w-full rounded-xl bg-senac-blue py-4 text-lg font-bold text-white shadow-md transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Registrando..." : "Autorizar repasse"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitForaHorario} className="space-y-5">
            <label className="block text-sm font-semibold text-gray-700">
              Professor
              <select
                value={foraHorarioForm.professor}
                onChange={(event) =>
                  setForaHorarioField("professor", event.target.value)
                }
                required
                className="form-input"
              >
                <option value="">Selecionar professor</option>
                {professors.map((professor) => (
                  <option key={professor.id} value={professor.id}>
                    {professor.nome} {professor.sobrenome}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Sala
              <select
                value={foraHorarioForm.sala}
                onChange={(event) =>
                  setForaHorarioField("sala", event.target.value)
                }
                required
                className="form-input"
              >
                <option value="">Selecionar sala</option>
                {context.rooms.map((room) => {
                  const key = keyByRoomId.get(room.id);
                  return (
                    <option key={room.id} value={room.id}>
                      Sala {room.codigo}
                      {key ? ` · Chave ${key.numero}` : ""}
                    </option>
                  );
                })}
              </select>
            </label>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-gray-700">
                Validade inicial
                <input
                  type="datetime-local"
                  value={foraHorarioForm.valida_de}
                  onChange={(event) =>
                    setForaHorarioField("valida_de", event.target.value)
                  }
                  required
                  className="form-input"
                />
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Validade final
                <input
                  type="datetime-local"
                  value={foraHorarioForm.valida_ate}
                  onChange={(event) =>
                    setForaHorarioField("valida_ate", event.target.value)
                  }
                  required
                  className="form-input"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-gray-700">
              Justificativa
              <textarea
                value={foraHorarioForm.motivo}
                onChange={(event) =>
                  setForaHorarioField("motivo", event.target.value)
                }
                required
                rows={3}
                placeholder="Descreva o motivo do acesso fora do horário de aula cadastrado."
                className="form-input resize-none"
              />
            </label>

            {!professors.length && (
              <p className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                Não há professor ativo cadastrado.
              </p>
            )}
            {!context.rooms.length && (
              <p className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                Não há sala cadastrada.
              </p>
            )}
            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {success && (
              <p role="status" className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle2 size={18} />
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !professors.length || !context.rooms.length}
              className="w-full rounded-xl bg-senac-blue py-4 text-lg font-bold text-white shadow-md transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Registrando..." : "Autorizar professor"}
            </button>
          </form>
        )}

      </section>

      {activeModalOpen && (
        <AutorizacoesAtivasModal
          authorizations={activeAuthorizations}
          usersById={usersById}
          roomsById={roomsById}
          onClose={() => setActiveModalOpen(false)}
          onRevoke={(authorization) => {
            setActiveModalOpen(false);
            setAuthorizationToRevoke(authorization);
            setError("");
          }}
        />
      )}

      {authorizationToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-title"
            className="relative w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl md:p-8"
          >
            <button
              type="button"
              onClick={() => !revoking && setAuthorizationToRevoke(null)}
              disabled={revoking}
              aria-label="Fechar"
              className="absolute right-5 top-5 rounded-full p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
            >
              <X size={21} />
            </button>
            <h2 id="revoke-title" className="pr-10 text-2xl font-bold text-senac-blue">
              Revogar autorização
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Esta ação encerrará a autorização, mas manterá seu registro no histórico.
            </p>
            {error && (
              <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAuthorizationToRevoke(null)}
                disabled={revoking}
                className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={revoking}
                className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-50"
              >
                {revoking ? "Revogando..." : "Confirmar revogação"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
