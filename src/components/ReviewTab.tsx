import React from "react";
import { Question } from "../types";
import { Check, X, BookOpen, AlertCircle, Award } from "lucide-react";
import { motion } from "motion/react";

interface ReviewTabProps {
  questions: Question[];
  difficulty: string;
  points: number;
}

export default function ReviewTab({ questions, difficulty, points }: ReviewTabProps) {
  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-2 animate-bounce" />
        <p className="text-sm">Nenhuma questão disponível para visualização.</p>
      </div>
    );
  }

  const getDifficultyBadgeColor = (diff: string) => {
    switch (diff) {
      case "Fácil":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Médio":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Difícil":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return "Múltipla Escolha";
      case "CHECKBOX":
        return "Caixa de Seleção";
      case "DROP_DOWN":
        return "Lista Suspensa";
      default:
        return "Múltipla Escolha";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h3 className="font-display font-semibold text-gray-800">
            Resumo do Conteúdo Elaborado
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getDifficultyBadgeColor(difficulty)}`}>
            Dificuldade: {difficulty}
          </span>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700">
            {points} pts por questão
          </span>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full border border-gray-300 bg-white text-gray-700">
            {questions.length} Questões
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const isCheckbox = question.tipo === "CHECKBOX";
          const isDropdown = question.tipo === "DROP_DOWN";

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs relative overflow-hidden"
            >
              {/* Type Badge */}
              <div className="absolute top-6 right-6">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                  {getQuestionTypeLabel(question.tipo)}
                </span>
              </div>

              {/* Title */}
              <div className="pr-24">
                <h4 className="font-display text-base font-semibold text-gray-900 leading-snug">
                  {question.titulo}
                </h4>
              </div>

              {/* Options */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {question.opcoes.map((option, optIdx) => {
                  const isCorrect = question.respostasCorretas.includes(optIdx);

                  return (
                    <div
                      key={optIdx}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-sm transition-all ${
                        isCorrect
                          ? "bg-emerald-50/50 border-emerald-200 text-emerald-950 font-medium"
                          : "bg-gray-50/30 border-gray-100 text-gray-700"
                      }`}
                    >
                      {isCorrect ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0 mt-0.5 flex items-center justify-center text-[10px] text-gray-400 font-mono font-bold">
                          {isDropdown ? "" : String.fromCharCode(65 + optIdx)}
                        </div>
                      )}
                      <span>{option}</span>
                    </div>
                  );
                })}
              </div>

              {/* Feedbacks Grid */}
              <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Correct Feedback */}
                <div className="p-3.5 rounded-xl bg-emerald-50/20 border border-emerald-100/50">
                  <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-semibold mb-1">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Feedback Pedagógico para Acerto:</span>
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed italic">
                    "{question.feedbackCorreto}"
                  </p>
                </div>

                {/* Incorrect Feedback */}
                <div className="p-3.5 rounded-xl bg-rose-50/20 border border-rose-100/50">
                  <div className="flex items-center gap-1.5 text-rose-800 text-xs font-semibold mb-1">
                    <X className="w-3.5 h-3.5 text-rose-500" />
                    <span>Feedback Pedagógico para Erro:</span>
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed italic">
                    "{question.feedbackIncorreto}"
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
