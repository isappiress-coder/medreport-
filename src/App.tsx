/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  FileText, 
  FileCheck2, 
  CalendarOff, 
  BriefcaseMedical, 
  DoorOpen, 
  Users, 
  Settings, 
  Search, 
  Bell, 
  Wand2, 
  Download, 
  Edit3,
  FileQuestion,
  User,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import { 
  Patient, 
  DoctorConfig, 
  TabType, 
  TAB_CONFIG 
} from './types';
import { generateMedicalReport } from './services/geminiService';

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<TabType>('resumo');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctorConfig, setDoctorConfig] = useState<DoctorConfig>({ name: 'Dr. Médico', crm: '---', rqe: '' });
  const [selectedPatientId, setSelectedPatientId] = useState<string>('none');
  const [rawInput, setRawInput] = useState('');
  const [cidInput, setCidInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Patient form state
  const [newPatient, setNewPatient] = useState({ name: '', cpf: '', rg: '' });

  const documentRef = useRef<HTMLDivElement>(null);

  // --- Persistence ---
  useEffect(() => {
    const savedPatients = localStorage.getItem('medreport_patients');
    const savedDoctor = localStorage.getItem('medreport_doctor');
    
    if (savedPatients) setPatients(JSON.parse(savedPatients));
    if (savedDoctor) setDoctorConfig(JSON.parse(savedDoctor));
  }, []);

  useEffect(() => {
    localStorage.setItem('medreport_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('medreport_doctor', JSON.stringify(doctorConfig));
  }, [doctorConfig]);

  // --- Handlers ---
  const handleSavePatient = () => {
    if (!newPatient.name.trim()) return alert("O nome é obrigatório!");
    
    const patient: Patient = {
      id: Date.now().toString(),
      ...newPatient
    };
    
    setPatients(prev => [...prev, patient]);
    setNewPatient({ name: '', cpf: '', rg: '' });
    alert("Paciente cadastrado com sucesso!");
  };

  const handleSaveDoctor = () => {
    if (!doctorConfig.name || !doctorConfig.crm) return alert("Nome e CRM são obrigatórios!");
    alert("Dados do médico salvos!");
  };

  const handleGenerate = async () => {
    console.log("Botão clicado. Aba ativa:", activeTab);
    
    if (selectedPatientId === 'none') {
      console.warn("Nenhum paciente selecionado");
      return alert("Selecione um paciente no topo da página!");
    }
    
    if (!rawInput.trim()) {
      console.warn("Input vazio");
      return alert("Insira os dados clínicos no campo de texto!");
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) {
      console.error("Paciente não encontrado no estado");
      return;
    }

    console.log("Iniciando geração com paciente:", patient.name);
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateMedicalReport(
        activeTab,
        patient,
        doctorConfig,
        rawInput,
        cidInput
      );
      console.log("Geração concluída com sucesso");
      setGeneratedHtml(result);
    } catch (err) {
      console.error("Erro capturado no catch do App.tsx:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsGenerating(false);
    }
  };


  const exportPDF = () => {
    if (!documentRef.current) return;
    const element = documentRef.current;
    const opt = {
      margin:       0,
      filename:     `MedReport_${activeTab}_${Date.now()}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  const isDocTab = ['resumo', 'laudo', 'atestado', 'inss', 'alta'].includes(activeTab);

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-sidebar-bg flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 text-white text-xl font-semibold">
            <Activity className="text-sky-400" />
            <span>MedReport Pro</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-sidebar-text font-bold mb-2 pl-3">Documentos</span>
          
          {[
            { id: 'resumo', label: 'Resumo Clínico', icon: FileText },
            { id: 'laudo', label: 'Laudo Médico', icon: FileCheck2 },
            { id: 'atestado', label: 'Atestado Médico', icon: CalendarOff },
            { id: 'inss', label: 'Relatório INSS', icon: BriefcaseMedical },
            { id: 'alta', label: 'Relatório de Alta', icon: DoorOpen },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}

          <span className="text-[10px] uppercase tracking-wider text-sidebar-text font-bold mb-2 mt-6 pl-3">Gestão</span>
          
          <button 
            onClick={() => setActiveTab('pacientes')}
            className={`sidebar-nav-item ${activeTab === 'pacientes' ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Pacientes</span>
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className={`sidebar-nav-item ${activeTab === 'config' ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span>Médicos / Config</span>
          </button>
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs">
              {doctorConfig.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <strong className="text-white text-sm truncate">{doctorConfig.name}</strong>
              <span className="text-sidebar-text text-[10px] truncate">CRM: {doctorConfig.crm}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-[70px] bg-white border-b border-border flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3 text-text-muted bg-bg-app px-4 py-2 rounded-full w-[300px]">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar paciente..." 
              className="bg-transparent border-none outline-none w-full text-sm"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-primary-light px-4 py-2 rounded-lg border border-primary/20">
              <span className="medical-label text-primary">Paciente Ativo:</span>
              <select 
                id="patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-transparent border-none outline-none text-primary font-medium cursor-pointer text-sm"
              >
                <option value="none">Selecione um paciente...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.cpf ? `(${p.cpf})` : ''}</option>
                ))}
              </select>
            </div>
            <button className="p-2 text-text-muted hover:text-text-main transition-colors">
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {isDocTab && (
              <motion.div 
                key="editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-6 h-full"
              >
                {/* Input Panel */}
                <div className="w-[400px] bg-white rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-border bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-text-main">{TAB_CONFIG[activeTab]?.title}</h2>
                    <p className="text-xs text-text-muted mt-1">{TAB_CONFIG[activeTab]?.desc}</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                      <div className="p-3 bg-critical/10 border border-critical/20 text-critical text-sm rounded-lg font-medium">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="medical-label">Dados Clínicos Brutos</label>
                      <textarea 
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                        placeholder="Cole aqui a evolução, exames, histórico e queixas..."
                        className="w-full h-64 p-3 border border-border rounded-lg text-[14px] bg-gray-50 focus:bg-white focus:border-primary outline-none transition-all resize-none leading-relaxed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="medical-label">CID-10 Principal</label>
                      <input 
                        type="text" 
                        value={cidInput}
                        onChange={(e) => setCidInput(e.target.value)}
                        placeholder="Ex: M54.5"
                        className="w-full p-3 border border-border rounded-lg text-[14px] focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 border-t border-border mt-auto">
                    <button 
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Wand2 size={18} />
                      {isGenerating ? 'Gerando...' : 'Gerar Documento'}
                    </button>
                  </div>
                </div>

                {/* Preview Panel */}
                <div className="flex-1 bg-white rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-border flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-text-main">Visualização</h2>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50" disabled={!generatedHtml}>
                        <Edit3 size={16} />
                        Editar
                      </button>
                      <button 
                        onClick={exportPDF}
                        disabled={!generatedHtml}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold shadow-sm disabled:opacity-50 transition-all"
                      >
                        <Download size={16} />
                        PDF
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-200 p-8 overflow-y-auto relative">
                    {isGenerating && (
                      <div className="absolute inset-0 bg-slate-200/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-slate-300 border-t-primary rounded-full animate-spin"></div>
                        <p className="font-semibold text-text-muted">Estruturando documento médico...</p>
                      </div>
                    )}

                    <div className="bg-white shadow-xl mx-auto w-[210mm] min-h-[297mm] p-[20mm] document-page" id="document-content">
                      {generatedHtml ? (
                        <div ref={documentRef} dangerouslySetInnerHTML={{ __html: generatedHtml }} />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[200mm] text-text-muted gap-4 opacity-50">
                          <FileQuestion size={64} />
                          <p className="text-lg">Preencha os dados e clique em Gerar Documento.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'pacientes' && (
              <motion.div 
                key="pacientes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-text-main">Gestão de Pacientes</h2>
                  <p className="text-sm text-text-muted">Cadastre pacientes e acesse o histórico de laudos gerados.</p>
                </div>
                
                <div className="flex gap-6 flex-1 overflow-hidden">
                  <div className="w-96 bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col">
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                      <Plus size={18} className="text-primary" />
                      Novo Paciente
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="medical-label">Nome Completo *</label>
                        <input 
                          type="text" 
                          value={newPatient.name}
                          onChange={e => setNewPatient({...newPatient, name: e.target.value})}
                          placeholder="Ex: João da Silva" 
                          className="w-full p-2.5 border border-border rounded-lg outline-none focus:border-primary text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="medical-label">CPF</label>
                        <input 
                          type="text" 
                          value={newPatient.cpf}
                          onChange={e => setNewPatient({...newPatient, cpf: e.target.value})}
                          placeholder="000.000.000-00" 
                          className="w-full p-2.5 border border-border rounded-lg outline-none focus:border-primary text-sm font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="medical-label">RG</label>
                        <input 
                          type="text" 
                          value={newPatient.rg}
                          onChange={e => setNewPatient({...newPatient, rg: e.target.value})}
                          placeholder="00.000.000-0" 
                          className="w-full p-2.5 border border-border rounded-lg outline-none focus:border-primary text-sm font-mono font-bold"
                        />
                      </div>
                      <button 
                        onClick={handleSavePatient}
                        className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-bold text-sm mt-4 transition-colors"
                      >
                        Cadastrar Paciente
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
                    <h3 className="font-bold mb-4">Pacientes Cadastrados</h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      {patients.length === 0 ? (
                        <p className="text-text-muted text-sm italic text-center mt-8">Nenhum paciente cadastrado.</p>
                      ) : (
                        patients.map(p => (
                          <div 
                            key={p.id}
                            className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary-light transition-all cursor-pointer group"
                            onClick={() => setSelectedPatientId(p.id)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-bold text-text-main text-[15px]">{p.name}</h4>
                                <p className="text-xs text-text-muted mt-1">
                                  CPF: <span className="medical-numeric">{p.cpf || '---'}</span> | 
                                  RG: <span className="medical-numeric">{p.rg || '---'}</span>
                                </p>
                              </div>
                              <User size={16} className="text-text-muted group-hover:text-primary" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'config' && (
              <motion.div 
                key="config"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-xl"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-text-main">Configurações do Médico</h2>
                  <p className="text-sm text-text-muted">Configure os dados do médico para assinatura dos laudos.</p>
                </div>
                
                <div className="bg-white p-8 rounded-xl border border-border shadow-sm space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="medical-label">Nome do Médico *</label>
                      <input 
                        type="text" 
                        value={doctorConfig.name}
                        onChange={e => setDoctorConfig({...doctorConfig, name: e.target.value})}
                        className="w-full p-3 border border-border rounded-lg outline-none focus:border-primary text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="medical-label">CRM *</label>
                      <input 
                        type="text" 
                        value={doctorConfig.crm}
                        onChange={e => setDoctorConfig({...doctorConfig, crm: e.target.value})}
                        className="w-full p-3 border border-border rounded-lg outline-none focus:border-primary text-sm font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="medical-label">RQE (Especialidade)</label>
                      <input 
                        type="text" 
                        value={doctorConfig.rqe}
                        onChange={e => setDoctorConfig({...doctorConfig, rqe: e.target.value})}
                        className="w-full p-3 border border-border rounded-lg outline-none focus:border-primary text-sm font-mono font-bold"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveDoctor}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-bold transition-colors"
                  >
                    Salvar Dados do Médico
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
