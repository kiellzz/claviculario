import { Pencil, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getApiErrorMessage,
  SessionService,
  UsuariosServices,
} from "../services/api";

const roleOptions = [
  { value: "professor", label: "Professor" },
  { value: "aluno", label: "Aluno" },
  { value: "porteiro", label: "Porteiro" },
  { value: "coordenacao", label: "Coordenação" },
  { value: "funcionario", label: "Funcionário" },
];

const emptyForm = {
  username: "",
  nome: "",
  sobrenome: "",
  matricula: "",
  email: "",
  papel: "aluno",
  ativo: true,
  rfid_tag: "",
  password: "",
};

const roleLabel = (role) =>
  roleOptions.find((option) => option.value === role)?.label || role;

export default function Usuarios() {
  const currentUser = SessionService.getCurrentUser();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busca, setBusca] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadUsuarios = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      setUsuarios(await UsuariosServices.getUsuarios());
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Não foi possível carregar os usuários."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    UsuariosServices.getUsuarios()
      .then((data) => {
        if (active) setUsuarios(data);
      })
      .catch((error) => {
        if (active) {
          setPageError(
            getApiErrorMessage(error, "Não foi possível carregar os usuários."),
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

  const usuariosFiltrados = useMemo(() => {
    const search = busca.trim().toLowerCase();
    if (!search) return usuarios;

    return usuarios.filter((user) =>
      [
        user.nome,
        user.sobrenome,
        user.matricula,
        user.username,
        user.email,
      ].some((value) => String(value || "").toLowerCase().includes(search)),
    );
  }, [busca, usuarios]);

  const openCreateModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
    setModalMode("create");
  };

  const openEditModal = (user) => {
    setForm({
      username: user.username || "",
      nome: user.nome || "",
      sobrenome: user.sobrenome || "",
      matricula: user.matricula || "",
      email: user.email || "",
      papel: user.papel || "aluno",
      ativo: user.ativo,
      rfid_tag: "",
      password: "",
    });
    setEditingId(user.id);
    setFormError("");
    setModalMode("edit");
  };

  const resetModal = () => {
    setModalMode(null);
    setEditingId(null);
    setFormError("");
  };

  const closeModal = () => {
    if (saving) return;
    resetModal();
  };

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const buildPayload = () => {
    const payload = {
      username: form.username.trim(),
      nome: form.nome.trim(),
      sobrenome: form.sobrenome.trim(),
      matricula: form.matricula.trim(),
      email: form.email.trim(),
      papel: form.papel,
      ativo: form.ativo,
    };

    if (form.rfid_tag.trim()) payload.rfid_tag = form.rfid_tag.trim();
    if (form.password) payload.password = form.password;
    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setFeedback("");

    try {
      const payload = buildPayload();
      if (modalMode === "create") {
        await UsuariosServices.createUsuario(payload);
        setFeedback("Usuário cadastrado com sucesso.");
      } else {
        const updatedUser = await UsuariosServices.updateUsuario(editingId, payload);
        if (editingId === currentUser?.id) {
          SessionService.setCurrentUser(updatedUser);
        }
        setFeedback("Usuário atualizado com sucesso.");
      }

      resetModal();
      await loadUsuarios();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (editingId === currentUser?.id) return;
    const selectedUser = usuarios.find((user) => user.id === editingId);
    const confirmed = window.confirm(
      `Excluir ${selectedUser?.nome || "este usuário"}? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    setSaving(true);
    setFormError("");
    try {
      await UsuariosServices.deleteUsuario(editingId);
      setFeedback("Usuário excluído com sucesso.");
      resetModal();
      await loadUsuarios();
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Não foi possível excluir o usuário."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-senac-blue-title">
          Controle de Usuários
        </h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-full bg-senac-blue px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-800"
        >
          <Plus size={20} />
          Adicionar usuário
        </button>
      </div>

      {feedback && (
        <p className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {feedback}
        </p>
      )}

      <label className="mb-8 flex w-full max-w-2xl items-center rounded-full border border-gray-300 bg-white px-5 py-3 shadow-sm">
        <Search size={22} className="mr-3 text-gray-400" />
        <span className="sr-only">Pesquisar usuários</span>
        <input
          type="search"
          placeholder="Pesquisar por nome, matrícula, usuário ou e-mail..."
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          className="flex-1 border-none bg-transparent text-lg text-gray-700 outline-none placeholder-gray-400"
        />
      </label>

      {loading ? (
        <LoadingState label="Carregando usuários..." />
      ) : pageError ? (
        <ErrorState message={pageError} onRetry={loadUsuarios} />
      ) : (
        <div className="grid grid-cols-1 gap-6 overflow-y-auto pb-4 pr-2 md:grid-cols-2 lg:grid-cols-3">
          {usuariosFiltrados.map((user) => (
            <article
              key={user.id}
              className="group relative flex items-center gap-5 rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <button
                onClick={() => openEditModal(user)}
                aria-label={`Editar ${user.nome} ${user.sobrenome}`}
                title="Editar usuário"
                className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-senac-blue md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              >
                <Pencil size={18} />
              </button>

              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                <UserRound size={28} className="text-gray-500" />
              </div>
              <div className="min-w-0 pr-7">
                <h2 className="truncate text-lg font-bold text-senac-blue">
                  {user.nome} {user.sobrenome}
                </h2>
                <span className="text-sm font-medium text-senac-orange">
                  {roleLabel(user.papel)}
                </span>
                <p className="mt-1 text-xs text-gray-500">
                  Matrícula: {user.matricula}
                </p>
                {!user.ativo && (
                  <span className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                    Inativo
                  </span>
                )}
              </div>
            </article>
          ))}

          {!usuariosFiltrados.length && (
            <p className="col-span-full py-10 text-center text-lg font-medium text-gray-500">
              Nenhum usuário encontrado.
            </p>
          )}
        </div>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl md:p-8"
          >
            <button
              onClick={closeModal}
              disabled={saving}
              aria-label="Fechar formulário"
              className="absolute right-6 top-6 text-gray-400 transition-colors hover:text-gray-700 disabled:opacity-50"
            >
              <X size={24} />
            </button>

            <h2 id="user-modal-title" className="mb-6 text-2xl font-bold text-senac-blue">
              {modalMode === "create" ? "Novo usuário" : "Editar usuário"}
            </h2>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <FormField label="Usuário" htmlFor="username">
                <input
                  id="username"
                  value={form.username}
                  onChange={(event) => setField("username", event.target.value)}
                  required
                  autoComplete="username"
                  className="form-input"
                />
              </FormField>

              <FormField label="Matrícula" htmlFor="matricula" hint="Exatamente 10 dígitos">
                <input
                  id="matricula"
                  value={form.matricula}
                  onChange={(event) => setField("matricula", event.target.value)}
                  required
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  minLength={10}
                  maxLength={10}
                  className="form-input"
                />
              </FormField>

              <FormField label="Nome" htmlFor="nome">
                <input
                  id="nome"
                  value={form.nome}
                  onChange={(event) => setField("nome", event.target.value)}
                  required
                  maxLength={30}
                  className="form-input"
                />
              </FormField>

              <FormField label="Sobrenome" htmlFor="sobrenome">
                <input
                  id="sobrenome"
                  value={form.sobrenome}
                  onChange={(event) => setField("sobrenome", event.target.value)}
                  required
                  maxLength={30}
                  className="form-input"
                />
              </FormField>

              <FormField label="E-mail institucional" htmlFor="email" hint="nome@edu.pe.senac.br">
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  required
                  maxLength={50}
                  pattern=".+@edu\.pe\.senac\.br"
                  className="form-input"
                />
              </FormField>

              <FormField label="Papel" htmlFor="papel">
                <select
                  id="papel"
                  value={form.papel}
                  onChange={(event) => setField("papel", event.target.value)}
                  disabled={editingId === currentUser?.id}
                  className="form-input disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="RFID" htmlFor="rfid" hint="Opcional; o backend armazena o hash">
                <input
                  id="rfid"
                  value={form.rfid_tag}
                  onChange={(event) => setField("rfid_tag", event.target.value)}
                  className="form-input"
                />
              </FormField>

              <FormField
                label={modalMode === "create" ? "Senha inicial" : "Nova senha"}
                htmlFor="password"
                hint="Opcional"
              >
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setField("password", event.target.value)}
                  autoComplete="new-password"
                  className="form-input"
                />
              </FormField>

              <label className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 text-sm font-semibold text-gray-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(event) => setField("ativo", event.target.checked)}
                  disabled={editingId === currentUser?.id}
                  className="h-4 w-4 accent-senac-blue"
                />
                Usuário ativo
              </label>

              {formError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">
                  {formError}
                </p>
              )}

              <div className="mt-2 flex flex-col-reverse gap-3 md:col-span-2 md:flex-row md:justify-end">
                {modalMode === "edit" && editingId !== currentUser?.id && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-5 py-3 font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                  >
                    <Trash2 size={18} />
                    Excluir
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-senac-blue px-6 py-3 font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {saving
                    ? "Salvando..."
                    : modalMode === "create"
                      ? "Cadastrar usuário"
                      : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, htmlFor, hint, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700">
      {label}
      {hint && <span className="ml-1 text-xs font-normal text-gray-400">({hint})</span>}
      {children}
    </label>
  );
}

function LoadingState({ label }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-senac-blue" />
      <span className="ml-3 text-lg font-semibold text-senac-blue">{label}</span>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="mb-4 text-red-700">{message}</p>
      <button onClick={onRetry} className="rounded-xl bg-senac-blue px-5 py-2 font-semibold text-white">
        Tentar novamente
      </button>
    </div>
  );
}
