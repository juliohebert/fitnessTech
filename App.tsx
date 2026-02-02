import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, LayoutDashboard, Apple, TrendingUp, Trophy,
  ArrowLeft, ArrowRight, Flame, DollarSign, Search, ShoppingCart, 
  CheckCircle2, Clock, Info, Play, Weight,
  Check, X, Timer, SkipForward, Award, Circle, Droplets, Zap, Activity,
  Smartphone, QrCode, CreditCard, Wallet, Trash2, Coffee, Sun, Moon, Repeat, Plus,
  ChevronRight, CheckCircle, Video, Wrench, BookOpen, ExternalLink, PlayCircle,
  Timer as TimerIcon, ChevronDown, ChevronUp, History, RotateCcw, Users, Salad, Utensils, MousePointer2,
  Package, Tag, Filter, ShoppingBag, Percent
} from 'lucide-react';
import { 
  ResponsiveContainer, Cell, 
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, AreaChart, Area, BarChart, Bar
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

// --- MOCK DATA ---

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Whey Isolate 900g', price: 249.90, brand: 'Max Titanium', img: 'https://images.unsplash.com/photo-1593095191850-2a733009e073?q=80&w=400', category: 'Suplementos', stock: 15 },
  { id: 2, name: 'Creatina Monohidratada', price: 89.90, brand: 'Growth', img: 'https://images.unsplash.com/photo-1579722820308-d74e5719d54e?q=80&w=400', category: 'Suplementos', stock: 40 },
  { id: 3, name: 'Straps Pro Edition', price: 55.00, brand: 'Fitness Tech', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400', category: 'Equipamentos', stock: 10 },
  { id: 4, name: 'Camiseta Oversized Zinc', price: 119.00, brand: 'Vou de Gym', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400', category: 'Vestuário', stock: 25 },
];

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
  1: { id: 'd1', title: 'High Carb: Treino de Força', kcal: 3150, meals: [
    { n: 'Café da Manhã', t: '07:30', kcal: 650, icon: <Coffee />, items: [{ name: '4 Ovos Mexidos', kcal: 320 }, { name: '100g Aveia', kcal: 250 }] },
    { n: 'Almoço', t: '13:00', kcal: 850, icon: <Sun />, items: [{ name: '200g Frango', kcal: 330 }, { name: '250g Arroz Integral', kcal: 450 }] },
  ]},
};

const DEFAULT_DIET = { id: 'default', title: 'Manutenção Padrão', kcal: 2500, meals: [
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

// --- BASE UI COMPONENTS ---

const NavItem = ({ icon, label, active, onClick, collapsed, badge }: any) => (
  <div onClick={onClick} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all relative ${active ? 'bg-lime-400 text-black shadow-xl shadow-lime-400/20 scale-[1.02]' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'}`}>
    <div className={`shrink-0 transition-transform ${active ? 'scale-110' : ''}`}>{icon}</div>
    {!collapsed && <span className="text-xs font-black uppercase tracking-widest truncate">{label}</span>}
    {badge > 0 && (
      <div className="absolute top-2 right-2 size-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-950">
        {badge}
      </div>
    )}
  </div>
);

const StatCard = ({ label, value, subValue, trend, color, icon: Icon }: any) => (
  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group transition-all hover:translate-y-[-4px] shadow-xl">
    <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-700 ${color}`}>
      {Icon ? <Icon size={80} /> : <TrendingUp size={80} />}
    </div>
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
    <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
      <div>
        <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">{title}</h2>
        <p className="text-zinc-500 font-medium">{sub}</p>
      </div>
      <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-3xl gap-1 shadow-xl overflow-x-auto no-scrollbar">
        {days.map((day: string, idx: number) => (
          <button 
            key={idx} 
            onClick={() => setSelectedDay(idx)} 
            className={`min-w-[4.5rem] h-12 flex items-center justify-center rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest px-4 ${selectedDay === idx ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:bg-zinc-800'}`}
          >
            {day}
          </button>
        ))}
      </div>
    </header>
    <div className="min-h-[50vh]">
      {children}
    </div>
  </div>
);

// --- WORKOUT INTERACTIVE COMPONENTS ---

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

  // Fix: Explicitly type reduce calls to avoid 'unknown' errors
  const totalPossibleSets: number = (workout?.exercises || []).reduce((acc: number, ex: any): number => acc + (Number(ex.s) || 0), 0);
  const totalCompletedSets: number = Object.values(exerciseProgress).reduce((acc: number, val: number): number => acc + val, 0);
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

const WorkoutDetailCard = ({ workout, onStart }: any) => {
  if (!workout.exercises || workout.exercises.length === 0) return (<div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-20 text-center shadow-2xl"><div className="size-24 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-8 text-zinc-700"><RotateCcw size={48} /></div><h3 className="text-3xl font-black italic uppercase mb-2">Descanso</h3></div>);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl">
      <div className="flex items-center gap-4 mb-10"><span className="bg-lime-400 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Série {workout.category}</span><span className="text-zinc-500 text-sm font-bold flex items-center gap-2"><Clock size={16} /> {workout.duration}</span></div>
      <h3 className="text-5xl font-black italic uppercase tracking-tighter mb-12 leading-none">{workout.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">{workout.exercises.map((ex: any, i: number) => (<div key={i} className="flex items-center justify-between p-6 bg-zinc-950/60 rounded-3xl border border-zinc-800"><div className="flex items-center gap-4"><div className="size-10 bg-zinc-900 rounded-xl flex items-center justify-center text-lime-400 font-black italic">{i+1}</div><div className="min-w-0"><p className="font-bold text-sm truncate uppercase tracking-tight italic">{ex.n}</p><p className="text-[10px] text-zinc-500 font-bold uppercase">{ex.s}X {ex.r} • {ex.w}</p></div></div></div>))}</div>
      <button onClick={onStart} className="w-full bg-lime-400 text-black py-7 rounded-[2rem] font-black uppercase tracking-widest text-xl flex items-center justify-center gap-4 shadow-xl active:scale-[0.98] transition-all shadow-lime-400/20"><Play size={28} fill="currentColor" /> COMEÇAR AGORA</button>
    </div>
  );
};

// --- STORE COMPONENTS ---

const StoreView = ({ products, addToCart, cartCount }: any) => {
  const [filter, setFilter] = useState('Todos');
  const categories = ['Todos', 'Suplementos', 'Equipamentos', 'Vestuário'];
  const filteredProducts = filter === 'Todos' ? products : products.filter((p: Product) => p.category === filter);

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <header className="flex flex-col lg:row justify-between lg:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">Marketplace</h2>
          <p className="text-zinc-500 font-medium">Equipamentos e suplementos de elite.</p>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-3xl gap-1 shadow-xl overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={`min-w-[6rem] h-12 flex items-center justify-center rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest px-6 ${filter === c ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:bg-zinc-800'}`}>
              {c}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.map((product: Product) => (
          <div key={product.id} className="group bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-lime-400/40 transition-all shadow-xl hover:translate-y-[-8px]">
            <div className="aspect-square relative overflow-hidden bg-zinc-950">
              <img src={product.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name}/>
              <div className="absolute top-4 left-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 px-3 py-1 rounded-full">
                <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest">{product.brand}</span>
              </div>
            </div>
            <div className="p-8">
              <h4 className="text-lg font-black italic uppercase tracking-tight mb-2 truncate">{product.name}</h4>
              <div className="flex items-center justify-between mb-8">
                 <p className="text-2xl font-black text-white italic">R$ {product.price.toFixed(2)}</p>
                 <span className="text-[10px] font-bold text-zinc-500 uppercase">{product.stock} un</span>
              </div>
              <button onClick={() => addToCart(product)} className="w-full bg-zinc-950 hover:bg-lime-400 text-zinc-400 hover:text-black border border-zinc-800 hover:border-lime-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-95">
                <Plus size={16} /> Adicionar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminStoreView = ({ products, setProducts }: any) => {
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', brand: '', category: 'Suplementos', stock: '' });

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: Date.now(),
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      brand: newProduct.brand,
      category: newProduct.category,
      stock: parseInt(newProduct.stock),
      img: 'https://images.unsplash.com/photo-1579722820308-d74e5719d54e?q=80&w=400'
    };
    setProducts([...products, product]);
    setShowForm(false);
    setNewProduct({ name: '', price: '', brand: '', category: 'Suplementos', stock: '' });
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-12">
      <header className="flex justify-between items-end">
        <div><h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Gestão de Loja</h2><p className="text-zinc-500 font-medium">Inventário e Marketplace.</p></div>
        <button onClick={() => setShowForm(true)} className="bg-lime-400 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-lime-400/20"><Plus size={20} /> Novo Produto</button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <StatCard label="Estoque" value={products.reduce((acc: number, p: Product) => acc + p.stock, 0)} color="text-blue-400" icon={Package} />
        <StatCard label="Valor Total" value={`R$ ${products.reduce((acc: number, p: Product) => acc + (p.price * p.stock), 0).toLocaleString()}`} color="text-lime-400" icon={DollarSign} />
        <StatCard label="Produtos" value={products.length} color="text-orange-400" icon={Tag} />
        <StatCard label="Vendas" value="24" color="text-pink-400" icon={ShoppingBag} />
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-zinc-950 border-b border-zinc-800"><th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Produto</th><th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Categoria</th><th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Preço</th><th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Estoque</th><th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Ações</th></tr></thead>
          <tbody>{products.map((p: Product) => (<tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"><td className="px-8 py-6"><div className="flex items-center gap-4"><img src={p.img} className="size-12 rounded-xl object-cover border border-zinc-800" /><div><p className="font-bold text-white uppercase text-sm">{p.name}</p><p className="text-[10px] text-zinc-500 font-bold tracking-widest">{p.brand}</p></div></div></td><td className="px-8 py-6 text-xs text-zinc-400 font-bold">{p.category}</td><td className="px-8 py-6 text-sm font-black text-lime-400">R$ {p.price.toFixed(2)}</td><td className="px-8 py-6"><span className={`px-4 py-1 rounded-full text-[10px] font-black ${p.stock < 5 ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>{p.stock} UN</span></td><td className="px-8 py-6"><button className="text-zinc-600 hover:text-white transition-colors"><RotateCcw size={18}/></button></td></tr>))}</tbody>
        </table>
      </div>
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-[3rem] p-10 animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black italic uppercase">Cadastrar Produto</h3><button onClick={() => setShowForm(false)} className="size-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500"><X size={20}/></button></div>
             <form onSubmit={addProduct} className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-500 ml-4">Nome</label><input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-lime-400 outline-none" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-500 ml-4">Marca</label><input required value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-lime-400 outline-none" /></div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-500 ml-4">Preço</label><input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-lime-400 outline-none" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-500 ml-4">Estoque</label><input required type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-lime-400 outline-none" /></div>
               </div>
               <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-lime-400/20 active:scale-95 transition-all">Salvar Produto</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- NUTRITION VIEW ---

const NutritionView = ({ diet, dayIdx }: { diet: any, dayIdx: number }) => {
  const [completedMeals, setCompletedMeals] = useState<number[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem(`fitness_tech_diet_day_${dayIdx}`);
    if (saved) setCompletedMeals(JSON.parse(saved));
    else setCompletedMeals([]);
  }, [dayIdx]);

  const toggleMeal = (idx: number) => {
    const newCompleted = completedMeals.includes(idx) ? completedMeals.filter(i => i !== idx) : [...completedMeals, idx];
    setCompletedMeals(newCompleted);
    localStorage.setItem(`fitness_tech_diet_day_${dayIdx}`, JSON.stringify(newCompleted));
  };

  const totalMeals = diet.meals.length;
  const doneCount = completedMeals.length;
  const progressPercent = totalMeals > 0 ? (doneCount / totalMeals) * 100 : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-2xl">
        <div className="size-8 bg-lime-400/20 text-lime-400 rounded-lg flex items-center justify-center shrink-0"><Info size={16} /></div>
        <p className="text-xs text-zinc-400 font-medium italic"><span className="text-zinc-100 font-bold">Dica:</span> Clique no card para dar o check-in!</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3"><div className="size-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center"><Utensils size={20} /></div><div><p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Dieta Diária</p><h4 className="text-lg font-black italic uppercase leading-none">{doneCount} de {totalMeals} feitas</h4></div></div>
          <span className="text-xl font-black italic text-lime-400">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5"><div className="h-full bg-lime-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(217,255,0,0.3)]" style={{ width: `${progressPercent}%` }} /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
           {diet.meals.map((meal: any, idx: number) => {
             const isDone = completedMeals.includes(idx);
             return (
               <div key={idx} onClick={() => toggleMeal(idx)} className={`group relative bg-zinc-900 border cursor-pointer rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-6 transition-all duration-300 active:scale-[0.98] ${isDone ? 'border-lime-400/30 bg-lime-400/5 shadow-inner' : 'border-zinc-800 hover:border-zinc-700'}`}>
                  {!isDone && (<div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"><MousePointer2 size={14} className="text-lime-400 animate-bounce" /><span className="text-[9px] font-black uppercase text-lime-400 tracking-widest">Clique para concluir</span></div>)}
                  <div className={`size-16 rounded-3xl flex items-center justify-center shrink-0 shadow-lg border transition-all duration-500 ${isDone ? 'bg-lime-400 border-lime-400 text-black rotate-12' : 'bg-zinc-950 border-zinc-800 text-blue-400'}`}>{isDone ? <Check size={28} strokeWidth={4} /> : meal.icon}</div>
                  <div className="flex-1">
                     <div className="flex flex-col sm:row sm:items-center justify-between mb-4 gap-2"><h4 className={`text-xl font-black italic uppercase tracking-tight ${isDone ? 'text-zinc-500 line-through' : 'text-white'}`}>{meal.n}</h4><div className="flex items-center gap-3"><span className="text-[10px] bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg font-black">{meal.t}</span><span className={`text-[10px] px-3 py-1 rounded-lg font-black ${isDone ? 'bg-lime-400 text-black' : 'bg-blue-500/20 text-blue-400'}`}>{meal.kcal} kcal</span></div></div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{meal.items.map((item: any, i: number) => (<div key={i} className={`p-4 rounded-2xl flex justify-between items-center border ${isDone ? 'bg-zinc-950/30 border-zinc-800/50 opacity-60' : 'bg-zinc-950 border-zinc-800'}`}><span className="text-xs font-bold text-zinc-300">{item.name}</span><span className="text-[9px] font-black uppercase text-zinc-600">{item.kcal} kcal</span></div>))}</div>
                  </div>
               </div>
             );
           })}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-xl h-fit"><h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-8">Macros</h4><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={MACRO_DISTRIBUTION} innerRadius={60} outerRadius={90} paddingAngle={10} dataKey="value">{MACRO_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.fill}/>)}</Pie></PieChart></ResponsiveContainer></div></div>
      </div>
    </div>
  );
};

// --- STUDENT MODULE ---

const StudentModule = ({ view, setView, products, addToCart, cartCount }: any) => {
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

  if (view === 'store') return <StoreView products={products} addToCart={addToCart} cartCount={cartCount} />;
  
  if (view === 'workouts') return isWorkoutActive ? (
    <ActiveWorkoutSession workout={WEEKLY_WORKOUTS[selectedDay] || { exercises: [] }} workoutTime={workoutSeconds} onFinish={handleFinish} onClose={() => setIsWorkoutActive(false)} />
  ) : workoutFinished ? (
    <FinishedSessionView title="Treino Concluído" totalTime={finalTime} reset={() => { setWorkoutFinished(false); setView('dashboard'); }} />
  ) : (
    <CalendarBase title="Planilha" sub="Sua programação de alta performance." selectedDay={selectedDay} setSelectedDay={setSelectedDay} days={['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']}>
      <WorkoutDetailCard workout={WEEKLY_WORKOUTS[selectedDay] || { exercises: [], title: 'Descanso' }} onStart={startWorkout} />
    </CalendarBase>
  );

  if (view === 'diet') return (
    <CalendarBase title="Nutrição" sub="Seu combustível para o sucesso." selectedDay={selectedDay} setSelectedDay={setSelectedDay} days={['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']}>
      <NutritionView diet={WEEKLY_DIETS[selectedDay] || DEFAULT_DIET} dayIdx={selectedDay} />
    </CalendarBase>
  );
  
  return <StudentDashboard setView={setView} onStartWorkout={() => setView('workouts')} />;
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

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [role, setRole] = useState<Role>('ALUNO');
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item);
      return [...prev, {...product, quantity: 1}];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => { setCart(prev => prev.filter(item => item.id !== id)); };
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <div className="fixed top-6 right-6 z-[100] bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-2 rounded-3xl flex gap-1 shadow-2xl">
        {(['ALUNO', 'NUTRI', 'PROFESSOR', 'ADMIN'] as Role[]).map(r => (
          <button key={r} onClick={() => { setRole(r); setActiveView('dashboard'); }} className={`px-5 py-2.5 text-[10px] font-black rounded-2xl transition-all ${role === r ? 'bg-lime-400 text-black' : 'text-zinc-500 hover:text-white'}`}>{r}</button>
        ))}
      </div>

      <aside className={`hidden md:flex flex-col border-r border-zinc-900 p-8 space-y-12 sticky top-0 h-screen bg-zinc-950/50 backdrop-blur-md transition-all duration-500 ${sidebarOpen ? 'w-80' : 'w-28'}`}>
        <div className="flex items-center gap-5 text-lime-400 font-black text-2xl italic uppercase tracking-tighter shrink-0">
          <div className="size-14 bg-lime-400 text-black rounded-[1.5rem] flex items-center justify-center rotate-3 border-[4px] border-zinc-950 shadow-xl"><Dumbbell size={32} strokeWidth={3} /></div>
          {sidebarOpen && <span>FITNESS<br/>TECH</span>}
        </div>
        <nav className="flex-1 space-y-3">
          <NavItem icon={<LayoutDashboard size={24}/>} label="Painel" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} collapsed={!sidebarOpen} />
          {role === 'ALUNO' && (<><NavItem icon={<Dumbbell size={24}/>} label="Treinos" active={activeView === 'workouts'} onClick={() => setActiveView('workouts')} collapsed={!sidebarOpen} /><NavItem icon={<Apple size={24}/>} label="Nutrição" active={activeView === 'diet'} onClick={() => setActiveView('diet')} collapsed={!sidebarOpen} /><NavItem icon={<ShoppingBag size={24}/>} label="Loja" active={activeView === 'store'} onClick={() => setActiveView('store')} collapsed={!sidebarOpen} badge={cartCount} /><NavItem icon={<TrendingUp size={24}/>} label="Performance" active={activeView === 'evolution'} onClick={() => setActiveView('evolution')} collapsed={!sidebarOpen} /></>)}
          {role === 'ADMIN' && (<><NavItem icon={<Users size={24}/>} label="Alunos" active={activeView === 'students'} onClick={() => setActiveView('students')} collapsed={!sidebarOpen} /><NavItem icon={<Package size={24}/>} label="Gestão Loja" active={activeView === 'adminStore'} onClick={() => setActiveView('adminStore')} collapsed={!sidebarOpen} /><NavItem icon={<Percent size={24}/>} label="Campanhas" active={activeView === 'campaigns'} onClick={() => setActiveView('campaigns')} collapsed={!sidebarOpen} /></>)}
          {role === 'NUTRI' && (<><NavItem icon={<Users size={24}/>} label="Pacientes" active={activeView === 'patients'} onClick={() => setActiveView('patients')} collapsed={!sidebarOpen} /><NavItem icon={<Salad size={24}/>} label="Planos" active={activeView === 'diet'} onClick={() => setActiveView('diet')} collapsed={!sidebarOpen} /></>)}
        </nav>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl flex justify-center text-zinc-400 hover:text-white">{sidebarOpen ? <ArrowLeft size={24}/> : <ArrowRight size={24}/>}</button>
      </aside>

      <main className="flex-1 p-6 md:p-12 lg:px-20 max-w-8xl mx-auto w-full pb-32">
        {role === 'ALUNO' && <StudentModule view={activeView} setView={setActiveView} products={products} addToCart={addToCart} cartCount={cartCount} />}
        {role === 'ADMIN' && activeView === 'adminStore' && <AdminStoreView products={products} setProducts={setProducts} />}
        {role === 'ADMIN' && activeView !== 'adminStore' && (<div className="flex flex-col items-center justify-center min-h-[60vh] text-center italic"><Package size={80} className="text-zinc-800 mb-6" /><h2 className="text-2xl font-black uppercase text-zinc-700">Selecione "Gestão Loja"</h2></div>)}
      </main>

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-900 h-screen flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl">
             <div className="p-8 border-b border-zinc-900 flex justify-between items-center"><div className="flex items-center gap-4 text-2xl font-black italic uppercase"><ShoppingCart size={32} className="text-lime-400" /> Carrinho</div><button onClick={() => setIsCartOpen(false)} className="size-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button></div>
             <div className="flex-1 overflow-y-auto p-8 space-y-6">{cart.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-zinc-600 italic"><ShoppingBag size={64} className="mb-6 opacity-20" /><p>Carrinho vazio.</p></div>) : (cart.map(item => (<div key={item.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex gap-4"><img src={item.img} className="size-20 rounded-2xl object-cover" /><div className="flex-1 min-w-0"><h5 className="font-bold text-sm truncate uppercase italic">{item.name}</h5><p className="text-[10px] text-zinc-500 font-bold uppercase mb-3">{item.brand}</p><div className="flex items-center justify-between"><p className="font-black text-lime-400">R$ {item.price.toFixed(2)}</p><div className="flex items-center bg-zinc-950 rounded-xl px-2 py-1 gap-4 border border-zinc-800"><button onClick={() => removeFromCart(item.id)} className="text-red-500 p-1"><Trash2 size={14}/></button><span className="text-xs font-black">{item.quantity}</span></div></div></div></div>)))}</div>
             <div className="p-8 bg-zinc-900/50 border-t border-zinc-900 space-y-6"><div className="flex justify-between items-center"><span className="text-zinc-500 font-black uppercase text-xs">Subtotal</span><span className="text-2xl font-black italic">R$ {cartTotal.toFixed(2)}</span></div><button className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase text-sm shadow-xl">Finalizar Compra</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;