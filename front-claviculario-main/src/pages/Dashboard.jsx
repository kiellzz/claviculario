import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import GerenciamentoChaves from "../components/GerenciamentoChaves";
import HistoricoModal from "../components/HistoricoModal";
import {
  DashboardService,
  getApiErrorMessage,
  SessionService,
} from "../services/api";
import { eventosWebSocket } from "../services/eventosWebSocket";

const eventLabels = {
  retirada: "Retirou a chave",
  devolucao: "Devolveu a chave",
  panico: "Alerta de pânico",
  autorizacao: "Autorização registrada",
  atraso: "Devolução atrasada",
  status_slot: "Status do slot atualizado",
  erro: "Erro no sistema",
  negado: "Acesso negado",
};

const eventStatus = {
  retirada: { label: "Sucesso", style: "border-green-300 bg-green-50 text-green-600" },
  devolucao: { label: "Sucesso", style: "border-green-300 bg-green-50 text-green-600" },
  autorizacao: { label: "Sucesso", style: "border-green-300 bg-green-50 text-green-600" },
  status_slot: { label: "Atualizado", style: "border-blue-300 bg-blue-50 text-blue-600" },
  panico: { label: "Alerta", style: "border-red-300 bg-red-50 text-red-600" },
  atraso: { label: "Atrasado", style: "border-yellow-300 bg-yellow-50 text-yellow-700" },
  erro: { label: "Erro", style: "border-red-300 bg-red-50 text-red-600" },
  negado: { label: "Negado", style: "border-red-300 bg-red-50 text-red-600" },
};

const formatTimestamp = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const connectionLabels = {
  connected: { label: "Tempo real ativo", color: "bg-green-500" },
  connecting: { label: "Conectando", color: "bg-yellow-500" },
  reconnecting: { label: "Reconectando", color: "bg-yellow-500" },
  disconnected: { label: "Tempo real offline", color: "bg-gray-400" },
  error: { label: "Falha na conexão", color: "bg-red-500" },
  invalid_message: { label: "Mensagem inválida", color: "bg-red-500" },
};

