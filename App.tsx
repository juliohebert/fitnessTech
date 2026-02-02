
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
  MessageCircle, UserPlus, Pencil, Trash
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

// --- INITIAL DATA ---

const INITIAL_STUDENTS: Student[] = [
  { id: 1, name: 'Alex Rivers', email: 'alex@rivers.com', phone: '5511999999999', plan: 'VIP Performance', lastVisit: 'Hoje, 09:00', progress: 75, avatar: 'https://picsum.photos/seed/alex/100' },
  { id: 2, name: 'Bia Silva', email: 'bia@fitness.com', phone: '5511988888888', plan: 'Básico Semanal', lastVisit: 'Ontem', progress: 40, avatar: 'https://picsum.photos/seed/bia/100' },
  { id: 3, name: 'Caio Castro', email: 'caio@body.com', phone: '5511977777777', plan: 'Consultoria Elite', lastVisit: 'há 2 dias', progress: 90, avatar: 'https://picsum.photos/seed/caio/100' },
];

const PROF_PLANS: ServicePlan[] = [
  { id: 1, title: 'Consultoria Online Mensal', price: 199.90, duration: '30 dias', activeStudents: 12, description: 'Treino personalizado com acompanhamento via chat.' },
  { id: 2, title: 'Plano Semestral Bodybuilder', price: 899.00, duration: '180 dias', activeStudents: 5, description: 'Foco total em competição e hipertrofia extrema.' },
];

