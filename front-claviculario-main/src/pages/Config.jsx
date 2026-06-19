import { useEffect, useState } from "react";
import { Type, MonitorPlay } from "lucide-react";

export default function Config() {
  // Inicializamos os estados lendo do localStorage (para manter salvo se recarregar)
  const [reduzirAnimacoes, setReduzirAnimacoes] = useState(
    localStorage.getItem("a11y-animacoes") === "true",
  );
  const [tamanhoFonte, setTamanhoFonte] = useState(
    localStorage.getItem("a11y-fonte") || "padrao",
  );

  // 1. Efeito de Tamanho de Fonte Real
  useEffect(() => {
    localStorage.setItem("a11y-fonte", tamanhoFonte);
    if (tamanhoFonte === "grande")
      document.documentElement.style.fontSize = "18px";
    else if (tamanhoFonte === "gigante")
      document.documentElement.style.fontSize = "20px";
    else document.documentElement.style.fontSize = "16px";
  }, [tamanhoFonte]);

  // 2. Efeito de Reduzir Animações Real
  useEffect(() => {
    localStorage.setItem("a11y-animacoes", reduzirAnimacoes);
    const styleId = "a11y-reduce-motion";
    let styleEl = document.getElementById(styleId);

    if (reduzirAnimacoes) {
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        // Injeta CSS global que zera o tempo de todas as animações
        styleEl.innerHTML = `* { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }`;
        document.head.appendChild(styleEl);
      }
    } else {
      if (styleEl) styleEl.remove();
    }
  }, [reduzirAnimacoes]);

  return (
    <div className="flex flex-col h-full w-full relative animate-[fadeIn_0.5s_ease-out]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-senac-blue">Acessibilidade</h1>
        <p className="text-xs text-gray-500 mt-1">
          Personalize a interface para suas necessidades visuais.
        </p>
      </div>

      <div className="flex flex-col gap-3 pb-2 pr-2">
        {/* Bloco 1: Texto */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Type size={20} className="text-senac-blue" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-senac-blue mb-2">
              Tamanho do Texto
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTamanhoFonte("padrao")}
                className={`py-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${tamanhoFonte === "padrao" ? "bg-blue-50 border-senac-blue text-senac-blue ring-1 ring-senac-blue" : "bg-white border-gray-200 text-gray-600"}`}
              >
                <span className="text-sm font-medium">Aa Padrão</span>
              </button>
              <button
                onClick={() => setTamanhoFonte("grande")}
                className={`py-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${tamanhoFonte === "grande" ? "bg-blue-50 border-senac-blue text-senac-blue ring-1 ring-senac-blue" : "bg-white border-gray-200 text-gray-600"}`}
              >
                <span className="text-base font-medium">Aa Grande</span>
              </button>
              <button
                onClick={() => setTamanhoFonte("gigante")}
                className={`py-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${tamanhoFonte === "gigante" ? "bg-blue-50 border-senac-blue text-senac-blue ring-1 ring-senac-blue" : "bg-white border-gray-200 text-gray-600"}`}
              >
                <span className="text-lg font-bold">Aa Gigante</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bloco 2: Animações */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MonitorPlay size={20} className="text-senac-orange" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-senac-blue mb-2">
              Animações de Tela
            </h2>
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div>
                <h3 className="font-semibold text-sm text-gray-800">
                  Reduzir Movimento
                </h3>
                <p className="text-[10px] text-gray-500">
                  Desativa o deslize de telas e efeitos de "zoom".
                </p>
              </div>
              <button
                onClick={() => setReduzirAnimacoes(!reduzirAnimacoes)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${reduzirAnimacoes ? "bg-senac-blue" : "bg-gray-300"}`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${reduzirAnimacoes ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
