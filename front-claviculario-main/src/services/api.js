import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api/").replace(
  /\/?$/,
  "/",
);

const STORAGE_KEYS = {
  access: "claviculario.accessToken",
  refresh: "claviculario.refreshToken",
  user: "claviculario.currentUser",
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const SessionService = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.access),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.refresh),
  getCurrentUser: () => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.user);
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem(STORAGE_KEYS.user);
      return null;
    }
  },
  setTokens: ({ access, refresh }) => {
    localStorage.setItem(STORAGE_KEYS.access, access);
    localStorage.setItem(STORAGE_KEYS.refresh, refresh);
  },
  setAccessToken: (access) => {
    localStorage.setItem(STORAGE_KEYS.access, access);
  },
  setCurrentUser: (user) => {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  },
  clear: () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
  isAuthenticated: () => Boolean(localStorage.getItem(STORAGE_KEYS.access)),
  isCoordinator: () => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.user);
    if (!storedUser) return false;
    try {
      return JSON.parse(storedUser).papel === "coordenacao";
    } catch {
      return false;
    }
  },
  isPorter: () => SessionService.getCurrentUser()?.papel === "porteiro",
  canWrite: () => SessionService.isCoordinator(),
  hasDashboardAccess: () =>
    ["coordenacao", "porteiro"].includes(
      SessionService.getCurrentUser()?.papel,
    ),
};

apiClient.interceptors.request.use((config) => {
  const accessToken = SessionService.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshRequest = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = SessionService.getRefreshToken();

    if (
      error.response?.status === 401 &&
      refreshToken &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        refreshRequest ??= refreshClient.post("auth/token/refresh/", {
          refresh: refreshToken,
        });
        const { data } = await refreshRequest;
        SessionService.setAccessToken(data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        SessionService.clear();
        if (window.location.pathname !== "/") window.location.assign("/");
        return Promise.reject(refreshError);
      } finally {
        refreshRequest = null;
      }
    }

    return Promise.reject(error);
  },
);

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
};

const createUserMessageError = (message) => {
  const error = new Error(message);
  error.userMessage = message;
  return error;
};

export function getApiErrorMessage(error, fallback = "Não foi possível concluir a operação.") {
  if (error?.userMessage) return error.userMessage;
  if (!error?.response) {
    return "Não foi possível conectar ao servidor. Verifique se o backend está em execução.";
  }

  const data = error.response.data;
  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data?.mensagem) return data.mensagem;

  if (data && typeof data === "object") {
    const messages = Object.entries(data).flatMap(([field, value]) => {
      const values = Array.isArray(value) ? value : [value];
      return values.map((message) => `${field}: ${message}`);
    });
    if (messages.length) return messages.join(" ");
  }

  return fallback;
}

export const AuthService = {
  login: async (username, password) => {
    SessionService.clear();
    const { data: tokens } = await apiClient.post("auth/token/", {
      username,
      password,
    });
    SessionService.setTokens(tokens);

    try {
      const { data: currentUser } = await apiClient.get("usuarios/me/");

      if (!currentUser || !["coordenacao", "porteiro"].includes(currentUser.papel)) {
        throw createUserMessageError(
          "Este painel é exclusivo para coordenação e portaria.",
        );
      }

      SessionService.setCurrentUser(currentUser);
      return currentUser;
    } catch (error) {
      SessionService.clear();
      if (error.response?.status === 403) {
        throw createUserMessageError(
          "Este painel é exclusivo para coordenação e portaria.",
        );
      }
      throw error;
    }
  },
  logout: () => SessionService.clear(),
};

export const UsuariosServices = {
  getUsuarios: async () => {
    const { data } = await apiClient.get("usuarios/");
    return normalizeList(data);
  },
  createUsuario: async (payload) => {
    const { data } = await apiClient.post("usuarios/", payload);
    return data;
  },
  updateUsuario: async (id, payload) => {
    const { data } = await apiClient.patch(`usuarios/${id}/`, payload);
    return data;
  },
  deleteUsuario: async (id) => {
    await apiClient.delete(`usuarios/${id}/`);
  },
};

const roomTypeLabels = {
  LAB: "Laboratório",
  SALA: "Sala de aula",
  COZINHA: "Cozinha",
  AUDITORIO: "Auditório",
};

const roleLabels = {
  professor: "Professor",
  aluno: "Aluno",
  porteiro: "Porteiro",
  coordenacao: "Coordenação",
  funcionario: "Funcionário",
};

const keyStatusLabels = {
  disponivel: "Disponível",
  emprestada: "Em uso",
  em_transito: "Em trânsito",
  manutencao: "Manutenção",
};

