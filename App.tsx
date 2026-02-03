
// ... (imports remain the same)
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
  MessageCircle, UserPlus, Pencil, Trash, Copy, BookMarked, Download, AlertTriangle, Eye, BarChart3, RefreshCw, ClipboardList, Hammer, Briefcase,
  Sparkles, Bot, Send, Loader2, BrainCircuit, ChefHat, Volume2, Upload, FileVideo, Mic, Watch, Heart, Bluetooth, Signal
} from 'lucide-react';
import { 
  ResponsiveContainer, Cell, 
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, AreaChart, Area, BarChart, Bar, Legend, LineChart, Line,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

// --- AI CONFIG ---
// Initialize Gemini AI. Assumes API_KEY is available in process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// ... (Types and Interfaces remain the same)
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
  daysAbsent: number; // For Retention Radar
  progress: number;
  avatar: string;
  financialStatus: 'OK' | 'LATE'; // For Admin
  risk: boolean; // For Retention Radar
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

// --- CONSTANTS & MOCKS ---
// ... (Keeping Mocks mostly same, ensuring INITIAL_DIETS is there)

const INITIAL_STUDENTS: Student[] = [
  { id: 1, name: 'Alex Rivers', email: 'alex@rivers.com', phone: '5511999999999', plan: 'VIP Performance', lastVisit: 'Hoje, 09:00', daysAbsent: 0, progress: 75, avatar: 'https://picsum.photos/seed/alex/100', financialStatus: 'OK', risk: false },
  { id: 2, name: 'Bia Silva', email: 'bia@fitness.com', phone: '5511988888888', plan: 'Básico Semanal', lastVisit: 'Ontem', daysAbsent: 1, progress: 40, avatar: 'https://picsum.photos/seed/bia/100', financialStatus: 'LATE', risk: false },
  { id: 3, name: 'Carlos Motta', email: 'carlos@m.com', phone: '5511977777777', plan: 'Trimestral', lastVisit: '12 dias atrás', daysAbsent: 12, progress: 10, avatar: 'https://picsum.photos/seed/carlos/100', financialStatus: 'OK', risk: true },
];

const INITIAL_TEMPLATES: WorkoutTemplate[] = [
  { id: 't1', title: 'Hipertrofia Base - Peito/Tríceps', category: 'A', exercises: [{ id: 'te1', n: 'Supino Reto', s: 4, r: '10', w: '30kg', rest: 90, group: 'Peito', orientations: ['Escápulas presas', 'Controle o peso'] }] }
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Whey Isolate 900g', price: 249.90, brand: 'Max Titanium', img: 'https://images.unsplash.com/photo-1593095191850-2a733009e073?q=80&w=400', category: 'Suplementos', stock: 15 },
  { id: 2, name: 'Creatina Monohidratada', price: 89.90, brand: 'Growth', img: 'https://images.unsplash.com/photo-1579722820308-d74e5719d54e?q=80&w=400', category: 'Suplementos', stock: 40 },
  { id: 3, name: 'Strap de Punho', price: 49.90, brand: 'Fitness Tech', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400', category: 'Equipamentos', stock: 5 },
];

const INITIAL_WORKOUTS: Record<number, any> = {
  1: { title: 'Push Day: Hipertrofia Sistêmica', category: 'A', exercises: [
    { id: 'ex1', n: 'Supino Reto c/ Barra', s: 4, r: '8-10', w: '80kg', rest: 90, group: 'Peito', orientations: ['Mantenha as escápulas aduzidas.', 'Pico de contração no topo.', 'Desça de forma controlada.'], video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 'ex2', n: 'Supino Inclinado c/ Halteres', s: 3, r: '10-12', w: '32kg', rest: 60, group: 'Peito', orientations: ['45 graus de inclinação.', 'Foco na porção superior.'], video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  ], duration: '65m' },
};

const INITIAL_DIETS: Record<number, any> = {
  1: { title: 'High Carb', kcal: 3150, meals: [
    { n: 'Café da Manhã', t: '07:30', kcal: 650, icon: <Coffee />, items: [{ name: '4 Ovos Mexidos', kcal: 320 }, { name: '100g Aveia', kcal: 330 }] },
    { n: 'Almoço', t: '13:00', kcal: 850, icon: <Sun />, items: [{ name: '200g Frango', kcal: 400 }, { name: '250g Arroz', kcal: 450 }] },
  ]},
};

const FOOD_SUBSTITUTIONS: Record<string, string[]> = {
  'Frango': ['Peixe Branco', 'Lombo Suíno', 'Ovos', 'Tofu'],
  'Arroz': ['Batata Inglesa', 'Batata Doce', 'Mandioca', 'Macarrão'],
  'Aveia': ['Granola Sem Açúcar', 'Farinha de Arroz', 'Corn Flakes'],
  'Ovos': ['Albumina', 'Queijo Cotagge', 'Whey Protein'],
};

const VISUAL_DIARY_MOCK = [
  { id: 1, meal: 'Café da Manhã', img: 'https://images.unsplash.com/photo-1494390248081-4e521a5940db?q=80&w=400', time: '08:15', status: 'approved' },
  { id: 2, meal: 'Almoço', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400', time: '13:30', status: 'warning' },
];

const CRM_DATA = [
  { id: 1, name: 'Lucas Pereira', status: 'LEAD', contact: '11 9999-0000', origin: 'Instagram' },
  { id: 2, name: 'Fernanda Lima', status: 'VISIT', contact: '11 9888-1111', origin: 'Indicação' },
  { id: 3, name: 'Ricardo Souza', status: 'TRIAL', contact: '11 9777-2222', origin: 'Google' },
  { id: 4, name: 'Juliana Costa', status: 'CLOSED', contact: '11 9666-3333', origin: 'Walk-in' },
  { id: 5, name: 'Marcos Vilela', status: 'LEAD', contact: '11 9555-4444', origin: 'Site' },
];

const MAINTENANCE_TICKETS = [
  { id: 1, equipment: 'Esteira 04', issue: 'Lona travando', status: 'OPEN', date: 'Hoje', priority: 'HIGH' },
  { id: 2, equipment: 'Cadeira Extensora', issue: 'Estofado rasgado', status: 'PENDING', date: 'Ontem', priority: 'LOW' },
  { id: 3, equipment: 'Crossfit Rig', issue: 'Parafuso solto', status: 'FIXED', date: '01/10', priority: 'MEDIUM' },
];

const ASSESSMENT_RADAR_DATA = [
  { subject: 'Força', A: 120, B: 110, fullMark: 150 },
  { subject: 'Cardio', A: 98, B: 130, fullMark: 150 },
  { subject: 'Flexib.', A: 86, B: 130, fullMark: 150 },
  { subject: 'Core', A: 99, B: 100, fullMark: 150 },
  { subject: 'Potência', A: 85, B: 90, fullMark: 150 },
  { subject: 'Resist.', A: 65, B: 85, fullMark: 150 },
];

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

const getBase64FromUrl = async (url: string): Promise<string> => {
  try {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob); 
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data.split(',')[1]); // remove data:image/jpeg;base64,
      }
    });
  } catch (e) {
    console.error("Failed to fetch image for AI", e);
    return "";
  }
}

