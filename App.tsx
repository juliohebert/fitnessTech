import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, LayoutDashboard, Apple, TrendingUp, Trophy,
  ArrowLeft, ArrowRight, Flame, DollarSign, Search, ShoppingCart, 
  CheckCircle2, Clock, Info, Play, Weight,
  Check, X, Timer, SkipForward, Award, Circle, Droplets, Zap, Activity,
  Smartphone, QrCode, CreditCard, Wallet, Trash2, Coffee, Sun, Moon, Repeat, Plus,
  ChevronRight, CheckCircle, Video, Wrench, BookOpen, ExternalLink, PlayCircle,
  Timer as TimerIcon, ChevronDown, ChevronUp, History, RotateCcw, Users, Salad
} from 'lucide-react';
import { 
  ResponsiveContainer, Cell, 
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, AreaChart, Area
} from 'recharts';

type Role = 'ALUNO' | 'PROFESSOR' | 'NUTRI' | 'ADMIN';
type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'APPLE_PAY' | null;

interface Product {
  id: number;
  name: string;
  price: number;
  img: string;
  brand: string;
}

interface CartItem extends Product {
  quantity: number;
}

// --- MOCK DATA ---

const WEIGHT_HISTORY = [
  { day: '01/05', weight: 86.5 },
  { day: '08/05', weight: 85.8 },
  { day: '15/05', weight: 85.2 },
  { day: '22/05', weight: 84.7 },
  { day: '29/05', weight: 84.2 },
];

const MACRO_DISTRIBUTION = [
  { name: 'Proteínas', value: 30, fill: '#D9FF00' },
  { name: 'Carboidratos', value: 50, fill: '#3b82f6' },
  { name: 'Gorduras', value: 20, fill: '#f97316' },
];

const WEEKLY_WORKOUTS: Record<number, any> = {
  1: { title: 'Push Day: Hipertrofia Sistêmica', category: 'A', exercises: [
    { id: 'ex1', n: 'Supino Reto c/ Barra', s: 4, r: '8-10', w: '80kg', rest: 90, group: 'Peito', desc: 'Foco na cadência 2020. Barra toca o peito levemente.', equipment: ['Barra Olímpica', 'Banco Reto'], video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 'ex2', n: 'Supino Inclinado c/ Halteres', s: 3, r: '10-12', w: '32kg', rest: 60, group: 'Peito', desc: 'Foco na porção superior do peito. 45 graus.', equipment: ['Halteres', 'Banco Inclinado'], video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 'ex3', n: 'Crucifixo Máquina', s: 3, r: '15', w: '55kg', rest: 45, group: 'Peito', desc: 'Pico de contração de 2 segundos no centro.', equipment: ['Pec Deck / Máquina de Crucifixo'], video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  ], duration: '65m' },
  2: { title: 'Pull Day: Dorsal & Estética', category: 'B', exercises: [
    { id: 'ex8', n: 'Barra Fixa (Pull Ups)', s: 4, r: 'Falha', w: 'BW', rest: 90, group: 'Costas', desc: 'Amplitude total, peito no topo.', equipment: ['Barra Fixa'], video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  ], duration: '70m' },
};

const WEEKLY_DIETS: Record<number, any> = {
  0: { title: 'Rest: Recuperação Metabólica', kcal: 2200, meals: [{ n: 'Café da Manhã', t: '08:30', kcal: 400, icon: <Coffee />, items: [{ name: 'Omelete de Claras', kcal: 200 }, { name: 'Frutas', kcal: 200 }] }] },
  1: { title: 'High Carb: Treino de Força', kcal: 3150, meals: [
    { n: 'Café da Manhã', t: '07:30', kcal: 650, icon: <Coffee />, items: [{ name: '4 Ovos Mexidos', kcal: 320 }, { name: '100g Aveia', kcal: 250 }, { name: '1 Banana', kcal: 80 }] },
    { n: 'Almoço', t: '13:00', kcal: 850, icon: <Sun />, items: [{ name: '200g Frango Grelhado', kcal: 330 }, { name: '250g Arroz Integral', kcal: 450 }, { name: 'Salada Verde', kcal: 70 }] },
    { n: 'Pós-Treino', t: '17:30', kcal: 400, icon: <Zap />, items: [{ name: 'Whey Protein', kcal: 150 }, { name: '50g Maltodextrina', kcal: 250 }] },
    { n: 'Jantar', t: '20:00', kcal: 700, icon: <Moon />, items: [{ name: '200g Tilápia', kcal: 250 }, { name: '200g Batata Doce', kcal: 400 }, { name: 'Brócolis', kcal: 50 }] },
  ]},
  2: { title: 'High Carb: Dorsal Day', kcal: 3150, meals: [
    { n: 'Café da Manhã', t: '07:30', kcal: 650, icon: <Coffee />, items: [{ name: 'Panqueca de Whey', kcal: 400 }, { name: 'Frutas Vermelhas', kcal: 250 }] },
    { n: 'Almoço', t: '13:00', kcal: 850, icon: <Sun />, items: [{ name: '200g Patinho', kcal: 350 }, { name: '250g Macarrão Integral', kcal: 400 }, { name: 'Azeite', kcal: 100 }] },
  ]},
};

const DEFAULT_DIET = { title: 'Manutenção Padrão', kcal: 2500, meals: [
  { n: 'Café da Manhã', t: '08:00', kcal: 500, icon: <Coffee />, items: [{ name: 'Pão com Ovos', kcal: 500 }] },
  { n: 'Almoço', t: '13:00', kcal: 1000, icon: <Sun />, items: [{ name: 'Prato do Dia', kcal: 1000 }] },
]};

// --- HELPERS ---

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => (v < 10 ? '0' + v : v)).filter((v, i) => v !== '00' || i > 0).join(':');
};