const formatDateTime = (value) => {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const SalasServices = {
  getSalas: async () => {
    const coordinator = SessionService.isCoordinator();
    const requests = [
      apiClient.get("salas/"),
      apiClient.get("chaves/"),
      apiClient.get("relatorios/chaves-emprestadas/"),
    ];
    if (coordinator) requests.push(apiClient.get("usuarios/"));
    const [roomsResponse, keysResponse, loansResponse, usersResponse] =
      await Promise.all(requests);

    const rooms = normalizeList(roomsResponse.data);
    const keys = normalizeList(keysResponse.data);
    const loans = normalizeList(loansResponse.data);
    const users = normalizeList(usersResponse?.data);
    const userById = new Map(users.map((user) => [user.id, user]));
    const activeLoanByKey = new Map(loans.map((loan) => [loan.chave, loan]));

    return rooms.map((room) => {
      const roomKeys = keys.filter((key) => key.sala === room.id);
      const activeLoan = roomKeys
        .map((key) => activeLoanByKey.get(key.id))
        .find(Boolean);
      const borrower = activeLoan ? userById.get(activeLoan.usuario) : null;
      const keyWithPriority =
        roomKeys.find((key) => key.status === "manutencao") ||
        roomKeys.find((key) => key.status === "em_transito") ||
        roomKeys.find((key) => key.status === "emprestada") ||
        roomKeys[0];

      let status = keyWithPriority
        ? keyStatusLabels[keyWithPriority.status] || keyWithPriority.status
        : "Sem chave cadastrada";
      if (activeLoan?.atraso_registrado) status = "Atrasado";

      return {
        id: room.id,
        andar: room.andar === 0 ? "Térreo" : `${room.andar}º andar`,
        sala: room.codigo,
        numero: room.numero,
        descricao: room.descricao,
        tipo: roomTypeLabels[room.tipo_sala] || room.tipo_sala,
        status,
        ocupanteNome: borrower
          ? `${borrower.nome} ${borrower.sobrenome}`.trim()
          : activeLoan?.usuario_nome || null,
        ocupanteTitulo: borrower
          ? roleLabels[borrower.papel]
          : activeLoan
            ? "Responsável"
            : null,
        horario: formatDateTime(activeLoan?.retirado_em),
        totalChaves: roomKeys.length,
        chaveId: keyWithPriority?.id || null,
        chaveNumero: keyWithPriority?.numero || null,
        emprestimoId: activeLoan?.id || null,
        responsavelId: borrower?.id || null,
      };
    });
  },
  getProfessores: async () => {
    const { data } = await apiClient.get("usuarios/");
    return normalizeList(data).filter(
      (user) => user.papel === "professor" && user.ativo,
    );
  },
  adicionarResponsavel: async ({ usuarioId, chaveId }) => {
    const { data } = await apiClient.post("operacoes/retirada/", {
      usuario_id: usuarioId,
      chave_id: chaveId,
    });
    return data;
  },
  removerResponsavel: async (chaveId) => {
    const { data } = await apiClient.post("operacoes/devolucao/", {
      chave_id: chaveId,
    });
    return data;
  },
};

export const EventosService = {
  getEventos: async (filters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value),
    );
    const { data } = await apiClient.get("eventos/", { params });
    return normalizeList(data);
  },
  getFilterOptions: async () => {
    const coordinator = SessionService.isCoordinator();
    const requests = [apiClient.get("chaves/"), apiClient.get("salas/")];
    if (coordinator) requests.push(apiClient.get("usuarios/"));
    const [keysResponse, roomsResponse, usersResponse] =
      await Promise.all(requests);

    return {
      users: normalizeList(usersResponse?.data),
      keys: normalizeList(keysResponse.data),
      rooms: normalizeList(roomsResponse.data),
    };
  },
};

export const GerenciamentoChavesService = {
  getContext: async () => {
    const [
      usersResponse,
      keysResponse,
      roomsResponse,
      loansResponse,
      authorizationsResponse,
    ] = await Promise.all([
      apiClient.get("usuarios/"),
      apiClient.get("chaves/"),
      apiClient.get("salas/"),
      apiClient.get("relatorios/chaves-emprestadas/"),
      apiClient.get("autorizacoes/", { params: { ativa: true } }),
    ]);

    return {
      users: normalizeList(usersResponse.data),
      keys: normalizeList(keysResponse.data),
      rooms: normalizeList(roomsResponse.data),
      loans: normalizeList(loansResponse.data),
      authorizations: normalizeList(authorizationsResponse.data),
    };
  },
  createTransferAuthorization: async (payload) => {
    const { data } = await apiClient.post("autorizacoes/", payload);
    return data;
  },
};

export const DashboardService = {
  getData: async () => {
    const coordinator = SessionService.isCoordinator();
    const [
      statusResponse,
      overdueResponse,
      recentEventsResponse,
      panicEventsResponse,
      keysResponse,
      roomsResponse,
      usersResponse,
    ] = await Promise.all([
      apiClient.get("relatorios/status-chaves/"),
      coordinator
        ? apiClient.get("relatorios/chaves-em-atraso/")
        : Promise.resolve({ data: [] }),
      coordinator
        ? apiClient.get("relatorios/eventos-recentes/", { params: { limite: 10 } })
        : Promise.resolve({ data: [] }),
      apiClient.get("eventos/", { params: { tipo: "panico" } }),
      apiClient.get("chaves/"),
      apiClient.get("salas/"),
      coordinator ? apiClient.get("usuarios/") : Promise.resolve({ data: [] }),
    ]);

    const keyStatuses = normalizeList(statusResponse.data);
    const overdueLoans = normalizeList(overdueResponse.data);
    const recentEvents = coordinator
      ? normalizeList(recentEventsResponse.data)
      : normalizeList(panicEventsResponse.data);
    const users = normalizeList(usersResponse.data);
    const keys = normalizeList(keysResponse.data);
    const rooms = normalizeList(roomsResponse.data);
    const panicCount = Array.isArray(panicEventsResponse.data)
      ? panicEventsResponse.data.length
      : (panicEventsResponse.data?.count ?? normalizeList(panicEventsResponse.data).length);

    return {
      metrics: {
        disponiveis: keyStatuses.filter((key) => key.status === "disponivel").length,
        em_uso: keyStatuses.filter((key) => key.status === "emprestada").length,
        atrasadas: overdueLoans.length,
        panicos: panicCount,
      },
      events: recentEvents,
      users,
      keys,
      rooms,
    };
  },
};

export const AutorizacoesService = {
  getContext: GerenciamentoChavesService.getContext,
  create: GerenciamentoChavesService.createTransferAuthorization,
  revoke: async (id) => {
    const { data } = await apiClient.post(`autorizacoes/${id}/revogar/`);
    return data;
  },
};

export default apiClient;
