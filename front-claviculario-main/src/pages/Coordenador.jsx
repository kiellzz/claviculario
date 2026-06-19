import { Briefcase, IdCard, LogOut, Mail, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AuthService, SessionService } from "../services/api";

export default function Coordenador() {
  const navigate = useNavigate();
  const coordinator = SessionService.getCurrentUser();
  const roleLabel = coordinator?.papel === "porteiro" ? "Porteiro" : "Coordenação";

  const handleLogout = () => {
    AuthService.logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-[75vh] w-full flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center rounded-[20px] border border-gray-300 bg-white p-8 text-center shadow-md">
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-gray-300 bg-gray-200 shadow-sm">
          <UserRound size={44} className="text-gray-500" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-senac-blue-title">
          {coordinator?.nome} {coordinator?.sobrenome}
        </h1>
        <span className="mb-6 rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-sm font-semibold text-senac-orange">
          {roleLabel}
        </span>

        <div className="mb-4 w-full border-t border-gray-200" />

        <div className="w-full space-y-3">
          <ProfileField icon={IdCard} label="Matrícula">
            {coordinator?.matricula || "Não informada"}
          </ProfileField>
          <ProfileField icon={Mail} label="E-mail institucional">
            {coordinator?.email || "Não informado"}
          </ProfileField>
          <ProfileField icon={Briefcase} label="Perfil">
            {roleLabel}
          </ProfileField>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 font-bold text-white shadow-md transition-colors hover:bg-red-700 active:bg-red-800"
        >
          <LogOut size={18} />
          Sair da conta
        </button>
      </div>
    </div>
  );
}

function ProfileField({ icon: Icon, label, children }) {
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-gray-400">
        <Icon size={15} />
        <span className="text-[10px] font-bold uppercase">{label}</span>
      </div>
      <span className="break-all text-base font-medium text-gray-700">
        {children}
      </span>
    </div>
  );
}