// --- COMPONENTS ---

const NavItem = ({ icon, label, active, onClick, collapsed }: any) => (
  <div onClick={onClick} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all ${active ? 'bg-lime-400 text-black shadow-xl shadow-lime-400/20 scale-[1.02]' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'}`}>
    <div className={`shrink-0 transition-transform ${active ? 'scale-110' : ''}`}>{icon}</div>
    {!collapsed && <span className="text-xs font-black uppercase tracking-widest truncate">{label}</span>}
  </div>
);

const StatCard = ({ label, value, subValue, trend, color }: any) => (
  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group transition-all hover:translate-y-[-4px] shadow-xl">
    <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-700 ${color}`}><TrendingUp size={80} /></div>
    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-2">{label}</p>
    <div className="flex items-baseline gap-3">
      <p className={`text-3xl font-black italic tracking-tighter ${color}`}>{value}</p>
      {subValue && <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">{subValue}</span>}
      {trend && <span className="text-[10px] font-black ml-auto bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">{trend}</span>}
    </div>
  </div>
);

const CalendarBase = ({ title, sub, selectedDay, setSelectedDay, days, children }: any) => (
  <div className="animate-in fade-in duration-700 space-y-10">
    <header className="flex flex-col md:flex-row justify-between md:items-end gap-6">
      <div>
        <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">{title}</h2>
        <p className="text-zinc-500 font-medium">{sub}</p>
      </div>
      <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-3xl gap-1 shadow-xl overflow-x-auto no-scrollbar">
        {days.map((d: string, i: number) => (
          <button 
            key={i} 
            onClick={() => setSelectedDay(i)} 
            className={`min-w-[4rem] h-14 flex flex-col items-center justify-center rounded-2xl transition-all ${selectedDay === i ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20 scale-105 px-4' : 'text-zinc-500 hover:bg-zinc-800 hover:text-white px-4'}`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">{d}</span>
          </button>
        ))}
      </div>
    </header>
    {children}
  </div>
);

// --- ACTIVE WORKOUT COMPONENTS ---

