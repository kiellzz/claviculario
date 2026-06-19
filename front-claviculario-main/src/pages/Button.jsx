export default function ButtonPage() {
  const handleAlertClick = () => {
    // Ordem clara: LIGAR!
    // Avisa a própria aba (caso ela tenha a tela vermelha)
    window.dispatchEvent(new CustomEvent("panicoLocal", { detail: "LIGAR" }));

    // Pega o rádio e avisa as outras abas: LIGAR!
    const canal = new BroadcastChannel("canal_panico");
    canal.postMessage("LIGAR");
  };

  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-5 font-sans animate-[fadeIn_0.5s_ease-out]">
      <div className="w-full max-w-[400px] bg-white py-10 px-8 rounded-2xl shadow-lg text-center border border-gray-100">
        <h1 className="text-[26px] text-gray-900 mb-3 font-extrabold">
          Painel de Emergência
        </h1>

        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Se houver qualquer irregularidade ou problema crítico com o
          claviculário, acione o botão abaixo imediatamente.
        </p>

        {/* Botão Vermelho Grande */}
        <button
          onClick={handleAlertClick}
          className="w-full bg-red-600 text-white py-5 text-2xl font-bold uppercase rounded-xl cursor-pointer shadow-[0_10px_20px_rgba(220,38,38,0.3)] hover:bg-red-700 hover:scale-105 active:scale-95 transition-all"
        >
          🚨 Alerta
        </button>
      </div>
    </div>
  );
}