// Helper to extract frames from video for AI Analysis
const extractFramesFromVideo = async (videoFile: File, numFrames: number = 3): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.playsInline = true;

    const frames: string[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth / 4; // Resize for quicker AI processing
      canvas.height = video.videoHeight / 4;
      const duration = video.duration;
      const interval = duration / (numFrames + 1);

      for (let i = 1; i <= numFrames; i++) {
        video.currentTime = interval * i;
        await new Promise(r => { video.onseeked = r; });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
        }
      }
      URL.revokeObjectURL(video.src);
      resolve(frames);
    };
    video.onerror = reject;
  });
};

// --- BASE UI COMPONENTS ---
// ... (NavItem, StatCard, CalendarBase remain unchanged)
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

// --- AI COMPONENTS ---
// ... (AIChatWidget remains unchanged)
const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    {role: 'model', text: 'Olá! Sou seu AI Coach. Como posso te ajudar hoje com seus treinos ou dieta?'}
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if(!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: "Você é um personal trainer e nutricionista experiente, motivador e técnico. Responda de forma concisa e útil.",
        },
        history: history
      });

      const result = await chat.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "Desculpe, não consegui processar." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Erro de conexão com o Coach AI." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-6 right-6 md:right-10 z-[100] size-16 bg-lime-400 text-black rounded-[2rem] flex items-center justify-center shadow-2xl hover:scale-110 transition-all border-4 border-zinc-950">
        <Sparkles size={28} className={isOpen ? 'rotate-90 transition-transform' : ''} />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 md:right-10 z-[99] w-[90vw] md:w-96 h-[60vh] bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
           <div className="p-6 border-b border-zinc-800 flex items-center gap-4 bg-zinc-950/50">
              <div className="size-10 bg-lime-400/10 text-lime-400 rounded-xl flex items-center justify-center"><Bot size={20}/></div>
              <div><h4 className="font-black italic uppercase text-white">AI Coach</h4><p className="text-[10px] font-bold text-zinc-500">Gemini Powered</p></div>
           </div>
           <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium leading-relaxed ${m.role === 'user' ? 'bg-zinc-800 text-zinc-200 rounded-br-none' : 'bg-lime-400/10 text-lime-400 rounded-bl-none'}`}>
                      {m.text}
                   </div>
                </div>
              ))}
              {isLoading && <div className="flex justify-start"><div className="bg-lime-400/10 p-4 rounded-2xl rounded-bl-none"><Loader2 size={16} className="text-lime-400 animate-spin"/></div></div>}
              <div ref={messagesEndRef} />
           </div>
           <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex gap-2">
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte ao Coach..." 
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-lime-400 transition-all"
              />
              <button onClick={handleSend} disabled={isLoading} className="size-10 bg-lime-400 text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"><Send size={16}/></button>
           </div>
        </div>
      )}
    </>
  );
};

// --- ALUNO COMPONENTS ---

const ActiveWorkoutSession = ({ workout, workoutTime, onFinish, onClose, watchConnected, connectedDeviceName }: any) => {
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(workout.exercises[0]?.id || null);
  const [restingExerciseId, setRestingExerciseId] = useState<string | null>(null);
  const [restSeconds, setRestSeconds] = useState<number>(0);
  
  // AI Posture & Voice States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [postureFeedback, setPostureFeedback] = useState<string | null>(null);
  const [showPostureModal, setShowPostureModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Watch Telemetry Simulation
  const [bpm, setBpm] = useState(110);
  const [cal, setCal] = useState(0);

  useEffect(() => {
    let interval: any;
    if (restingExerciseId && restSeconds > 0) interval = setInterval(() => setRestSeconds((p: number) => p - 1), 1000);
    else if (restSeconds === 0) setRestingExerciseId(null);
    return () => clearInterval(interval);
  }, [restingExerciseId, restSeconds]);

  // Simulate Heart Rate if connected
  useEffect(() => {
    if (!watchConnected) return;
    const interval = setInterval(() => {
      setBpm(prev => Math.min(185, Math.max(90, prev + Math.floor(Math.random() * 10) - 4)));
      setCal(prev => prev + 0.2);
    }, 2000);
    return () => clearInterval(interval);
  }, [watchConnected]);

  const totalPossibleSets: number = (workout.exercises || []).reduce((acc: number, ex: any) => acc + (Number(ex.s) || 0), 0);
  const totalCompletedSets: number = (Object.values(exerciseProgress) as number[]).reduce((acc: number, val: number) => acc + val, 0);
  const workoutPercentage = totalPossibleSets > 0 ? (totalCompletedSets / totalPossibleSets) * 100 : 0;

  const handleVoiceGuidance = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.cancel(); // Stop previous
    window.speechSynthesis.speak(utterance);
  };

  const handleVideoAnalysis = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsAnalyzing(true);
    setPostureFeedback(null);
    
    try {
      // Extract frames from video for AI analysis
      const frames = await extractFramesFromVideo(file, 3);
      const parts = frames.map(f => ({ inlineData: { mimeType: 'image/jpeg', data: f } }));
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Pro model for better vision reasoning
        contents: {
          parts: [
            ...parts,
            { text: "Analise a técnica deste exercício de musculação baseado nesses frames do vídeo. Identifique erros de postura (como valgo, coluna torta, amplitude) e dê 3 dicas de correção diretas e motivadoras. Responda em português." }
          ]
        }
      });
      setPostureFeedback(response.text || "Não foi possível analisar o vídeo.");
    } catch (err) {
      console.error(err);
      setPostureFeedback("Erro ao analisar vídeo. Tente um arquivo menor ou mais curto.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-500 pb-32 max-w-3xl mx-auto">
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 pb-6 mb-10 pt-4 px-4 md:px-0">
        <div className="flex justify-between items-center mb-6 relative">
          <button onClick={onClose} className="size-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white transition-all z-10"><X size={20} /></button>
          
          <div className="absolute left-0 right-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex items-center justify-center gap-2 mb-0.5">
               <TimerIcon size={16} className="text-lime-400" />
               <span className="text-2xl font-black italic text-lime-400 tracking-tighter">{formatTime(workoutTime)}</span>
            </div>
            {watchConnected ? (
               <div className="flex items-center gap-1.5 text-red-500 font-black italic text-xs animate-in slide-in-from-top-2">
                  <Heart size={10} fill="currentColor" className="animate-pulse"/> {bpm} BPM
               </div>
            ) : (
               <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Treinando Agora</p>
            )}
          </div>

          <div className="size-12 flex items-center justify-center z-10">
             {watchConnected && <Watch size={20} className="text-zinc-600" />}
          </div>
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
                        <div className="flex justify-between items-center mb-3">
                           <p className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2"><BookOpen size={14}/> Técnica</p>
                           <button onClick={() => handleVoiceGuidance(ex.orientations.join('. '))} className={`flex items-center gap-2 text-[10px] font-black uppercase transition-colors px-3 py-1.5 rounded-lg border ${isSpeaking ? 'bg-lime-400 text-black border-lime-400 animate-pulse' : 'bg-zinc-900 text-lime-400 border-zinc-800 hover:border-lime-400/50'}`}>
                              {isSpeaking ? <Volume2 size={12} className="animate-bounce"/> : <Volume2 size={12}/>} 
                              {isSpeaking ? 'Falando...' : 'Ouvir Dicas'}
                           </button>
                        </div>
                        <ul className="space-y-2">{ex.orientations.map((item: string, i: number) => (<li key={i} className="text-xs text-zinc-400 italic"><span className="text-lime-400 font-black mr-1">{i+1}.</span> {item}</li>))}</ul>
                      </div>
                      <button onClick={() => setShowPostureModal(true)} className="w-full bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 text-zinc-400 hover:text-white py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all"><Video size={16} className="text-blue-500"/> Analisar Postura (AI)</button>
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

      {showPostureModal && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowPostureModal(false)}>
           <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[3rem] p-10 animate-in zoom-in duration-300 relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowPostureModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X size={24}/></button>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Análise de Postura</h3>
              <p className="text-zinc-500 text-sm font-bold mb-8">Envie um vídeo curto do seu exercício. A IA analisará sua biomecânica frame a frame.</p>
              
              {!postureFeedback ? (
                 <div className="border-2 border-dashed border-zinc-800 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 hover:border-lime-400 transition-colors bg-zinc-950/50">
                    {isAnalyzing ? (
                       <div className="flex flex-col items-center gap-4 animate-in fade-in">
                          <Loader2 size={48} className="text-lime-400 animate-spin"/>
                          <p className="text-xs font-black uppercase text-lime-400 animate-pulse">Analisando frames...</p>
                       </div>
                    ) : (
                       <>
                          <div className="size-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-600"><FileVideo size={32}/></div>
                          <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-xl text-xs font-black uppercase hover:scale-105 transition-transform">
                             Selecionar Vídeo
                             <input type="file" accept="video/*" className="hidden" onChange={handleVideoAnalysis} />
                          </label>
                          <p className="text-[10px] text-zinc-600 font-bold">Max 15 segundos</p>
                       </>
                    )}
                 </div>
              ) : (
                 <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl max-h-60 overflow-y-auto">
                       <div className="flex items-center gap-3 mb-4"><Sparkles size={18} className="text-lime-400"/><span className="text-xs font-black uppercase text-white">Feedback do Coach AI</span></div>
                       <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{postureFeedback}</p>
                    </div>
                    <button onClick={() => setPostureFeedback(null)} className="w-full bg-zinc-800 text-white py-4 rounded-2xl font-black uppercase text-xs">Nova Análise</button>
                 </div>
              )}
           </div>
        </div>
      )}
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

const ProfileView = ({ profileImage, onImageChange, biometrics, onBiometricsChange, watchConnected, toggleWatch, deviceName }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempBiometrics, setTempBiometrics] = useState({...biometrics});
  const [notif, setNotif] = useState(true);
  const [isPairing, setIsPairing] = useState(false);
  const [showDeviceList, setShowDeviceList] = useState(false);

  useEffect(() => { if (!isEditing) setTempBiometrics({...biometrics}); }, [biometrics, isEditing]);
  const handleSave = () => { onBiometricsChange({...tempBiometrics}); setIsEditing(false); };
  const handleCancel = () => { setTempBiometrics({...biometrics}); setIsEditing(false); };

  const mockDevices = [
    { id: 1, name: 'Apple Watch Series 8', os: '8.8.1 (19U512)', signal: 'Forte', type: 'apple' },
    { id: 2, name: 'Apple Watch SE', os: '8.7', signal: 'Fraco', type: 'apple' },
    { id: 3, name: 'Mi Band 7', os: 'N/A', signal: 'Médio', type: 'other' }
  ];

  const handleDevicePairing = () => {
    if (watchConnected) {
      toggleWatch(false);
    } else {
      setIsPairing(true);
      // Simulate scanning delay
      setTimeout(() => {
        setIsPairing(false);
        setShowDeviceList(true);
      }, 2000);
    }
  };

  const selectDevice = (device: any) => {
    setShowDeviceList(false);
    toggleWatch(true, device.name + ' - ' + device.os);
  };

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
               <button onClick={handleDevicePairing} disabled={isPairing} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${watchConnected ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-zinc-950 border border-zinc-800 hover:text-white'}`}>
                  {isPairing ? <Loader2 size={12} className="animate-spin"/> : watchConnected ? <Watch size={14}/> : <Plus size={14}/>}
                  {isPairing ? 'Buscando...' : watchConnected ? `Conectado: ${deviceName || 'Apple Watch'}` : 'Conectar'}
               </button>
            </div>
         </div>
      </section>

      {/* DEVICE SELECTION MODAL */}
      {showDeviceList && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowDeviceList(false)}>
           <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[3rem] p-8 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                 <h4 className="text-xl font-black italic uppercase flex items-center gap-3"><Bluetooth size={20} className="text-blue-500"/> Dispositivos</h4>
                 <button onClick={() => setShowDeviceList(false)}><X size={20} className="text-zinc-500 hover:text-white"/></button>
              </div>
              <p className="text-xs text-zinc-500 font-bold mb-6 uppercase tracking-widest">Selecione seu dispositivo para parear:</p>
              <div className="space-y-3">
                 {mockDevices.map((device) => (
                    <button key={device.id} onClick={() => selectDevice(device)} className="w-full bg-zinc-950 border border-zinc-800 hover:border-lime-400 p-4 rounded-2xl flex items-center justify-between group transition-all">
                       <div className="text-left">
                          <p className="text-sm font-bold text-white group-hover:text-lime-400">{device.name}</p>
                          <p className="text-[10px] font-black text-zinc-500 uppercase">{device.os}</p>
                       </div>
                       <div className="flex items-center gap-2">
                          <Signal size={14} className={device.signal === 'Forte' ? 'text-green-500' : 'text-orange-500'} />
                       </div>
                    </button>
                 ))}
              </div>
              <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
                 <p className="text-[9px] text-zinc-600 animate-pulse">Buscando novos dispositivos...</p>
              </div>
           </div>
        </div>
      )}
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