const NUTRI_PLANS: ServicePlan[] = [
  { id: 3, title: 'Acompanhamento Nutricional 60d', price: 250.00, duration: '60 dias', activeStudents: 8, description: 'Ajustes quinzenais de macros e suplementação.' },
  { id: 4, title: 'Dieta Flexível Master', price: 150.00, duration: '30 dias', activeStudents: 15, description: 'Aprenda a comer o que gosta batendo as metas.' },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Whey Isolate 900g', price: 249.90, brand: 'Max Titanium', img: 'https://images.unsplash.com/photo-1593095191850-2a733009e073?q=80&w=400', category: 'Suplementos', stock: 15 },
  { id: 2, name: 'Creatina Monohidratada', price: 89.90, brand: 'Growth', img: 'https://images.unsplash.com/photo-1579722820308-d74e5719d54e?q=80&w=400', category: 'Suplementos', stock: 40 },
  { id: 3, name: 'Straps Pro Edition', price: 55.00, brand: 'Fitness Tech', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400', category: 'Equipamentos', stock: 10 },
  { id: 4, name: 'Camiseta Oversized Zinc', price: 119.00, brand: 'Vou de Gym', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400', category: 'Vestuário', stock: 25 },
];

const WEIGHT_HISTORY = [
  { date: 'Set 10', weight: 88.5, fat: 18.5 },
  { date: 'Set 17', weight: 87.2, fat: 18.2 },
  { date: 'Set 24', weight: 86.8, fat: 18.0 },
  { date: 'Out 01', weight: 85.5, fat: 17.5 },
  { date: 'Out 08', weight: 84.9, fat: 17.2 },
  { date: 'Out 15', weight: 84.2, fat: 16.8 },
];

const LIFT_PROGRESS = [
  { week: 'Semana 1', load: 80 },
  { week: 'Semana 2', load: 85 },
  { week: 'Semana 3', load: 85 },
  { week: 'Semana 4', load: 92 },
  { week: 'Semana 5', load: 95 },
  { week: 'Semana 6', load: 102 },
];

const PERSONAL_RECORDS = [
  { exercise: 'Supino Reto', weight: '105kg', date: '12 Out', icon: <Flame size={14}/>, color: 'text-orange-500' },
  { exercise: 'Agachamento', weight: '140kg', date: '08 Out', icon: <Zap size={14}/>, color: 'text-lime-400' },
  { exercise: 'Lev. Terra', weight: '180kg', date: '25 Set', icon: <Trophy size={14}/>, color: 'text-blue-500' },
];

const MACRO_DISTRIBUTION = [
  { name: 'Proteínas', value: 30, fill: '#D9FF00' },
  { name: 'Carbos', value: 50, fill: '#3b82f6' },
  { name: 'Gorduras', value: 20, fill: '#f97316' },
];

const INITIAL_WORKOUTS: Record<number, any> = {
  1: { title: 'Push Day: Hipertrofia Sistêmica', category: 'A', exercises: [
    { id: 'ex1', n: 'Supino Reto c/ Barra', s: 4, r: '8-10', w: '80kg', rest: 90, group: 'Peito', desc: 'Foco na cadência 2020. Barra toca o peito levemente.', equipment: ['Barra Olímpica', 'Banco Reto'], video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 'ex2', n: 'Supino Inclinado c/ Halteres', s: 3, r: '10-12', w: '32kg', rest: 60, group: 'Peito', desc: 'Foco na porção superior do peito. 45 graus.', equipment: ['Halteres', 'Banco Inclinado'], video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
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

// --- PROFESSIONAL SHARED COMPONENTS ---

const StudentConsole = ({ student, type, onClose, initialView = 'profile' }: any) => {
  const [view, setView] = useState(initialView);
  const [selectedDay, setSelectedDay] = useState(1);
  const [workouts, setWorkouts] = useState(INITIAL_WORKOUTS);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ n: '', s: '', r: '', w: '', rest: '60', group: '', desc: '' });

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    const dayWorkout = workouts[selectedDay] || { title: `Treino de ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][selectedDay]}`, category: 'A', exercises: [] };
    const updatedWorkout = {
      ...dayWorkout,
      exercises: [...dayWorkout.exercises, { ...newExercise, id: Date.now().toString() }]
    };
    setWorkouts({ ...workouts, [selectedDay]: updatedWorkout });
    setIsAddingExercise(false);
    setNewExercise({ n: '', s: '', r: '', w: '', rest: '60', group: '', desc: '' });
  };

  const removeExercise = (day: number, exId: string) => {
    const dayWorkout = workouts[day];
    const updatedExercises = dayWorkout.exercises.filter((ex: any) => ex.id !== exId);
    setWorkouts({ ...workouts, [day]: { ...dayWorkout, exercises: updatedExercises } });
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black flex animate-in fade-in duration-500 overflow-y-auto">
       <aside className="w-80 border-r border-zinc-900 bg-zinc-950 p-8 flex flex-col gap-10">
          <button onClick={onClose} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-4">
             <ChevronLeft size={16}/> Voltar para lista
          </button>
          <div className="text-center">
             <img src={student.avatar} className="size-32 rounded-[3rem] border-4 border-zinc-900 mx-auto mb-6 shadow-2xl" alt="Avatar"/>
             <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{student.name}</h3>
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-2">{student.plan}</p>
          </div>
          <nav className="space-y-2 mt-4">
             <button onClick={() => setView('profile')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'profile' ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:bg-zinc-900'}`}>
                <User size={18}/> Perfil do Aluno
             </button>
             <button onClick={() => setView('workouts')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'workouts' ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:bg-zinc-900'}`}>
                <Dumbbell size={18}/> Gestão de Treino
             </button>
             <button onClick={() => setView('diet')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'diet' ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:bg-zinc-900'}`}>
                <Salad size={18}/> Gestão de Dieta
             </button>
          </nav>
       </aside>

       <main className="flex-1 p-12 lg:p-20 bg-zinc-950">
          {view === 'profile' && (
            <div className="animate-in slide-in-from-right-10 duration-500 space-y-12">
               <header>
                 <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Visão Geral</h2>
                 <p className="text-zinc-500 font-medium">Dados biométricos e histórico de performance.</p>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard label="Peso Atual" value="84.2kg" trend="-0.4" color="text-lime-400" icon={Scale} />
                  <StatCard label="Altura" value="1.82m" color="text-blue-400" icon={Target} />
                  <StatCard label="Idade" value="26" color="text-orange-500" icon={History} />
                  <StatCard label="Meta" value="Hipertrofia" color="text-pink-500" icon={Award} />
               </div>
               <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl">
                  <h4 className="text-xl font-black italic uppercase mb-10 flex items-center gap-3"><Activity size={20} className="text-blue-400"/> Curva de Evolução</h4>
                  <div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={WEIGHT_HISTORY}><defs><linearGradient id="colorW" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" /><YAxis hide /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '1rem' }} /><Area type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={4} fill="url(#colorW)" /></AreaChart></ResponsiveContainer></div>
               </div>
            </div>
          )}

          {view === 'workouts' && (
            <div className="animate-in slide-in-from-right-10 duration-500 space-y-12">
               <header className="flex justify-between items-end">
                 <div><h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Prescrever Treino</h2><p className="text-zinc-500 font-medium">Monte a estratégia de treinamento semanal.</p></div>
                 <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar max-w-sm">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
                      <button key={idx} onClick={() => setSelectedDay(idx)} className={`w-12 h-12 flex items-center justify-center rounded-xl text-[10px] font-black uppercase transition-all ${selectedDay === idx ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:bg-zinc-800'}`}>{day}</button>
                    ))}
                 </div>
               </header>

               <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black italic uppercase text-white">{workouts[selectedDay]?.title || 'Descanso ou Novo Treino'}</h3>
                    <button onClick={() => setIsAddingExercise(true)} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"><Plus size={16}/> Adicionar Exercício</button>
                  </div>

                  <div className="space-y-4">
                     {!workouts[selectedDay]?.exercises || workouts[selectedDay].exercises.length === 0 ? (
                       <div className="py-20 text-center italic text-zinc-700 font-bold uppercase tracking-widest">Nenhum exercício prescrito para este dia.</div>
                     ) : (
                       workouts[selectedDay].exercises.map((ex: any, idx: number) => (
                         <div key={ex.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between group">
                            <div className="flex items-center gap-6">
                               <div className="size-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-lime-400 font-black italic">{idx + 1}</div>
                               <div><p className="text-sm font-black text-white uppercase italic tracking-tight">{ex.n}</p><div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase mt-1"><span>{ex.group}</span><span>•</span><span>{ex.s} séries</span><span>•</span><span>{ex.r} reps</span><span>•</span><span className="text-lime-400">{ex.w}</span></div></div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all"><Pencil size={14}/></button>
                               <button onClick={() => removeExercise(selectedDay, ex.id)} className="size-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash size={14}/></button>
                            </div>
                         </div>
                       ))
                     )}
                  </div>
               </div>

               {isAddingExercise && (
                 <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-[3rem] p-10 animate-in zoom-in duration-300">
                       <div className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black italic uppercase">Adicionar ao Treino</h3><button onClick={() => setIsAddingExercise(false)} className="size-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500"><X size={20}/></button></div>
                       <form onSubmit={handleAddExercise} className="space-y-6">
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Nome do Exercício</label><input required value={newExercise.n} onChange={e => setNewExercise({...newExercise, n: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-lime-400 outline-none" placeholder="Ex: Supino Reto"/></div>
                          <div className="grid grid-cols-3 gap-4">
                             <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Séries</label><input required value={newExercise.s} onChange={e => setNewExercise({...newExercise, s: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-lime-400 outline-none" placeholder="4"/></div>
                             <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Repetições</label><input required value={newExercise.r} onChange={e => setNewExercise({...newExercise, r: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-lime-400 outline-none" placeholder="10-12"/></div>
                             <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Carga</label><input required value={newExercise.w} onChange={e => setNewExercise({...newExercise, w: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-lime-400 outline-none" placeholder="80kg"/></div>
                          </div>
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Grupo Muscular</label><input required value={newExercise.group} onChange={e => setNewExercise({...newExercise, group: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-lime-400 outline-none" placeholder="Peito, Quadríceps..."/></div>
                          <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-lime-400/20 active:scale-95 transition-all">Prescrever Exercício</button>
                       </form>
                    </div>
                 </div>
               )}
            </div>
          )}
       </main>
    </div>
  );
};

const StudentManagementView = ({ title, type, students, onAddStudent }: { title: string, type: 'PROFESSOR' | 'NUTRI', students: Student[], onAddStudent: (s: Partial<Student>) => void }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStudent, setNewStudent] = useState({ name: '', email: '', phone: '', plan: '' });
  const [consoleState, setConsoleState] = useState<{ student: Student | null, view: string }>({ student: null, view: 'profile' });

  const sendWhatsAppAccess = (student: Student) => {
    const message = encodeURIComponent(`Olá ${student.name}! Aqui está o seu acesso ao Fitness Tech:\n\n📧 Login: ${student.email}\n📱 Baixe o app e comece agora o seu plano de ${student.plan}!\n\nBora pra cima! 🔥`);
    const whatsappUrl = `https://wa.me/${student.phone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStudent(newStudent);
    setNewStudent({ name: '', email: '', phone: '', plan: '' });
    setShowAddModal(false);
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const currentPlans = type === 'PROFESSOR' ? PROF_PLANS : NUTRI_PLANS;

  if (consoleState.student) {
    return <StudentConsole student={consoleState.student} type={type} initialView={consoleState.view} onClose={() => setConsoleState({ student: null, view: 'profile' })} />;
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2">{title}</h2>
          <p className="text-zinc-500 font-medium">Gestão ativa de clientes e progresso.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                placeholder="Buscar por nome..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold w-full sm:w-64 focus:border-lime-400 outline-none" 
              />
           </div>
           <button 
            onClick={() => setShowAddModal(true)}
            className="bg-lime-400 text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-lime-400/20 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
           >
             <UserPlus size={18} /> Novo Aluno
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-20 text-center italic text-zinc-600">
             <Users size={64} className="mx-auto mb-6 opacity-20" />
             <p className="font-bold uppercase tracking-widest text-xs">Nenhum aluno encontrado</p>
          </div>
        ) : (
          filteredStudents.map(student => (
            <div key={student.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] flex flex-col lg:flex-row items-center gap-8 hover:border-zinc-700 transition-all group">
              <div className="size-16 rounded-[1.5rem] overflow-hidden border-2 border-zinc-800 shrink-0">
                 <img src={student.avatar} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 text-center lg:text-left">
                 <h4 className="text-lg font-black italic uppercase tracking-tight text-white leading-none mb-2 truncate">{student.name}</h4>
                 <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 text-zinc-500">
                    <span className="text-[10px] font-black uppercase bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">{student.plan}</span>
                    <div className="size-1 bg-zinc-800 rounded-full hidden sm:block" />
                    <span className="text-[10px] font-bold uppercase flex items-center gap-1 shrink-0"><Clock size={12}/> {student.lastVisit}</span>
                 </div>
              </div>
              <div className="hidden lg:block w-48 px-6">
                 <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] font-black uppercase text-zinc-600">Adesão ao {type === 'PROFESSOR' ? 'Treino' : 'Plano'}</span>
                    <span className="text-[10px] font-black text-lime-400 italic">{student.progress}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden p-0.5"><div className="h-full bg-lime-400 rounded-full transition-all duration-1000" style={{ width: `${student.progress}%` }} /></div>
              </div>
              <div className="flex flex-wrap justify-center lg:flex-nowrap gap-2">
                 <button 
                  onClick={() => sendWhatsAppAccess(student)}
                  className="size-12 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/5 group"
                  title="Enviar acesso via WhatsApp"
                 >
                    <MessageCircle size={18} className="group-hover:scale-110 transition-transform"/>
                 </button>
                 <button className="size-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-all"><Mail size={18}/></button>
                 <button 
                  onClick={() => setConsoleState({ student, view: 'workouts' })}
                  className="bg-zinc-950 border border-zinc-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-zinc-500 hover:text-lime-400 hover:border-lime-400/30 transition-all flex items-center gap-2"
                 >
                    {type === 'PROFESSOR' ? <Dumbbell size={14}/> : <Salad size={14}/>}
                    {type === 'PROFESSOR' ? 'Treino' : 'Dieta'}
                 </button>
                 <button 
                  onClick={() => setConsoleState({ student, view: 'profile' })}
                  className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-lime-400 transition-all"
                 >
                   Ver Perfil
                 </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL NOVO ALUNO */}
      {showAddModal && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
           <div 
            className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-[3rem] p-10 animate-in zoom-in duration-300 shadow-2xl"
            onClick={e => e.stopPropagation()}
           >
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-3xl font-black italic uppercase tracking-tighter">Novo {type === 'PROFESSOR' ? 'Aluno' : 'Paciente'}</h3>
                 <button onClick={() => setShowAddModal(false)} className="size-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-all"><X size={20}/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest">Nome Completo</label>
                    <input 
                      required 
                      value={newStudent.name}
                      onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                      placeholder="Ex: João Silva"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-lime-400 outline-none transition-all placeholder:text-zinc-800" 
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest">E-mail</label>
                       <input 
                        required 
                        type="email"
                        value={newStudent.email}
                        onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                        placeholder="aluno@email.com"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-lime-400 outline-none transition-all placeholder:text-zinc-800" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest">WhatsApp (com DDI)</label>
                       <input 
                        required 
                        value={newStudent.phone}
                        onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                        placeholder="5511999999999"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-lime-400 outline-none transition-all placeholder:text-zinc-800" 
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest">Plano de Adesão</label>
                    <select 
                      required
                      value={newStudent.plan}
                      onChange={e => setNewStudent({...newStudent, plan: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:border-lime-400 outline-none transition-all appearance-none text-zinc-400"
                    >
                      <option value="">Selecione um plano...</option>
                      {currentPlans.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                    </select>
                 </div>
                 <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-lime-400/20 active:scale-95 transition-all mt-6">
                    Cadastrar e Liberar Acesso
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const PlanManagementView = ({ plans }: { plans: ServicePlan[] }) => {
  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Meus Planos</h2>
          <p className="text-zinc-500 font-medium">Configure seus pacotes de consultoria e preços.</p>
        </div>
        <button className="bg-lime-400 text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl shadow-lime-400/20"><Plus size={16}/> Criar Novo Plano</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map(plan => (
          <div key={plan.id} className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 relative overflow-hidden group hover:border-lime-400/40 transition-all shadow-2xl">
             <div className="absolute top-6 right-8 text-zinc-700"><MoreVertical size={24}/></div>
             <div className="mb-10">
                <span className="text-[10px] font-black uppercase text-lime-400 bg-lime-400/10 px-4 py-1.5 rounded-full mb-4 inline-block">{plan.duration}</span>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-tight">{plan.title}</h3>
             </div>
             <p className="text-xs text-zinc-500 font-medium mb-10 leading-relaxed italic">"{plan.description}"</p>
             <div className="flex items-center justify-between pt-10 border-t border-zinc-800/50">
                <div>
                   <p className="text-3xl font-black text-white italic">R$ {plan.price.toFixed(2)}</p>
                   <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Valor do Pacote</p>
                </div>
                <div className="text-right">
                   <p className="text-lg font-black text-lime-400 italic">{plan.activeStudents}</p>
                   <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Alunos Ativos</p>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfessionalDashboard = ({ type }: { type: 'PROFESSOR' | 'NUTRI' }) => {
  return (
    <div className="animate-in fade-in duration-700 space-y-12">
       <header className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="size-20 rounded-[2.5rem] bg-zinc-900 border-4 border-zinc-800 flex items-center justify-center text-lime-400 shadow-2xl">
               {type === 'PROFESSOR' ? <Dumbbell size={32}/> : <Salad size={32}/>}
            </div>
            <div>
               <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">Olá, Dr. Silva</h1>
               <p className="text-zinc-500 font-medium uppercase text-[10px] tracking-widest flex items-center gap-2">
                 <ShieldCheck size={14} className="text-blue-400"/> {type === 'PROFESSOR' ? 'Coach Certificado' : 'Nutricionista Clínico'}
               </p>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-6 py-4 rounded-3xl text-right">
             <p className="text-[9px] font-black uppercase text-zinc-600 mb-1">Faturamento Mensal</p>
             <p className="text-2xl font-black italic text-lime-400">R$ 12.450,00</p>
          </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard label="Alunos Ativos" value="34" trend="+2" color="text-lime-400" icon={Users} />
         <StatCard label="Consultas Hoje" value="6" trend="🔥" color="text-orange-400" icon={Calendar} />
         <StatCard label="Feedbacks Pendentes" value="12" trend="!" color="text-red-400" icon={Bell} />
         <StatCard label="Rating Médio" value="4.9" trend="⭐" color="text-blue-400" icon={Award} />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-[3.5rem] p-10 shadow-2xl">
             <div className="flex justify-between items-center mb-10">
                <h4 className="text-xl font-black italic uppercase flex items-center gap-3"><Activity size={20} className="text-lime-400"/> Desempenho dos Alunos</h4>
                <div className="flex gap-2">
                   <button className="bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-xl text-[10px] font-black text-zinc-500">Semana</button>
                   <button className="bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-xl text-[10px] font-black text-white">Mês</button>
                </div>
             </div>
             <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[
                   { name: 'Seg', valor: 85 }, { name: 'Ter', valor: 92 }, { name: 'Qua', valor: 88 },
                   { name: 'Qui', valor: 95 }, { name: 'Sex', valor: 98 }, { name: 'Sáb', valor: 90 }, { name: 'Dom', valor: 82 }
                 ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '1rem' }} />
                    <Bar dataKey="valor" fill="#D9FF00" radius={[8, 8, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 shadow-2xl">
                <h5 className="text-[10px] font-black uppercase text-zinc-500 mb-6">Próximos Agendamentos</h5>
                <div className="space-y-4">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-800/50 rounded-2xl">
                        <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-black text-lime-400 italic">14h</div>
                        <div><p className="text-xs font-bold text-white uppercase italic">Marcos S.</p><p className="text-[8px] font-black text-zinc-600 uppercase">Check-in Mensal</p></div>
                        <ArrowUpRight size={16} className="ml-auto text-zinc-800" />
                     </div>
                   ))}
                </div>
                <button className="w-full mt-8 bg-zinc-950 border border-zinc-800 py-3 rounded-2xl text-[9px] font-black uppercase text-zinc-500 hover:text-white transition-all">Ver Agenda Completa</button>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- PROFILE VIEW ---

const ProfileView = ({ profileImage, onImageChange, biometrics, onBiometricsChange }: { profileImage: string, onImageChange: (url: string) => void, biometrics: Biometrics, onBiometricsChange: (b: Biometrics) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempBiometrics, setTempBiometrics] = useState({...biometrics});
  const [notif, setNotif] = useState(true);

  // Sync temp state if biometrics prop changes while not editing
  useEffect(() => {
    if (!isEditing) {
      setTempBiometrics({...biometrics});
    }
  }, [biometrics, isEditing]);

  const handleSave = () => {
    onBiometricsChange({...tempBiometrics});
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempBiometrics({...biometrics});
    setIsEditing(false);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const goals = ['Hipertrofia', 'Cutting', 'Bulking', 'Manutenção', 'Resistência'];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-12 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row items-center gap-10">
        <div className="relative group">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />
          <div 
            onClick={handlePhotoClick}
            className="size-40 rounded-[4rem] border-[10px] border-zinc-900 shadow-2xl overflow-hidden relative cursor-pointer"
          >
            <img src={profileImage} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt="Avatar"/>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
              <Camera size={32} className="text-lime-400 mb-1" />
              <span className="text-[9px] font-black uppercase text-lime-400 tracking-widest">Trocar Foto</span>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 size-14 bg-lime-400 text-black rounded-3xl flex items-center justify-center shadow-2xl border-[6px] border-zinc-950">
            <Trophy size={28} strokeWidth={3} />
          </div>
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-4">Alex Rivers</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
             <span className="bg-zinc-900 border border-zinc-800 px-5 py-2 rounded-2xl text-[10px] font-black uppercase text-zinc-400 tracking-widest">Aluno VIP</span>
             <span className="bg-lime-400/10 border border-lime-400/30 px-5 py-2 rounded-2xl text-[10px] font-black uppercase text-lime-400 tracking-widest">Nível 28</span>
             <span className="bg-blue-400/10 border border-blue-400/30 px-5 py-2 rounded-2xl text-[10px] font-black uppercase text-blue-400 tracking-widest">Desde Ago 2023</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl space-y-10">
           <div className="flex items-center justify-between">
              <h4 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3"><User size={20} className="text-lime-400"/> Dados Biométricos</h4>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="text-[10px] font-black uppercase text-lime-400 hover:underline">Editar</button>
              ) : (
                <div className="flex gap-4">
                  <button onClick={handleCancel} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white">Cancelar</button>
                  <button onClick={handleSave} className="text-[10px] font-black uppercase text-lime-400 flex items-center gap-1"><Save size={12}/> Salvar</button>
                </div>
              )}
           </div>
           <div className="grid grid-cols-2 gap-6">
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800/50 transition-all">
                <p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Altura</p>
                {isEditing ? (
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01" 
                      value={tempBiometrics.height}
                      onChange={(e) => setTempBiometrics({...tempBiometrics, height: e.target.value})}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 w-full text-white font-black italic outline-none focus:border-lime-400"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-700">M</span>
                  </div>
                ) : (
                  <p className="text-2xl font-black italic text-white">{biometrics.height}m</p>
                )}
              </div>
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800/50 transition-all">
                <p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Peso</p>
                {isEditing ? (
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.1" 
                      value={tempBiometrics.weight}
                      onChange={(e) => setTempBiometrics({...tempBiometrics, weight: e.target.value})}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 w-full text-white font-black italic outline-none focus:border-lime-400"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-700">KG</span>
                  </div>
                ) : (
                  <p className="text-2xl font-black italic text-white">{biometrics.weight}kg</p>
                )}
              </div>
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800/50 transition-all">
                <p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Idade</p>
                {isEditing ? (
                  <input 
                    type="number" 
                    value={tempBiometrics.age}
                    onChange={(e) => setTempBiometrics({...tempBiometrics, age: e.target.value})}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 w-full text-white font-black italic outline-none focus:border-lime-400"
                  />
                ) : (
                  <p className="text-2xl font-black italic text-white">{biometrics.age} anos</p>
                )}
              </div>
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800/50 transition-all">
                <p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Objetivo</p>
                {isEditing ? (
                  <select 
                    value={tempBiometrics.goal}
                    onChange={(e) => setTempBiometrics({...tempBiometrics, goal: e.target.value})}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 w-full text-white font-black italic outline-none focus:border-lime-400 appearance-none"
                  >
                    {goals.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                ) : (
                  <p className="text-2xl font-black italic text-lime-400 uppercase tracking-tighter">{biometrics.goal}</p>
                )}
              </div>
           </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl space-y-8">
           <h4 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3"><ShieldCheck size={20} className="text-blue-400"/> Assinatura Ativa</h4>
           <div className="bg-zinc-950 rounded-[2.5rem] p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform"><Trophy size={140} className="text-lime-400" /></div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase text-lime-400 tracking-widest mb-2">PLANO ATUAL</p>
                <h5 className="text-4xl font-black italic uppercase tracking-tighter mb-4">BLACK VIP</h5>
                <div className="flex items-center gap-4 mb-8">
                  <div className="size-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500"><CardIcon size={20}/></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-300">Método de Pagamento</p>
                    <p className="text-xs font-bold text-zinc-500">Mastercard **** 8291</p>
                  </div>
                </div>
                <div className="pt-6 border-t border-zinc-900 flex justify-between items-end">
                   <div>
                     <p className="text-[9px] font-black uppercase text-zinc-600">Próxima Cobrança</p>
                     <p className="text-sm font-black italic text-white">15 de Novembro, 2024</p>
                   </div>
                   <button className="text-[10px] font-black uppercase bg-zinc-900 border border-zinc-800 px-6 py-2.5 rounded-xl hover:text-red-400 hover:border-red-400/30 transition-all">Cancelar</button>
                </div>
              </div>
           </div>
        </section>
      </div>

      <section className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl">
         <h4 className="text-xl font-black italic uppercase tracking-tighter mb-10 flex items-center gap-3"><Settings size={20} className="text-orange-400"/> Preferências e Conta</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="flex items-center justify-between py-6 border-b border-zinc-800/50">
               <div className="flex items-center gap-4">
                  <div className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><Bell size={20}/></div>
                  <div><p className="text-sm font-black uppercase italic text-zinc-200">Notificações</p><p className="text-[10px] font-bold text-zinc-600">Lembretes de treino e dieta</p></div>
               </div>
               <button onClick={() => setNotif(!notif)} className={`w-14 h-8 rounded-full transition-all relative p-1 ${notif ? 'bg-lime-400 shadow-lg shadow-lime-400/20' : 'bg-zinc-950 border border-zinc-800'}`}>
                  <div className={`size-6 rounded-full transition-all ${notif ? 'bg-black translate-x-6' : 'bg-zinc-700 translate-x-0'}`} />
               </button>
            </div>
            <div className="flex items-center justify-between py-6 border-b border-zinc-800/50">
               <div className="flex items-center gap-4">
                  <div className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><Smartphone size={20}/></div>
                  <div><p className="text-sm font-black uppercase italic text-zinc-200">Dispositivos</p><p className="text-[10px] font-bold text-zinc-600">Sincronizar com Apple Health</p></div>
               </div>
               <ChevronRight size={20} className="text-zinc-700" />
            </div>
            <div className="flex items-center justify-between py-6 border-b border-zinc-800/50">
               <div className="flex items-center gap-4">
                  <div className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><ShieldCheck size={20}/></div>
                  <div><p className="text-sm font-black uppercase italic text-zinc-200">Segurança</p><p className="text-[10px] font-bold text-zinc-600">Alterar senha e biometria</p></div>
               </div>
               <ChevronRight size={20} className="text-zinc-700" />
            </div>
            <button className="flex items-center gap-4 py-6 border-b border-zinc-800/50 group w-full text-left">
               <div className="size-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all"><LogOut size={20}/></div>
               <div><p className="text-sm font-black uppercase italic text-red-500">Sair da Conta</p><p className="text-[10px] font-bold text-zinc-600">Desconectar deste dispositivo</p></div>
            </button>
         </div>
      </section>

      <footer className="text-center pb-12">
         <p className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.4em]">Fitness Tech v2.8.4 • Política de Privacidade</p>
      </footer>
    </div>
  );
};

const ArrowUpRight = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>;

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

  const totalPossibleSets: number = (workout?.exercises || []).reduce((acc: number, ex: any): number => acc + (Number(ex.s) || 0), 0);
  const totalCompletedSets: number = (Object.values(exerciseProgress) as number[]).reduce((acc: number, val: number): number => acc + val, 0);
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

const StoreView = ({ products, addToCart, cartCount, openCart }: any) => {
  const [filter, setFilter] = useState('Todos');
  const categories = ['Todos', 'Suplementos', 'Equipamentos', 'Vestuário'];
  const filteredProducts = filter === 'Todos' ? products : products.filter((p: Product) => p.category === filter);

  return (
    <div className="animate-in fade-in duration-700 space-y-10 relative">
      <header className="flex flex-col lg:row justify-between lg:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">Marketplace</h2>
          <p className="text-zinc-500 font-medium">Equipamentos e suplementos de elite.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-3xl gap-1 shadow-xl overflow-x-auto no-scrollbar">
            {categories.map((c) => (
              <button key={c} onClick={() => setFilter(c)} className={`min-w-[6rem] h-12 flex items-center justify-center rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest px-6 ${filter === c ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:bg-zinc-800'}`}>
                {c}
              </button>
            ))}
          </div>
          <button 
            onClick={openCart}
            className="hidden md:flex bg-zinc-900 border border-zinc-800 h-14 px-6 rounded-3xl items-center gap-4 hover:border-lime-400/40 transition-all text-zinc-400 hover:text-white group"
          >
            <div className="relative">
              <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
              {cartCount > 0 && <div className="absolute -top-2 -right-2 size-4 bg-lime-400 text-black text-[9px] font-black rounded-full flex items-center justify-center">{cartCount}</div>}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Ver Carrinho</span>
          </button>
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

      {/* FAB - FLOATING ACTION BUTTON PARA CARRINHO */}
      <button 
        onClick={openCart}
        className="fixed bottom-32 md:bottom-12 right-6 md:right-12 size-16 md:size-20 bg-lime-400 text-black rounded-[2rem] flex items-center justify-center shadow-2xl shadow-lime-400/30 hover:scale-110 active:scale-95 transition-all z-[60]"
      >
        <div className="relative">
          <ShoppingBag size={32} />
          {cartCount > 0 && <div className="absolute -top-3 -right-3 size-7 bg-black text-lime-400 text-xs font-black rounded-full flex items-center justify-center border-4 border-lime-400">{cartCount}</div>}
        </div>
      </button>
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
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-xl h-fit">
          <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-8">Distribuição de Macros</h4>
          <div className="flex flex-col items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Pie data={MACRO_DISTRIBUTION} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                    {MACRO_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full mt-6 space-y-4">
               {MACRO_DISTRIBUTION.map((macro, idx) => (
                 <div key={idx} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className="size-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: macro.fill, color: macro.fill }} />
                       <span className="text-xs font-black uppercase text-zinc-300 tracking-tighter">{macro.name}</span>
                    </div>
                    <span className="text-xs font-black italic text-white">{macro.value}%</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- EVOLUTION VIEW ---

const EvolutionView = () => {
  return (
    <div className="animate-in fade-in duration-700 space-y-12">
      <header>
        <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">Evolução</h2>
        <p className="text-zinc-500 font-medium">Acompanhe sua jornada de transformação.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weight Chart */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-2xl">
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Peso Corporal (kg)</p>
              <h4 className="text-3xl font-black italic text-white">-4.3kg este mês</h4>
            </div>
            <div className="size-12 bg-lime-400/10 text-lime-400 rounded-2xl flex items-center justify-center">
              <Scale size={24} />
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEIGHT_HISTORY}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D9FF00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D9FF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="weight" stroke="#D9FF00" strokeWidth={4} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lift Progress Chart */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-2xl">
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Carga Supino Reto (kg)</p>
              <h4 className="text-3xl font-black italic text-blue-400">+22kg total</h4>
            </div>
            <div className="size-12 bg-blue-400/10 text-blue-400 rounded-2xl flex items-center justify-center">
              <Zap size={24} />
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={LIFT_PROGRESS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="week" stroke="#52525b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="load" fill="#3b82f6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Personal Records */}
      <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] shadow-2xl">
        <h4 className="text-xl font-black italic uppercase tracking-tighter mb-10 flex items-center gap-3">
          <Trophy size={20} className="text-orange-400"/> Recordes Pessoais
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PERSONAL_RECORDS.map((record, i) => (
            <div key={i} className="bg-zinc-950 border border-zinc-800 p-6 rounded-[2rem] hover:border-zinc-700 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl bg-zinc-900 ${record.color}`}>
                  {record.icon}
                </div>
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{record.date}</span>
              </div>
              <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">{record.exercise}</p>
              <p className="text-4xl font-black italic text-white tracking-tighter group-hover:scale-110 transition-transform origin-left">{record.weight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- MODULES ---

const StudentModule = ({ view, setView, products, addToCart, cartCount, setIsCartOpen, profileImage, onImageChange, biometrics, onBiometricsChange }: any) => {
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

  if (view === 'store') return <StoreView products={products} addToCart={addToCart} cartCount={cartCount} openCart={() => setIsCartOpen(true)} />;
  
  if (view === 'workouts') return isWorkoutActive ? (
    <ActiveWorkoutSession workout={INITIAL_WORKOUTS[selectedDay] || { exercises: [] }} workoutTime={workoutSeconds} onFinish={handleFinish} onClose={() => setIsWorkoutActive(false)} />
  ) : workoutFinished ? (
    <FinishedSessionView title="Treino Concluído" totalTime={finalTime} reset={() => { setWorkoutFinished(false); setView('dashboard'); }} />
  ) : (
    <CalendarBase title="Planilha" sub="Sua programação de alta performance." selectedDay={selectedDay} setSelectedDay={setSelectedDay} days={['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']}>
      <WorkoutDetailCard workout={INITIAL_WORKOUTS[selectedDay] || { exercises: [], title: 'Descanso' }} onStart={startWorkout} />
    </CalendarBase>
  );

  if (view === 'diet') return (
    <CalendarBase title="Nutrição" sub="Seu combustível para o sucesso." selectedDay={selectedDay} setSelectedDay={setSelectedDay} days={['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']}>
      <NutritionView diet={WEEKLY_DIETS[selectedDay] || DEFAULT_DIET} dayIdx={selectedDay} />
    </CalendarBase>
  );

  if (view === 'evolution') return <EvolutionView />;
  if (view === 'profile') return <ProfileView profileImage={profileImage} onImageChange={onImageChange} biometrics={biometrics} onBiometricsChange={onBiometricsChange} />;
  
  return <StudentDashboard setView={setView} onStartWorkout={() => setView('workouts')} profileImage={profileImage} biometrics={biometrics} />;
};

const ProfessorModule = ({ view, setView, students, onAddStudent }: any) => {
  if (view === 'students') return <StudentManagementView title="Alunos Ativos" type="PROFESSOR" students={students} onAddStudent={onAddStudent} />;
  if (view === 'plans') return <PlanManagementView plans={PROF_PLANS} />;
  return <ProfessionalDashboard type="PROFESSOR" />;
};

const NutriModule = ({ view, setView, students, onAddStudent }: any) => {
  if (view === 'patients') return <StudentManagementView title="Pacientes Ativos" type="NUTRI" students={students} onAddStudent={onAddStudent} />;
  if (view === 'plans') return <PlanManagementView plans={NUTRI_PLANS} />;
  return <ProfessionalDashboard type="NUTRI" />;
};

const StudentDashboard = ({ setView, onStartWorkout, profileImage, biometrics }: any) => {
  const today = new Date().getDay();
  const workout = INITIAL_WORKOUTS[today];
  const diet = WEEKLY_DIETS[today] || DEFAULT_DIET;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-8">
          <div className="relative group cursor-pointer" onClick={() => setView('profile')}>
            <img src={profileImage} className="size-24 rounded-[3rem] border-[6px] border-zinc-900 shadow-2xl group-hover:scale-105 transition-transform object-cover" alt="Avatar"/>
            <div className="absolute -bottom-2 -right-2 size-10 bg-lime-400 text-black rounded-2xl flex items-center justify-center shadow-xl border-4 border-zinc-950"><Trophy size={20} strokeWidth={3} /></div>
          </div>
          <div><h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-3">Alex Rivers</h1><div className="flex items-center gap-4"><span className="bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-xl text-xs font-black uppercase text-zinc-500">Nível 28</span><div className="w-48 h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800"><div className="h-full bg-lime-400 w-3/4 shadow-[0_0_15px_#D9FF00]" /></div></div></div>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Peso" value={`${biometrics.weight}kg`} trend="-0.4" color="text-lime-400" />
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
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  
  // Global Profile Image State
  const [profileImage, setProfileImage] = useState("https://picsum.photos/seed/fitness/300");

  // Global Biometrics State
  const [biometrics, setBiometrics] = useState<Biometrics>({
    height: '1.82',
    weight: '84.2',
    age: '26',
    goal: 'Hipertrofia'
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item);
      return [...prev, {...product, quantity: 1}];
    });
    setIsCartOpen(true);
  };

  const handleAddStudent = (data: Partial<Student>) => {
    const newStudent: Student = {
      id: Date.now(),
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      plan: data.plan || 'Plano Básico',
      lastVisit: 'Nunca',
      progress: 0,
      avatar: `https://picsum.photos/seed/${data.name}/100`
    };
    setStudents([newStudent, ...students]);
  };

  const removeFromCart = (id: number) => { setCart(prev => prev.filter(item => item.id !== id)); };
  
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = paymentMethod === 'pix' ? subtotal * 0.05 : 0;
  const cartTotal = subtotal - discount;
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <div className="fixed top-6 right-6 z-[100] bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-2 rounded-3xl flex gap-1 shadow-2xl overflow-x-auto no-scrollbar max-w-[90vw]">
        {(['ALUNO', 'NUTRI', 'PROFESSOR', 'ADMIN'] as Role[]).map(r => (
          <button key={r} onClick={() => { setRole(r); setActiveView('dashboard'); }} className={`px-5 py-2.5 text-[10px] font-black rounded-2xl transition-all whitespace-nowrap ${role === r ? 'bg-lime-400 text-black' : 'text-zinc-500 hover:text-white'}`}>{r}</button>
        ))}
      </div>

      <aside className={`hidden md:flex flex-col border-r border-zinc-900 p-8 space-y-12 sticky top-0 h-screen bg-zinc-950/50 backdrop-blur-md transition-all duration-500 ${sidebarOpen ? 'w-80' : 'w-28'}`}>
        <div className="flex items-center gap-5 text-lime-400 font-black text-2xl italic uppercase tracking-tighter shrink-0">
          <div className="size-14 bg-lime-400 text-black rounded-[1.5rem] flex items-center justify-center rotate-3 border-[4px] border-zinc-950 shadow-xl"><Dumbbell size={32} strokeWidth={3} /></div>
          {sidebarOpen && <span>FITNESS<br/>TECH</span>}
        </div>
        <nav className="flex-1 space-y-3">
          <NavItem icon={<LayoutDashboard size={24}/>} label="Painel" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} collapsed={!sidebarOpen} />
          {role === 'ALUNO' && (
            <>
              <NavItem icon={<Dumbbell size={24}/>} label="Treinos" active={activeView === 'workouts'} onClick={() => setActiveView('workouts')} collapsed={!sidebarOpen} />
              <NavItem icon={<Apple size={24}/>} label="Nutrição" active={activeView === 'diet'} onClick={() => setActiveView('diet')} collapsed={!sidebarOpen} />
              <NavItem icon={<ShoppingBag size={24}/>} label="Loja" active={activeView === 'store'} onClick={() => { if(activeView === 'store') setIsCartOpen(true); setActiveView('store'); }} collapsed={!sidebarOpen} badge={cartCount} />
              <NavItem icon={<TrendingUp size={24}/>} label="Performance" active={activeView === 'evolution'} onClick={() => setActiveView('evolution')} collapsed={!sidebarOpen} />
              <NavItem icon={<User size={24}/>} label="Perfil" active={activeView === 'profile'} onClick={() => setActiveView('profile')} collapsed={!sidebarOpen} />
            </>
          )}
          {role === 'PROFESSOR' && (
            <>
              <NavItem icon={<Users size={24}/>} label="Alunos" active={activeView === 'students'} onClick={() => setActiveView('students')} collapsed={!sidebarOpen} />
              <NavItem icon={<Dumbbell size={24}/>} label="Biblioteca" active={activeView === 'library'} onClick={() => setActiveView('library')} collapsed={!sidebarOpen} />
              <NavItem icon={<Zap size={24}/>} label="Planos" active={activeView === 'plans'} onClick={() => setActiveView('plans')} collapsed={!sidebarOpen} />
            </>
          )}
          {role === 'NUTRI' && (
            <>
              <NavItem icon={<Users size={24}/>} label="Pacientes" active={activeView === 'patients'} onClick={() => setActiveView('patients')} collapsed={!sidebarOpen} />
              <NavItem icon={<Apple size={24}/>} label="Cardápios" active={activeView === 'menus'} onClick={() => setActiveView('menus')} collapsed={!sidebarOpen} />
              <NavItem icon={<Zap size={24}/>} label="Planos" active={activeView === 'plans'} onClick={() => setActiveView('plans')} collapsed={!sidebarOpen} />
            </>
          )}
          {role === 'ADMIN' && (<><NavItem icon={<Users size={24}/>} label="Usuários" active={activeView === 'students'} onClick={() => setActiveView('students')} collapsed={!sidebarOpen} /><NavItem icon={<Package size={24}/>} label="Gestão Loja" active={activeView === 'adminStore'} onClick={() => setActiveView('adminStore')} collapsed={!sidebarOpen} /><NavItem icon={<Percent size={24}/>} label="Campanhas" active={activeView === 'campaigns'} onClick={() => setActiveView('campaigns')} collapsed={!sidebarOpen} /></>)}
        </nav>
        
        {/* Sidebar Mini Profile */}
        {sidebarOpen && (
          <div className="p-6 bg-zinc-900/50 rounded-[2rem] border border-zinc-800 flex items-center gap-4">
             <img src={role === 'ALUNO' ? profileImage : 'https://picsum.photos/seed/doc/100'} className="size-12 rounded-2xl object-cover border border-zinc-800" />
             <div className="min-w-0">
                <p className="text-[10px] font-black text-white uppercase italic truncate">{role === 'ALUNO' ? 'Alex Rivers' : 'Dr. Silva'}</p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{role}</p>
             </div>
          </div>
        )}

        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl flex justify-center text-zinc-400 hover:text-white transition-all">{sidebarOpen ? <ArrowLeft size={24}/> : <ArrowRight size={24}/>}</button>
      </aside>

      <main className="flex-1 p-6 md:p-12 lg:px-20 max-w-8xl mx-auto w-full pb-32">
        {role === 'ALUNO' && (
          <StudentModule 
            view={activeView} 
            setView={setActiveView} 
            products={products} 
            addToCart={addToCart} 
            cartCount={cartCount} 
            setIsCartOpen={setIsCartOpen} 
            profileImage={profileImage}
            onImageChange={setProfileImage}
            biometrics={biometrics}
            onBiometricsChange={setBiometrics}
          />
        )}
        {role === 'PROFESSOR' && <ProfessorModule view={activeView} setView={setActiveView} students={students} onAddStudent={handleAddStudent} />}
        {role === 'NUTRI' && <NutriModule view={activeView} setView={setActiveView} students={students} onAddStudent={handleAddStudent} />}
        {role === 'ADMIN' && activeView === 'adminStore' && <AdminStoreView products={products} setProducts={setProducts} />}
        {role === 'ADMIN' && activeView !== 'adminStore' && (<div className="flex flex-col items-center justify-center min-h-[60vh] text-center italic"><Package size={80} className="text-zinc-800 mb-6" /><h2 className="text-2xl font-black uppercase text-zinc-700">Painel Administrativo</h2></div>)}
      </main>

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-lg flex justify-end" onClick={() => setIsCartOpen(false)}>
          <div 
            className="w-full max-w-md bg-zinc-950 border-l border-zinc-900 h-screen flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="p-8 border-b border-zinc-900 flex justify-between items-center">
               <div className="flex items-center gap-4 text-2xl font-black italic uppercase">
                 <ShoppingCart size={32} className="text-lime-400" /> Carrinho
               </div>
               <button onClick={() => setIsCartOpen(false)} className="size-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                 <X size={24}/>
               </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
               <section>
                 <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-6">Itens Escolhidos</h6>
                 <div className="space-y-4">
                  {cart.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-zinc-600 italic">
                      <ShoppingBag size={64} className="mb-6 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-xs">Seu carrinho está vazio</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-[2rem] flex gap-4 hover:border-zinc-700 transition-all">
                          <img src={item.img} className="size-16 rounded-2xl object-cover border border-zinc-800" />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs truncate uppercase italic tracking-tight text-white">{item.name}</h5>
                            <div className="flex items-center justify-between mt-2">
                                <p className="font-black text-lime-400 italic text-sm">R$ {item.price.toFixed(2)}</p>
                                <div className="flex items-center bg-zinc-950 rounded-xl px-2 py-1 gap-3 border border-zinc-800">
                                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:scale-110 transition-transform"><Trash2 size={12}/></button>
                                  <span className="text-[10px] font-black text-zinc-300">{item.quantity}</span>
                                </div>
                            </div>
                          </div>
                      </div>
                    ))
                  )}
                 </div>
               </section>

               {cart.length > 0 && (
                 <section className="animate-in slide-in-from-bottom-4 duration-500">
                   <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-6">Forma de Pagamento</h6>
                   <div className="grid grid-cols-1 gap-3">
                     <button 
                       onClick={() => setPaymentMethod('pix')}
                       className={`flex items-center gap-4 p-5 rounded-3xl border transition-all text-left group ${paymentMethod === 'pix' ? 'bg-lime-400/10 border-lime-400 shadow-xl shadow-lime-400/5' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                     >
                       <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'pix' ? 'bg-lime-400 text-black' : 'bg-zinc-950 text-lime-400'}`}><QrCode size={24}/></div>
                       <div>
                         <p className={`font-black uppercase italic tracking-tighter text-sm ${paymentMethod === 'pix' ? 'text-lime-400' : 'text-zinc-300'}`}>PIX Instantâneo</p>
                         <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Aprovação Imediata • 5% OFF</p>
                       </div>
                       {paymentMethod === 'pix' && <CheckCircle2 size={20} className="ml-auto text-lime-400" />}
                     </button>

                     <button 
                       onClick={() => setPaymentMethod('credit_card')}
                       className={`flex items-center gap-4 p-5 rounded-3xl border transition-all text-left group ${paymentMethod === 'credit_card' ? 'bg-lime-400/10 border-lime-400 shadow-xl shadow-lime-400/5' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                     >
                       <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'credit_card' ? 'bg-lime-400 text-black' : 'bg-zinc-950 text-blue-400'}`}><CreditCard size={24}/></div>
                       <div>
                         <p className={`font-black uppercase italic tracking-tighter text-sm ${paymentMethod === 'credit_card' ? 'text-lime-400' : 'text-zinc-300'}`}>Cartão de Crédito</p>
                         <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Em até 12x sem juros</p>
                       </div>
                       {paymentMethod === 'credit_card' && <CheckCircle2 size={20} className="ml-auto text-lime-400" />}
                     </button>

                     <button 
                       onClick={() => setPaymentMethod('wallet')}
                       className={`flex items-center gap-4 p-5 rounded-3xl border transition-all text-left group ${paymentMethod === 'wallet' ? 'bg-lime-400/10 border-lime-400 shadow-xl shadow-lime-400/5' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                     >
                       <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'wallet' ? 'bg-lime-400 text-black' : 'bg-zinc-950 text-orange-400'}`}><Wallet size={24}/></div>
                       <div>
                         <p className={`font-black uppercase italic tracking-tighter text-sm ${paymentMethod === 'wallet' ? 'text-lime-400' : 'text-zinc-300'}`}>Saldo em Carteira</p>
                         <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Saldo disponível: R$ 850,00</p>
                       </div>
                       {paymentMethod === 'wallet' && <CheckCircle2 size={20} className="ml-auto text-lime-400" />}
                     </button>
                   </div>
                 </section>
               )}
             </div>

             <div className="p-8 bg-zinc-900/50 border-t border-zinc-900 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-zinc-300">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-lime-400 font-bold text-[10px] uppercase tracking-widest">
                      <span>Desconto PIX (5%)</span>
                      <span>- R$ {discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                    <span className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em]">Total</span>
                    <span className="text-3xl font-black italic text-white leading-none">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <button 
                  disabled={cart.length === 0 || !paymentMethod}
                  className={`w-full py-6 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${!paymentMethod ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50' : 'bg-lime-400 text-black shadow-xl shadow-lime-400/20 active:scale-95'}`}
                >
                  {paymentMethod ? 'Finalizar Pedido' : 'Selecione o Pagamento'} 
                  {paymentMethod && <ArrowRight size={18}/>}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-zinc-950/90 backdrop-blur-3xl border-t border-zinc-900 flex items-center justify-around z-50 px-8 pb-4">
        <button onClick={() => setActiveView('dashboard')} className={activeView === 'dashboard' ? 'text-lime-400' : 'text-zinc-600'}><LayoutDashboard size={28}/></button>
        <button onClick={() => setActiveView(role === 'ALUNO' ? 'workouts' : (role === 'PROFESSOR' ? 'students' : 'patients'))} className={activeView === (role === 'ALUNO' ? 'workouts' : 'students') ? 'text-lime-400' : 'text-zinc-600'}>
          {role === 'ALUNO' ? <Dumbbell size={28}/> : <Users size={28}/>}
        </button>
        <button onClick={() => setActiveView(role === 'ALUNO' ? 'store' : 'plans')} className={activeView === (role === 'ALUNO' ? 'store' : 'plans') ? 'text-lime-400' : 'text-zinc-600'}>
          {role === 'ALUNO' ? <ShoppingBag size={28}/> : <Zap size={28}/>}
        </button>
        <button onClick={() => setActiveView('profile')} className={activeView === 'profile' ? 'text-lime-400' : 'text-zinc-600'}><User size={28}/></button>
      </nav>
    </div>
  );
};

export default App;
