import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI client (safe server-side initialization)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Host health route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Generate quiz and Apps Script code route
app.post("/api/generate", async (req, res) => {
  try {
    const {
      formId,
      title,
      description,
      difficulty,
      totalQuestions,
      pointsPerQuestion,
      numMultipleChoice,
      numCheckbox,
      numDropdown,
      baseMaterial,
    } = req.body;

    if (!formId || !title || !totalQuestions || !pointsPerQuestion) {
      return res.status(400).json({ error: "Parâmetros obrigatórios ausentes." });
    }

    const systemPrompt = `Você é um Assistente Educacional e Programador Sênior em Google Apps Script. Seu objetivo é ajudar a criar uma prova de alta qualidade de forma empática no Google Forms através de um script Google Apps Script pronto para ser copiado e colado, de acordo com as preferências do professor.

INFORMAÇÕES DA PROVA:
- ID do Formulário: "${formId}"
- Título da Atividade: "${title}"
- Descrição/Instruções: "${description || 'Prova gerada automaticamente.'}"
- Nível de Dificuldade: "${difficulty}" (pode ser "Fácil", "Médio" ou "Difícil")
- Pontuação por questão: exatamente ${pointsPerQuestion} pontos
- Distribuição de Questões:
  * Múltipla Escolha: ${numMultipleChoice} questão(ões)
  * Caixa de Seleção (Multi-seleção): ${numCheckbox} questão(ões)
  * Lista Suspensa: ${numDropdown} questão(ões)
  * Total de questões: ${totalQuestions}

CONTEÚDO BASE PARA ELABORAÇÃO:
"${baseMaterial || 'Nenhum material fornecido. Crie perguntas gerais apropriadas sobre tópicos acadêmicos padrão.'}"

DIRETRIZES DE COMPLEXIDADE (NÍVEIS DE DIFICULDADE):
- Fácil: Perguntas diretas, curtas e de memorização básica. Opções de resposta breves e objetivas (poucas palavras).
- Médio: Perguntas mais descritivas, exigindo compreensão do contexto. Opções de resposta em frases completas e com distratores moderados.
- Difícil: Perguntas longas, com cenários complexos, problemas práticos ou estudos de caso da vida real (estilo provas de concurso). Opções de resposta densas, detalhadas e com distratores falsos altamente verossímeis e muito similares entre si, exigindo profunda capacidade analítica do aluno.

DIRETRIZES DE ELABORAÇÃO E FORMATAÇÃO (ESTRITAS):
- Geral: É ESTRITAMENTE PROIBIDO inserir expressões que denunciem a origem da informação, como "Segundo o texto", "De acordo com o texto". É ESTRITAMENTE PROIBIDO incluir marcadores de citação gerados por IA (como asteriscos, notas de rodapé, ou notas de citação como "[1]") no final das perguntas, opções ou feedbacks. O texto gerado deve ser 100% limpo. Formule a pergunta diretamente.
- Caixa de Seleção: Você DEVE informar explicitamente no final do título da pergunta quantas opções o aluno deve marcar (Ex: "[Selecione 2 opções]" ou "[Selecione 3 opções]"). O número de opções corretas do tipo Caixa de Seleção DEVE ser entre 2 e 3 para ser condizente com a instrução.
- Lista Suspensa: O formato da pergunta DEVE ser no estilo "preencha a lacuna", contendo obrigatoriamente uma linha sublinhada contínua "________" no meio, início ou fim da frase. As opções desta pergunta servirão para preencher exatamente esta lacuna.
- Padrão Cíclico e Numeração: Organize as questões geradas em um ciclo estrito de alternância: 1º Múltipla Escolha, 2º Caixa de Seleção, 3º Lista Suspensa, e repita esse padrão continuamente de forma a intercalar os tipos até acabarem as questões. Se um dos tipos esgotar, continue alternando entre os tipos de balanceamento que restaram no saldo. A numeração sequencial (1, 2, 3...) no título DEVE ser aplicada após estabelecer essa ordem, para manter a numeração perfeita no formulário. Todas as perguntas geradas devem conter no mínimo 4 alternativas.
- Cada pergunta gerada deve ter DOIS textos de feedback distintos: um para respostas corretas (reforçando o aprendizado) e outro para incorretas (explicando o erro de forma pedagógica).

DIRETRIZES SINTÁTICAS DO CÓDIGO GOOGLE APPS SCRIPT (OBRIGATÓRIO):
O script Google Apps Script gerado no campo 'scriptSource' deve ser em JavaScript puro e aderir estritamente a estas sintaxes:
1. Usar: var form = FormApp.openById('${formId}');
2. Definir o título e a descrição fornecidos:
   form.setTitle('${title}');
   form.setDescription('${description || 'Prova gerada automaticamente pelo assistente.'}');
3. Aplicar estritamente as configurações globais abaixo:
   form.setIsQuiz(true);
   form.setProgressBar(true);
   form.setCollectEmail(true);
   form.setLimitOneResponsePerUser(true);
4. Criar um loop inicial que capture itens existentes com form.getItems() e os apague com form.deleteItem() antes de injetar novos para garantir que a prova seja recriada limpa:
   var items = form.getItems();
   for (var i = 0; i < items.length; i++) {
     form.deleteItem(items[i]);
   }
5. Estruturar um Array de Objetos integrado no próprio código Apps Script contendo as questões já organizadas estritamente na ordem cíclica correta que você elaborou. Cada objeto de questão deve ter propriedades limpas: tipo_de_questao ('MULTIPLE_CHOICE', 'CHECKBOX' ou 'DROP_DOWN'), título (com numeração perfeita, ex: "1. Sua pergunta"), opções (array de strings), respostas_corretas (array com índices das respostas corretas), feedback_correto (string) e feedback_incorreto (string).
6. FORMATAÇÃO OBRIGATÓRIA DAS OPÇÕES:
   - Para "Múltipla Escolha" (MULTIPLE_CHOICE) e "Caixa de Seleção" (CHECKBOX), inicie as alternativas com letras (Ex: "A) Primeira", "B) Segunda", "C) Terceira", "D) Quarta").
   - Para "Lista Suspensa" (DROP_DOWN), É PROIBIDO usar letras; coloque apenas o texto limpo (Ex: "primeira", "segunda").
7. Loop de Injeção: Faça um loop que percorra esse Array de Objetos e injete as questões dependendo do tipo usando form.addMultipleChoiceItem(), form.addCheckboxItem() ou form.addListItem(). Exemplo de estrutura:
   \n\n[ESTRUTURA EXEMPLO DO SCRIPT]:\n
   function criarProva() {
     var form = FormApp.openById('{formId}');
     form.setTitle('{title}');
     form.setDescription('{description}');
     form.setIsQuiz(true);
     form.setProgressBar(true);
     form.setCollectEmail(true);
     form.setLimitOneResponsePerUser(true);

     // Limpar itens anteriores
     var items = form.getItems();
     for (var i = 0; i < items.length; i++) {
       form.deleteItem(items[i]);
     }

     var questoes = [ ... array de objetos ... ];

     for (var j = 0; j < questoes.length; j++) {
       var q = questoes[j];
       var item;
       if (q.tipo_de_questao === 'MULTIPLE_CHOICE') {
         item = form.addMultipleChoiceItem();
       } else if (q.tipo_de_questao === 'CHECKBOX') {
         item = form.addCheckboxItem();
       } else if (q.tipo_de_questao === 'DROP_DOWN') {
         item = form.addListItem();
       }

       item.setTitle(q.titulo);
       item.setRequired(true);
       item.setPoints({pointsPerQuestion});

       var choices = [];
       for (var k = 0; k < q.opcoes.length; k++) {
         var isCorrect = q.respostas_corretas.indexOf(k) !== -1;
         choices.push(item.createChoice(q.opcoes[k], isCorrect));
       }
       item.setChoices(choices);

       var feedCorreto = FormApp.createFeedback().setText(q.feedback_correto).build();
       item.setFeedbackForCorrect(feedCorreto);
       var feedIncorreto = FormApp.createFeedback().setText(q.feedback_incorreto).build();
       item.setFeedbackForIncorrect(feedIncorreto);

       if (j < questoes.length - 1) {
         form.addPageBreakItem();
       }
       Utilities.sleep(1500);
     }
   }
   \n\n
8. Pontuação e Obrigatoriedade: Use item.setRequired(true); e item.setPoints(${pointsPerQuestion}); em todas as questões geradas no loop como mostrado acima.
9. APLICAÇÃO DOS FEEDBACKS (SINTAXE OBRIGATÓRIA): Use estritamente conforme o exemplo com setText() e build().
10. APENAS UMA PERGUNTA POR TELA: Adicione form.addPageBreakItem(); APENAS se não for a última questão do array.
11. DELAY: Adicione Utilities.sleep(1500); no final de cada iteração de salvamento.

Gere a resposta respeitando estritamente o esquema JSON configurado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Por favor, elabore as questões e escreva o script Google Apps Script perfeito baseado nas preferências e no material do professor.",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              description: "Lista de questões elaboradas na ordem cíclica definida.",
              items: {
                type: Type.OBJECT,
                properties: {
                  tipo: {
                    type: Type.STRING,
                    description: "O tipo da questão (MULTIPLE_CHOICE, CHECKBOX ou DROP_DOWN)"
                  },
                  titulo: {
                    type: Type.STRING,
                    description: "O título da questão formatado, incluindo numeração sequencial (ex: '1. ...')"
                  },
                  opcoes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Lista de alternativas de respostas."
                  },
                  respostasCorretas: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: "Índice(s) da(s) alternativa(s) correta(s) (base 0)"
                  },
                  feedbackCorreto: {
                    type: Type.STRING,
                    description: "Feedback pedagógico rico para a resposta certa."
                  },
                  feedbackIncorreto: {
                    type: Type.STRING,
                    description: "Feedback pedagógico claro e explicativo para a resposta fácil/errada."
                  }
                },
                required: ["tipo", "titulo", "opcoes", "respostasCorretas", "feedbackCorreto", "feedbackIncorreto"]
              }
            },
            scriptSource: {
              type: Type.STRING,
              description: "Código pronto Google Apps Script completo e formatado seguindo as diretrizes técnicas necessárias."
            }
          },
          required: ["questions", "scriptSource"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Resposta vazia do modelo Gemini.");
    }

    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Erro na rota /api/generate:", error);
    res.status(500).json({ error: error.message || "Erro interno ao processar a requisição." });
  }
});

// Configure Vite or production fallback
async function boot() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

boot();