// --- NUTRI EXTENSIONS: SUBSTITUTIONS & VISUAL DIARY ---

const NutritionView = ({ diet, dayIdx, onGenerateDiet }: { diet: any, dayIdx: number, onGenerateDiet: (d: any) => void }) => {
  const [completedMeals, setCompletedMeals] = useState<number[]>([]);
  const [substitutionModal, setSubstitutionModal] = useState<{ isOpen: boolean, original: string, options: string[] }>({ isOpen: false, original: '', options: [] });
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState({ kcal: '2000', type: 'Equilibrada', restrictions: 'Sem restrições' });
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleFoodClick = (e: React.MouseEvent, foodName: string) => {
    e.stopPropagation();
    const key = Object.keys(FOOD_SUBSTITUTIONS).find(k => foodName.includes(k));
    if (key) {
      setSubstitutionModal({ isOpen: true, original: foodName, options: FOOD_SUBSTITUTIONS[key] });
    }
  };

  const generateDiet = async () => {
    setIsGenerating(true);
    try {
        const prompt = `Crie um plano alimentar diário (dieta) em formato JSON.
        Calorias: ${aiPrompt.kcal}. Tipo: ${aiPrompt.type}. Restrições: ${aiPrompt.restrictions}.
        
        Retorne APENAS um objeto JSON válido com esta estrutura exata, sem markdown:
        {
          "title": "Nome da Dieta",
          "kcal": 2000,
          "meals": [
            { 
              "n": "Nome da Refeição (ex: Café)", 
              "t": "08:00", 
              "kcal": 500, 
              "items": [
                { "name": "Alimento e quantidade", "kcal": 200 }
              ] 
            }
          ]
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });

        const text = response.text || "{}";
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const generated = JSON.parse(jsonStr);
        
        const mealsWithIcons = generated.meals.map((m: any) => ({
            ...m,
            icon: m.n.toLowerCase().includes('café') ? <Coffee/> : m.n.toLowerCase().includes('almoço') ? <Sun/> : <Moon/>
        }));

        onGenerateDiet({ ...generated, meals: mealsWithIcons });
        setShowAI(false);
    } catch (e) {
        console.error(e);
        alert("Erro ao gerar dieta. Tente novamente.");
    } finally {
        setIsGenerating(false);
    }
  };

  const progress = diet.meals.length > 0 ? (completedMeals.length / diet.meals.length) * 100 : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 relative">
      <header className="flex justify-between items-end">
         <div className="flex-1 mr-6">
            <h2 className="text-5xl font-black italic uppercase mb-2">Nutrição</h2>
            <p className="text-zinc-500 font-medium">Combustível para o corpo.</p>
         </div>
         <button onClick={() => setShowAI(true)} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
            <Sparkles size={16}/> Gerar Dieta AI
         </button>
      </header>

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
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{meal.items.map((item: any, i: number) => (
                       <div key={i} onClick={(e) => handleFoodClick(e, item.name)} className={`p-4 rounded-2xl flex justify-between items-center border hover:border-lime-400/50 transition-colors ${isDone ? 'bg-zinc-950/30 border-zinc-800/50 opacity-60' : 'bg-zinc-950 border-zinc-800'}`}>
                         <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">{item.name} {Object.keys(FOOD_SUBSTITUTIONS).some(k => item.name.includes(k)) && <RefreshCw size={10} className="text-lime-400"/>}</span>
                         <span className="text-[9px] font-black uppercase text-zinc-600">{item.kcal} kcal</span>
                       </div>
                     ))}</div>
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

      {substitutionModal.isOpen && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSubstitutionModal({...substitutionModal, isOpen: false})}>
           <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2rem] p-8 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
              <h4 className="text-xl font-black italic uppercase mb-2">Substituir {substitutionModal.original}</h4>
              <p className="text-xs text-zinc-500 font-bold mb-6">Opções equivalentes em macros:</p>
              <div className="space-y-3">
                 {substitutionModal.options.map((opt, i) => (
                    <button key={i} className="w-full bg-zinc-950 border border-zinc-800 hover:border-lime-400 p-4 rounded-xl flex items-center justify-between group transition-all">
                       <span className="text-sm font-bold text-zinc-300 group-hover:text-lime-400">{opt}</span>
                       <CheckCircle2 size={16} className="text-zinc-700 group-hover:text-lime-400"/>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {showAI && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowAI(false)}>
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-[3rem] p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-8"><h3 className="text-3xl font-black italic uppercase">Gerador Nutri AI</h3><button onClick={() => setShowAI(false)} className="size-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 transition-all"><X size={20}/></button></div>
               <div className="space-y-6">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Calorias Diárias</label><input type="number" value={aiPrompt.kcal} onChange={e => setAiPrompt({...aiPrompt, kcal: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none focus:border-lime-400" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Tipo de Dieta</label><select value={aiPrompt.type} onChange={e => setAiPrompt({...aiPrompt, type: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none appearance-none"><option>Equilibrada</option><option>Low Carb</option><option>Cetogênica</option><option>Vegana</option><option>Bulking (Ganho de Massa)</option></select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-zinc-600 ml-4">Restrições / Preferências</label><input placeholder="Ex: Sem glúten, barato, rápido de fazer..." value={aiPrompt.restrictions} onChange={e => setAiPrompt({...aiPrompt, restrictions: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none" /></div>
                  <button onClick={generateDiet} disabled={isGenerating} className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {isGenerating ? <Loader2 className="animate-spin"/> : <Sparkles size={18}/>} 
                    {isGenerating ? 'Criando Plano...' : 'Gerar Dieta'}
                  </button>
               </div>
            </div>
        </div>
      )}
    </div>
  );
};

// --- MODULES ---

const StudentModule = ({ view, setView, products, addToCart, cartCount, setIsCartOpen, profileImage, onImageChange, biometrics, onBiometricsChange, dietPlans, setDietPlans, watchConnected, toggleWatch, deviceName }: any) => {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [activeSessionTime, setActiveSessionTime] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);
  
  useEffect(() => {
    let interval: any;
    if (activeSession) interval = setInterval(() => setActiveSessionTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  if (activeSession) return <ActiveWorkoutSession workout={activeSession} workoutTime={activeSessionTime} onFinish={() => { setActiveSession(null); setSessionFinished(true); }} onClose={() => setActiveSession(null)} watchConnected={watchConnected} connectedDeviceName={deviceName} />;
  if (sessionFinished) return <FinishedSessionView totalTime={activeSessionTime} reset={() => { setSessionFinished(false); setActiveSessionTime(0); setView('dashboard'); }} />;

  switch (view) {
    case 'dashboard':
      return (
        <div className="space-y-12 animate-in fade-in duration-700">
           <header><h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-2">Olá, Alex</h1><p className="text-zinc-500 font-medium">Vamos destruir hoje?</p></header>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatCard label="Treinos" value="12" trend="+2 essa semana" color="text-lime-400" icon={Dumbbell} />
             <StatCard label="Calorias" value="2450" trend="Na meta" color="text-orange-400" icon={Flame} />
             <StatCard label="Peso" value={biometrics.weight} trend="-1.2kg" color="text-blue-400" icon={Scale} />
           </div>
           <section>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-8">Próximo Treino</h3>
              <WorkoutDetailCard workout={INITIAL_WORKOUTS[1]} onStart={() => setActiveSession(INITIAL_WORKOUTS[1])} />
           </section>
        </div>
      );
    case 'workouts':
       return (
         <div className="space-y-10 animate-in fade-in duration-700">
            <header><h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Seus Treinos</h2><p className="text-zinc-500 font-medium">Sua rotina semanal.</p></header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {Object.values(INITIAL_WORKOUTS).map((w: any, i) => (
                  <div key={i} onClick={() => setActiveSession(w)} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] hover:border-lime-400/50 transition-all cursor-pointer group">
                     <div className="flex justify-between items-start mb-8"><span className="bg-zinc-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-zinc-500 tracking-widest group-hover:bg-lime-400 group-hover:text-black transition-colors">Série {w.category}</span><ArrowRight className="text-zinc-600 group-hover:text-lime-400 transition-colors"/></div>
                     <h4 className="text-2xl font-black italic uppercase tracking-tight mb-2">{w.title}</h4>
                     <p className="text-xs font-bold text-zinc-500 uppercase">{w.duration} • {w.exercises.length} exercícios</p>
                  </div>
               ))}
            </div>
         </div>
       );
    case 'diet':
       const currentDiet = dietPlans[1] || INITIAL_DIETS[1];
       return <NutritionView diet={currentDiet} dayIdx={new Date().getDay()} onGenerateDiet={(newDiet: any) => setDietPlans({...dietPlans, 1: newDiet})} />;
    case 'store':
       return <StoreView products={products} addToCart={addToCart} cartCount={cartCount} openCart={() => setIsCartOpen(true)} />;
    case 'evolution': return <EvolutionView />;
    case 'profile': return <ProfileView profileImage={profileImage} onImageChange={onImageChange} biometrics={biometrics} onBiometricsChange={onBiometricsChange} watchConnected={watchConnected} toggleWatch={toggleWatch} deviceName={deviceName} />;
    default: return null;
  }
};

const ProfessorModule = ({ view, students, setView, templates, onAddTemplate, onRemoveTemplate }: any) => {
   const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
   if (selectedStudent) {
      return (
         <div className="animate-in fade-in slide-in-from-right duration-500 space-y-8">
            <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-4"><ArrowLeft size={20}/><span className="text-xs font-black uppercase">Voltar</span></button>
            <div className="flex items-center gap-6 mb-8"><img src={selectedStudent.avatar} className="size-24 rounded-3xl object-cover"/><div className=""><h2 className="text-4xl font-black italic uppercase">{selectedStudent.name}</h2><p className="text-zinc-500 font-bold">{selectedStudent.plan}</p></div></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <StatCard label="Frequência" value={`${100 - (selectedStudent.daysAbsent * 10)}%`} color="text-lime-400" icon={Activity} />
               <StatCard label="Progresso" value={`${selectedStudent.progress}%`} color="text-blue-400" icon={TrendingUp} />
               <StatCard label="Risco" value={selectedStudent.risk ? "ALTO" : "BAIXO"} color={selectedStudent.risk ? "text-red-500" : "text-green-500"} icon={AlertTriangle} />
            </div>
         </div>
      );
   }
   switch(view) {
      case 'dashboard':
         return (
            <div className="space-y-10 animate-in fade-in duration-700">
               <header><h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Painel do Treinador</h1></header>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard label="Total Alunos" value={students.length} color="text-white" icon={Users} />
                  <StatCard label="Em Risco" value={students.filter((s: Student) => s.risk).length} color="text-red-500" icon={AlertTriangle} />
                  <StatCard label="Treinos Hoje" value="18" color="text-lime-400" icon={Dumbbell} />
               </div>
            </div>
         );
      case 'students':
         return (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header><h2 className="text-4xl font-black italic uppercase tracking-tighter">Meus Alunos</h2></header>
               <div className="grid gap-4">
                  {students.map((s: Student) => (
                     <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between cursor-pointer hover:border-lime-400/50 transition-all">
                        <div className="flex items-center gap-4"><img src={s.avatar} className="size-14 rounded-2xl"/><div className=""><h4 className="font-black italic uppercase text-lg">{s.name}</h4><p className="text-[10px] font-bold text-zinc-500">{s.lastVisit}</p></div></div>
                        <div className="flex items-center gap-4">{s.risk && <span className="px-3 py-1 bg-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-lg">Risco de Churn</span>}<ChevronRight className="text-zinc-600"/></div>
                     </div>
                  ))}
               </div>
            </div>
         );
      case 'templates':
         return (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex justify-between items-end"><h2 className="text-4xl font-black italic uppercase tracking-tighter">Modelos de Treino</h2><button className="bg-lime-400 text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><Plus size={16}/> Novo Modelo</button></header>
               <div className="grid gap-4">{templates.map((t: WorkoutTemplate) => (<div key={t.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex justify-between items-center group"><div><h4 className="font-black italic uppercase text-lg">{t.title}</h4><p className="text-[10px] text-zinc-500 font-bold">{t.exercises.length} Exercícios • Série {t.category}</p></div><button onClick={() => onRemoveTemplate(t.id)} className="size-10 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>))}</div>
            </div>
         );
      default: return null;
   }
}

const AdminModule = () => {
   const [tab, setTab] = useState('crm');
   return (
      <div className="space-y-10 animate-in fade-in duration-700">
         <header className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div><h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Administração</h1><p className="text-zinc-500 font-medium">Gestão completa do studio.</p></div>
            <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl gap-1">
               <button onClick={() => setTab('crm')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${tab === 'crm' ? 'bg-lime-400 text-black' : 'text-zinc-500 hover:text-white'}`}>CRM</button>
               <button onClick={() => setTab('maintenance')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${tab === 'maintenance' ? 'bg-lime-400 text-black' : 'text-zinc-500 hover:text-white'}`}>Manutenção</button>
            </div>
         </header>
         {tab === 'crm' && (<div className="grid gap-4">{CRM_DATA.map((lead: any) => (<div key={lead.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4"><div className="flex items-center gap-4"><div className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center font-black text-zinc-600">{lead.name.charAt(0)}</div><div><h4 className="font-black italic uppercase text-lg">{lead.name}</h4><p className="text-[10px] text-zinc-500 font-bold">{lead.contact} • {lead.origin}</p></div></div><span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${lead.status === 'CLOSED' ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}>{lead.status}</span></div>))}</div>)}
         {tab === 'maintenance' && (<div className="grid gap-4">{MAINTENANCE_TICKETS.map((ticket: any) => (<div key={ticket.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex justify-between items-center"><div><h4 className="font-black italic uppercase text-lg">{ticket.equipment}</h4><p className="text-[10px] text-zinc-500 font-bold">{ticket.issue}</p></div><span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${ticket.priority === 'HIGH' ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{ticket.status}</span></div>))}</div>)}
      </div>
   );
};

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
  const [dietPlans, setDietPlans] = useState<Record<number, any>>(INITIAL_DIETS);
  
  // State for Watch Integration
  const [watchConnected, setWatchConnected] = useState(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState("");

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = paymentMethod === 'pix' ? subtotal * 0.05 : 0;
  const total = subtotal - discount;

  const handleToggleWatch = (status: boolean, name: string = "") => {
    setWatchConnected(status);
    if (name) setConnectedDeviceName(name);
  };

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
            dietPlans={dietPlans} setDietPlans={setDietPlans}
            watchConnected={watchConnected} toggleWatch={handleToggleWatch}
            deviceName={connectedDeviceName}
          />
        )}
        {(role === 'PROFESSOR' || role === 'NUTRI') && (
          <ProfessorModule 
            view={activeView} setView={setActiveView} students={students} 
            onAddStudent={()=>{}} templates={workoutTemplates} 
            onAddTemplate={(d:any)=>setWorkoutTemplates([d, ...workoutTemplates])} 
            onRemoveTemplate={(id:any)=>setWorkoutTemplates(workoutTemplates.filter(t=>t.id!==id))} 
            dietPlans={dietPlans} setDietPlans={setDietPlans}
          />
        )}
        {role === 'ADMIN' && <AdminModule />}
      </main>

      {/* AI CHATBOT GLOBAL */}
      <AIChatWidget />

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
