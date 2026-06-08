import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Award,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ClipboardList,
  Terminal,
  Clock,
  Eye,
  Settings,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReviewTab from "./components/ReviewTab";
import CodeTab from "./components/CodeTab";
import { Question, ExamRequest } from "./types";

interface StepConfig {
  id: number;
  label: string;
  questionText: string;
  helpText: string;
}

export default function App() {
  // Application mode: "interview" | "result"
  const [mode, setMode] = useState<"interview" | "result">("interview");
  const [activeTab, setActiveTab] = useState<"code" | "review">("review");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State Values
  const [formId, setFormId] = useState<string>("1aBcDeFgHiJkLmNoPqRsTuVwXyZ_example_id");
  const [title, setTitle] = useState<string>("Avaliação Mensal de Geografia");
  const [description, setDescription] = useState<string>(
    "Leia atentamente cada questão antes de responder. Esta avaliação contempla o conteúdo do Capítulo 3 do livro didático."
  );
  const [difficulty, setDifficulty] = useState<"Fácil" | "Médio" | "Difícil">("Médio");
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [pointsPerQuestion, setPointsPerQuestion] = useState<number>(2);
  const [numMultipleChoice, setNumMultipleChoice] = useState<number>(3);
  const [numCheckbox, setNumCheckbox] = useState<number>(1);
  const [numDropdown, setNumDropdown] = useState<number>(1);
  
  // Base material input
  const [baseMaterial, setBaseMaterial] = useState<string>(
    "O relevo brasileiro é caracterizado por planaltos, planícies e depressões, sem a existência de dobramentos modernos (cadeias montanhosas semelhantes aos Andes). Os rios do Brasil possuem predominantemente regime pluvial, ou seja, são alimentados pela água das chuvas. O rio Amazonas destaca-se como o maior do mundo em volume de água e extensão. O clima predominante no território é o Tropical, apresentando variações como Tropical de Altitude, Tropical Semiárido na região Nordeste (com baixa pluviosidade), e o clima Subtropical na região Sul, marcado pelas quatro estações bem definidas e chuvas regulares ao longo do ano."
  );

  // Interview state control
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [answersConfirmed, setAnswersConfirmed] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true,
    10: false,
  });

  // Generated results from Gemini
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [generatedScript, setGeneratedScript] = useState<string>("");

  // Input temporary current state value to handle conversational entry
  const [inputValue, setInputValue] = useState<string>("");
  const [inputError, setInputError] = useState<string | null>(null);

  // Time stamp state
  const [currentTime, setCurrentTime] = useState<string>("2026-06-08 23:36:00 UTC");

  useEffect(() => {
    // Keep local clock or simple static time from metadata
    const now = new Date();
    const formatted = now.toISOString().replace("T", " ").substring(0, 19) + " UTC";
    setCurrentTime(formatted);
  }, []);

  // Update transient inputs when stepping
  useEffect(() => {
    setInputError(null);
    switch (currentStep) {
      case 1:
        setInputValue(formId);
        break;
      case 2:
        setInputValue(title);
        break;
      case 3:
        setInputValue(description);
        break;
      case 5:
        setInputValue(totalQuestions.toString());
        break;
      case 6:
        setInputValue(pointsPerQuestion.toString());
        break;
      case 7:
        setInputValue(numMultipleChoice.toString());
        break;
      case 8:
        setInputValue(numCheckbox.toString());
        break;
      case 9:
        setInputValue(numDropdown.toString());
        break;
      case 10:
        setInputValue(baseMaterial);
        break;
      default:
        setInputValue("");
    }
  }, [currentStep]);

  // Dynamic values calculation
  const totalAllocated = numMultipleChoice + numCheckbox + numDropdown;
  const missingQuestions = totalQuestions - totalAllocated;

  // Settle specific values based on actions
  const validateAndAdvance = () => {
    setInputError(null);
    const cleaned = inputValue.trim();

    if (currentStep === 1) {
      if (!cleaned) {
        setInputError("Por favor, informe um ID de formulário válido.");
        return;
      }
      setFormId(cleaned);
      markStepCompleted(1);
      advanceToNextStep(1);
    } else if (currentStep === 2) {
      if (!cleaned) {
        setInputError("Insira um título para a atividade.");
        return;
      }
      setTitle(cleaned);
      markStepCompleted(2);
      advanceToNextStep(2);
    } else if (currentStep === 3) {
      setDescription(cleaned);
      markStepCompleted(3);
      advanceToNextStep(3);
    } else if (currentStep === 5) {
      const val = parseInt(cleaned, 10);
      if (isNaN(val) || val <= 0) {
        setInputError("Por favor, informe um número inteiro maior que zero.");
        return;
      }
      setTotalQuestions(val);
      // Reset distribution values to avoid bad saldo
      setNumMultipleChoice(0);
      setNumCheckbox(0);
      setNumDropdown(0);
      markStepCompleted(5);
      advanceToNextStep(5);
    } else if (currentStep === 6) {
      const val = parseFloat(cleaned);
      if (isNaN(val) || val <= 0) {
        setInputError("A pontuação deve ser um número positivo (ex: 2 ou 1.5).");
        return;
      }
      setPointsPerQuestion(val);
      markStepCompleted(6);
      advanceToNextStep(6);
    } else if (currentStep === 7) {
      const val = parseInt(cleaned, 10);
      if (isNaN(val) || val < 0) {
        setInputError("Insira um número maior ou igual a zero.");
        return;
      }
      if (val > totalQuestions) {
        setInputError(`O número de questões de Múltipla Escolha (${val}) não pode ser maior que o total da prova (${totalQuestions}).`);
        return;
      }
      setNumMultipleChoice(val);
      const remaining = totalQuestions - val;
      markStepCompleted(7);

      if (remaining === 0) {
        // Skip steps 8 & 9 straight to 10
        setNumCheckbox(0);
        setNumDropdown(0);
        setAnswersConfirmed(prev => ({ ...prev, 7: true, 8: true, 9: true }));
        setCurrentStep(10);
      } else {
        setCurrentStep(8);
      }
    } else if (currentStep === 8) {
      const val = parseInt(cleaned, 10);
      if (isNaN(val) || val < 0) {
        setInputError("Insira um número maior ou igual a zero.");
        return;
      }
      const currentSum = numMultipleChoice + val;
      if (currentSum > totalQuestions) {
        const allowed = totalQuestions - numMultipleChoice;
        setInputError(`De acordo com as configurações, você possui apenas ${allowed} questões de saldo disponível.`);
        return;
      }
      setNumCheckbox(val);
      const remaining = totalQuestions - currentSum;
      markStepCompleted(8);

      if (remaining === 0) {
        setNumDropdown(0);
        setAnswersConfirmed(prev => ({ ...prev, 8: true, 9: true }));
        setCurrentStep(10);
      } else {
        // Pre-fill Step 9 with the automatic balance
        setNumDropdown(remaining);
        setCurrentStep(9);
      }
    } else if (currentStep === 9) {
      const val = parseInt(cleaned, 10);
      if (isNaN(val) || val < 0) {
        setInputError("Insira um número maior ou igual a zero.");
        return;
      }
      const currentSum = numMultipleChoice + numCheckbox + val;
      if (currentSum !== totalQuestions) {
        const exactNeeded = totalQuestions - (numMultipleChoice + numCheckbox);
        setInputError(`Atenção: A soma das questões deve dar exatamente ${totalQuestions}. Defina exatamente ${exactNeeded} questão(ões) do tipo Lista Suspensa.`);
        return;
      }
      setNumDropdown(val);
      markStepCompleted(9);
      setCurrentStep(10);
    } else if (currentStep === 10) {
      if (!cleaned || cleaned.length < 15) {
        setInputError("Insira um material de apoio com no mínimo 15 caracteres para basear as questões com eficácia.");
        return;
      }
      setBaseMaterial(cleaned);
      markStepCompleted(10);
      handleGenerateExam(cleaned);
    }
  };

  const markStepCompleted = (step: number) => {
    setAnswersConfirmed((prev) => ({
      ...prev,
      [step]: true,
    }));
  };

  const advanceToNextStep = (current: number) => {
    if (current === 4) {
      setCurrentStep(5);
    } else if (current < 10) {
      setCurrentStep(current + 1);
    }
  };

  const handleDifficultySelect = (lvl: "Fácil" | "Médio" | "Difícil") => {
    setDifficulty(lvl);
    markStepCompleted(4);
    advanceToNextStep(4);
  };

  const handleGoBack = () => {
    if (currentStep === 10) {
      const sumBefore = numMultipleChoice + numCheckbox;
      if (sumBefore === totalQuestions) {
        setCurrentStep(7);
      } else {
        const sumWithCb = numMultipleChoice + numCheckbox;
        if (sumWithCb < totalQuestions) {
          setCurrentStep(9);
        } else {
          setCurrentStep(8);
        }
      }
    } else if (currentStep === 8) {
      setCurrentStep(7);
    } else if (currentStep === 9) {
      setCurrentStep(8);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Safe handler to jump steps from sidebar
  const handleJumpToStep = (stepId: number) => {
    // Ensure total questions are configured before adjusting distribution
    if (stepId > 5 && !answersConfirmed[5]) {
      setInputError("Por favor, configure primeiro a quantidade total de questões (Passo 5).");
      return;
    }
    setCurrentStep(stepId);
  };

  const handleGenerateExam = async (materialText: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formId,
          title,
          description,
          difficulty,
          totalQuestions,
          pointsPerQuestion,
          numMultipleChoice,
          numCheckbox,
          numDropdown,
          baseMaterial: materialText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro desconhecido ao gerar o exame.");
      }

      const data = await response.json();
      setGeneratedQuestions(data.questions || []);
      setGeneratedScript(data.scriptSource || "");
      setMode("result");
      setActiveTab("review");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || "Falha na comunicação com o servidor. Por favor, tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setMode("interview");
    setCurrentStep(1);
    setGeneratedQuestions([]);
    setGeneratedScript("");
  };

  // Steps master configuration
  const steps: StepConfig[] = [
    {
      id: 1,
      label: "ID do Formulário",
      questionText: "Informe o ID do seu formulário Google Forms",
      helpText: "O ID pode ser copiado diretamente do link de edição do seu Forms. Exemplo: https://docs.google.com/forms/d/SEU_ID_AQUI/edit",
    },
    {
      id: 2,
      label: "Título da Atividade",
      questionText: "Qual o Título principal da Atividade?",
      helpText: "Será o cabeçalho principal da prova para visualização dos estudantes. Ex: Avaliação Trimestral de História.",
    },
    {
      id: 3,
      label: "Descrição / Instruções",
      questionText: "Gostaria de adicionar instruções ou uma breve descrição?",
      helpText: "Instruções pedagógicas, regras, capítulos cobrados ou data de entrega da prova.",
    },
    {
      id: 4,
      label: "Nível de Dificuldade",
      questionText: "Escolha o Nível de Dificuldade para formulação das questões:",
      helpText: "O nível altera a densidade, profundidade analítica dos distratores e estilo de redação das perguntas.",
    },
    {
      id: 5,
      label: "Quantidade Total",
      questionText: "Quantas Questões você quer criar no total?",
      helpText: "Indique o número total absoluto de itens que comporão a avaliação inteira.",
    },
    {
      id: 6,
      label: "Pontuação por Questão",
      questionText: "Qual será a pontuação individual atribuída a cada questão?",
      helpText: "Todos os itens terão o mesmo valor configurado globalmente no formulário (ex: 2.0 ou 1.0).",
    },
    {
      id: 7,
      label: "Múltipla Escolha",
      questionText: "Quantas questões serão do tipo Múltipla Escolha?",
      helpText: "Questões tradicionais com 4 alternativas e apenas 1 resposta correta.",
    },
    {
      id: 8,
      label: "Caixa de Seleção",
      questionText: "Quantas questões serão do tipo Caixa de Seleção?",
      helpText: "Permitem marcar múltiplas respostas corretas simultaneamente. O título indicará quantas selecionar.",
    },
    {
      id: 9,
      label: "Lista Suspensa",
      questionText: "Quantas questões serão do tipo Lista Suspensa?",
      helpText: "No estilo de preenchimento de lacunas, contendo uma linha sublinhada para completar.",
    },
    {
      id: 10,
      label: "Material Base",
      questionText: "Insira o Material ou Texto Base que fundamentará a avaliação:",
      helpText: "Cole capítulos de livros, postulados científicos, notícias ou tópicos a serem transformados em questões pedagógicas.",
    },
  ];

  const currentStepObj = steps.find((s) => s.id === currentStep) || steps[0];

  // Helper values to show current allocations
  const getStepValueDisplay = (stepId: number) => {
    switch (stepId) {
      case 1:
        return formId ? `${formId.substring(0, 10)}...` : "Não definido";
      case 2:
        return title || "Não definido";
      case 3:
        return description ? `${description.substring(0, 18)}...` : "Nenhum";
      case 4:
        return difficulty;
      case 5:
        return `${totalQuestions} questões`;
      case 6:
        return `${pointsPerQuestion} pts/questão`;
      case 7:
        return `${numMultipleChoice} un`;
      case 8:
        return `${numCheckbox} un`;
      case 9:
        return `${numDropdown} un`;
      case 10:
        return baseMaterial ? `${baseMaterial.substring(0, 18)}...` : "Não definido";
      default:
        return "";
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] text-[#111827] font-sans antialiased overflow-hidden">
      
      {/* 1. Left Progress / Navigation Sidebar */}
      <aside className="w-[320px] bg-white border-r border-gray-200 flex flex-col p-6 shrink-0 h-full overflow-y-auto">
        
        {/* Brand & Identity */}
        <div className="mb-6 pb-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-display font-extrabold tracking-tight text-gray-900 leading-none">
                EduScript Forms
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                Entrevistador Virtual
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-semibold text-indigo-700 font-mono">
            v1.2
          </div>
        </div>

        {/* Real-time Status Balance Metrics Card */}
        <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-205">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Controle de Saldo
            </span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              Proporcional
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <p className="text-[10px] text-gray-500 leading-none">Total Pretendido</p>
              <p className="text-base font-display font-semibold text-gray-900 mt-1">
                {totalQuestions} <span className="text-xs text-gray-500">questões</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 leading-none">Alocadas Atuais</p>
              <p className="text-base font-display font-semibold mt-1 rounded text-indigo-700">
                {totalAllocated} <span className="text-xs text-gray-500">questões</span>
              </p>
            </div>
          </div>

          {/* Quick graphical progress bar of the question budget */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                totalAllocated === totalQuestions
                  ? "bg-emerald-500"
                  : totalAllocated > totalQuestions
                  ? "bg-rose-500"
                  : "bg-indigo-600"
              }`}
              style={{
                width: `${Math.min(100, (totalAllocated / totalQuestions) * 100)}%`,
              }}
            ></div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-gray-500">Status do Balanço:</span>
            {totalAllocated === totalQuestions ? (
              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" /> Saldo Perfeito
              </span>
            ) : totalAllocated > totalQuestions ? (
              <span className="text-rose-600 font-bold">
                Excedeu {totalAllocated - totalQuestions} questões!
              </span>
            ) : (
              <span className="text-slate-500 font-medium">
                Faltam {totalQuestions - totalAllocated} questões
              </span>
            )}
          </div>
        </div>

        {/* Guided Steps Interactive Timeline */}
        <div className="flex-1 space-y-1">
          <p className="text-[9px] uppercase font-extrabold tracking-widest text-gray-400 mb-2 px-1">
            Progresso da Configuração
          </p>
          <div className="space-y-1">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = answersConfirmed[step.id];
              let isSkipped = false;

              // Check if step is skipped dynamically based on rules (e.g. step 8 or 9 when quota reaches 0)
              if (step.id === 8 && numMultipleChoice === totalQuestions && answersConfirmed[7]) {
                isSkipped = true;
              }
              if (
                step.id === 9 &&
                numMultipleChoice + numCheckbox === totalQuestions &&
                answersConfirmed[8]
              ) {
                isSkipped = true;
              }

              return (
                <button
                  key={step.id}
                  disabled={loading}
                  onClick={() => handleJumpToStep(step.id)}
                  className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold"
                      : isSkipped
                      ? "bg-gray-100/50 border border-transparent text-gray-400 opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50 border border-transparent text-gray-700"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isSkipped ? (
                      <span className="text-[9px] w-5 h-5 border border-dashed border-gray-300 rounded-full flex items-center justify-center font-mono">
                        Ø
                      </span>
                    ) : isCompleted && !isActive ? (
                      <span className="text-[10px] w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                        ✓
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-300 bg-white text-gray-600"
                        }`}
                      >
                        {step.id}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs ${isActive ? "font-bold text-gray-900" : "font-medium"}`}>
                      {step.label}
                    </p>
                    {isCompleted && !isSkipped && (
                      <p className="text-[10px] text-gray-500 font-mono truncate">
                        {getStepValueDisplay(step.id)}
                      </p>
                    )}
                    {isSkipped && (
                      <p className="text-[9px] text-gray-400 uppercase italic">Pulado automaticamente</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Empathy System Prompt Context Box */}
        <div className="pt-4 mt-4 border-t border-gray-100">
          <div className="bg-indigo-50 rounded-xl p-3.5 border border-indigo-100">
            <p className="text-[11px] text-indigo-800 font-medium leading-relaxed">
              "Agindo como um entrevistador rigoroso. Avaliação em tempo real e controle de saldo para assegurar que seu formulário funcione perfeitamente!"
            </p>
          </div>
        </div>
      </aside>

      {/* 2. Main Workarea Frame */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header Utilities */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-gray-600">
              Modo Conectado: Google Apps Script API V2
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {currentTime}
            </span>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <span>Filtro de Citação: Ativo</span>
          </div>
        </header>

        {/* Interactive Workspace Area Container */}
        <div className="flex-1 overflow-y-auto p-12 flex flex-col justify-between">
          <div className="max-w-2xl mx-auto w-full space-y-8 flex-1 flex flex-col justify-center">
            
            {mode === "interview" ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* Step Ribbon Badge */}
                  <div>
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-indigo-150">
                      Pergunta {currentStep.toString().padStart(2, "0")} de 10
                    </span>
                  </div>

                  {/* Principal Question Title */}
                  <h2 className="text-2xl font-light text-gray-900 leading-tight">
                    {currentStepObj.questionText.split(" ").map((word, i) => {
                      const isHighlight =
                        word.toLowerCase().includes("id") ||
                        word.toLowerCase().includes("título") ||
                        word.toLowerCase().includes("descrição") ||
                        word.toLowerCase().includes("dificuldade") ||
                        word.toLowerCase().includes("total") ||
                        word.toLowerCase().includes("pontuação") ||
                        word.toLowerCase().includes("múltipla") ||
                        word.toLowerCase().includes("caixa") ||
                        word.toLowerCase().includes("lista") ||
                        word.toLowerCase().includes("material");
                      return (
                        <span key={i} className={isHighlight ? "font-semibold text-indigo-900" : ""}>
                          {word}{" "}
                        </span>
                      );
                    })}
                  </h2>

                  <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                    {currentStepObj.helpText}
                  </p>

                  {/* Input options / fields depending on question */}
                  <div className="mt-6">
                    {currentStep === 4 ? (
                      /* DIFFICULTY UNIQUE SELECT CARDS BUTTONS */
                      <div className="space-y-3">
                        {(["Fácil", "Médio", "Difícil"] as const).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => handleDifficultySelect(lvl)}
                            className={`w-full flex items-center justify-between p-4 bg-white border rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left shadow-xs cursor-pointer ${
                              difficulty === lvl
                                ? "border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-500"
                                : "border-gray-200"
                            }`}
                          >
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{lvl}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {lvl === "Fácil" &&
                                  "Perguntas diretas, curtas e de memorização. Alternativas sucintas."}
                                {lvl === "Médio" &&
                                  "Perguntas mais descritivas, exigindo interpretação moderada e frases completas."}
                                {lvl === "Difícil" &&
                                  "Cenários complexos, distratores densos e altamente verossímeis."}
                              </p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                difficulty === lvl
                                  ? "border-indigo-600 text-indigo-600"
                                  : "border-gray-300"
                              }`}
                            >
                              {difficulty === lvl && (
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : currentStep === 10 ? (
                      /* STEP 10: MASSIVE BASE TEXTAREA AREA */
                      <div className="space-y-2">
                        <textarea
                          rows={6}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="Cole aqui seu conteúdo base ou texto didático..."
                          className="w-full bg-white border border-gray-300 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner resize-none font-sans"
                        />
                        <div className="flex justify-between items-center text-[11px] text-gray-400">
                          <span>Escreva no mínimo 15 caracteres do material de leitura.</span>
                          <span>{inputValue.length} caracteres</span>
                        </div>
                      </div>
                    ) : currentStep === 9 ? (
                      /* DYNAMIC PRE-STEP 9 DIALOG VALUE AUTOFILL */
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-250 text-xs text-amber-900 leading-relaxed">
                          <strong>Preenchimento Automático do Saldo:</strong> Como restam{" "}
                          <span className="font-bold underline">
                            {totalQuestions - (numMultipleChoice + numCheckbox)}
                          </span>{" "}
                          questões para atingir o total planejado de {totalQuestions} questões, elas
                          serão obrigatoriamente do tipo <strong>Lista Suspensa</strong>, correto?
                        </div>
                        <input
                          type="number"
                          value={inputValue}
                          disabled={true}
                          className="w-full bg-gray-100 border border-gray-300 rounded-xl px-5 py-3.5 text-sm cursor-not-allowed text-gray-500 font-mono"
                        />
                      </div>
                    ) : (
                      /* ALL OTHER TRADITIONAL TEXT AND NUMBER INPUT FIELDS */
                      <input
                        type={
                          currentStep === 5 ||
                          currentStep === 6 ||
                          currentStep === 7 ||
                          currentStep === 8
                            ? "number"
                            : "text"
                        }
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Digite sua resposta aqui para o entrevistador..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            validateAndAdvance();
                          }
                        }}
                        className="w-full bg-white border border-gray-300 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner transition-shadow font-sans"
                      />
                    )}
                  </div>

                  {/* Real-time Dynamic Validation Error Alert message banner */}
                  {inputError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                      <div>
                        <p className="font-semibold">Erro de Validação do Entrevistador</p>
                        <p className="mt-0.5 text-rose-700/90 leading-relaxed">{inputError}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Interactive Control Buttons */}
                  <div className="flex items-center gap-3 pt-4">
                    {currentStep > 1 && (
                      <button
                        onClick={handleGoBack}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-5 py-3 text-sm font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 bg-white text-gray-700 hover:text-gray-900 transition-colors shadow-xs cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Voltar</span>
                      </button>
                    )}
                    <button
                      onClick={validateAndAdvance}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl hover:shadow shadow-sm transition-all cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Processando inteligência...</span>
                        </>
                      ) : currentStep === 10 ? (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-200" />
                          <span>Gerar Prova e script do Google Forms</span>
                        </>
                      ) : (
                        <>
                          <span>Confirmar e Próximo</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              /* RESULTS VIEWER TABBED AREA IF EXAM ALREADY GENERATED */
              <div className="space-y-6 flex-1 flex flex-col justify-start">
                
                {/* Visual Accent Header and Back reset button */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200 shrink-0">
                  <div>
                    <h2 className="text-xl font-display font-bold text-gray-900 leading-tight">
                      {title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Gerado com sucesso para o ID de Formulário: <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{formId}</code>
                    </p>
                  </div>
                  <button
                    onClick={handleRestart}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-sm cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Gerar Nova Prova</span>
                  </button>
                </div>

                {/* Navigation Tab Controllers */}
                <div className="flex border-b border-gray-150 shrink-0">
                  <button
                    onClick={() => setActiveTab("review")}
                    className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeTab === "review"
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>1. Prova Elaborada</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("code")}
                    className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeTab === "code"
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                    <span>2. Código Google Apps Script</span>
                  </button>
                </div>

                {/* Sub-panels display container depending on selection */}
                <div className="flex-1 overflow-visible">
                  {errorMessage && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
                      <p className="font-bold">Aviso de Erro:</p>
                      <p className="mt-1">{errorMessage}</p>
                    </div>
                  )}

                  {activeTab === "review" ? (
                    <ReviewTab
                      questions={generatedQuestions}
                      difficulty={difficulty}
                      points={pointsPerQuestion}
                    />
                  ) : (
                    <CodeTab scriptCode={generatedScript} />
                  )}
                </div>

                {/* Embedded prompt message requirement guide footer */}
                {activeTab === "code" && (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-650 space-y-2 mt-4">
                    <p className="font-bold text-gray-800">Pronto para rodar no Google Forms:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-gray-600">
                      <li>Acesse seu formulário no Google Forms.</li>
                      <li>No canto superior direito, clique nos três pontinhos (⋮) e selecione "Apps script".</li>
                      <li>Apague qualquer código existente, cole exatamente o código acima e clique no ícone de disquete para Salvar.</li>
                      <li>Clique em "Executar" no menu superior e conceda as permissões de acesso. As questões aparecerão magicamente no seu formulário!</li>
                    </ol>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Active Overlay loading state indicator */}
          {loading && (
            <div className="fixed inset-0 bg-white/75 backdrop-blur-xs flex flex-col items-center justify-center z-50">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 max-w-sm w-full flex flex-col items-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <Sparkles className="w-5 h-5 text-indigo-600 absolute animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 font-display">Elaborando Prova Pedagógica</p>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    Nossa IA está formulando questões no nível <strong className="text-indigo-600">{difficulty}</strong>, distribuindo e aplicando feedbacks didáticos ricos...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Persistent visual bottom footer info */}
          <footer className="mt-12 pt-6 border-t border-gray-150 flex items-center justify-between text-[11px] text-gray-400 shrink-0">
            <div>
              Organização Cíclica: <span className="font-bold text-gray-500">Múltipla Escolha → Caixa de Seleção → Lista Suspensa</span>
            </div>
            <div>
              Design Minimalist &bull; Desenvolvido para Professores
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
