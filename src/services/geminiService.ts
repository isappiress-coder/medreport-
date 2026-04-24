import { GoogleGenAI } from "@google/genai";
import { DoctorConfig, Patient, TabType } from "../types";

// ATENÇÃO: Chave de API inserida conforme solicitação do usuário. 
// Em ambiente de produção, recomenda-se o uso de Variáveis de Ambiente (Secrets).
const API_KEY = "AIzaSyCRWxmfLm6U9GBpDlkSnM-OoulKZ9-5-IA";
const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `Você é um Médico Especialista em Auditoria e Redação Clínica de alto nível.
Sua missão é atuar como um "Copiloto Médico", transformando anotações brutas de prontuário em documentos técnicos impecáveis.

Diferenciação por Tipo de Documento:
1. RESUMO CLÍNICO: Foco em linha do tempo, continuidade do cuidado e clareza para outros profissionais.
2. LAUDO MÉDICO: Linguagem extremamente técnica, foco em achados semiológicos, exames e hipótese diagnóstica.
3. ATESTADO MÉDICO: Conciso, obedecendo às normas do CFM. Deve conter o motivo (se autorizado), tempo de dispensa e orientações.
4. RELATÓRIO INSS: Foco em INCAPACIDADE. Descrever limitações funcionais (ex: não consegue deambular, não suporta carga). Deve ser robusto para perícia.
5. ALTA HOSPITALAR: Consolidado da internação, exames críticos de saída e plano terapêutico domiciliar.

Regras de Ouro:
- NUNCA invente dados. Se algo estiver faltando, ignore ou use "[Dado não informado]".
- Output exclusivamente em HTML estruturado (Tags: <h1>, <h2>, <p>, <ul>, <li>, <strong>).
- Use terminologia médica atualizada (ex: "Clitíase" em vez de "pedra", "Paresia" em vez de "fraqueza").
- Formatação impecável para visualização em papel A4.`;

const PROMPT_TEMPLATES: Record<TabType, string> = {
  resumo: "Estruture um RESUMO CLÍNICO para transferência ou acompanhamento ambulatorial.",
  laudo: "Elabore um LAUDO MÉDICO PERICIAL/DIAGNÓSTICO com rigor técnico.",
  atestado: "Gere um ATESTADO MÉDICO de afastamento, garantindo validade jurídica e ética.",
  inss: "Crie um RELATÓRIO MÉDICO PARA O INSS (PERÍCIA), enfatizando as limitações laborais e o nexo causal se aplicável.",
  alta: "Produz um RELATÓRIO DE ALTA HOSPITALAR detalhando desfecho e orientações pós-alta.",
  pacientes: "",
  config: ""
};

export async function generateMedicalReport(
  type: TabType,
  patient: Patient,
  doctor: DoctorConfig,
  clinicalData: string,
  cid?: string
): Promise<string> {
  const prompt = `
[CONTEXTO DO DOCUMENTO]
Tipo: ${PROMPT_TEMPLATES[type] || PROMPT_TEMPLATES.resumo}
Paciente: ${patient.name} | CPF: ${patient.cpf || '---'} | RG: ${patient.rg || '---'}
Médico Assistente: ${doctor.name} | CRM: ${doctor.crm} ${doctor.rqe ? `| RQE: ${doctor.rqe}` : ''}
CID-10 Informado: ${cid || 'Não definido'}

[DADOS BRUTOS DO PRONTUÁRIO]
${clinicalData}

[INSTRUÇÃO DE FORMATAÇÃO]
Retorne apenas o conteúdo HTML interno. Ao final, adicione esta estrutura de assinatura:
<div class="doc-signature">
  <div class="doc-signature-line"></div>
  <p><strong>${doctor.name}</strong></p>
  <p>CRM: ${doctor.crm} ${doctor.rqe ? `| RQE: ${doctor.rqe}` : ''}</p>
</div>
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error("O modelo não retornou nenhum texto.");
    }
    
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("A chave API fornecida parece ser inválida ou expirou.");
      }
    }
    throw new Error("Erro na comunicação com a IA. Por favor, tente novamente em alguns instantes.");
  }
}
