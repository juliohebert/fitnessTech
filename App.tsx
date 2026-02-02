
import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, LayoutDashboard, Apple, TrendingUp, Trophy,
  ArrowLeft, ArrowRight, Flame, DollarSign, Search, ShoppingCart, 
  CheckCircle2, Clock, Info, Play, Weight,
  Check, X, Timer, SkipForward, Award, Circle, Droplets, Zap, Activity,
  Smartphone, QrCode, CreditCard, Wallet, Trash2, Coffee, Sun, Moon, Repeat, Plus,
  ChevronRight, CheckCircle, Video, Wrench, BookOpen, ExternalLink, PlayCircle,
  Timer as TimerIcon, ChevronDown, ChevronUp, History, RotateCcw, Users, Salad, Utensils, MousePointer2,
  Package, Tag, Filter, ShoppingBag, Percent, Scale, ZapOff, Target, ChevronLeft, User, Settings, Bell, ShieldCheck, LogOut, CreditCard as CardIcon, Save, Camera, Mail, Phone, Calendar, MoreVertical,
  MessageCircle, UserPlus, Pencil, Trash, Copy, BookMarked, Download
} from 'lucide-react';
import { 
  ResponsiveContainer, Cell, 
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, AreaChart, Area, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';

type Role = 'ALUNO' | 'PROFESSOR' | 'NUTRI' | 'ADMIN';

interface Product {
  id: number;
  name: string;
  price: number;
  img: string;
  brand: string;
  category: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface Biometrics {
  height: string;
  weight: string;
  age: string;
  goal: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan: string;
  lastVisit: string;
  progress: number;
  avatar: string;
}

interface ServicePlan {
  id: number;
  title: string;
  price: number;
  duration: string;
  activeStudents: number;
  description: string;
}

interface Exercise {
  id: string;
  n: string;
  s: number | string;
  r: string;
  w: string;
  rest: number | string;
  group: string;
  orientations: string[];
  video?: string;
}

interface WorkoutTemplate {
  id: string;
  title: string;
  category: string;
  exercises: Exercise[];
}

interface LibraryExercise {
  id: string;
  name: string;
  group: string;
  defaultOrientations: string[];
  video: string;
}

// --- CONSTANTS & MOCKS ---

const EXERCISE_LIBRARY: LibraryExercise[] = [
  { id: 'lib1', name: 'Supino Reto com Barra', group: 'Peito', defaultOrientations: ['Mantenha as escápulas aduzidas contra o banco.', 'Desça a barra até tocar levemente o centro do peito.', 'Suba de forma explosiva, sem estender totalmente os cotovelos.'], video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: 'lib2', name: 'Agachamento Livre', group: 'Pernas', defaultOrientations: ['Mantenha a coluna em posição neutra.', 'Desça até que as coxas fiquem paralelas ao chão.', 'Pressione os calcanhares firmemente contra o solo.'], video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
];

const INITIAL_STUDENTS: Student[] = [
  { id: 1, name: 'Alex Rivers', email: 'alex@rivers.com', phone: '5511999999999', plan: 'VIP Performance', lastVisit: 'Hoje, 09:00', progress: 75, avatar: 'https://picsum.photos/seed/alex/100' },
  { id: 2, name: 'Bia Silva', email: 'bia@fitness.com', phone: '5511988888888', plan: 'Básico Semanal', lastVisit: 'Ontem', progress: 40, avatar: 'https://picsum.photos/seed/bia/100' },
];

const INITIAL_TEMPLATES: WorkoutTemplate[] = [
  { id: 't1', title: 'Hipertrofia Base - Peito/Tríceps', category: 'A', exercises: [{ id: 'te1', n: 'Supino Reto', s: 4, r: '10', w: '30kg', rest: 90, group: 'Peito', orientations: ['Escápulas presas', 'Controle o peso'] }] }
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Whey Isolate 900g', price: 249.90, brand: 'Max Titanium', img: 'https://images.unsplash.com/photo-1593095191850-2a733009e073?q=80&w=400', category: 'Suplementos', stock: 15 },
  { id: 2, name: 'Creatina Monohidratada', price: 89.90, brand: 'Growth', img: 'https://images.unsplash.com/photo-1579722820308-d74e5719d54e?q=80&w=400', category: 'Suplementos', stock: 40 },
];

const INITIAL_WORKOUTS: Record<number, any> = {
  1: { title: 'Push Day: Hipertrofia Sistêmica', category: 'A', exercises: [
    { id: 'ex1', n: 'Supino Reto c/ Barra', s: 4, r: '8-10', w: '80kg', rest: 90, group: 'Peito', orientations: ['Mantenha as escápulas aduzidas.', 'Pico de contração no topo.', 'Desça de forma controlada.'], video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 'ex2', n: 'Supino Inclinado c/ Halteres', s: 3, r: '10-12', w: '32kg', rest: 60, group: 'Peito', orientations: ['45 graus de inclinação.', 'Foco na porção superior.'], video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  ], duration: '65m' },
};

const WEEKLY_DIETS: Record<number, any> = {
  1: { title: 'High Carb', kcal: 3150, meals: [
    { n: 'Café da Manhã', t: '07:30', kcal: 650, icon: <Coffee />, items: [{ name: '4 Ovos Mexidos', kcal: 320 }, { name: '100g Aveia', kcal: 330 }] },
    { n: 'Almoço', t: '13:00', kcal: 850, icon: <Sun />, items: [{ name: '200g Frango', kcal: 400 }, { name: '250g Arroz', kcal: 450 }] },
  ]},
};

const DEFAULT_DIET = { title: 'Padrão', kcal: 2500, meals: [{ n: 'Café', t: '08:00', kcal: 500, icon: <Coffee />, items: [{ name: 'Pão c/ Ovo', kcal: 500 }] }] };
const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MACRO_DISTRIBUTION = [
  { name: 'Proteínas', value: 30, fill: '#D9FF00' },
  { name: 'Carboidratos', value: 50, fill: '#3b82f6' },
  { name: 'Gorduras', value: 20, fill: '#f97316' },
];

const WEIGHT_HISTORY = [
  { date: '01/10', weight: 88.5 },
  { date: '08/10', weight: 87.2 },
  { date: '15/10', weight: 86.0 },
  { date: '22/10', weight: 85.1 },
  { date: '29/10', weight: 84.2 },
];

const LIFT_PROGRESS = [
  { week: 'Sem 1', load: 60 },
  { week: 'Sem 2', load: 65 },
  { week: 'Sem 3', load: 72 },
  { week: 'Sem 4', load: 82 },
];

const PERSONAL_RECORDS = [
  { exercise: 'Supino Reto', weight: '100kg', date: 'Ontem', icon: <Dumbbell />, color: 'text-lime-400' },
  { exercise: 'Agachamento', weight: '140kg', date: '3 dias atrás', icon: <Zap />, color: 'text-blue-400' },
  { exercise: 'Levantamento Terra', weight: '180kg', date: 'Semana passada', icon: <Flame />, color: 'text-orange-500' },
];

// --- HELPERS ---

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => (v < 10 ? '0' + v : v)).filter((v, i) => v !== '00' || i > 0).join(':');
};

// --- BASE UI COMPONENTS ---

const NavItem = ({ icon, label, active, onClick, collapsed, badge }: any) => (
  <div onClick={onClick} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all relative ${active ? 'bg-lime-400 text-black shadow-xl shadow-lime-400/20 scale-[1.02]' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'}`}>
    <div className={`shrink-0 transition-transform ${active ? 'scale-110' : ''}`}>{icon}</div>
    {!collapsed && <span className="text-xs font-black uppercase tracking-widest truncate">{label}</span>}
    {badge > 0 && <div className="absolute top-2 right-2 size-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-950">{badge}</div>}
  </div>
);

const StatCard = ({ label, value, trend, color, icon: Icon }: any) => (
  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group transition-all hover:translate-y-[-4px] shadow-xl">
    <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-700 ${color}`}>{Icon && <Icon size={80} />}</div>
    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-2">{label}</p>
    <div className="flex items-baseline gap-3">
      <p className={`text-3xl font-black italic tracking-tighter ${color}`}>{value}</p>
      {trend && <span className="text-[10px] font-black ml-auto bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">{trend}</span>}
    </div>
  </div>
);

const CalendarBase = ({ title, sub, selectedDay, setSelectedDay, days, children }: any) => (
  <div className="animate-in fade-in duration-700 space-y-10">
    <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
      <div><h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">{title}</h2><p className="text-zinc-500 font-medium">{sub}</p></div>
      <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-3xl gap-1 shadow-xl overflow-x-auto no-scrollbar">
        {days.map((day: string, idx: number) => (<button key={idx} onClick={() => setSelectedDay(idx)} className={`min-w-[4.5rem] h-12 flex items-center justify-center rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest px-4 ${selectedDay === idx ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:bg-zinc-800'}`}>{day}</button>))}
      </div>
    </header>
    <div className="min-h-[50vh]">{children}</div>
  </div>
);

// --- ALUNO COMPONENTS ---

const ActiveWorkoutSession = ({ workout, workoutTime, onFinish, onClose }: any) => {
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(workout.exercises[0]?.id || null);
  const [restingExerciseId, setRestingExerciseId] = useState<string | null>(null);
  const [restSeconds, setRestSeconds] = useState<number>(0);

  useEffect(() => {
    let interval: any;
    if (restingExerciseId && restSeconds > 0) interval = setInterval(() => setRestSeconds((p: number) => p - 1), 1000);
    else if (restSeconds === 0) setRestingExerciseId(null);
    return () => clearInterval(interval);
  }, [restingExerciseId, restSeconds]);

  const totalPossibleSets: number = (workout.exercises || []).reduce((acc: number, ex: any) => acc + (Number(ex.s) || 0), 0);
  const totalCompletedSets: number = (Object.values(exerciseProgress) as number[]).reduce((acc: number, val: number) => acc + val, 0);
  const workoutPercentage = totalPossibleSets > 0 ? (totalCompletedSets / totalPossibleSets) * 100 : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-500 pb-32 max-w-3xl mx-auto">
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 pb-6 mb-10 pt-4">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onClose} className="size-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white transition-all"><X size={20} /></button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-0.5"><TimerIcon size={16} className="text-lime-400" /><span className="text-2xl font-black italic text-lime-400 tracking-tighter">{formatTime(workoutTime)}</span></div>
            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Treinando Agora</p>
          </div>
          <div className="size-12 flex items-center justify-center"><div className="size-3 bg-red-500 rounded-full animate-pulse" /></div>
        </div>
        <div className="px-1">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase text-lime-400 tracking-widest">Progresso Geral</span></div>
            <span className="text-[10px] font-black text-white">{totalCompletedSets} / {totalPossibleSets} Séries</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-lime-400 transition-all duration-700 ease-out" style={{ width: `${workoutPercentage}%` }} /></div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter px-2 mb-2">{workout.title}</h2>
        {workout.exercises.map((ex: any, idx: number) => {
          const completed = exerciseProgress[ex.id] || 0;
          const isDone = completed === Number(ex.s);
          const isExpanded = expandedId === ex.id;
          const isResting = restingExerciseId === ex.id;
          return (
            <div key={ex.id} className={`bg-zinc-900 border transition-all duration-300 rounded-[2.5rem] overflow-hidden ${isDone ? 'border-zinc-800/50 opacity-50' : isExpanded ? 'border-lime-400/40 shadow-2xl' : 'border-zinc-800 hover:border-zinc-700'}`}>
              <div className="p-8 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : ex.id)}>
                <div className="flex items-center gap-5">
                  <div className={`size-14 rounded-2xl border-2 flex items-center justify-center transition-all ${isDone ? 'bg-zinc-800 border-zinc-700 text-zinc-500' : isExpanded ? 'bg-lime-400 border-lime-400 text-black shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>{isDone ? <Check size={28} strokeWidth={4} /> : <span className="text-lg font-black italic tracking-tighter">{idx + 1}</span>}</div>
                  <div>
                    <h4 className={`font-black italic uppercase tracking-tight text-xl leading-none mb-1.5 ${isDone ? 'line-through text-zinc-600' : ''}`}>{ex.n}</h4>
                    <div className="flex items-center gap-3"><span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{ex.group}</span><div className="size-1 bg-zinc-800 rounded-full" /><span className="text-[10px] font-black uppercase text-lime-400 tracking-widest">{completed} de {ex.s} séries</span></div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={24} className="text-zinc-600" /> : <ChevronDown size={24} className="text-zinc-600" />}
              </div>
              {isExpanded && (
                <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-zinc-800 relative group"><video src={ex.video} autoPlay loop muted playsInline className="w-full h-full object-cover" /></div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-3xl"><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Carga</p><p className="text-2xl font-black italic text-white">{ex.w}</p></div>
                        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-3xl"><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Reps</p><p className="text-2xl font-black italic text-blue-400">{ex.r}</p></div>
                      </div>
                      <div className="bg-zinc-950/50 p-6 rounded-3xl border border-zinc-800/50">
                        <p className="text-[10px] font-black uppercase text-zinc-500 mb-3 flex items-center gap-2"><BookOpen size={14}/> Técnica</p>
                        <ul className="space-y-2">{ex.orientations.map((item: string, i: number) => (<li key={i} className="text-xs text-zinc-400 italic"><span className="text-lime-400 font-black mr-1">{i+1}.</span> {item}</li>))}</ul>
                      </div>
                    </div>
                  </div>
                  {!isDone && (
                    <div className="relative">
                       {isResting ? (
                         <div className="bg-blue-500 p-8 rounded-3xl flex flex-col items-center justify-center animate-in zoom-in duration-300 shadow-xl shadow-blue-500/20">
                            <div className="flex items-center gap-4 mb-2"><Timer size={24} className="text-white animate-bounce" /><span className="text-4xl font-black italic text-white tracking-tighter">DESCANSO: {restSeconds}s</span></div>
                            <button onClick={() => setRestSeconds(0)} className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Pular Descanso</button>
                         </div>
                       ) : (
                         <button onClick={() => { const next = (exerciseProgress[ex.id] || 0) + 1; setExerciseProgress({...exerciseProgress, [ex.id]: next}); if(next === Number(ex.s)) setExpandedId(null); else { setRestingExerciseId(ex.id); setRestSeconds(Number(ex.rest) || 60); } }} className="w-full bg-lime-400 hover:bg-lime-300 text-black py-8 rounded-[2rem] font-black uppercase tracking-widest text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all shadow-lime-400/20"><Zap size={28} fill="currentColor" /> Finalizar Série {completed + 1}</button>
                       )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FinishedSessionView = ({ totalTime, reset }: any) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-in zoom-in duration-700 p-6">
    <div className="size-40 bg-lime-400 text-black rounded-[4rem] flex items-center justify-center mb-10 shadow-2xl rotate-6 border-[8px] border-zinc-950"><Award size={80} strokeWidth={2} /></div>
    <h2 className="text-7xl font-black italic uppercase tracking-tighter mb-4 leading-none">DOMINADO!</h2>
    <p className="text-zinc-500 text-xl font-medium mb-12 max-w-sm">Você destruiu a sessão de hoje em <span className="text-white font-black">{formatTime(totalTime)}</span>.</p>
    <button onClick={reset} className="bg-white text-black px-16 py-6 rounded-3xl font-black uppercase tracking-widest text-lg flex items-center gap-4 hover:scale-105 transition-all shadow-2xl">IR PARA O PAINEL <ArrowRight size={24} /></button>
  </div>
);

const WorkoutDetailCard = ({ workout, onStart }: any) => {
  if (!workout.exercises || workout.exercises.length === 0) return (<div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-20 text-center shadow-2xl"><div className="size-24 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-8 text-zinc-700"><RotateCcw size={48} /></div><h3 className="text-3xl font-black italic uppercase mb-2">Dia de Descanso</h3><p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Foque na recuperação.</p></div>);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl">
      <div className="flex items-center gap-4 mb-10"><span className="bg-lime-400 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Série {workout.category}</span><span className="text-zinc-500 text-sm font-bold flex items-center gap-2"><Clock size={16} /> {workout.duration}</span></div>
      <h3 className="text-5xl font-black italic uppercase tracking-tighter mb-12 leading-none">{workout.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">{workout.exercises.map((ex: any, i: number) => (<div key={i} className="flex items-center justify-between p-6 bg-zinc-950/60 rounded-3xl border border-zinc-800"><div className="flex items-center gap-4"><div className="size-10 bg-zinc-900 rounded-xl flex items-center justify-center text-lime-400 font-black italic">{i+1}</div><div className="min-w-0"><p className="font-bold text-sm truncate uppercase tracking-tight italic">{ex.n}</p><p className="text-[10px] text-zinc-500 font-bold uppercase">{ex.s}X {ex.r} • {ex.w} • {ex.rest}s descanso</p></div></div></div>))}</div>
      <button onClick={onStart} className="w-full bg-lime-400 text-black py-7 rounded-[2rem] font-black uppercase tracking-widest text-xl flex items-center justify-center gap-4 shadow-xl active:scale-[0.98] transition-all shadow-lime-400/20"><Play size={28} fill="currentColor" /> COMEÇAR AGORA</button>
    </div>
  );
};

const NutritionView = ({ diet, dayIdx }: { diet: any, dayIdx: number }) => {
  const [completedMeals, setCompletedMeals] = useState<number[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem(`diet_day_${dayIdx}`);
    if (saved) setCompletedMeals(JSON.parse(saved));
    else setCompletedMeals([]);
  }, [dayIdx]);

  const toggleMeal = (idx: number) => {
    const newCompleted = completedMeals.includes(idx) ? completedMeals.filter(i => i !== idx) : [...completedMeals, idx];
    setCompletedMeals(newCompleted);
    localStorage.setItem(`diet_day_${dayIdx}`, JSON.stringify(newCompleted));
  };

  const progress = diet.meals.length > 0 ? (completedMeals.length / diet.meals.length) * 100 : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3"><div className="size-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center"><Utensils size={20} /></div><div><p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Adesão Diária</p><h4 className="text-lg font-black italic uppercase">{completedMeals.length} de {diet.meals.length} refeições</h4></div></div>
          <span className="text-xl font-black italic text-lime-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5"><div className="h-full bg-lime-400 rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
           {diet.meals.map((meal: any, idx: number) => {
             const isDone = completedMeals.includes(idx);
             return (
               <div key={idx} onClick={() => toggleMeal(idx)} className={`group relative bg-zinc-900 border cursor-pointer rounded-[2.5rem] p-8 flex gap-6 transition-all duration-300 active:scale-[0.98] ${isDone ? 'border-lime-400/30 bg-lime-400/5' : 'border-zinc-800 hover:border-zinc-700'}`}>
                  <div className={`size-16 rounded-3xl flex items-center justify-center shrink-0 shadow-lg border transition-all duration-500 ${isDone ? 'bg-lime-400 border-lime-400 text-black rotate-12' : 'bg-zinc-950 border-zinc-800 text-blue-400'}`}>{isDone ? <Check size={28} strokeWidth={4} /> : meal.icon}</div>
                  <div className="flex-1">
                     <div className="flex justify-between items-center mb-4"><h4 className={`text-xl font-black italic uppercase tracking-tight ${isDone ? 'text-zinc-500 line-through' : 'text-white'}`}>{meal.n}</h4><div className="flex gap-3"><span className="text-[10px] bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg font-black">{meal.t}</span><span className={`text-[10px] px-3 py-1 rounded-lg font-black ${isDone ? 'bg-lime-400 text-black' : 'bg-blue-500/20 text-blue-400'}`}>{meal.kcal} kcal</span></div></div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{meal.items.map((item: any, i: number) => (<div key={i} className={`p-4 rounded-2xl flex justify-between items-center border ${isDone ? 'bg-zinc-950/30 border-zinc-800/50 opacity-60' : 'bg-zinc-950 border-zinc-800'}`}><span className="text-xs font-bold text-zinc-300">{item.name}</span><span className="text-[9px] font-black uppercase text-zinc-600">{item.kcal} kcal</span></div>))}</div>
                  </div>
               </div>
             );
           })}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-xl h-fit">
          <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-8">Macros</h4>
          <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} /><Pie data={MACRO_DISTRIBUTION} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">{MACRO_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie></PieChart></ResponsiveContainer></div>
          <div className="w-full mt-6 space-y-4">{MACRO_DISTRIBUTION.map((macro, idx) => (<div key={idx} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl"><div className="flex items-center gap-3"><div className="size-3 rounded-full" style={{ backgroundColor: macro.fill }} /><span className="text-xs font-black uppercase text-zinc-300">{macro.name}</span></div><span className="text-xs font-black italic text-white">{macro.value}%</span></div>))}</div>
        </div>
      </div>
    </div>
  );
};

const EvolutionView = () => (
  <div className="animate-in fade-in duration-700 space-y-12">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-2xl">
        <div className="flex justify-between items-start mb-10"><div><p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Peso Corporal (kg)</p><h4 className="text-3xl font-black italic text-white">-4.3kg este mês</h4></div><div className="size-12 bg-lime-400/10 text-lime-400 rounded-2xl flex items-center justify-center"><Scale size={24} /></div></div>
        <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={WEIGHT_HISTORY}><defs><linearGradient id="colorW" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D9FF00" stopOpacity={0.3}/><stop offset="95%" stopColor="#D9FF00" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Area type="monotone" dataKey="weight" stroke="#D9FF00" strokeWidth={4} fill="url(#colorW)" /></AreaChart></ResponsiveContainer></div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-2xl">
        <div className="flex justify-between items-start mb-10"><div><p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Progressão de Carga (kg)</p><h4 className="text-3xl font-black italic text-blue-400">+22kg total</h4></div><div className="size-12 bg-blue-400/10 text-blue-400 rounded-2xl flex items-center justify-center"><Zap size={24} /></div></div>
        <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={LIFT_PROGRESS}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="week" stroke="#52525b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Bar dataKey="load" fill="#3b82f6" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </div>
    </div>
    <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] shadow-2xl">
      <h4 className="text-xl font-black italic uppercase tracking-tighter mb-10 flex items-center gap-3"><Trophy size={20} className="text-orange-400"/> Recordes Pessoais</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PERSONAL_RECORDS.map((record, i) => (
          <div key={i} className="bg-zinc-950 border border-zinc-800 p-6 rounded-[2rem] hover:border-zinc-700 transition-all group">
            <div className="flex justify-between items-start mb-6"><div className={`p-3 rounded-xl bg-zinc-900 ${record.color}`}>{record.icon}</div><span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{record.date}</span></div>
            <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">{record.exercise}</p>
            <p className="text-4xl font-black italic text-white tracking-tighter group-hover:scale-110 transition-transform origin-left">{record.weight}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ProfileView = ({ profileImage, onImageChange, biometrics, onBiometricsChange }: { profileImage: string, onImageChange: (url: string) => void, biometrics: Biometrics, onBiometricsChange: (b: Biometrics) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempBiometrics, setTempBiometrics] = useState({...biometrics});
  const [notif, setNotif] = useState(true);

  useEffect(() => { if (!isEditing) setTempBiometrics({...biometrics}); }, [biometrics, isEditing]);
  const handleSave = () => { onBiometricsChange({...tempBiometrics}); setIsEditing(false); };
  const handleCancel = () => { setTempBiometrics({...biometrics}); setIsEditing(false); };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-12 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row items-center gap-10">
        <div className="relative group"><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend = () => onImageChange(r.result as string); r.readAsDataURL(f); } }}/><div onClick={() => fileInputRef.current?.click()} className="size-40 rounded-[4rem] border-[10px] border-zinc-900 shadow-2xl overflow-hidden relative cursor-pointer"><img src={profileImage} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"/><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity"><Camera size={32} className="text-lime-400 mb-1" /><span className="text-[9px] font-black uppercase text-lime-400">Trocar Foto</span></div></div><div className="absolute -bottom-2 -right-2 size-14 bg-lime-400 text-black rounded-3xl flex items-center justify-center shadow-2xl border-[6px] border-zinc-950"><Trophy size={28} strokeWidth={3} /></div></div>
        <div className="text-center md:text-left"><h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-4">Alex Rivers</h1><div className="flex flex-wrap justify-center md:justify-start gap-3"><span className="bg-zinc-900 border border-zinc-800 px-5 py-2 rounded-2xl text-[10px] font-black uppercase text-zinc-400 tracking-widest">Aluno VIP</span><span className="bg-lime-400/10 border border-lime-400/30 px-5 py-2 rounded-2xl text-[10px] font-black uppercase text-lime-400 tracking-widest">Nível 28</span></div></div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl space-y-10">
           <div className="flex items-center justify-between"><h4 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3"><User size={20} className="text-lime-400"/> Biometria</h4>{!isEditing ? (<button onClick={() => setIsEditing(true)} className="text-[10px] font-black uppercase text-lime-400 hover:underline">Editar</button>) : (<div className="flex gap-4"><button onClick={handleCancel} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white">Cancelar</button><button onClick={handleSave} className="text-[10px] font-black uppercase text-lime-400 flex items-center gap-1"><Save size={12}/> Salvar</button></div>)}</div>
           <div className="grid grid-cols-2 gap-6">
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800/50"><p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Altura</p>{isEditing ? (<input type="number" step="0.01" value={tempBiometrics.height} onChange={(e) => setTempBiometrics({...tempBiometrics, height: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 w-full text-white font-black italic" />) : (<p className="text-2xl font-black italic text-white">{biometrics.height}m</p>)}</div>
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800/50"><p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Peso</p>{isEditing ? (<input type="number" step="0.1" value={tempBiometrics.weight} onChange={(e) => setTempBiometrics({...tempBiometrics, weight: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 w-full text-white font-black italic" />) : (<p className="text-2xl font-black italic text-white">{biometrics.weight}kg</p>)}</div>
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800/50"><p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Idade</p>{isEditing ? (<input type="number" value={tempBiometrics.age} onChange={(e) => setTempBiometrics({...tempBiometrics, age: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 w-full text-white font-black italic" />) : (<p className="text-2xl font-black italic text-white">{biometrics.age} anos</p>)}</div>
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800/50"><p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Meta</p>{isEditing ? (<select value={tempBiometrics.goal} onChange={(e) => setTempBiometrics({...tempBiometrics, goal: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 w-full text-white font-black italic outline-none appearance-none"><option value="Hipertrofia">Hipertrofia</option><option value="Cutting">Cutting</option><option value="Bulking">Bulking</option></select>) : (<p className="text-2xl font-black italic text-lime-400 uppercase tracking-tighter">{biometrics.goal}</p>)}</div>
           </div>
        </section>
        <section className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl space-y-8"><h4 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3"><ShieldCheck size={20} className="text-blue-400"/> Assinatura</h4><div className="bg-zinc-950 rounded-[2.5rem] p-8 relative overflow-hidden"><div className="absolute top-0 right-0 p-10 opacity-5"><Trophy size={140} className="text-lime-400" /></div><div className="relative z-10"><p className="text-[10px] font-black uppercase text-lime-400 tracking-widest mb-2">PLANO ATUAL</p><h5 className="text-4xl font-black italic uppercase tracking-tighter mb-4">BLACK VIP</h5><div className="flex items-center gap-4 mb-8"><div className="size-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500"><CardIcon size={20}/></div><div><p className="text-[10px] font-black uppercase text-zinc-300">Pagamento</p><p className="text-xs font-bold text-zinc-500">Mastercard **** 8291</p></div></div><div className="pt-6 border-t border-zinc-900 flex justify-between items-end"><div><p className="text-[9px] font-black uppercase text-zinc-600">Próxima Cobrança</p><p className="text-sm font-black italic text-white">15 de Nov, 2024</p></div><button className="text-[10px] font-black uppercase bg-zinc-900 border border-zinc-800 px-6 py-2.5 rounded-xl hover:text-red-400 transition-all">Gerenciar</button></div></div></div></section>
      </div>
      <section className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl">
         <h4 className="text-xl font-black italic uppercase tracking-tighter mb-10 flex items-center gap-3"><Settings size={20} className="text-orange-400"/> Configurações</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="flex items-center justify-between py-6 border-b border-zinc-800/50">
               <div className="flex items-center gap-4"><div className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><Bell size={20}/></div><div><p className="text-sm font-black uppercase italic text-zinc-200">Notificações</p><p className="text-[10px] font-bold text-zinc-600">Lembretes diários</p></div></div>
               <button onClick={() => setNotif(!notif)} className={`w-14 h-8 rounded-full transition-all relative p-1 ${notif ? 'bg-lime-400' : 'bg-zinc-950 border border-zinc-800'}`}><div className={`size-6 rounded-full transition-all ${notif ? 'bg-black translate-x-6' : 'bg-zinc-700'}`} /></button>
            </div>
            <div className="flex items-center justify-between py-6 border-b border-zinc-800/50">
               <div className="flex items-center gap-4"><div className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><Smartphone size={20}/></div><div><p className="text-sm font-black uppercase italic text-zinc-200">Dispositivos</p><p className="text-[10px] font-bold text-zinc-600">Apple Health / Watch</p></div></div>
               <ChevronRight size={20} className="text-zinc-700" />
            </div>
         </div>
      </section>
    </div>
  );
};

const StoreView = ({ products, addToCart, cartCount, openCart }: any) => {
  const [filter, setFilter] = useState('Todos');
  const categories = ['Todos', 'Suplementos', 'Equipamentos', 'Vestuário'];
  const filtered = filter === 'Todos' ? products : products.filter((p: Product) => p.category === filter);

  return (
    <div className="animate-in fade-in duration-700 space-y-10 relative">
      <header className="flex flex-col lg:row justify-between lg:items-end gap-6">
        <div><h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">Marketplace</h2><p className="text-zinc-500 font-medium">Equipamentos de elite.</p></div>
        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-3xl gap-1 overflow-x-auto no-scrollbar">
            {categories.map((c) => (<button key={c} onClick={() => setFilter(c)} className={`min-w-[6rem] h-12 flex items-center justify-center rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest px-6 ${filter === c ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:bg-zinc-800'}`}>{c}</button>))}
          </div>
          <button onClick={openCart} className="hidden md:flex bg-zinc-900 border border-zinc-800 h-14 px-6 rounded-3xl items-center gap-4 hover:border-lime-400/40 transition-all text-zinc-400 hover:text-white group cursor-pointer">
            <div className="relative"><ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />{cartCount > 0 && <div className="absolute -top-2 -right-2 size-4 bg-lime-400 text-black text-[9px] font-black rounded-full flex items-center justify-center">{cartCount}</div>}</div>
            <span className="text-[10px] font-black uppercase tracking-widest">Ver Carrinho</span>
          </button>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filtered.map((product: Product) => (
          <div key={product.id} className="group bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-lime-400/40 transition-all shadow-xl hover:translate-y-[-8px]">
            <div className="aspect-square relative overflow-hidden bg-zinc-950"><img src={product.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/><div className="absolute top-4 left-4 bg-zinc-900/80 border border-zinc-800 px-3 py-1 rounded-full"><span className="text-[10px] font-black text-lime-400 uppercase tracking-widest">{product.brand}</span></div></div>
            <div className="p-8">
              <h4 className="text-lg font-black italic uppercase tracking-tight mb-2 truncate">{product.name}</h4>
              <div className="flex items-center justify-between mb-8"><p className="text-2xl font-black text-white italic">R$ {product.price.toFixed(2)}</p><span className="text-[10px] font-bold text-zinc-500 uppercase">{product.stock} un</span></div>
              <button onClick={() => addToCart(product)} className="w-full bg-zinc-950 hover:bg-lime-400 text-zinc-400 hover:text-black border border-zinc-800 hover:border-lime-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-95"><Plus size={16} /> Adicionar</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={openCart} className="fixed bottom-32 md:bottom-12 right-6 md:right-12 size-16 md:size-20 bg-lime-400 text-black rounded-[2rem] flex items-center justify-center shadow-2xl shadow-lime-400/30 hover:scale-110 active:scale-95 transition-all z-[60] cursor-pointer">
        <div className="relative"><ShoppingBag size={32} />{cartCount > 0 && <div className="absolute -top-3 -right-3 size-7 bg-black text-lime-400 text-xs font-black rounded-full flex items-center justify-center border-4 border-lime-400">{cartCount}</div>}</div>
      </button>
    </div>
  );
};

// --- PROFESSIONAL COMPONENTS ---

const ProfessionalDashboard = ({ type }: { type: Role }) => (
  <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-12">
    <header>
      <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">Dashboard {type === 'PROFESSOR' ? 'Coach' : 'Nutri'}</h2>
      <p className="text-zinc-500 font-medium">Visão geral do desempenho da sua consultoria e atividades recentes.</p>
    </header>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard label="Alunos" value="48" trend="+4" color="text-lime-400" icon={Users}/>
      <StatCard label="Receita" value="R$ 8.4K" trend="+12%" color="text-blue-400" icon={DollarSign}/>
      <StatCard label="Consultas" value="12" color="text-orange-500" icon={type === 'PROFESSOR' ? Dumbbell : Salad}/>
      <StatCard label="Satisfação" value="9.8" color="text-blue-500" icon={Trophy}/>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-2xl">
        <h4 className="text-xl font-black italic uppercase mb-8 flex items-center gap-3">
          <TrendingUp size={20} className="text-lime-400"/> Crescimento Mensal
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[{ name: 'Set', s: 30 }, { name: 'Out', s: 48 }, { name: 'Nov', s: 52 }]}>
              <defs>
                <linearGradient id="colorS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D9FF00" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#D9FF00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} />
              <Area type="monotone" dataKey="s" stroke="#D9FF00" strokeWidth={4} fill="url(#colorS)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-2xl">
        <h4 className="text-xl font-black italic uppercase mb-8 flex items-center gap-3">
          <Activity size={20} className="text-blue-400"/> Feed de Atividade
        </h4>
        <div className="space-y-4">
          {[
            { u: 'Alex Rivers', a: 'Concluiu Treino A', t: '15m' },
            { u: 'Bia Silva', a: 'Registrou Refeição', t: '1h' },
            { u: 'Carlos Motta', a: 'Assinatura Ativada', t: '4h' },
            { u: 'Davi Luiz', a: 'Nova Mensagem', t: '6h' },
          ].map((act, i) => (
            <div key={i} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center group hover:border-zinc-700 transition-colors">
              <div>
                <p className="text-xs font-black uppercase text-white group-hover:text-lime-400 transition-colors">{act.u}</p>
                <p className="text-[10px] text-zinc-500 font-bold">{act.a}</p>
              </div>
              <span className="text-[9px] font-black uppercase text-zinc-700">{act.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// --- MODULES ---

const StudentModule = ({ view, setView, products, addToCart, cartCount, setIsCartOpen, profileImage, onImageChange, biometrics, onBiometricsChange }: any) => {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 1);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutFinished, setWorkoutFinished] = useState(false);
  const [workoutSeconds, setWorkoutSeconds] = useState<number>(0);
  const [finalTime, setFinalTime] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isWorkoutActive) interval = setInterval(() => setWorkoutSeconds(p => p + 1), 1000);
    else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  if (view === 'store') return <StoreView products={products} addToCart={addToCart} cartCount={cartCount} openCart={() => setIsCartOpen(true)} />;
  if (view === 'workouts') return isWorkoutActive ? (
    <ActiveWorkoutSession workout={INITIAL_WORKOUTS[selectedDay] || { exercises: [] }} workoutTime={workoutSeconds} onFinish={(t: any) => { setFinalTime(t); setWorkoutFinished(true); setIsWorkoutActive(false); }} onClose={() => setIsWorkoutActive(false)} />
  ) : workoutFinished ? (
    <FinishedSessionView totalTime={finalTime} reset={() => { setWorkoutFinished(false); setView('dashboard'); }} />
  ) : (
    <CalendarBase title="Planilha" sub="Sua programação" selectedDay={selectedDay} setSelectedDay={setSelectedDay} days={DAYS_SHORT}>
      <WorkoutDetailCard workout={INITIAL_WORKOUTS[selectedDay] || { exercises: [], title: 'Descanso' }} onStart={() => { setWorkoutSeconds(0); setIsWorkoutActive(true); }} />
    </CalendarBase>
  );
  if (view === 'diet') return (<CalendarBase title="Nutrição" sub="Seu combustível" selectedDay={selectedDay} setSelectedDay={setSelectedDay} days={DAYS_SHORT}><NutritionView diet={WEEKLY_DIETS[selectedDay] || DEFAULT_DIET} dayIdx={selectedDay} /></CalendarBase>);
  if (view === 'evolution') return <EvolutionView />;
  if (view === 'profile') return <ProfileView profileImage={profileImage} onImageChange={onImageChange} biometrics={biometrics} onBiometricsChange={onBiometricsChange} />;
  return <StudentDashboard setView={setView} profileImage={profileImage} biometrics={biometrics} />;
};

const ProfessorModule = ({ view, setView, students, onAddStudent, templates, onAddTemplate, onRemoveTemplate }: any) => {
  if (view === 'students') return <StudentManagementView title="Alunos Ativos" type="PROFESSOR" students={students} onAddStudent={onAddStudent} templates={templates} />;
  if (view === 'templates') return <WorkoutTemplatesView templates={templates} onAddTemplate={onAddTemplate} onRemoveTemplate={onRemoveTemplate} />;
  return <ProfessionalDashboard type="PROFESSOR" />;
};

const StudentDashboard = ({ setView, profileImage, biometrics }: any) => {
  const today = new Date().getDay() || 1;
  const workout = INITIAL_WORKOUTS[today];
  const diet = WEEKLY_DIETS[today] || DEFAULT_DIET;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-8"><div className="relative group cursor-pointer" onClick={() => setView('profile')}><img src={profileImage} className="size-24 rounded-[3rem] border-[6px] border-zinc-900 shadow-2xl object-cover"/><div className="absolute -bottom-2 -right-2 size-10 bg-lime-400 text-black rounded-2xl flex items-center justify-center border-4 border-zinc-950"><Trophy size={20} strokeWidth={3} /></div></div><div><h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-3">Alex Rivers</h1><div className="flex items-center gap-4"><span className="bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-xl text-xs font-black uppercase text-zinc-500">Nível 28</span><div className="w-48 h-2.5 bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-lime-400 w-3/4 shadow-[0_0_15px_#D9FF00]" /></div></div></div></div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><StatCard label="Peso" value={`${biometrics.weight}kg`} trend="-0.4" color="text-lime-400" icon={Scale}/><StatCard label="Meta Kcal" value={diet.kcal.toString()} color="text-blue-400" icon={Utensils}/><StatCard label="Sessões" value="18" trend="🔥" color="text-orange-500" icon={Zap}/><StatCard label="Hidratação" value="2.8L" color="text-blue-500" icon={Droplets}/></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div onClick={() => setView('workouts')} className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-[4rem] p-12 relative group cursor-pointer hover:border-lime-400/30 transition-all"><div className="absolute top-0 right-0 p-12 opacity-5 text-lime-400"><Dumbbell size={300} /></div><div className="relative z-10 max-w-lg"><span className="text-[11px] bg-lime-400 text-black px-5 py-2 rounded-full font-black uppercase mb-8 inline-block tracking-widest">HOJE</span><h3 className="text-6xl font-black italic uppercase tracking-tighter mb-6 leading-none">{workout ? workout.title.split(':')[0] : 'Rest Day'}</h3><button className="bg-lime-400 text-black px-12 py-6 rounded-3xl font-black uppercase text-lg flex items-center gap-4 shadow-2xl">INICIAR TREINO <ArrowRight size={28} /></button></div></div>
        <div onClick={() => setView('diet')} className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-[4rem] p-10 relative group cursor-pointer hover:border-blue-400/30 transition-all flex flex-col justify-between"><div className="absolute top-0 right-0 p-8 opacity-5 text-blue-400"><Salad size={160}/></div><div><span className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-4 block">PLANO NUTRI</span><h4 className="text-3xl font-black italic uppercase">Próxima: Almoço</h4></div><div className="mt-10"><p className="text-4xl font-black italic text-white leading-none">{diet.kcal} kcal</p><p className="text-zinc-500 text-xs font-bold uppercase mt-2">Meta Diária</p></div></div>
      </div>
    </div>
  );
};

const StudentManagementView = ({ title, type, students, onAddStudent, templates }: { title: string, type: 'PROFESSOR' | 'NUTRI', students: Student[], onAddStudent: (s: Partial<Student>) => void, templates?: WorkoutTemplate[] }) => {
  const [consoleState, setConsoleState] = useState<{ student: Student | null, view: string }>({ student: null, view: 'profile' });
  if (consoleState.student) return <StudentConsole student={consoleState.student} type={type} templates={templates} onClose={() => setConsoleState({ student: null, view: 'profile' })} />;
  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <header className="flex justify-between items-end"><div><h2 className="text-5xl font-black italic uppercase">{title}</h2><p className="text-zinc-500 font-medium">Gestão direta.</p></div><button className="bg-lime-400 text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><UserPlus size={18}/> Novo Aluno</button></header>
      <div className="space-y-4">{students.map(s => (<div key={s.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] flex items-center gap-8 group hover:border-zinc-700 transition-all"><img src={s.avatar} className="size-16 rounded-[1.5rem] object-cover border-2 border-zinc-800"/><div className="flex-1"><h4 className="text-lg font-black italic uppercase text-white">{s.name}</h4><p className="text-[10px] font-black uppercase text-zinc-500">{s.plan} • {s.lastVisit}</p></div><button onClick={() => setConsoleState({ student: s, view: 'profile' })} className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-lime-400 transition-all">Ver Perfil</button></div>))}</div>
    </div>
  );
};

const StudentConsole = ({ student, type, onClose, initialView = 'profile', templates = [] }: any) => {
  const [view, setView] = useState(initialView);
  const [selectedDay, setSelectedDay] = useState(1);
  const [workouts, setWorkouts] = useState(INITIAL_WORKOUTS);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [targetDays, setTargetDays] = useState<number[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [orientationItems, setOrientationItems] = useState<string[]>(['']);
  const [newExercise, setNewExercise] = useState({ n: '', s: '', r: '', w: '', rest: '60', group: '', video: '' });

  const handleSaveExercise = (e: React.FormEvent) => {
    e.preventDefault();
    const dayWorkout = workouts[selectedDay] || { title: `Treino de ${DAYS_SHORT[selectedDay]}`, exercises: [] };
    const updatedExs = editingExerciseId ? dayWorkout.exercises.map((ex: any) => ex.id === editingExerciseId ? { ...newExercise, id: ex.id, orientations: orientationItems.filter(i => i.trim()) } : ex) : [...dayWorkout.exercises, { ...newExercise, id: Date.now().toString(), orientations: orientationItems.filter(i => i.trim()) }];
    setWorkouts({ ...workouts, [selectedDay]: { ...dayWorkout, exercises: updatedExs } });
    setIsAddingExercise(false);
    setEditingExerciseId(null);
  };

  const handleDuplicate = () => {
    const src = workouts[selectedDay];
    if (!src || !src.exercises.length) return;
    const next = { ...workouts };
    targetDays.forEach(d => next[d] = { ...src, exercises: src.exercises.map((ex: any, i: number) => ({ ...ex, id: `cloned-${d}-${Date.now()}-${i}` })) });
    setWorkouts(next);
    setIsDuplicating(false);
    setTargetDays([]);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black flex animate-in fade-in duration-500 overflow-y-auto">
       <aside className="w-80 border-r border-zinc-900 bg-zinc-950 p-8 flex flex-col gap-10 shrink-0">
          <button onClick={onClose} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-4"><ChevronLeft size={16}/> Voltar</button>
          <div className="text-center"><img src={student.avatar} className="size-32 rounded-[3rem] border-4 border-zinc-900 mx-auto mb-6 shadow-2xl" /><h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{student.name}</h3><p className="text-[10px] font-black text-zinc-500 uppercase mt-2">{student.plan}</p></div>
          <nav className="space-y-2 mt-4">
             <button onClick={() => setView('profile')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'profile' ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:bg-zinc-900'}`}><User size={18}/> Perfil</button>
             {(type === 'PROFESSOR' || type === 'ADMIN') && <button onClick={() => setView('workouts')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'workouts' ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:bg-zinc-900'}`}><Dumbbell size={18}/> Treino</button>}
             {(type === 'NUTRI' || type === 'ADMIN') && <button onClick={() => setView('diet')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'diet' ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:bg-zinc-900'}`}><Apple size={18}/> Dieta</button>}
          </nav>
       </aside>
       <main className="flex-1 p-12 lg:p-20 bg-zinc-950">
          {view === 'diet' && (
            <div className="space-y-12">
               <header className="flex justify-between items-end"><div><h2 className="text-5xl font-black italic uppercase mb-2">Plano Alimentar</h2><p className="text-zinc-500 font-medium">Visualização da dieta do aluno.</p></div><div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl gap-1">{DAYS_SHORT.map((d, i) => (<button key={i} onClick={() => setSelectedDay(i)} className={`w-12 h-12 flex items-center justify-center rounded-xl text-[10px] font-black uppercase transition-all ${selectedDay === i ? 'bg-lime-400 text-black' : 'text-zinc-500'}`}>{d}</button>))}</div></header>
               <NutritionView diet={WEEKLY_DIETS[selectedDay] || DEFAULT_DIET} dayIdx={selectedDay} />
            </div>
          )}
          {view === 'workouts' && (
            <div className="space-y-12">
               <header className="flex justify-between items-end"><div><h2 className="text-5xl font-black italic uppercase mb-2">Prescrever Treino</h2><p className="text-zinc-500 font-medium">Monte a rotina do aluno.</p></div><div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl gap-1">{DAYS_SHORT.map((d, i) => (<button key={i} onClick={() => setSelectedDay(i)} className={`w-12 h-12 flex items-center justify-center rounded-xl text-[10px] font-black uppercase transition-all ${selectedDay === i ? 'bg-lime-400 text-black' : 'text-zinc-500'}`}>{d}</button>))}</div></header>
               <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl">
                  <div className="flex flex-col xl:flex-row justify-between xl:items-center mb-10 gap-6">
                    <h3 className="text-2xl font-black italic uppercase text-white">{workouts[selectedDay]?.title || `Treino de ${DAYS_SHORT[selectedDay]}`}</h3>
                    <div className="flex flex-wrap gap-3">
                       <button onClick={() => setIsImportModalOpen(true)} className="px-5 py-3 rounded-2xl font-black uppercase text-[10px] bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-lime-400 transition-all"><Download size={16}/> Importar Modelo</button>
                       <button onClick={() => setIsDuplicating(!isDuplicating)} className={`px-5 py-3 rounded-2xl font-black uppercase text-[10px] transition-all ${isDuplicating ? 'bg-blue-500' : 'bg-zinc-800 text-zinc-400'}`}><Copy size={16}/> Duplicar Treino</button>
                       <button onClick={() => { setEditingExerciseId(null); setOrientationItems(['']); setIsAddingExercise(true); }} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 transition-all"><Plus size={16}/> Adicionar Exercício</button>
                    </div>
                  </div>
                  {isDuplicating && (
                    <div className="bg-zinc-950 border border-blue-500/30 p-8 rounded-3xl mb-10"><h4 className="text-[10px] font-black uppercase text-blue-400 mb-6">Duplicar para:</h4><div className="flex gap-2 mb-8">{DAYS_SHORT.map((d, i) => (<button key={i} disabled={i === selectedDay} onClick={() => setTargetDays(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])} className={`h-12 min-w-[4rem] rounded-xl text-[10px] font-black border transition-all ${i === selectedDay ? 'opacity-20' : targetDays.includes(i) ? 'bg-blue-500 text-white' : 'bg-zinc-900 text-zinc-500'}`}>{d}</button>))}</div><button onClick={handleDuplicate} disabled={targetDays.length === 0} className="w-full bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Confirmar ({targetDays.length})</button></div>
                  )}
                  <div className="space-y-4">
                     {(!workouts[selectedDay]?.exercises || workouts[selectedDay].exercises.length === 0) ? (<div className="py-20 text-center italic text-zinc-700 font-bold uppercase tracking-widest">Nenhum exercício</div>) : (
                       workouts[selectedDay].exercises.map((ex: any, idx: number) => (
                         <div key={ex.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl flex flex-col gap-6 group">
                            <div className="flex items-center justify-between"><div className="flex items-center gap-6"><div className="size-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-lime-400 font-black italic">{idx + 1}</div><div><p className="text-sm font-black text-white uppercase italic">{ex.n}</p><div className="flex gap-3 text-[10px] font-black text-zinc-500 mt-1"><span>{ex.group}</span><span>•</span><span>{ex.s} séries</span><span>•</span><span>{ex.r} reps</span></div></div></div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setNewExercise(ex); setOrientationItems(ex.orientations || ['']); setEditingExerciseId(ex.id); setIsAddingExercise(true); }} className="size-10 rounded-xl bg-zinc-900 text-zinc-500 hover:text-white"><Pencil size={14}/></button><button onClick={() => { if(confirm('Remover?')) setWorkouts({...workouts, [selectedDay]: { ...workouts[selectedDay], exercises: workouts[selectedDay].exercises.filter((x: any) => x.id !== ex.id) } }); }} className="size-10 rounded-xl bg-red-500/10 text-red-500"><Trash size={14}/></button></div></div>
                         </div>
                       ))
                     )}
                  </div>
               </div>
            </div>
          )}
          {view === 'profile' && <ProfileView profileImage={student.avatar} onImageChange={() => {}} biometrics={{ height: '1.80', weight: '80', age: '25', goal: 'Hipertrofia' }} onBiometricsChange={() => {}} />}
       </main>

       {isAddingExercise && (
         <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[3rem] p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
               <div className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black italic uppercase tracking-tighter">{editingExerciseId ? 'Editar' : 'Adicionar'}</h3><button onClick={() => setIsAddingExercise(false)} className="size-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-all"><X size={20}/></button></div>
               <form onSubmit={handleSaveExercise} className="space-y-6">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Nome</label><input required value={newExercise.n} onChange={e => setNewExercise({...newExercise, n: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none focus:border-lime-400 transition-all" /></div>
                  <div className="grid grid-cols-4 gap-4">
                     <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Séries</label><input required value={newExercise.s} onChange={e => setNewExercise({...newExercise, s: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none" /></div>
                     <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Reps</label><input required value={newExercise.r} onChange={e => setNewExercise({...newExercise, r: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none" /></div>
                     <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Peso</label><input required value={newExercise.w} onChange={e => setNewExercise({...newExercise, w: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none" /></div>
                     <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Descanso</label><input required value={newExercise.rest} onChange={e => setNewExercise({...newExercise, rest: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none" /></div>
                  </div>
                  <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl mt-4">Salvar Exercício</button>
               </form>
            </div>
         </div>
       )}

       {isImportModalOpen && (
         <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-3xl rounded-[3rem] p-10 animate-in zoom-in duration-300">
               <div className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black italic uppercase">Modelos</h3><button onClick={() => setIsImportModalOpen(false)} className="size-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 transition-all"><X size={20}/></button></div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templates.map((template: WorkoutTemplate) => (
                    <div key={template.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl hover:border-lime-400/40 transition-all group">
                        <span className="text-[10px] font-black uppercase text-lime-400 bg-lime-400/10 px-3 py-1 rounded-full mb-4 inline-block">{template.category}</span>
                        <h4 className="text-xl font-black italic uppercase text-white mb-6">{template.title}</h4>
                        <button onClick={() => { const cl = template.exercises.map((ex: any, i: number) => ({ ...ex, id: `imp-${Date.now()}-${i}` })); setWorkouts({ ...workouts, [selectedDay]: { title: template.title, exercises: cl } }); setIsImportModalOpen(false); }} className="w-full bg-zinc-900 border border-zinc-800 group-hover:bg-lime-400 group-hover:text-black py-3 rounded-2xl font-black uppercase text-[10px] transition-all">Importar</button>
                    </div>
                  ))}
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

const WorkoutTemplatesView = ({ templates, onAddTemplate, onRemoveTemplate }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ title: '', category: 'A' });
  return (
    <div className="animate-in fade-in duration-700 space-y-12">
      <header className="flex justify-between items-end"><div><h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Modelos</h2><p className="text-zinc-500 font-medium">Treinos padronizados.</p></div><button onClick={() => setShowAdd(true)} className="bg-lime-400 text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl"><Plus size={16}/> Criar Modelo</button></header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((template: WorkoutTemplate) => (
          <div key={template.id} className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 relative group hover:border-lime-400/40 transition-all">
             <div className="mb-8"><span className="text-[10px] font-black uppercase text-lime-400 bg-lime-400/10 px-4 py-1.5 rounded-full mb-4 inline-block">{template.category}</span><h3 className="text-2xl font-black italic uppercase text-white leading-tight">{template.title}</h3></div>
             <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50"><span className="text-[10px] font-black text-zinc-600 uppercase">{template.exercises.length} Exercícios</span><button onClick={() => onRemoveTemplate(template.id)} className="size-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash size={14}/></button></div>
          </div>
        ))}
      </div>
      {showAdd && (
         <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-[3rem] p-10 animate-in zoom-in duration-300">
               <div className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black italic uppercase">Novo Modelo</h3><button onClick={() => setShowAdd(false)} className="size-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 transition-all"><X size={20}/></button></div>
               <form onSubmit={(e) => { e.preventDefault(); onAddTemplate({...newTemplate, id: Date.now().toString(), exercises: []}); setShowAdd(false); }} className="space-y-6">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Título</label><input required value={newTemplate.title} onChange={e => setNewTemplate({...newTemplate, title: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Categoria</label><input required value={newTemplate.category} onChange={e => setNewTemplate({...newTemplate, category: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none" /></div>
                  <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all">Salvar</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

// --- APP ---

const App: React.FC = () => {
  const [role, setRole] = useState<Role>('ALUNO');
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState("https://picsum.photos/seed/fitness/300");
  const [biometrics, setBiometrics] = useState<Biometrics>({ height: '1.82', weight: '84.2', age: '26', goal: 'Hipertrofia' });
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>(INITIAL_TEMPLATES);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = paymentMethod === 'pix' ? subtotal * 0.05 : 0;
  const total = subtotal - discount;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <div className="fixed top-6 right-6 z-[100] bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-2 rounded-3xl flex gap-1 shadow-2xl overflow-x-auto no-scrollbar max-w-[90vw]">
        {(['ALUNO', 'PROFESSOR', 'NUTRI', 'ADMIN'] as Role[]).map(r => (
          <button key={r} onClick={() => { setRole(r); setActiveView('dashboard'); }} className={`px-5 py-2.5 text-[10px] font-black rounded-2xl transition-all whitespace-nowrap ${role === r ? 'bg-lime-400 text-black' : 'text-zinc-500 hover:text-white'}`}>{r}</button>
        ))}
      </div>

      <aside className={`hidden md:flex flex-col border-r border-zinc-900 p-8 space-y-12 sticky top-0 h-screen bg-zinc-950 transition-all duration-500 ${sidebarOpen ? 'w-80' : 'w-28'}`}>
        <div className="flex items-center gap-5 text-lime-400 font-black text-2xl italic uppercase shrink-0"><div className="size-14 bg-lime-400 text-black rounded-[1.5rem] flex items-center justify-center rotate-3 border-[4px] border-zinc-950 shadow-xl"><Dumbbell size={32} strokeWidth={3} /></div>{sidebarOpen && <span>FITNESS<br/>TECH</span>}</div>
        <nav className="flex-1 space-y-3">
          <NavItem icon={<LayoutDashboard size={24}/>} label="Painel" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} collapsed={!sidebarOpen} />
          {role === 'ALUNO' && (
            <>
              <NavItem icon={<Dumbbell size={24}/>} label="Treinos" active={activeView === 'workouts'} onClick={() => setActiveView('workouts')} collapsed={!sidebarOpen} />
              <NavItem icon={<Apple size={24}/>} label="Nutrição" active={activeView === 'diet'} onClick={() => setActiveView('diet')} collapsed={!sidebarOpen} />
              <NavItem icon={<ShoppingBag size={24}/>} label="Loja" active={activeView === 'store'} onClick={() => { setActiveView('store'); if(activeView === 'store') setIsCartOpen(true); }} collapsed={!sidebarOpen} badge={cart.length} />
              <NavItem icon={<TrendingUp size={24}/>} label="Evolução" active={activeView === 'evolution'} onClick={() => setActiveView('evolution')} collapsed={!sidebarOpen} />
              <NavItem icon={<User size={24}/>} label="Perfil" active={activeView === 'profile'} onClick={() => setActiveView('profile')} collapsed={!sidebarOpen} />
            </>
          )}
          {(role === 'PROFESSOR' || role === 'NUTRI' || role === 'ADMIN') && (
            <>
              <NavItem icon={<Users size={24}/>} label="Alunos" active={activeView === 'students'} onClick={() => setActiveView('students')} collapsed={!sidebarOpen} />
              {role === 'PROFESSOR' && <NavItem icon={<BookMarked size={24}/>} label="Modelos" active={activeView === 'templates'} onClick={() => setActiveView('templates')} collapsed={!sidebarOpen} />}
            </>
          )}
        </nav>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl flex justify-center text-zinc-400 hover:text-white transition-all">{sidebarOpen ? <ArrowLeft size={24}/> : <ArrowRight size={24}/>}</button>
      </aside>

      <main className="flex-1 p-6 md:p-12 lg:px-20 max-w-8xl mx-auto w-full pb-32">
        {role === 'ALUNO' && (
          <StudentModule 
            view={activeView} setView={setActiveView} products={products} 
            addToCart={(p:any)=>setCart([...cart, {...p, quantity: 1}])} 
            cartCount={cart.length} setIsCartOpen={setIsCartOpen} 
            profileImage={profileImage} onImageChange={setProfileImage} 
            biometrics={biometrics} onBiometricsChange={setBiometrics} 
          />
        )}
        {(role === 'PROFESSOR' || role === 'NUTRI' || role === 'ADMIN') && (
          <ProfessorModule 
            view={activeView} setView={setActiveView} students={students} 
            onAddStudent={()=>{}} templates={workoutTemplates} 
            onAddTemplate={(d:any)=>setWorkoutTemplates([d, ...workoutTemplates])} 
            onRemoveTemplate={(id:any)=>setWorkoutTemplates(workoutTemplates.filter(t=>t.id!==id))} 
          />
        )}
      </main>

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-lg flex justify-end" onClick={() => setIsCartOpen(false)}>
          <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-900 h-screen flex flex-col animate-in slide-in-from-right duration-500" onClick={e=>e.stopPropagation()}>
             <div className="p-8 border-b border-zinc-900 flex justify-between items-center"><div className="flex items-center gap-4 text-2xl font-black italic uppercase"><ShoppingCart size={32} className="text-lime-400" /> Carrinho</div><button onClick={() => setIsCartOpen(false)} className="size-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button></div>
             <div className="flex-1 overflow-y-auto p-8 space-y-10">
               <div className="space-y-4">
                  {cart.length === 0 ? (<div className="py-12 text-center text-zinc-600 italic font-bold">Vazio</div>) : cart.map((item, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-[2rem] flex gap-4"><img src={item.img} className="size-16 rounded-2xl object-cover"/><div className="flex-1"><h5 className="font-bold text-xs uppercase italic text-white">{item.name}</h5><div className="flex justify-between items-center mt-2"><p className="font-black text-lime-400 italic">R$ {item.price.toFixed(2)}</p><button onClick={() => setCart(cart.filter((_, idx)=>idx!==i))} className="text-red-500"><Trash2 size={12}/></button></div></div></div>
                  ))}
               </div>
               {cart.length > 0 && (<section className="space-y-3"><h6 className="text-[10px] font-black uppercase text-zinc-600 mb-6">Pagamento</h6>{['pix', 'credit_card'].map(m=>(<button key={m} onClick={()=>setPaymentMethod(m)} className={`w-full flex items-center gap-4 p-5 rounded-3xl border transition-all ${paymentMethod === m ? 'bg-lime-400/10 border-lime-400' : 'bg-zinc-900 border-zinc-800'}`}>{m === 'pix' ? <QrCode size={24}/> : <CreditCard size={24}/>}<div><p className="font-black uppercase italic text-sm">{m === 'pix' ? 'PIX' : 'Cartão'}</p></div></button>))}</section>)}
             </div>
             <div className="p-8 bg-zinc-900/50 border-t border-zinc-900 space-y-6">
                <div className="space-y-3"><div className="flex justify-between text-zinc-500 font-bold text-[10px] uppercase"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div><div className="pt-3 border-t border-zinc-800 flex justify-between items-center"><span className="text-zinc-500 font-black uppercase text-[10px]">Total</span><span className="text-3xl font-black italic text-white">R$ {total.toFixed(2)}</span></div></div>
                <button disabled={cart.length === 0 || !paymentMethod} className={`w-full py-6 rounded-2xl font-black uppercase text-sm transition-all ${!paymentMethod ? 'bg-zinc-800 text-zinc-600' : 'bg-lime-400 text-black shadow-xl shadow-lime-400/20'}`}>Finalizar Pedido</button>
             </div>
          </div>
        </div>
      )}

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-zinc-950/90 backdrop-blur-3xl border-t border-zinc-900 flex items-center justify-around z-50 px-8 pb-4">
        <button onClick={() => setActiveView('dashboard')} className={activeView === 'dashboard' ? 'text-lime-400' : 'text-zinc-600'}><LayoutDashboard size={28}/></button>
        <button onClick={() => setActiveView(role === 'ALUNO' ? 'workouts' : 'students')} className={activeView === (role === 'ALUNO' ? 'workouts' : 'students') ? 'text-lime-400' : 'text-zinc-600'}>{role === 'ALUNO' ? <Dumbbell size={28}/> : <Users size={28}/>}</button>
        <button onClick={() => setActiveView('profile')} className={activeView === 'profile' ? 'text-lime-400' : 'text-zinc-600'}><User size={28}/></button>
      </nav>
    </div>
  );
};

export default App;
