import React, { useState, useMemo, useRef } from 'react';
import { ChevronRight, ChevronLeft, Save, Printer, CheckCircle, FileText, User, Smartphone, Wrench, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

type OSStatus = 'Orçamento' | 'Aprovado' | 'Em Serviço' | 'Aguardando Peça' | 'Finalizado' | 'Entregue';

interface ServiceOrder {
  id: string;
  date: string;
  client: { name: string; phone: string; document: string };
  device: { type: string; brand: string; model: string; serial: string };
  problem: { reported: string; condition: string };
  values: { parts: number; labor: number; discount: number };
  status: OSStatus;
}

const INITIAL_OS: ServiceOrder = {
  id: 'OS-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
  date: new Date().toLocaleDateString('pt-BR'),
  client: { name: '', phone: '', document: '' },
  device: { type: '', brand: '', model: '', serial: '' },
  problem: { reported: '', condition: '' },
  values: { parts: 0, labor: 0, discount: 0 },
  status: 'Orçamento',
};

const STEPS = [
  { id: 1, title: 'Cliente', icon: User },
  { id: 2, title: 'Aparelho', icon: Smartphone },
  { id: 3, title: 'Problema', icon: Wrench },
  { id: 4, title: 'Valores', icon: DollarSign },
  { id: 5, title: 'Finalização', icon: FileText },
];

const Input = ({ label, value, onChange, type = 'text', placeholder = '', maxLength }: any) => (
  <div className="flex flex-col gap-2 mb-6">
    <label className="text-sm font-bold text-slate-800 uppercase tracking-wider">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="p-4 text-lg border-2 border-slate-200 rounded-xl focus:border-orange-600 focus:ring-4 focus:ring-orange-600/20 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium"
    />
  </div>
);

const Textarea = ({ label, value, onChange, placeholder = '' }: any) => (
  <div className="flex flex-col gap-2 mb-6">
    <label className="text-sm font-bold text-slate-800 uppercase tracking-wider">{label}</label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="p-4 text-lg border-2 border-slate-200 rounded-xl focus:border-orange-600 focus:ring-4 focus:ring-orange-600/20 outline-none transition-all bg-slate-50 focus:bg-white resize-none text-slate-900 placeholder:text-slate-400 font-medium"
    />
  </div>
);

export default function App() {
  const [os, setOs] = useState<ServiceOrder>(INITIAL_OS);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const totalValue = useMemo(() => {
    const parts = Number(os.values.parts) || 0;
    const labor = Number(os.values.labor) || 0;
    const discount = Number(os.values.discount) || 0;
    return parts + labor - discount;
  }, [os.values]);

  const handleNext = () => {
    setDirection(1);
    setCurrentStep(p => Math.min(p + 1, 5));
  };
  
  const handlePrev = () => {
    setDirection(-1);
    setCurrentStep(p => Math.max(p - 1, 1));
  };

  const updateField = (section: keyof ServiceOrder, field: string, value: any) => {
    setOs(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const handlePrint = async () => {
    if (!printRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${os.id}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF da Ordem de Serviço.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleNewOS = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setOs({
      ...INITIAL_OS,
      id: 'OS-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
      date: new Date().toLocaleDateString('pt-BR')
    });
    setCurrentStep(1);
    setShowResetConfirm(false);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-200 selection:text-orange-900">
      
      {/* Top Bar - Hidden on Print */}
      <header className="bg-slate-900 text-white p-4 sm:p-6 sticky top-0 z-50 shadow-xl shadow-slate-900/10 print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="Biandricell" 
              className="h-16 sm:h-20 w-auto object-contain rounded-xl bg-white p-1.5"
              onError={(e) => {
                // Fallback visual caso a imagem ainda não tenha sido enviada
                e.currentTarget.src = 'https://placehold.co/200x64/ffffff/ea580c?text=BIANDRICELL&font=Montserrat';
              }}
            />
            <div className="hidden sm:block w-px h-8 bg-slate-700 mx-2"></div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-0.5">Cliente</div>
              <div className="font-bold text-xl truncate max-w-[200px] sm:max-w-xs text-slate-50">
                {os.client.name || 'Não identificado'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-0.5">Status</div>
              <div className="font-black text-orange-400 text-xl tracking-tight">
                {os.status}
              </div>
            </div>
            <button 
              onClick={handleNewOS}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-lg transition-colors"
            >
              Nova OS
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Hidden on Print */}
      <main className="max-w-4xl mx-auto p-4 sm:p-8 print:hidden">
        
        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-12 overflow-x-auto pb-6 pt-6 px-4 sm:px-8 -mx-4 sm:-mx-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isPast = currentStep > step.id;
            return (
              <React.Fragment key={step.id}>
                <button 
                  onClick={() => {
                    setDirection(step.id > currentStep ? 1 : -1);
                    setCurrentStep(step.id);
                  }}
                  className="flex flex-col items-center gap-3 group focus:outline-none shrink-0"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                    isActive 
                      ? 'border-orange-600 bg-orange-50 text-orange-600 scale-110 shadow-lg shadow-orange-600/20' 
                      : isPast 
                        ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800' 
                        : 'border-slate-200 bg-white text-slate-400 group-hover:border-slate-300'
                  }`}>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest hidden sm:block transition-colors ${
                    isActive ? 'text-orange-600' : isPast ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {step.title}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 sm:mx-8 rounded-full transition-colors duration-300 ${
                    isPast ? 'bg-slate-900' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form Area */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative min-h-[400px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full"
            >
              {currentStep === 1 && (
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Dados do Cliente</h2>
                  <Input label="Nome Completo" value={os.client.name} onChange={(v: string) => updateField('client', 'name', v)} placeholder="Ex: João da Silva" />
                  <Input label="Telefone / WhatsApp" value={os.client.phone} onChange={(v: string) => updateField('client', 'phone', v)} type="tel" placeholder="(00) 00000-0000" maxLength={15} />
                  <Input label="CPF ou CNPJ (Opcional)" value={os.client.document} onChange={(v: string) => updateField('client', 'document', v)} placeholder="000.000.000-00" maxLength={18} />
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Dados do Aparelho</h2>
                  <Input label="Tipo de Aparelho" value={os.device.type} onChange={(v: string) => updateField('device', 'type', v)} placeholder="Ex: Smartphone, Notebook, TV" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Marca" value={os.device.brand} onChange={(v: string) => updateField('device', 'brand', v)} placeholder="Ex: Samsung, Apple" />
                    <Input label="Modelo" value={os.device.model} onChange={(v: string) => updateField('device', 'model', v)} placeholder="Ex: Galaxy S21" />
                  </div>
                  <Input label="Nº de Série / IMEI" value={os.device.serial} onChange={(v: string) => updateField('device', 'serial', v)} placeholder="Opcional" />
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Relato do Problema</h2>
                  <Textarea label="Defeito Relatado pelo Cliente" value={os.problem.reported} onChange={(v: string) => updateField('problem', 'reported', v)} placeholder="Descreva o que o cliente informou..." />
                  <Textarea label="Condições do Aparelho (Arranhões, trincas, etc)" value={os.problem.condition} onChange={(v: string) => updateField('problem', 'condition', v)} placeholder="Descreva o estado físico do aparelho ao dar entrada..." />
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Orçamento</h2>
                  <Input label="Valor das Peças (R$)" value={os.values.parts || ''} onChange={(v: string) => updateField('values', 'parts', v)} type="number" placeholder="0.00" />
                  <Input label="Valor da Mão de Obra (R$)" value={os.values.labor || ''} onChange={(v: string) => updateField('values', 'labor', v)} type="number" placeholder="0.00" />
                  <Input label="Desconto (R$)" value={os.values.discount || ''} onChange={(v: string) => updateField('values', 'discount', v)} type="number" placeholder="0.00" />
                  
                  <div className="mt-8 p-6 sm:p-8 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xl shadow-slate-900/20">
                    <span className="text-lg font-bold uppercase tracking-widest text-slate-400">Total a Pagar</span>
                    <span className="text-5xl font-black text-orange-500 tracking-tighter">R$ {totalValue.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Finalização</h2>
                  
                  <div className="mb-10">
                    <label className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 block">Status da Ordem de Serviço</label>
                    <div className="relative">
                      <select 
                        value={os.status}
                        onChange={e => setOs(prev => ({ ...prev, status: e.target.value as OSStatus }))}
                        className="w-full p-5 text-xl border-2 border-slate-200 rounded-xl focus:border-orange-600 focus:ring-4 focus:ring-orange-600/20 outline-none transition-all bg-slate-50 focus:bg-white appearance-none font-black text-slate-900 cursor-pointer"
                      >
                        <option value="Orçamento">Orçamento</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Em Serviço">Em Serviço</option>
                        <option value="Aguardando Peça">Aguardando Peça</option>
                        <option value="Finalizado">Finalizado</option>
                        <option value="Entregue">Entregue</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight size={24} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <Input 
                    label="Código da Ordem de Serviço"  
                    onChange={(value: string) => setOs(prev => ({ ...prev, id: value }))} 
                    placeholder="Ex: 0001" 
                  />

                  <div className="flex justify-center mt-6">
                    <button onClick={handlePrint} disabled={isGeneratingPDF} className="flex items-center justify-center gap-3 px-12 py-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors text-lg shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-w-[300px]">
                      <Printer size={24} />
                      {isGeneratingPDF ? 'Gerando...' : 'Gerar PDF'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <button 
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
              currentStep === 1 
                ? 'text-slate-300 cursor-not-allowed opacity-50' 
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 bg-slate-100'
            }`}
          >
            <ChevronLeft size={24} />
            Anterior
          </button>
          
          {currentStep < 5 ? (
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95"
            >
              Próximo
              <ChevronRight size={24} />
            </button>
          ) : null}
        </div>
      </main>

      {/* Custom Modal for Reset Confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 print:hidden"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Iniciar Nova OS?</h3>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                Tem certeza que deseja limpar todos os dados e iniciar uma nova Ordem de Serviço? Os dados atuais não salvos serão perdidos.
              </p>
              <div className="flex gap-4 justify-end">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmReset}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-colors"
                >
                  Sim, Nova OS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Off-screen Print Layout for PDF Generation */}
      <div className="absolute left-[-9999px] top-0">
        <div ref={printRef} style={{ color: '#000000', backgroundColor: '#ffffff' }} className="w-[800px] p-12 font-sans min-h-[1131px]">
          <div className="flex justify-between items-start border-b-4 border-[#000000] pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Ordem de Serviço</h1>
            <p className="text-xl font-bold text-[#4b5563]">Data: {os.date}</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black tracking-tighter">{os.id}</div>
            <div className="text-2xl font-black uppercase border-4 border-[#000000] inline-block px-4 py-2 mt-4 tracking-widest">{os.status}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-10">
          <div>
            <h2 className="text-2xl font-black uppercase border-b-2 border-[#d1d5db] mb-4 pb-2 tracking-tight">Cliente</h2>
            <p className="text-xl mb-2"><strong className="font-black">Nome:</strong> {os.client.name}</p>
            <p className="text-xl mb-2"><strong className="font-black">Telefone:</strong> {os.client.phone}</p>
            <p className="text-xl mb-2"><strong className="font-black">Doc:</strong> {os.client.document}</p>
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase border-b-2 border-[#d1d5db] mb-4 pb-2 tracking-tight">Aparelho</h2>
            <p className="text-xl mb-2"><strong className="font-black">Tipo:</strong> {os.device.type}</p>
            <p className="text-xl mb-2"><strong className="font-black">Marca/Modelo:</strong> {os.device.brand} {os.device.model}</p>
            <p className="text-xl mb-2"><strong className="font-black">Série/IMEI:</strong> {os.device.serial}</p>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-black uppercase border-b-2 border-[#d1d5db] mb-4 pb-2 tracking-tight">Problema Relatado</h2>
          <p className="text-xl whitespace-pre-wrap leading-relaxed">{os.problem.reported || 'Nenhum problema relatado.'}</p>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-black uppercase border-b-2 border-[#d1d5db] mb-4 pb-2 tracking-tight">Condições do Aparelho</h2>
          <p className="text-xl whitespace-pre-wrap leading-relaxed">{os.problem.condition || 'Nenhuma condição reportada.'}</p>
        </div>

        <div className="border-4 border-[#000000] p-8 rounded-2xl mb-12">
          <h2 className="text-2xl font-black uppercase border-b-2 border-[#d1d5db] mb-6 pb-2 tracking-tight">Valores</h2>
          <div className="flex justify-between text-xl mb-3 font-bold">
            <span className="text-[#4b5563]">Peças:</span>
            <span>R$ {Number(os.values.parts || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl mb-3 font-bold">
            <span className="text-[#4b5563]">Mão de Obra:</span>
            <span>R$ {Number(os.values.labor || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl mb-6 font-bold">
            <span className="text-[#4b5563]">Desconto:</span>
            <span>- R$ {Number(os.values.discount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-4xl font-black border-t-4 border-[#000000] pt-6 mt-4 tracking-tighter">
            <span>TOTAL:</span>
            <span>R$ {totalValue.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-24 pt-12 border-t-2 border-[#d1d5db] text-center">
          <div className="w-96 border-b-2 border-[#000000] mx-auto mb-4"></div>
          <p className="text-xl font-black uppercase tracking-widest">Assinatura do Cliente</p>
          <p className="text-[#6b7280] mt-2 font-medium">Declaro estar ciente e de acordo com as condições descritas acima.</p>
        </div>
      </div>
      </div>

    </div>
  );
}
