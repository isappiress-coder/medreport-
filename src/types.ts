export interface Patient {
  id: string;
  name: string;
  cpf?: string;
  rg?: string;
}

export interface DoctorConfig {
  name: string;
  crm: string;
  rqe?: string;
}

export interface Report {
  id: string;
  patientId: string;
  type: string;
  title: string;
  content: string;
  createdAt: number;
}

export type TabType = 'resumo' | 'laudo' | 'atestado' | 'inss' | 'alta' | 'pacientes' | 'config';

export const TAB_CONFIG: Record<string, { title: string; desc: string }> = {
  'resumo': { title: 'Resumo Clínico', desc: 'Produz um relatório clínico resumido.' },
  'laudo': { title: 'Laudo Médico', desc: 'Emite documento técnico conclusivo.' },
  'atestado': { title: 'Atestado Médico', desc: 'Documento para justificativa de afastamento.' },
  'inss': { title: 'Relatório para INSS', desc: 'Focado em incapacidade laborativa.' },
  'alta': { title: 'Relatório de Alta', desc: 'Documenta o encerramento da internação.' }
};