export default function Dashboard() {
  const coordinator = SessionService.isCoordinator();
  const porter = SessionService.isPorter();
  const [data, setData] = useState({
    metrics: { disponiveis: 0, em_uso: 0, atrasadas: 0, panicos: 0 },
    events: [],
    users: [],
    keys: [],
    rooms: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(
    eventosWebSocket.getStatus(),
  );
  const [modalHistoricoOpen, setModalHistoricoOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await DashboardService.getData());
    } catch (loadError) {
      setError(
        getApiErrorMessage(loadError, "Não foi possível carregar o dashboard."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      setData(await DashboardService.getData());
      setSyncError("");
    } catch (refreshError) {
      setSyncError(
        getApiErrorMessage(
          refreshError,
          "O evento chegou, mas não foi possível atualizar o painel.",
        ),
      );
    }
  }, []);

  useEffect(() => {
    let active = true;

    DashboardService.getData()
      .then((dashboardData) => {
        if (active) setData(dashboardData);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            getApiErrorMessage(
              loadError,
              "Não foi possível carregar o dashboard.",
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

  useEffect(() => {
    let refreshTimer = null;
    const unsubscribeMessages = eventosWebSocket.subscribe(() => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        refreshDashboard();
      }, 300);
    });
    const unsubscribeStatus = eventosWebSocket.subscribeStatus(
      setConnectionStatus,
    );

    eventosWebSocket.connect();

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      unsubscribeMessages();
      unsubscribeStatus();
      eventosWebSocket.disconnect();
    };
  }, [refreshDashboard]);

  const usersById = useMemo(
    () => new Map(data.users.map((user) => [user.id, user])),
    [data.users],
  );
  const keysById = useMemo(
    () => new Map(data.keys.map((key) => [key.id, key])),
    [data.keys],
  );
  const roomsById = useMemo(
    () => new Map(data.rooms.map((room) => [room.id, room])),
    [data.rooms],
  );

  const history = useMemo(
    () =>
      data.events.slice(0, 6).map((event) => {
        const user = usersById.get(event.usuario);
        const key = keysById.get(event.chave);
        const room = roomsById.get(event.sala || key?.sala);
        return {
          ...event,
          userName: user
            ? `${user.nome} ${user.sobrenome}`.trim()
            : event.usuario_nome || "Sistema",
          action: eventLabels[event.tipo] || event.tipo,
          location: room ? `Sala ${room.codigo}` : "-",
          keyNumber: key?.numero,
          displayStatus: eventStatus[event.tipo] || {
            label: "Registrado",
            style: "border-gray-300 bg-gray-50 text-gray-600",
          },
        };
      }),
    [data.events, keysById, roomsById, usersById],
  );

  const cards = porter
    ? [
        { title: "Chaves\ndisponíveis", value: data.metrics.disponiveis, color: "text-green-500" },
        { title: "Chaves em\nuso", value: data.metrics.em_uso, color: "text-senac-blue" },
        { title: "Alertas de\npânico", value: data.metrics.panicos, color: "text-red-600" },
      ]
    : [
        { title: "Chaves\ndisponíveis", value: data.metrics.disponiveis, color: "text-green-500" },
        { title: "Chaves em\nuso", value: data.metrics.em_uso, color: "text-senac-blue" },
        { title: "Chaves\natrasadas", value: data.metrics.atrasadas, color: "text-yellow-500" },
        { title: "Alertas de\npânico", value: data.metrics.panicos, color: "text-red-600" },
      ];
  const connection =
    connectionLabels[connectionStatus] || connectionLabels.disconnected;

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-senac-blue" />
        <span className="ml-3 text-lg font-semibold text-senac-blue">
          Sincronizando painel...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-center">
        <p className="mb-4 text-red-700">{error}</p>
        <button
          onClick={loadDashboard}
          className="flex items-center gap-2 rounded-xl bg-senac-blue px-5 py-3 font-semibold text-white"
        >
          <RefreshCw size={18} />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-senac-blue-title">Dashboard</h1>
        <span className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className={`h-2.5 w-2.5 rounded-full ${connection.color}`} />
          {connection.label}
        </span>
      </div>

      {syncError && (
        <p role="status" className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
          {syncError}
        </p>
      )}

      <div className={`mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 ${porter ? "xl:grid-cols-3" : "xl:grid-cols-4"} xl:gap-6`}>
        {cards.map((card) => (
          <article
            key={card.title}
            className="flex min-h-32 flex-col items-center justify-center rounded-[20px] border border-gray-300 bg-white px-4 py-4 shadow-md"
          >
            <h2 className="mb-3 whitespace-pre-line text-center text-lg font-normal leading-tight text-senac-blue-title">
              {card.title}
            </h2>
            <strong className={`text-4xl ${card.color}`}>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-4">
        <section
          className={`col-span-1 flex min-h-96 flex-col rounded-[20px] border border-gray-300 bg-white p-6 shadow-md ${coordinator ? "xl:col-span-3" : "xl:col-span-4"}`}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-senac-blue-title">
              {porter ? "Alertas de pânico" : "Histórico de chaves"}
            </h2>
            {coordinator && (
              <button
                onClick={() => setModalHistoricoOpen(true)}
                className="font-normal text-senac-blue hover:underline"
              >
                Ver todos
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {history.length ? (
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-300 text-xs font-semibold text-gray-500">
                    <th className="pb-3">Usuário</th>
                    <th className="pb-3">Ação</th>
                    <th className="pb-3">Local</th>
                    <th className="pb-3">Data/Hora</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                  {history.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 font-medium">{item.userName}</td>
                      <td className="py-4">
                        {item.action}
                        {item.keyNumber ? ` ${item.keyNumber}` : ""}
                      </td>
                      <td className="py-4 text-xs">{item.location}</td>
                      <td className="whitespace-nowrap py-4 text-xs text-gray-500">
                        {formatTimestamp(item.timestamp)}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${item.displayStatus.style}`}>
                          {item.displayStatus.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex h-full min-h-52 items-center justify-center text-sm text-gray-500">
                {porter
                  ? "Nenhum alerta de pânico registrado."
                  : "Nenhum evento registrado ainda."}
              </div>
            )}
          </div>
        </section>

        {coordinator && (
          <div className="col-span-1 min-h-96">
            <GerenciamentoChaves />
          </div>
        )}
      </div>

      {coordinator && modalHistoricoOpen && (
        <HistoricoModal onClose={() => setModalHistoricoOpen(false)} />
      )}
    </div>
  );
}
