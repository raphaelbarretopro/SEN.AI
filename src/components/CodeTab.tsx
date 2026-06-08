import React, { useState } from "react";
import { Check, Copy, Terminal, ExternalLink, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface CodeTabProps {
  scriptCode: string;
}

export default function CodeTab({ scriptCode }: CodeTabProps) {
  const [copied, setCopied] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar código:", err);
    }
  };

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const usageSteps = [
    {
      title: "Passo 1: Abrir o Google Forms",
      text: "Acesse seu formulário no Google Forms no qual deseja aplicar a prova.",
      link: "https://forms.google.com",
    },
    {
      title: "Passo 2: Acessar o Apps Script",
      text: "No canto superior direito, clique nos três pontinhos (⋮) e selecione 'Apps script'.",
    },
    {
      title: "Passo 3: Colar o Código",
      text: "Apague qualquer código existente no editor do Apps Script, cole exatamente o código copiado acima e clique no ícone de disquete para Salvar.",
    },
    {
      title: "Passo 4: Executar o Script",
      text: "Clique em 'Executar' no menu superior do Google Apps Script e conceda as permissões de acesso da sua conta Google. As questões aparecerão magicamente no seu formulário!",
    },
  ];

  const finalSettings = [
    {
      boldText: "Em 'Respostas'",
      text: "mude 'Enviar aos participantes uma cópia' para 'Sempre'.",
    },
    {
      boldText: "Confirmação de Liberação",
      text: "Verifique se as chaves de 'Perguntas erradas', 'Respostas corretas' e 'Valores' estão ativadas para os alunos na aba 'Configurações' do formulário.",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Code Viewer Panel */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-600" />
            <h3 className="font-display font-semibold text-gray-800">
              Código Google Apps Script
            </h3>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              copied
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm cursor-pointer"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>

        {/* Code Blocks Previewer */}
        <div className="relative group rounded-2xl overflow-hidden border border-gray-250 bg-slate-900 shadow-lg text-xs leading-5">
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={handleCopy}
              className="p-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px]"
            >
              Copiar
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-950 border-b border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] text-slate-500 font-mono ml-2">codigo_forms.js</span>
          </div>
          <pre className="p-5 overflow-auto max-h-[500px] text-slate-200 font-mono custom-scrollbar text-left whitespace-pre">
            <code>{scriptCode}</code>
          </pre>
        </div>
      </div>

      {/* Manual & Tutorial Instructions Panel */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <h3 className="font-display font-semibold text-gray-800">
            Manual de Instalação no Forms
          </h3>
        </div>

        {/* Instruction Checklist Cards */}
        <div className="space-y-3.5">
          {usageSteps.map((step, index) => {
            const isCompleted = !!checkedSteps[index];

            return (
              <div
                key={index}
                onClick={() => toggleStep(index)}
                className={`p-4 border rounded-2xl transition-all cursor-pointer flex gap-3 ${
                  isCompleted
                    ? "bg-emerald-50/20 border-emerald-200 opacity-80"
                    : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="shrink-0 pt-0.5">
                  <div
                    className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center transition-colors ${
                      isCompleted
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-gray-300 hover:border-indigo-500 bg-white"
                    }`}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold font-display tracking-tight transition-colors ${
                        isCompleted ? "text-emerald-900 line-through" : "text-gray-900"
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 text-xs font-semibold"
                      >
                        Abrir <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p
                    className={`text-xs ${
                      isCompleted ? "text-emerald-800/70" : "text-gray-600"
                    } leading-relaxed`}
                  >
                    {step.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Important Adjustments Panel */}
        <div className="p-5 border border-indigo-150 rounded-2xl bg-indigo-50/50 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-indigo-900">
              ATENÇÃO ÀS CONFIGURAÇÕES FINAIS
            </h4>
          </div>
          <p className="text-xs text-indigo-950 leading-relaxed">
            O código gerado já limita a prova a <strong>1 resposta</strong> por usuário, torna todas as questões <strong>obrigatórias</strong> e ativa a <strong>coleta automática de e-mails</strong>.
          </p>
          <div className="pt-2 border-t border-indigo-150/50 space-y-2.5 text-xs text-indigo-900">
            {finalSettings.map((setting, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-indigo-600 shrink-0 font-bold">•</span>
                <p className="leading-relaxed">
                  <strong>{setting.boldText}:</strong> {setting.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
