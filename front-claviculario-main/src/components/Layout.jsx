import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  // 1. AQUI ESTÃO AS VARIÁVEIS QUE TINHAM SUMIDO NO MERGE!
  const [isPanic, setIsPanic] = useState(false);
  const audioRef = useRef(new Audio("/sirene.mp3"));

  // 2. AQUI ESTÁ A LÓGICA DO ALARME QUE FAZ TUDO FUNCIONAR!
  useEffect(() => {
    const canal = new BroadcastChannel("canal_panico");

    const ligarAlarme = () => {
      setIsPanic(true);
      audioRef.current.loop = true;
      audioRef.current.play().catch((e) => console.log("Erro de áudio:", e));
    };

    const desligarAlarme = () => {
      setIsPanic(false);
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    };

    // Escuta o evento desta mesma aba
    const handleLocalEvent = (e) => {
      if (e.detail === "LIGAR") ligarAlarme();
      if (e.detail === "DESLIGAR") desligarAlarme();
    };
    window.addEventListener("panicoLocal", handleLocalEvent);

    // Escuta o Walkie-Talkie das outras abas
    canal.onmessage = (evento) => {
      if (evento.data === "LIGAR") ligarAlarme();
      if (evento.data === "DESLIGAR") desligarAlarme();
    };

    return () => {
      window.removeEventListener("panicoLocal", handleLocalEvent);
      canal.close();
    };
  }, []);

  return (
    <div className="flex h-screen w-full bg-background-light overflow-hidden relative">
      <div className="py-4 pl-2 h-full z-10">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto py-5 pr-5 pl-10 animate-[fadeIn_0.5s_ease-out] z-10">
        <Outlet />
      </main>

      {/* POPUP GIGANTE DE PÂNICO */}
      {isPanic && (
        <div className="fixed inset-0 z-[9999] bg-red-600/95 flex flex-col items-center justify-center animate-pulse backdrop-blur-md">
          <h1 className="text-white text-7xl font-black mb-6 tracking-widest text-center">
            🚨 ALERTA DE PÂNICO 🚨
          </h1>
          <p className="text-white text-2xl font-bold bg-black/50 px-8 py-4 rounded-full shadow-lg">
            Acionamento detectado! Verifique as câmeras e as salas
            imediatamente.
          </p>
          <button
            onClick={() => {
              // Ordem clara: DESLIGAR!
              window.dispatchEvent(
                new CustomEvent("panicoLocal", { detail: "DESLIGAR" }),
              );
              const canal = new BroadcastChannel("canal_panico");
              canal.postMessage("DESLIGAR");
            }}
            className="mt-12 bg-white text-red-600 px-10 py-4 rounded-full font-black text-2xl hover:bg-gray-200 transition-transform hover:scale-105 shadow-2xl cursor-pointer"
          >
            DESATIVAR ALARME
          </button>
        </div>
      )}
    </div>
  );
}