const ActiveWorkoutSession = ({ workout, workoutTime, onFinish, onClose }: any) => {
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(workout.exercises[0]?.id || null);
  const [restingExerciseId, setRestingExerciseId] = useState<string | null>(null);
  const [restSeconds, setRestSeconds] = useState<number>(0);

  useEffect(() => {
    let interval: any;
    if (restingExerciseId && restSeconds > 0) {
      interval = setInterval(() => setRestSeconds((prev: number) => prev - 1), 1000);
    } else if (restSeconds === 0) {
      setRestingExerciseId(null);
    }
    return () => clearInterval(interval);
  }, [restingExerciseId, restSeconds]);

  const handleSetComplete = (ex: any) => {
    const currentSets = exerciseProgress[ex.id] || 0;
    if (currentSets < ex.s) {
      const newSets = currentSets + 1;
      setExerciseProgress(prev => ({ ...prev, [ex.id]: newSets }));
      setRestingExerciseId(ex.id);
      setRestSeconds(ex.rest || 60);
      if (newSets === ex.s) setExpandedId(null);
    }
  };

  const skipRest = () => { setRestSeconds(0); setRestingExerciseId(null); };

  // Fix: Use 'any' for reduce accumulator to satisfy the compiler's arithmetic requirements for line 164
  const totalPossibleSets = (workout?.exercises || []).reduce((acc: any, ex: any) => acc + (Number(ex.s) || 0), 0);
  const totalCompletedSets = Object.values(exerciseProgress).reduce((acc: any, val: any) => acc + (val || 0), 0);
  const workoutPercentage = totalPossibleSets > 0 ? (totalCompletedSets / totalPossibleSets) * 100 : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-500 pb-32 max-w-3xl mx-auto">
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 pb-6 mb-10 pt-4">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onClose} className="size-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white transition-all"><X size={20} /></button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <TimerIcon size={16} className="text-lime-400" />
              <span className="text-2xl font-black italic text-lime-400 tracking-tighter">{formatTime(workoutTime)}</span>
            </div>
            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Treinando Agora</p>
          </div>
          <div className="size-12 flex items-center justify-center"><div className="size-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" /></div>
        </div>
        <div className="px-1">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase text-lime-400 tracking-widest">Progresso Geral</span><span className="text-[10px] text-zinc-600 font-bold">{Math.round(workoutPercentage)}%</span></div>
            <span className="text-[10px] font-black text-white">{totalCompletedSets} / {totalPossibleSets} Séries</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-lime-400 transition-all duration-700 ease-out" style={{ width: `${workoutPercentage}%` }} /></div>
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter px-2 mb-2">{workout.title}</h2>
        {workout.exercises.map((ex: any, idx: number) => {
          const completed = exerciseProgress[ex.id] || 0;
          const isDone = completed === ex.s;
          const isExpanded = expandedId === ex.id;
          const isResting = restingExerciseId === ex.id;
          return (
            <div key={ex.id} className={`bg-zinc-900 border transition-all duration-300 rounded-[2.5rem] overflow-hidden ${isDone ? 'border-zinc-800/50 opacity-50' : isExpanded ? 'border-lime-400/40 shadow-2xl' : 'border-zinc-800 hover:border-zinc-700'}`}>
              <div className="p-6 md:p-8 flex items-center justify-between gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : ex.id)}>
                <div className="flex items-center gap-5 min-w-0">
                  <div className={`size-14 rounded-2xl border-2 flex items-center justify-center transition-all shrink-0 ${isDone ? 'bg-zinc-800 border-zinc-700 text-zinc-500' : isExpanded ? 'bg-lime-400 border-lime-400 text-black shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>{isDone ? <Check size={28} strokeWidth={4} /> : <span className="text-lg font-black italic tracking-tighter">{idx + 1}</span>}</div>
                  <div className="min-w-0">
                    <h4 className={`font-black italic uppercase tracking-tight text-xl leading-none mb-1.5 transition-all ${isDone ? 'line-through text-zinc-600' : ''}`}>{ex.n}</h4>
                    <div className="flex items-center gap-3"><span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{ex.group}</span><div className="size-1 bg-zinc-800 rounded-full" /><span className="text-[10px] font-black uppercase text-lime-400 tracking-widest">{completed} de {ex.s} séries</span></div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={24} className="text-zinc-600" /> : <ChevronDown size={24} className="text-zinc-600" />}
              </div>
              {isExpanded && (
                <div className="px-6 md:px-8 pb-8 pt-2 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-zinc-800 relative group"><video src={ex.video} autoPlay loop muted playsInline className="w-full h-full object-cover" /></div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-3xl"><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Carga</p><p className="text-2xl font-black italic text-white">{ex.w}</p></div>
                        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-3xl"><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Reps</p><p className="text-2xl font-black italic text-blue-400">{ex.r}</p></div>
                      </div>
                      <div className="bg-zinc-950/50 p-6 rounded-3xl border border-zinc-800/50"><p className="text-[10px] font-black uppercase text-zinc-500 mb-3 flex items-center gap-2"><BookOpen size={14}/> Técnica</p><p className="text-xs text-zinc-400 leading-relaxed italic font-medium">"{ex.desc}"</p></div>
                    </div>
                  </div>
                  {!isDone && (
                    <div className="relative">
                       {isResting ? (
                         <div className="bg-blue-500 p-8 rounded-3xl flex flex-col items-center justify-center animate-in zoom-in duration-300 shadow-xl shadow-blue-500/20">
                            <div className="flex items-center gap-4 mb-2"><Timer size={24} className="text-white animate-bounce" /><span className="text-4xl font-black italic text-white tracking-tighter">DESCANSO: {restSeconds}s</span></div>
                            <button onClick={skipRest} className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Pular Descanso</button>
                         </div>
                       ) : (
                         <button onClick={() => handleSetComplete(ex)} className="w-full bg-lime-400 hover:bg-lime-300 text-black py-8 rounded-[2rem] font-black uppercase tracking-widest text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all shadow-lime-400/20"><Zap size={28} fill="currentColor" /> Finalizar Série {completed + 1}</button>
                       )}
                       <div className="flex justify-center gap-3 mt-8">{Array.from({ length: ex.s }).map((_, i) => (<div key={i} className={`size-3 rounded-full transition-all duration-500 ${i < completed ? 'bg-lime-400 shadow-[0_0_8px_#D9FF00]' : 'bg-zinc-800'}`} />))}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-4 rounded-[2.5rem] shadow-2xl flex gap-3">
          <button onClick={onClose} className="bg-zinc-800 text-zinc-400 size-16 rounded-2xl flex items-center justify-center hover:text-white transition-all"><X size={24}/></button>
          <button onClick={() => onFinish(workoutTime)} className={`flex-1 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all ${totalCompletedSets >= totalPossibleSets ? 'bg-lime-400 text-black shadow-xl shadow-lime-400/20' : 'bg-white text-black hover:bg-lime-400'}`}>{totalCompletedSets >= totalPossibleSets ? <><Trophy size={20}/> Finalizar Treino</> : 'Encerrar Treino'}</button>
        </div>
      </div>
    </div>
  );
};

// --- NUTRITION VIEW ---

const NutritionView = ({ diet }: { diet: any }) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-400"><Salad size={120}/></div>
             <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">{diet.title}</h3>
             <p className="text-zinc-500 font-medium">Meta Diária: <span className="text-white font-black">{diet.kcal} kcal</span></p>
          </div>
          <div className="space-y-4">
             {diet.meals.map((meal: any, idx: number) => (
               <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-6 hover:border-blue-500/30 transition-all">
                  <div className="size-16 bg-zinc-950 border border-zinc-800 rounded-3xl flex items-center justify-center text-blue-400 shrink-0 shadow-lg">{meal.icon}</div>
                  <div className="flex-1">
                     <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-black italic uppercase tracking-tight">{meal.n}</h4>
                        <div className="flex items-center gap-3"><span className="text-[10px] bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg font-black">{meal.t}</span><span className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg font-black">{meal.kcal} kcal</span></div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {meal.items.map((item: any, i: number) => (
                          <div key={i} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center"><span className="text-xs font-bold text-zinc-300">{item.name}</span><span className="text-[9px] font-black uppercase text-zinc-600">{item.kcal} kcal</span></div>
                        ))}
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
        <div className="space-y-6">
           <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-xl">
              <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-8">Composição de Macros</h4>
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={MACRO_DISTRIBUTION} innerRadius={60} outerRadius={90} paddingAngle={10} dataKey="value">{MACRO_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.fill}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
              <div className="space-y-4">{MACRO_DISTRIBUTION.map(m => (<div key={m.name} className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="size-2 rounded-full" style={{ backgroundColor: m.fill }} /><span className="text-[10px] font-black uppercase text-zinc-400">{m.name}</span></div><span className="text-sm font-black">{m.value}%</span></div>))}</div>
           </div>
        </div>
      </div>
    </div>
  );
};

const FinishedSessionView = ({ title, totalTime, reset }: any) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-in zoom-in duration-700 p-6">
    <div className="size-40 bg-lime-400 text-black rounded-[4rem] flex items-center justify-center mb-10 shadow-2xl shadow-lime-400/20 rotate-6 border-[8px] border-zinc-950"><Award size={80} strokeWidth={2} /></div>
    <h2 className="text-7xl font-black italic uppercase tracking-tighter mb-4 leading-none">TREINO<br/>FINALIZADO!</h2>
    <p className="text-zinc-500 text-xl font-medium mb-12 max-w-sm">Você dominou a sessão de hoje em <span className="text-white font-black">{formatTime(totalTime)}</span>.</p>
    <button onClick={reset} className="bg-white text-black px-16 py-6 rounded-3xl font-black uppercase tracking-widest text-lg flex items-center gap-4 hover:scale-105 transition-all shadow-2xl">IR PARA O PAINEL <ArrowRight size={24} /></button>
  </div>
);

const EvolutionView = () => (
  <div className="animate-in fade-in duration-700 space-y-10">
    <header><h2 className="text-6xl font-black italic uppercase tracking-tighter mb-2 leading-none">Performance</h2><p className="text-zinc-500 font-medium">Evolução baseada em dados reais.</p></header>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] shadow-xl"><h3 className="text-xl font-black italic uppercase mb-10">Peso (kg)</h3><div className="h-[350px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={WEIGHT_HISTORY}><defs><linearGradient id="colorW" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D9FF00" stopOpacity={0.3}/><stop offset="95%" stopColor="#D9FF00" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="day" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} /><Tooltip/><Area type="monotone" dataKey="weight" stroke="#D9FF00" strokeWidth={5} fillOpacity={1} fill="url(#colorW)" /></AreaChart></ResponsiveContainer></div></div>
      <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] shadow-xl flex flex-col items-center"><h3 className="text-xl font-black italic uppercase self-start mb-10">Macros</h3><div className="h-[350px] w-full flex items-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={MACRO_DISTRIBUTION} innerRadius={80} outerRadius={120} paddingAngle={10} dataKey="value">{MACRO_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie></PieChart></ResponsiveContainer></div></div>
    </div>
  </div>
);

const StudentModule = ({ view, setView }: any) => {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutFinished, setWorkoutFinished] = useState(false);
  const [workoutSeconds, setWorkoutSeconds] = useState<number>(0);
  const [finalTime, setFinalTime] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isWorkoutActive) interval = setInterval(() => setWorkoutSeconds((p: number) => p + 1), 1000);
    else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  const startWorkout = () => { setWorkoutSeconds(0); setIsWorkoutActive(true); setWorkoutFinished(false); setView('workouts'); };
  const handleFinish = (t: number) => { setFinalTime(t); setWorkoutFinished(true); setIsWorkoutActive(false); };

  if (view === 'workouts') return isWorkoutActive ? (
    <ActiveWorkoutSession workout={WEEKLY_WORKOUTS[selectedDay] || { exercises: [] }} workoutTime={workoutSeconds} onFinish={handleFinish} onClose={() => setIsWorkoutActive(false)} />
  ) : workoutFinished ? (
    <FinishedSessionView title="Treino Concluído" totalTime={finalTime} reset={() => { setWorkoutFinished(false); setView('dashboard'); }} />
  ) : (
    <CalendarBase title="Planilha" sub="Programação de alta intensidade." selectedDay={selectedDay} setSelectedDay={setSelectedDay} days={['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']}>
      <WorkoutDetailCard workout={WEEKLY_WORKOUTS[selectedDay] || { exercises: [], title: 'Descanso' }} onStart={startWorkout} />
    </CalendarBase>
  );

  if (view === 'diet') return (
    <CalendarBase title="Nutrição" sub="Fueling your performance." selectedDay={selectedDay} setSelectedDay={setSelectedDay} days={['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']}>
      <NutritionView diet={WEEKLY_DIETS[selectedDay] || DEFAULT_DIET} />
    </CalendarBase>
  );

  if (view === 'evolution') return <EvolutionView />;
  return <StudentDashboard setView={setView} onStartWorkout={startWorkout} />;
};

const WorkoutDetailCard = ({ workout, onStart }: any) => {
  if (!workout.exercises || workout.exercises.length === 0) return (<div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-20 text-center shadow-2xl"><div className="size-24 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-8 text-zinc-700"><RotateCcw size={48} /></div><h3 className="text-3xl font-black italic uppercase mb-2">Descanso</h3></div>);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl">
      <div className="flex items-center gap-4 mb-10"><span className="bg-lime-400 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Série {workout.category}</span><span className="text-zinc-500 text-sm font-bold flex items-center gap-2"><Clock size={16} /> {workout.duration}</span></div>
      <h3 className="text-5xl font-black italic uppercase tracking-tighter mb-12 leading-none">{workout.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">{workout.exercises.map((ex: any, i: number) => (<div key={i} className="flex items-center justify-between p-6 bg-zinc-950/60 rounded-3xl border border-zinc-800"><div className="flex items-center gap-4"><div className="size-10 bg-zinc-900 rounded-xl flex items-center justify-center text-lime-400 font-black italic">{i+1}</div><div className="min-w-0"><p className="font-bold text-sm truncate">{ex.n}</p><p className="text-[10px] text-zinc-500 font-bold uppercase">{ex.s}X {ex.r} • {ex.w}</p></div></div></div>))}</div>
      <button onClick={onStart} className="w-full bg-lime-400 text-black py-7 rounded-[2rem] font-black uppercase tracking-widest text-xl flex items-center justify-center gap-4 shadow-xl active:scale-[0.98] transition-all"><Play size={28} fill="currentColor" /> COMEÇAR AGORA</button>
    </div>
  );
};

const StudentDashboard = ({ setView, onStartWorkout }: any) => {
  const today = new Date().getDay();
  const workout = WEEKLY_WORKOUTS[today];
  const diet = WEEKLY_DIETS[today] || DEFAULT_DIET;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-8">
          <div className="relative"><img src="https://picsum.photos/seed/fitness/200" className="size-24 rounded-[3rem] border-[6px] border-zinc-900 shadow-2xl" alt="Avatar"/><div className="absolute -bottom-2 -right-2 size-10 bg-lime-400 text-black rounded-2xl flex items-center justify-center shadow-xl border-4 border-zinc-950"><Trophy size={20} strokeWidth={3} /></div></div>
          <div><h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-3">Alex Rivers</h1><div className="flex items-center gap-4"><span className="bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-xl text-xs font-black uppercase text-zinc-500">Nível 28</span><div className="w-48 h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800"><div className="h-full bg-lime-400 w-3/4 shadow-[0_0_15px_#D9FF00]" /></div></div></div>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Peso" value="84.2kg" trend="-0.4" color="text-lime-400" />
        <StatCard label="Kcal Diárias" value={diet.kcal.toString()} subValue="kcal" color="text-blue-400" />
        <StatCard label="Sessões" value="18" trend="🔥" color="text-orange-500" />
        <StatCard label="Hidratação" value="2.8L" trend="💧" color="text-blue-500" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div onClick={onStartWorkout} className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-[4rem] p-12 relative overflow-hidden group cursor-pointer hover:border-lime-400/30 transition-all shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-all text-lime-400"><Dumbbell size={300} /></div>
          <div className="relative z-10 max-w-lg"><span className="text-[11px] bg-lime-400 text-black px-5 py-2 rounded-full font-black uppercase mb-8 inline-block tracking-widest">HOJE</span><h3 className="text-6xl font-black italic uppercase tracking-tighter mb-6 leading-none">{workout ? workout.title.split(':')[0] : 'Rest Day'}</h3><button className="bg-lime-400 text-black px-12 py-6 rounded-3xl font-black uppercase text-lg flex items-center gap-4 shadow-2xl">INICIAR TREINO <ArrowRight size={28} /></button></div>
        </div>
        <div onClick={() => setView('diet')} className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-[4rem] p-10 h-full relative overflow-hidden group cursor-pointer hover:border-blue-400/30 transition-all shadow-2xl flex flex-col justify-between">
           <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-400"><Salad size={160}/></div>
           <div><span className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-4 block">PLANO NUTRI</span><h4 className="text-3xl font-black italic uppercase tracking-tighter">Próxima: {diet.meals[0].n}</h4></div>
           <div className="mt-10"><p className="text-4xl font-black italic text-white leading-none">{diet.kcal} kcal</p><p className="text-zinc-500 text-xs font-bold uppercase mt-2">Meta Diária</p></div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [role, setRole] = useState<Role>('ALUNO');
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <div className="fixed top-6 right-6 z-[100] bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-2 rounded-3xl flex gap-1 shadow-2xl">
        {(['ALUNO', 'NUTRI', 'PROFESSOR', 'ADMIN'] as Role[]).map(r => (
          <button key={r} onClick={() => { setRole(r); setActiveView('dashboard'); }} className={`px-5 py-2.5 text-[10px] font-black rounded-2xl transition-all ${role === r ? 'bg-lime-400 text-black' : 'text-zinc-500 hover:text-white'}`}>{r}</button>
        ))}
      </div>
      <aside className={`hidden md:flex flex-col border-r border-zinc-900 p-8 space-y-12 sticky top-0 h-screen bg-zinc-950/50 backdrop-blur-md ${sidebarOpen ? 'w-80' : 'w-28'}`}>
        <div className="flex items-center gap-5 text-lime-400 font-black text-2xl italic uppercase tracking-tighter shrink-0"><div className="size-14 bg-lime-400 text-black rounded-[1.5rem] flex items-center justify-center rotate-3 border-[4px] border-zinc-950 shadow-xl"><Dumbbell size={32} strokeWidth={3} /></div>{sidebarOpen && <span>FITNESS<br/>TECH</span>}</div>
        <nav className="flex-1 space-y-3">
          <NavItem icon={<LayoutDashboard size={24}/>} label="Painel" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} collapsed={!sidebarOpen} />
          {role === 'ALUNO' && (<><NavItem icon={<Dumbbell size={24}/>} label="Treinos" active={activeView === 'workouts'} onClick={() => setActiveView('workouts'} collapsed={!sidebarOpen} /><NavItem icon={<Apple size={24}/>} label="Nutrição" active={activeView === 'diet'} onClick={() => setActiveView('diet'} collapsed={!sidebarOpen} /><NavItem icon={<TrendingUp size={24}/>} label="Performance" active={activeView === 'evolution'} onClick={() => setActiveView('evolution'} collapsed={!sidebarOpen} /></>)}
          {role === 'NUTRI' && (<><NavItem icon={<Users size={24}/>} label="Pacientes" active={activeView === 'patients'} onClick={() => setActiveView('patients'} collapsed={!sidebarOpen} /><NavItem icon={<Salad size={24}/>} label="Planos" active={activeView === 'diet'} onClick={() => setActiveView('diet'} collapsed={!sidebarOpen} /></>)}
        </nav>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl flex justify-center text-zinc-400">{sidebarOpen ? <ArrowLeft size={24}/> : <ArrowRight size={24}/>}</button>
      </aside>
      <main className="flex-1 p-6 md:p-12 lg:px-20 max-w-8xl mx-auto w-full pb-32"><StudentModule view={activeView} setView={setActiveView} /></main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-zinc-950/90 backdrop-blur-3xl border-t border-zinc-900 flex items-center justify-around z-50 px-8 pb-4">
        <button onClick={() => setActiveView('dashboard')} className={activeView === 'dashboard' ? 'text-lime-400' : 'text-zinc-600'}><LayoutDashboard size={28}/></button>
        <button onClick={() => setActiveView('workouts')} className={activeView === 'workouts' ? 'text-lime-400' : 'text-zinc-600'}><Dumbbell size={28}/></button>
        <button onClick={() => setActiveView('diet')} className={activeView === 'diet' ? 'text-lime-400' : 'text-zinc-600'}><Apple size={28}/></button>
      </nav>
    </div>
  );
};

export default App;