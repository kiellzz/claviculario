import { Link, NavLink, useNavigate } from "react-router-dom"; // Importamos o NavLink aqui
import {
  LayoutDashboard,
  DoorClosed,
  Users,
  ShieldCheck,
  Settings,
  UserRound,
  Lock,
  LogOut,
} from "lucide-react";
import escudoImg from "../assets/escudo.svg";
import { AuthService, SessionService } from "../services/api";

export default function Sidebar() {
  const navigate = useNavigate();
  const currentUser = SessionService.getCurrentUser();
  const porter = SessionService.isPorter();
  // Função que verifica se a rota está ativa e aplica o fundo escuro
  const navLinkClass = ({ isActive }) => {
    return `flex items-center gap-3 text-xs transition-colors p-2 rounded-xl ${
      isActive
        ? "bg-black/20 text-senac-orange font-semibold"
        : "text-white hover:text-senac-orange"
    }`;
  };

  return (
    // Seu código com w-40, rounded-[25px], etc., mantido intacto
    <aside className="w-40 bg-senac-blue text-white flex flex-col justify-between h-full rounded-[25px] py-5 px-3 shadow-xl">
      {/* Topo: Logo e Título */}
      <div>
        <div className="flex items-center gap-3 mb-12">
          <img
            src={escudoImg}
            alt="Logo Controle de Acesso"
            className="w-10 h-10"
          />
          <h2 className="font-bold text-xs leading-tight">
            Controle
            <br />
            de acesso
          </h2>
        </div>

        {/* Menu de Navegação - Trocamos Link por NavLink e adicionamos a função de classe */}
        <nav className="flex flex-col gap-2">
          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard size={22} />
            <span>Tela inicial</span>
          </NavLink>

          <NavLink to="/salas" className={navLinkClass}>
            <DoorClosed size={22} />
            <span>Salas</span>
          </NavLink>

          {porter ? (
            <>
              <DisabledNavItem icon={Users}>Usuários</DisabledNavItem>
              <DisabledNavItem icon={ShieldCheck}>Autorizações</DisabledNavItem>
            </>
          ) : (
            <>
              <NavLink to="/usuarios" className={navLinkClass}>
                <Users size={22} />
                <span>Usuários</span>
              </NavLink>
              <NavLink to="/autorizacoes" className={navLinkClass}>
                <ShieldCheck size={22} />
                <span>Autorizações</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Rodapé: Configurações e Perfil */}
      <div>
        {porter ? (
          <DisabledNavItem icon={Settings} className="mb-6">
            Configurações
          </DisabledNavItem>
        ) : (
          <Link
            to="/configuracoes"
            className="mb-6 flex items-center gap-3 p-2 text-xs transition-colors hover:text-senac-orange"
          >
            <Settings size={22} />
            <span>Configurações</span>
          </Link>
        )}

        {/* Card de Perfil / Sair */}
        {porter ? (
          <div className="space-y-2">
            <div className="rounded-full bg-senac-orange px-3 py-2 shadow-md">
              <div className="flex items-center gap-1">
                <UserRound size={16} className="text-senac-blue" />
                <span className="text-sm font-semibold text-senac-blue">
                  {currentUser?.nome || "Porteiro"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                AuthService.logout();
                navigate("/", { replace: true });
              }}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-red-700"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        ) : (
          <Link
            to="/coordenador"
            className="bg-senac-orange rounded-full py-2 px-3 flex cursor-pointer hover:brightness-110 transition-all shadow-md"
          >
            <div className="flex items-center gap-1">
              <UserRound size={16} className="text-senac-blue" />
              <span className="font-semibold text-sm text-senac-blue">
                {currentUser?.nome || "Coordenação"}
              </span>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}

function DisabledNavItem({ icon: Icon, children, className = "" }) {
  return (
    <div
      aria-disabled="true"
      title="Disponível apenas para coordenação"
      className={`flex cursor-not-allowed items-center gap-3 rounded-xl p-2 text-xs text-white/40 ${className}`}
    >
      <Icon size={22} />
      <span>{children}</span>
      <Lock size={12} className="ml-auto" />
    </div>
  );
}
