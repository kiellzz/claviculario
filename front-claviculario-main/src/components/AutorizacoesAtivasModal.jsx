import { Ban, Clock, ShieldCheck, X } from "lucide-react";

const formatDateTime = (value) => {
  if (!value) return "Sem expiração";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export default function AutorizacoesAtivasModal({
  authorizations,
  usersById,
  roomsById,
  onClose,
  onRevoke,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-authorizations-title"
        className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-[24px] bg-white p-6 shadow-2xl md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar autorizações ativas"
          className="absolute right-5 top-5 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={22} />
        </button>

        <div className="mb-6 flex items-center gap-3 pr-12">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-senac-blue">
            <ShieldCheck size={21} />
          </div>
          <div>
            <h2
              id="active-authorizations-title"
              className="text-2xl font-bold text-senac-blue"
            >
              Autorizações ativas
            </h2>
            <p className="text-sm text-gray-500">
              {authorizations.length} autorização(ões) vigente(s)
            </p>
          </div>
        </div>

        <div className="min-h-40 flex-1 space-y-3 overflow-y-auto pr-1">
          {authorizations.length ? (
            authorizations.map((authorization) => {
              const authorizedUser = usersById.get(authorization.usuario);
              const room = roomsById.get(authorization.sala);
              return (
                <article
                  key={authorization.id}
                  className="flex flex-col gap-4 border-b border-gray-200 px-1 pb-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">
                      {authorizedUser
                        ? `${authorizedUser.nome} ${authorizedUser.sobrenome}`.trim()
                        : "Usuário não encontrado"}
                      {room ? ` · Sala ${room.codigo}` : ""}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {authorization.motivo || "Sem justificativa informada"}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock size={13} />
                      Válida até {formatDateTime(authorization.valida_ate)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRevoke(authorization)}
                    className="flex flex-shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                  >
                    <Ban size={16} />
                    Revogar
                  </button>
                </article>
              );
            })
          ) : (
            <div className="flex min-h-40 items-center justify-center text-center text-sm text-gray-500">
              Nenhuma autorização vigente.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
