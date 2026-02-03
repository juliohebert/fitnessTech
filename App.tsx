
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
  Sparkles, Bot, Send, Loader2, BrainCircuit, ChefHat, Volume2, Upload, FileVideo, Mic, Watch, Heart, Bluetooth, Signal, FileText, XCircle, MapPin
} from 'lucide-react';
import { 
  ResponsiveContainer, Cell, 
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, AreaChart, Area, BarChart, Bar, Legend, LineChart, Line,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

// --- AI CONFIG ---
// Initialize Gemini AI. Assumes API_KEY is available in import.meta.env
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

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

// Estrutura de treinos por dia da semana (0 = Domingo, 1 = Segunda, etc.)
const INITIAL_WORKOUTS_WEEKLY: Record<number, Record<number, any>> = {
  1: { // userId 1
    0: { title: 'Descanso Ativo', category: 'Rest', exercises: [], duration: '-' },
    1: { title: 'Push Day: Peito e Tríceps', category: 'A', exercises: [
      { id: 'ex1', n: 'Supino Reto c/ Barra', s: 4, r: '8-10', w: '80kg', rest: 90, group: 'Peito', orientations: ['Mantenha as escápulas aduzidas.', 'Pico de contração no topo.', 'Desça de forma controlada.'], video: 'https://www.youtube.com/watch?v=fG_03xSzT2s' },
      { id: 'ex2', n: 'Supino Inclinado c/ Halteres', s: 3, r: '10-12', w: '32kg', rest: 60, group: 'Peito', orientations: ['45 graus de inclinação.', 'Foco na porção superior.'], video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
      { id: 'ex3', n: 'Tríceps Testa', s: 3, r: '12-15', w: '20kg', rest: 45, group: 'Tríceps', orientations: ['Cotovelos fixos.', 'Movimento controlado.'], video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
    ], duration: '65m' },
    2: { title: 'Pull Day: Costas e Bíceps', category: 'B', exercises: [
      { id: 'ex4', n: 'Puxada Frontal', s: 4, r: '10-12', w: '60kg', rest: 60, group: 'Costas', orientations: ['Escápulas para trás e para baixo.', 'Controle na fase excêntrica.'], video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
      { id: 'ex5', n: 'Remada Curvada', s: 4, r: '8-10', w: '70kg', rest: 90, group: 'Costas', orientations: ['Costas retas.', 'Puxe para a linha do umbigo.'], video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
      { id: 'ex6', n: 'Rosca Direta', s: 3, r: '10-12', w: '15kg', rest: 45, group: 'Bíceps', orientations: ['Cotovelos fixos.', 'Contração no topo.'], video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
    ], duration: '60m' },
    3: { title: 'Leg Day: Pernas Completo', category: 'C', exercises: [
      { id: 'ex7', n: 'Agachamento Livre', s: 4, r: '8-10', w: '100kg', rest: 120, group: 'Pernas', orientations: ['Profundidade até paralelo.', 'Core ativado.', 'Joelhos alinhados.'], video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4' },
      { id: 'ex8', n: 'Leg Press 45°', s: 3, r: '12-15', w: '200kg', rest: 90, group: 'Pernas', orientations: ['Amplitude completa.', 'Lombar apoiada.'], video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
      { id: 'ex9', n: 'Stiff', s: 3, r: '10-12', w: '60kg', rest: 60, group: 'Posterior', orientations: ['Joelhos levemente flexionados.', 'Foco no alongamento.'], video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4' },
    ], duration: '70m' },
    4: { title: 'Upper Body: Força', category: 'D', exercises: [
      { id: 'ex10', n: 'Desenvolvimento Militar', s: 4, r: '6-8', w: '50kg', rest: 120, group: 'Ombros', orientations: ['Barra na linha dos olhos.', 'Core estável.'], video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4' },
      { id: 'ex11', n: 'Elevação Lateral', s: 3, r: '12-15', w: '12kg', rest: 45, group: 'Ombros', orientations: ['Cotovelos levemente flexionados.', 'Controle o movimento.'], video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4' },
    ], duration: '55m' },
    5: { title: 'Full Body: Funcional', category: 'E', exercises: [
      { id: 'ex12', n: 'Levantamento Terra', s: 4, r: '6-8', w: '120kg', rest: 150, group: 'Full Body', orientations: ['Postura neutra da coluna.', 'Força vem das pernas.'], video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
      { id: 'ex13', n: 'Burpees', s: 3, r: '15', w: 'Corpo', rest: 60, group: 'Cardio', orientations: ['Movimento explosivo.', 'Mantenha o ritmo.'], video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
    ], duration: '50m' },
    6: { title: 'Descanso Total', category: 'Rest', exercises: [], duration: '-' },
  }
};

const INITIAL_WORKOUTS: Record<number, any> = {
  1: INITIAL_WORKOUTS_WEEKLY[1][new Date().getDay()],
};

// Estrutura de dietas por dia da semana (0 = Domingo, 1 = Segunda, etc.)
const INITIAL_DIETS_WEEKLY: Record<number, Record<number, any>> = {
  1: { // userId 1
    0: { title: 'Domingo - Low Carb', kcal: 2500, meals: [
      { n: 'Café da Manhã', t: '09:00', kcal: 550, icon: <Coffee />, items: [{ name: '3 Ovos Mexidos', kcal: 240 }, { name: '50g Aveia', kcal: 180 }, { name: '1 Banana', kcal: 130 }] },
      { n: 'Almoço', t: '13:00', kcal: 750, icon: <Sun />, items: [{ name: '200g Frango', kcal: 400 }, { name: '150g Batata Doce', kcal: 200 }, { name: 'Salada', kcal: 150 }] },
      { n: 'Lanche', t: '16:00', kcal: 400, icon: <Coffee />, items: [{ name: 'Whey Protein', kcal: 150 }, { name: '30g Amendoim', kcal: 250 }] },
      { n: 'Jantar', t: '19:30', kcal: 600, icon: <Moon />, items: [{ name: '150g Carne', kcal: 400 }, { name: 'Legumes', kcal: 200 }] },
      { n: 'Ceia', t: '22:00', kcal: 200, icon: <Moon />, items: [{ name: 'Iogurte Grego', kcal: 200 }] },
    ]},
    1: { title: 'Segunda - High Carb (Treino)', kcal: 3150, meals: [
      { n: 'Café da Manhã', t: '07:30', kcal: 650, icon: <Coffee />, items: [{ name: '4 Ovos Mexidos', kcal: 320 }, { name: '100g Aveia', kcal: 330 }] },
      { n: 'Pré-Treino', t: '10:30', kcal: 400, icon: <Zap />, items: [{ name: '2 Bananas', kcal: 260 }, { name: '30g Whey', kcal: 140 }] },
      { n: 'Almoço', t: '13:00', kcal: 850, icon: <Sun />, items: [{ name: '200g Frango', kcal: 400 }, { name: '250g Arroz', kcal: 450 }] },
      { n: 'Lanche', t: '16:00', kcal: 450, icon: <Coffee />, items: [{ name: 'Pão Integral', kcal: 200 }, { name: 'Pasta de Amendoim', kcal: 250 }] },
      { n: 'Jantar', t: '19:30', kcal: 700, icon: <Moon />, items: [{ name: '200g Peixe', kcal: 350 }, { name: '200g Batata', kcal: 350 }] },
      { n: 'Ceia', t: '22:00', kcal: 100, icon: <Moon />, items: [{ name: 'Caseína', kcal: 100 }] },
    ]},
    2: { title: 'Terça - High Carb (Treino)', kcal: 3100, meals: [
      { n: 'Café da Manhã', t: '07:30', kcal: 630, icon: <Coffee />, items: [{ name: '3 Ovos + 2 Claras', kcal: 280 }, { name: '100g Aveia', kcal: 330 }, { name: 'Mel 20g', kcal: 20 }] },
      { n: 'Pré-Treino', t: '10:30', kcal: 380, icon: <Zap />, items: [{ name: 'Tapioca 100g', kcal: 270 }, { name: 'Geleia', kcal: 110 }] },
      { n: 'Almoço', t: '13:00', kcal: 880, icon: <Sun />, items: [{ name: '250g Frango', kcal: 500 }, { name: '200g Arroz', kcal: 360 }, { name: 'Feijão', kcal: 20 }] },
      { n: 'Lanche', t: '16:00', kcal: 420, icon: <Coffee />, items: [{ name: 'Whey', kcal: 140 }, { name: 'Granola 50g', kcal: 280 }] },
      { n: 'Jantar', t: '19:30', kcal: 690, icon: <Moon />, items: [{ name: '180g Carne Vermelha', kcal: 420 }, { name: '150g Batata Doce', kcal: 270 }] },
      { n: 'Ceia', t: '22:00', kcal: 100, icon: <Moon />, items: [{ name: 'Caseína', kcal: 100 }] },
    ]},
    3: { title: 'Quarta - High Carb (Leg Day)', kcal: 3300, meals: [
      { n: 'Café da Manhã', t: '07:00', kcal: 700, icon: <Coffee />, items: [{ name: '4 Ovos', kcal: 320 }, { name: '120g Aveia', kcal: 380 }] },
      { n: 'Pré-Treino', t: '10:00', kcal: 450, icon: <Zap />, items: [{ name: '2 Bananas', kcal: 260 }, { name: 'Maltodextrina 30g', kcal: 190 }] },
      { n: 'Pós-Treino', t: '12:00', kcal: 250, icon: <Zap />, items: [{ name: 'Whey + Dextrose', kcal: 250 }] },
      { n: 'Almoço', t: '13:30', kcal: 950, icon: <Sun />, items: [{ name: '250g Frango', kcal: 500 }, { name: '300g Arroz', kcal: 450 }] },
      { n: 'Lanche', t: '16:30', kcal: 450, icon: <Coffee />, items: [{ name: 'Sanduíche Natural', kcal: 450 }] },
      { n: 'Jantar', t: '20:00', kcal: 700, icon: <Moon />, items: [{ name: '200g Peixe', kcal: 350 }, { name: '200g Batata', kcal: 350 }] },
      { n: 'Ceia', t: '22:30', kcal: 100, icon: <Moon />, items: [{ name: 'Caseína', kcal: 100 }] },
    ]},
    4: { title: 'Quinta - Moderado Carb', kcal: 2900, meals: [
      { n: 'Café da Manhã', t: '07:30', kcal: 600, icon: <Coffee />, items: [{ name: '3 Ovos', kcal: 240 }, { name: '80g Aveia', kcal: 280 }, { name: 'Frutas', kcal: 80 }] },
      { n: 'Lanche', t: '10:30', kcal: 350, icon: <Coffee />, items: [{ name: 'Whey', kcal: 140 }, { name: 'Castanhas 30g', kcal: 210 }] },
      { n: 'Almoço', t: '13:00', kcal: 800, icon: <Sun />, items: [{ name: '200g Frango', kcal: 400 }, { name: '200g Batata Doce', kcal: 400 }] },
      { n: 'Lanche', t: '16:00', kcal: 400, icon: <Coffee />, items: [{ name: 'Iogurte + Granola', kcal: 400 }] },
      { n: 'Jantar', t: '19:30', kcal: 650, icon: <Moon />, items: [{ name: '180g Salmão', kcal: 350 }, { name: 'Legumes', kcal: 300 }] },
      { n: 'Ceia', t: '22:00', kcal: 100, icon: <Moon />, items: [{ name: 'Caseína', kcal: 100 }] },
    ]},
    5: { title: 'Sexta - Moderado Carb (Treino)', kcal: 2950, meals: [
      { n: 'Café da Manhã', t: '07:30', kcal: 600, icon: <Coffee />, items: [{ name: '4 Ovos', kcal: 320 }, { name: '70g Aveia', kcal: 280 }] },
      { n: 'Pré-Treino', t: '10:30', kcal: 350, icon: <Zap />, items: [{ name: 'Banana + Whey', kcal: 350 }] },
      { n: 'Almoço', t: '13:00', kcal: 850, icon: <Sun />, items: [{ name: '220g Frango', kcal: 440 }, { name: '220g Arroz', kcal: 410 }] },
      { n: 'Lanche', t: '16:00', kcal: 400, icon: <Coffee />, items: [{ name: 'Tapioca + Queijo', kcal: 400 }] },
      { n: 'Jantar', t: '19:30', kcal: 650, icon: <Moon />, items: [{ name: '200g Carne', kcal: 450 }, { name: 'Salada', kcal: 200 }] },
      { n: 'Ceia', t: '22:00', kcal: 100, icon: <Moon />, items: [{ name: 'Caseína', kcal: 100 }] },
    ]},
    6: { title: 'Sábado - Refeed Day', kcal: 3500, meals: [
      { n: 'Café da Manhã', t: '09:00', kcal: 750, icon: <Coffee />, items: [{ name: 'Panquecas (4)', kcal: 500 }, { name: 'Mel + Frutas', kcal: 250 }] },
      { n: 'Almoço', t: '13:00', kcal: 1000, icon: <Sun />, items: [{ name: '200g Carne', kcal: 450 }, { name: '300g Arroz', kcal: 450 }, { name: 'Feijão', kcal: 100 }] },
      { n: 'Lanche', t: '16:00', kcal: 500, icon: <Coffee />, items: [{ name: 'Açaí Bowl', kcal: 500 }] },
      { n: 'Jantar', t: '19:30', kcal: 950, icon: <Moon />, items: [{ name: 'Pizza Caseira', kcal: 950 }] },
      { n: 'Sobremesa', t: '21:00', kcal: 300, icon: <Moon />, items: [{ name: 'Sorvete Proteico', kcal: 300 }] },
    ]},
  }
};

const INITIAL_DIETS: Record<number, any> = {
  1: INITIAL_DIETS_WEEKLY[1][new Date().getDay()] || DEFAULT_DIET,
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
  { id: 1, name: 'Lucas Pereira', status: 'lead', contact: '11 9999-0000', origin: 'Instagram', value: 'R$ 150/mês', notes: 'Interessado em musculação' },
  { id: 2, name: 'Fernanda Lima', status: 'contact', contact: '11 9888-1111', origin: 'Indicação', value: 'R$ 200/mês', notes: 'Agendou visita para amanhã' },
  { id: 3, name: 'Ricardo Souza', status: 'proposal', contact: '11 9777-2222', origin: 'Google', value: 'R$ 180/mês', notes: 'Proposta enviada - aguardando retorno' },
  { id: 4, name: 'Juliana Costa', status: 'negotiation', contact: '11 9666-3333', origin: 'Walk-in', value: 'R$ 220/mês', notes: 'Negociando desconto familiar' },
  { id: 5, name: 'Marcos Vilela', status: 'won', contact: '11 9555-4444', origin: 'Site', value: 'R$ 150/mês', notes: 'Matriculado - plano anual' },
  { id: 6, name: 'Ana Santos', status: 'lead', contact: '11 9444-5555', origin: 'Facebook', value: 'R$ 170/mês', notes: 'Primeira academia' },
  { id: 7, name: 'Pedro Oliveira', status: 'contact', contact: '11 9333-6666', origin: 'Instagram', value: 'R$ 200/mês', notes: 'Quer treino de luta' },
  { id: 8, name: 'Carla Mendes', status: 'lost', contact: '11 9222-7777', origin: 'Indicação', value: 'R$ 180/mês', notes: 'Optou por concorrente mais próximo' },
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

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*$/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? `https://www.youtube.com/embed/${match[7]}` : null;
};

const isYouTubeUrl = (url: string): boolean => {
  return url?.includes('youtube.com') || url?.includes('youtu.be');
};

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
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, number>>(() => {
    // Inicializa progresso zerado para cada exercício
    const initial: Record<string, number> = {};
    workout.exercises?.forEach((ex: any) => {
      initial[ex.id] = 0;
    });
    return initial;
  });
  const [expandedId, setExpandedId] = useState<string | null>(workout.exercises[0]?.id || null);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
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

  const totalPossibleSets: number = (workout.exercises || []).reduce((acc: number, ex: any) => {
    const sets = typeof ex.s === 'string' ? parseInt(ex.s) : Number(ex.s);
    return acc + (isNaN(sets) ? 0 : sets);
  }, 0);
  
  const totalCompletedSets: number = (workout.exercises || []).reduce((acc: number, ex: any) => {
    return acc + (exerciseProgress[ex.id] || 0);
  }, 0);
  
  const workoutPercentage = totalPossibleSets > 0 ? Math.min(100, (totalCompletedSets / totalPossibleSets) * 100) : 0;

  // Verificar se todos os exercícios foram completados
  useEffect(() => {
    if (!workout.exercises || workout.exercises.length === 0) return;
    
    const allCompleted = workout.exercises.every((ex: any) => {
      const completed = exerciseProgress[ex.id] || 0;
      const required = typeof ex.s === 'string' ? parseInt(ex.s) : Number(ex.s);
      return !isNaN(required) && completed >= required;
    });
    
    // Só finaliza se todos estiverem completos E pelo menos uma série foi feita
    if (allCompleted && totalCompletedSets >= totalPossibleSets && totalPossibleSets > 0) {
      console.log('✅ Todos os exercícios completos! Finalizando treino em 3 segundos...');
      const timer = setTimeout(() => {
        onFinish();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [exerciseProgress, workout.exercises, totalCompletedSets, totalPossibleSets, onFinish]);

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

          <button 
            onClick={onFinish} 
            className="size-12 bg-red-500 hover:bg-red-600 border-2 border-red-400 rounded-2xl flex items-center justify-center text-white transition-all z-10 shadow-lg hover:scale-105 active:scale-95"
            title="Finalizar Treino"
          >
            <CheckCircle size={24} strokeWidth={3} />
          </button>
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
                    <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-zinc-800 relative group">
                      {isYouTubeUrl(ex.video) ? (
                        <iframe 
                          src={getYouTubeEmbedUrl(ex.video) || ex.video} 
                          className="w-full h-full" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        />
                      ) : (
                        <video src={ex.video} loop muted playsInline controls className="w-full h-full object-cover" />
                      )}
                      <button onClick={() => setExpandedVideo(ex.video)} className="absolute top-4 right-4 bg-black/80 hover:bg-lime-400 text-white hover:text-black p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                        <ExternalLink size={20} />
                      </button>
                    </div>
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
                         <button onClick={() => { 
                           const next = (exerciseProgress[ex.id] || 0) + 1; 
                           setExerciseProgress({...exerciseProgress, [ex.id]: next}); 
                           const requiredSets = typeof ex.s === 'string' ? parseInt(ex.s) : Number(ex.s);
                           if(next >= requiredSets) {
                             // Exercício completo - avançar para o próximo
                             const currentIndex = workout.exercises.findIndex((e: any) => e.id === ex.id);
                             const nextExercise = workout.exercises[currentIndex + 1];
                             if(nextExercise) {
                               setExpandedId(nextExercise.id);
                             } else {
                               setExpandedId(null);
                             }
                           } else { 
                             setRestingExerciseId(ex.id); 
                             setRestSeconds(typeof ex.rest === 'string' ? parseInt(ex.rest) : Number(ex.rest) || 60); 
                           } 
                         }} className="w-full bg-lime-400 hover:bg-lime-300 text-black py-8 rounded-[2rem] font-black uppercase tracking-widest text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all shadow-lime-400/20"><Zap size={28} fill="currentColor" /> Finalizar Série {completed + 1}</button>
                       )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {expandedVideo && (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center" onClick={() => setExpandedVideo(null)}>
          <button onClick={() => setExpandedVideo(null)} className="absolute top-8 right-8 bg-zinc-900/80 hover:bg-zinc-800 text-white p-4 rounded-full z-10 backdrop-blur-sm transition-all">
            <X size={28} />
          </button>
          <div className="w-full h-full flex items-center justify-center p-8" onClick={e => e.stopPropagation()}>
            {isYouTubeUrl(expandedVideo) ? (
              <iframe 
                src={getYouTubeEmbedUrl(expandedVideo) || expandedVideo} 
                className="w-full h-full max-w-6xl aspect-video rounded-2xl shadow-2xl" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            ) : (
              <video src={expandedVideo} loop controls className="max-w-full max-h-full rounded-2xl shadow-2xl" />
            )}
          </div>
        </div>
      )}

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
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800/50"><p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Meta</p>{isEditing ? (<select value={tempBiometrics.goal} onChange={(e) => setTempBiometrics({...tempBiometrics, goal: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 w-full text-white font-black italic outline-none appearance-none"><option value="Hipertrofia">Hipertrofia</option><option value="Cutting">Cutting</option><option value="Bulking">Bulking</option></select>) : (<p className="text-xl font-black italic text-lime-400 uppercase tracking-tighter break-words">{biometrics.goal}</p>)}</div>
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

const StudentModule = ({ view, setView, products, addToCart, cartCount, setIsCartOpen, profileImage, onImageChange, biometrics, onBiometricsChange, dietPlans, setDietPlans, watchConnected, toggleWatch, deviceName, activeSession, setActiveSession, activeSessionTime, sessionFinished, setSessionFinished, setActiveSessionTime }: any) => {
  const [selectedDayWorkout, setSelectedDayWorkout] = useState(new Date().getDay());
  const [selectedDayDiet, setSelectedDayDiet] = useState(new Date().getDay());

  // Se estiver na view de treino ativo, mostrar a sessão
  if (view === 'active-workout' && activeSession) {
    return <ActiveWorkoutSession workout={activeSession} workoutTime={activeSessionTime} onFinish={() => { setActiveSession(null); setSessionFinished(true); setView('dashboard'); }} onClose={() => setView('dashboard')} watchConnected={watchConnected} connectedDeviceName={deviceName} />;
  }

  // Se treino foi finalizado, mostrar tela de finalização
  if (sessionFinished) {
    return <FinishedSessionView totalTime={activeSessionTime} reset={() => { setSessionFinished(false); setActiveSessionTime(0); setView('dashboard'); }} />;
  }

  const handleStartWorkout = (workout: any) => {
    setActiveSession(workout);
    setView('active-workout');
  };

  return (
    <>
      {/* Indicador flutuante de treino ativo */}
      {activeSession && view !== 'active-workout' && (
        <div className="fixed bottom-6 left-6 z-[100] animate-in slide-in-from-bottom duration-500">
          <button 
            onClick={() => setView('active-workout')} 
            className="bg-lime-400 text-black px-6 py-4 rounded-2xl shadow-2xl shadow-lime-400/30 flex items-center gap-4 hover:scale-105 transition-all border-4 border-zinc-950"
          >
            <div className="size-3 bg-red-500 rounded-full animate-pulse" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-widest">Treino Ativo</span>
              <span className="text-lg font-black italic">{Math.floor(activeSessionTime / 60)}:{String(activeSessionTime % 60).padStart(2, '0')}</span>
            </div>
            <Play size={20} fill="currentColor" />
          </button>
        </div>
      )}

      <div className="w-full">
        {(() => {
          switch (view) {
    case 'dashboard':
      const todayWorkout = INITIAL_WORKOUTS_WEEKLY[1][new Date().getDay()];
      return (
        <div className="space-y-12 animate-in fade-in duration-700">
           <header><h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-2">Olá, Alex</h1><p className="text-zinc-500 font-medium">Vamos destruir hoje?</p></header>
           
           {/* Banner de treino ativo */}
           {activeSession && (
             <div className="bg-gradient-to-r from-lime-400/20 to-lime-500/10 border-2 border-lime-400/50 p-8 rounded-[3rem] shadow-xl shadow-lime-400/10 animate-in slide-in-from-top duration-500">
               <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                 <div className="flex items-center gap-6">
                   <div className="size-16 bg-lime-400 rounded-2xl flex items-center justify-center text-black animate-pulse">
                     <Timer size={32} strokeWidth={3} />
                   </div>
                   <div>
                     <div className="flex items-center gap-3 mb-2">
                       <div className="size-3 bg-red-500 rounded-full animate-pulse" />
                       <h3 className="text-2xl font-black italic uppercase tracking-tight text-lime-400">Treino em Andamento</h3>
                     </div>
                     <p className="text-zinc-400 font-bold">{activeSession.title}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-6">
                   <div className="text-center">
                     <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Tempo Decorrido</p>
                     <p className="text-4xl font-black italic text-lime-400 tracking-tighter">{Math.floor(activeSessionTime / 60)}:{String(activeSessionTime % 60).padStart(2, '0')}</p>
                   </div>
                   <button 
                     onClick={() => setView('active-workout')} 
                     className="bg-lime-400 hover:bg-lime-300 text-black px-8 py-4 rounded-2xl font-black uppercase text-sm flex items-center gap-3 shadow-xl transition-all hover:scale-105"
                   >
                     <Play size={20} fill="currentColor" />
                     Retornar
                   </button>
                 </div>
               </div>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatCard label="Treinos" value="12" trend="+2 essa semana" color="text-lime-400" icon={Dumbbell} />
             <StatCard label="Calorias" value="2450" trend="Na meta" color="text-orange-400" icon={Flame} />
             <StatCard label="Peso" value={biometrics.weight} trend="-1.2kg" color="text-blue-400" icon={Scale} />
           </div>
           <section>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-8">Treino de Hoje</h3>
              <WorkoutDetailCard workout={todayWorkout} onStart={() => handleStartWorkout(todayWorkout)} />
           </section>
        </div>
      );
    case 'workouts':
       const currentWorkout = INITIAL_WORKOUTS_WEEKLY[1][selectedDayWorkout];
       return (
         <>
           {/* Banner de treino ativo */}
           {activeSession && (
             <div className="bg-gradient-to-r from-lime-400/20 to-lime-500/10 border-2 border-lime-400/50 p-6 rounded-[2.5rem] shadow-xl shadow-lime-400/10 mb-8 animate-in slide-in-from-top duration-500">
               <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4">
                   <div className="size-3 bg-red-500 rounded-full animate-pulse" />
                   <div>
                     <h3 className="text-lg font-black italic uppercase tracking-tight text-lime-400">Treino Ativo: {activeSession.title}</h3>
                     <p className="text-2xl font-black italic text-lime-400">{Math.floor(activeSessionTime / 60)}:{String(activeSessionTime % 60).padStart(2, '0')}</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => setView('active-workout')} 
                   className="bg-lime-400 hover:bg-lime-300 text-black px-6 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 shadow-xl transition-all"
                 >
                   <Play size={16} fill="currentColor" />
                   Retornar
                 </button>
               </div>
             </div>
           )}
           <CalendarBase 
             title="Seus Treinos" 
             sub="Sua rotina semanal completa" 
             selectedDay={selectedDayWorkout} 
             setSelectedDay={setSelectedDayWorkout} 
             days={DAYS_SHORT}
           >
             <WorkoutDetailCard workout={currentWorkout} onStart={() => handleStartWorkout(currentWorkout)} />
           </CalendarBase>
         </>
       );
    case 'diet':
       const currentDiet = dietPlans[`${1}_${selectedDayDiet}`] || INITIAL_DIETS_WEEKLY[1][selectedDayDiet];
       return (
         <CalendarBase 
           title="Nutrição" 
           sub="Seu plano alimentar semanal" 
           selectedDay={selectedDayDiet} 
           setSelectedDay={setSelectedDayDiet} 
           days={DAYS_SHORT}
         >
           <NutritionView diet={currentDiet} dayIdx={selectedDayDiet} onGenerateDiet={(newDiet: any) => setDietPlans({...dietPlans, [`${1}_${selectedDayDiet}`]: newDiet})} />
         </CalendarBase>
       );
    case 'store':
       return <StoreView products={products} addToCart={addToCart} cartCount={cartCount} openCart={() => setIsCartOpen(true)} />;
    case 'evolution': return <EvolutionView />;
    case 'profile': return <ProfileView profileImage={profileImage} onImageChange={onImageChange} biometrics={biometrics} onBiometricsChange={onBiometricsChange} watchConnected={watchConnected} toggleWatch={toggleWatch} deviceName={deviceName} />;
    default: return null;
          }
        })()}
      </div>
    </>
  );
};

const ProfessorModule = ({ view, students, setView, templates, onAddTemplate, onRemoveTemplate }: any) => {
   const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
   const [subView, setSubView] = useState<string>('overview'); // overview, workouts, assessments, performance, schedule, chat
   const [showCreateWorkout, setShowCreateWorkout] = useState(false);
   const [showAssessment, setShowAssessment] = useState(false);
   const [showNewStudent, setShowNewStudent] = useState(false);
   
   // Form states
   const [newStudentForm, setNewStudentForm] = useState({ name: '', email: '', phone: '', plan: 'Básico Semanal', goal: 'Hipertrofia' });
   const [newTemplateForm, setNewTemplateForm] = useState({ title: '', category: '' });
   const [newScheduleForm, setNewScheduleForm] = useState({ type: 'Personal Training', date: '', time: '', notes: '' });
   const [newAssessmentForm, setNewAssessmentForm] = useState({ weight: '', bodyFat: '', muscle: '', water: '', chest: '', waist: '', arm: '', leg: '' });
   const [showNewTemplate, setShowNewTemplate] = useState(false);
   const [showNewSchedule, setShowNewSchedule] = useState(false);
   const [selectedDate, setSelectedDate] = useState(new Date());
   
   // Mock data para demonstração
   const [assessments, setAssessments] = useState<any[]>([
      { id: 1, studentId: 1, date: '2024-01-15', weight: 88.5, bodyFat: 18.2, muscle: 38.1, water: 58.3, chest: 105, waist: 88, arm: 38, leg: 62 },
      { id: 2, studentId: 1, date: '2024-02-01', weight: 87.2, bodyFat: 17.1, muscle: 39.2, water: 59.1, chest: 106, waist: 86, arm: 39, leg: 63 },
   ]);
   
   const [schedules, setSchedules] = useState<any[]>([
      { id: 1, studentId: 1, date: '2024-02-03', time: '14:00', type: 'Personal Training', status: 'confirmed' },
      { id: 2, studentId: 2, date: '2024-02-03', time: '16:00', type: 'Avaliação Física', status: 'pending' },
   ]);

   const [chatMessages, setChatMessages] = useState<any[]>([
      { id: 1, from: 'teacher', text: 'Como foi o treino de hoje?', time: '10:30' },
      { id: 2, from: 'student', text: 'Muito bom! Consegui aumentar a carga no supino 💪', time: '10:35' },
   ]);

   if (selectedStudent) {
      return (
         <div className="animate-in fade-in slide-in-from-right duration-500 space-y-8">
            <button onClick={() => { setSelectedStudent(null); setSubView('overview'); }} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-4"><ArrowLeft size={20}/><span className="text-xs font-black uppercase">Voltar</span></button>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
               <div className="flex items-center gap-6">
                  <img src={selectedStudent.avatar} className="size-24 rounded-3xl object-cover border-4 border-zinc-900"/>
                  <div>
                     <h2 className="text-4xl font-black italic uppercase">{selectedStudent.name}</h2>
                     <p className="text-zinc-500 font-bold">{selectedStudent.plan}</p>
                     <div className="flex gap-2 mt-2">
                        <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg font-black uppercase text-zinc-400">{selectedStudent.email}</span>
                        <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg font-black uppercase text-zinc-400">{selectedStudent.phone}</span>
                     </div>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setShowCreateWorkout(true)} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><Plus size={16}/> Prescrever Treino</button>
                  <button onClick={() => setShowAssessment(true)} className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><ClipboardList size={16}/> Nova Avaliação</button>
               </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl">
               {[
                  { id: 'overview', label: 'Visão Geral', icon: <LayoutDashboard size={16}/> },
                  { id: 'workouts', label: 'Treinos', icon: <Dumbbell size={16}/> },
                  { id: 'assessments', label: 'Avaliações', icon: <ClipboardList size={16}/> },
                  { id: 'performance', label: 'Performance', icon: <TrendingUp size={16}/> },
                  { id: 'schedule', label: 'Agenda', icon: <Calendar size={16}/> },
                  { id: 'chat', label: 'Chat', icon: <MessageCircle size={16}/> },
               ].map(tab => (
                  <button key={tab.id} onClick={() => setSubView(tab.id)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${subView === tab.id ? 'bg-lime-400 text-black' : 'text-zinc-500 hover:text-white'}`}>
                     {tab.icon} {tab.label}
                  </button>
               ))}
            </div>

            {subView === 'overview' && (
               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                     <StatCard label="Frequência" value={`${100 - (selectedStudent.daysAbsent * 10)}%`} color="text-lime-400" icon={Activity} />
                     <StatCard label="Progresso" value={`${selectedStudent.progress}%`} color="text-blue-400" icon={TrendingUp} />
                     <StatCard label="Treinos/Semana" value="4.2" color="text-orange-400" icon={Dumbbell} />
                     <StatCard label="Status" value={selectedStudent.risk ? "RISCO" : "OK"} color={selectedStudent.risk ? "text-red-500" : "text-green-500"} icon={AlertTriangle} />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3"><Scale size={20} className="text-blue-400"/> Última Avaliação</h3>
                        {assessments.length > 0 && (
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-zinc-950 p-4 rounded-2xl"><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Peso</p><p className="text-2xl font-black italic">{assessments[assessments.length - 1].weight}kg</p></div>
                              <div className="bg-zinc-950 p-4 rounded-2xl"><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">% Gordura</p><p className="text-2xl font-black italic text-orange-400">{assessments[assessments.length - 1].bodyFat}%</p></div>
                              <div className="bg-zinc-950 p-4 rounded-2xl"><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Massa Magra</p><p className="text-2xl font-black italic text-lime-400">{assessments[assessments.length - 1].muscle}kg</p></div>
                              <div className="bg-zinc-950 p-4 rounded-2xl"><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Hidratação</p><p className="text-2xl font-black italic text-blue-400">{assessments[assessments.length - 1].water}%</p></div>
                           </div>
                        )}
                     </div>

                     <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3"><Calendar size={20} className="text-lime-400"/> Próximas Sessões</h3>
                        <div className="space-y-3">
                           {schedules.filter(s => s.studentId === selectedStudent.id).map(schedule => (
                              <div key={schedule.id} className="bg-zinc-950 p-4 rounded-2xl flex justify-between items-center">
                                 <div>
                                    <p className="font-black text-sm">{schedule.type}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold">{schedule.date} às {schedule.time}</p>
                                 </div>
                                 <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${schedule.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>{schedule.status === 'confirmed' ? 'Confirmado' : 'Pendente'}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {subView === 'workouts' && (
               <div className="space-y-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                     <h3 className="text-2xl font-black italic uppercase mb-6">Treinos Prescritos</h3>
                     <div className="grid gap-4">
                        {DAYS_SHORT.map((day, idx) => {
                           const workout = INITIAL_WORKOUTS_WEEKLY[1][idx];
                           return (
                              <div key={idx} className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl">
                                 <div className="flex justify-between items-start mb-4">
                                    <div>
                                       <h4 className="font-black italic uppercase text-lg">{day} - {workout.title}</h4>
                                       <p className="text-[10px] text-zinc-500 font-bold uppercase">{workout.exercises?.length || 0} exercícios • {workout.duration}</p>
                                    </div>
                                    <button className="text-lime-400 hover:text-lime-300"><Pencil size={16}/></button>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>
            )}

            {subView === 'assessments' && (
               <div className="space-y-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-black italic uppercase">Histórico de Avaliações</h3>
                        <button onClick={() => setShowAssessment(true)} className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2">
                           <ClipboardList size={16}/> Nova Avaliação
                        </button>
                     </div>
                     <div className="space-y-4">
                        {assessments.map(assessment => (
                           <div key={assessment.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl">
                              <div className="flex justify-between items-start mb-6">
                                 <div>
                                    <h4 className="font-black text-lg">{new Date(assessment.date).toLocaleDateString('pt-BR')}</h4>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Avaliação Física Completa</p>
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <div><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Peso</p><p className="text-xl font-black italic">{assessment.weight}kg</p></div>
                                 <div><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">% Gordura</p><p className="text-xl font-black italic text-orange-400">{assessment.bodyFat}%</p></div>
                                 <div><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Massa Magra</p><p className="text-xl font-black italic text-lime-400">{assessment.muscle}kg</p></div>
                                 <div><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Hidratação</p><p className="text-xl font-black italic text-blue-400">{assessment.water}%</p></div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-4 gap-4 text-center">
                                 <div><p className="text-[9px] text-zinc-600 font-black uppercase mb-1">Peito</p><p className="text-sm font-black">{assessment.chest}cm</p></div>
                                 <div><p className="text-[9px] text-zinc-600 font-black uppercase mb-1">Cintura</p><p className="text-sm font-black">{assessment.waist}cm</p></div>
                                 <div><p className="text-[9px] text-zinc-600 font-black uppercase mb-1">Braço</p><p className="text-sm font-black">{assessment.arm}cm</p></div>
                                 <div><p className="text-[9px] text-zinc-600 font-black uppercase mb-1">Coxa</p><p className="text-sm font-black">{assessment.leg}cm</p></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {subView === 'performance' && (
               <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6">Evolução de Peso</h3>
                        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={assessments.map(a => ({ date: new Date(a.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}), peso: a.weight }))}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Line type="monotone" dataKey="peso" stroke="#D9FF00" strokeWidth={3} dot={{ fill: '#D9FF00', r: 5 }} /></LineChart></ResponsiveContainer></div>
                     </div>
                     <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6">Composição Corporal</h3>
                        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={assessments.map(a => ({ date: new Date(a.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}), gordura: a.bodyFat, musculo: a.muscle }))}><defs><linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient><linearGradient id="colorMuscle" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D9FF00" stopOpacity={0.3}/><stop offset="95%" stopColor="#D9FF00" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Area type="monotone" dataKey="gordura" stroke="#f97316" strokeWidth={2} fill="url(#colorFat)" /><Area type="monotone" dataKey="musculo" stroke="#D9FF00" strokeWidth={2} fill="url(#colorMuscle)" /></AreaChart></ResponsiveContainer></div>
                     </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Progressão de Carga (Supino Reto)</h3>
                     <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={LIFT_PROGRESS}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="week" stroke="#52525b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Bar dataKey="load" fill="#3b82f6" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div>
                  </div>
               </div>
            )}

            {subView === 'schedule' && (
               <div className="space-y-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-black italic uppercase flex items-center gap-3">
                           <Calendar size={24} className="text-lime-400"/>
                           Agendamentos
                        </h3>
                        <button onClick={() => setShowNewSchedule(true)} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2">
                           <Plus size={16}/> Novo Agendamento
                        </button>
                     </div>
                     <div className="grid gap-4">
                        {schedules.filter(s => s.studentId === selectedStudent.id).length > 0 ? (
                           schedules.filter(s => s.studentId === selectedStudent.id).map(schedule => (
                              <div key={schedule.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex justify-between items-center hover:border-lime-400/30 transition-all">
                                 <div className="flex items-center gap-6">
                                    <div className="size-16 bg-lime-400/10 text-lime-400 rounded-2xl flex items-center justify-center">
                                       <Calendar size={24}/>
                                    </div>
                                    <div>
                                       <h4 className="font-black text-lg">{schedule.type}</h4>
                                       <p className="text-[10px] text-zinc-500 font-bold">{schedule.date} às {schedule.time}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${schedule.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                       {schedule.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                                    </span>
                                    <div className="flex gap-2">
                                       <button className="size-10 bg-green-500/20 text-green-500 rounded-xl flex items-center justify-center hover:bg-green-500/30 transition-all">
                                          <Check size={14}/>
                                       </button>
                                       <button className="size-10 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500/30 transition-all">
                                          <X size={14}/>
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="bg-zinc-950 border border-zinc-800 border-dashed p-12 rounded-2xl text-center">
                              <div className="size-16 bg-zinc-900 text-zinc-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                 <Calendar size={24}/>
                              </div>
                              <h4 className="font-black text-lg text-zinc-500 mb-2">Nenhum agendamento</h4>
                              <p className="text-xs text-zinc-600">Clique em "Novo Agendamento" para criar a primeira sessão</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {subView === 'chat' && (
               <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden" style={{height: '500px'}}>
                  <div className="h-full flex flex-col">
                     <div className="p-6 border-b border-zinc-800 flex items-center gap-4">
                        <div className="size-12 bg-lime-400/10 text-lime-400 rounded-xl flex items-center justify-center"><MessageCircle size={20}/></div>
                        <div><h4 className="font-black italic uppercase">Chat com {selectedStudent.name}</h4><p className="text-[10px] text-zinc-500 font-bold">Online agora</p></div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {chatMessages.map(msg => (
                           <div key={msg.id} className={`flex ${msg.from === 'teacher' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] p-4 rounded-2xl ${msg.from === 'teacher' ? 'bg-lime-400 text-black rounded-br-none' : 'bg-zinc-950 border border-zinc-800 rounded-bl-none'}`}>
                                 <p className="text-sm font-medium">{msg.text}</p>
                                 <p className="text-[9px] mt-1 opacity-60">{msg.time}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                     <div className="p-4 border-t border-zinc-800 flex gap-2">
                        <input placeholder="Digite sua mensagem..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-lime-400"/>
                        <button className="size-12 bg-lime-400 text-black rounded-xl flex items-center justify-center hover:scale-105 transition-all"><Send size={20}/></button>
                     </div>
                  </div>
               </div>
            )}

            {/* Modal Criar Treino */}
            {showCreateWorkout && (
               <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowCreateWorkout(false)}>
                  <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-[3rem] p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-3xl font-black italic uppercase">Prescrever Treino</h3>
                        <button onClick={() => setShowCreateWorkout(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                     </div>
                     <div className="space-y-6">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Dia da Semana</label><select className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none appearance-none">{DAYS_SHORT.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}</select></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Título do Treino</label><input placeholder="Ex: Push Day - Peito e Tríceps" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Categoria</label><input placeholder="Ex: A" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl">
                           <div className="flex justify-between items-center mb-4">
                              <h4 className="text-sm font-black uppercase">Exercícios</h4>
                              <button className="bg-lime-400 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase"><Plus size={14}/> Adicionar</button>
                           </div>
                           <p className="text-xs text-zinc-500 italic">Nenhum exercício adicionado ainda</p>
                        </div>
                        <button className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Salvar Treino</button>
                     </div>
                  </div>
               </div>
            )}

            {/* Modal Nova Avaliação */}
            {showAssessment && (
               <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowAssessment(false)}>
                  <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-[3rem] p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-3xl font-black italic uppercase">Nova Avaliação Física</h3>
                        <button onClick={() => setShowAssessment(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                     </div>
                     <form onSubmit={(e) => { e.preventDefault(); alert('Avaliação salva com sucesso!\n\nPeso: ' + newAssessmentForm.weight + 'kg\n% Gordura: ' + newAssessmentForm.bodyFat + '%'); setNewAssessmentForm({ weight: '', bodyFat: '', muscle: '', water: '', chest: '', waist: '', arm: '', leg: '' }); setShowAssessment(false); }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Peso (kg)</label><input required type="number" step="0.1" value={newAssessmentForm.weight} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, weight: e.target.value})} placeholder="Ex: 84.5" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">% Gordura</label><input required type="number" step="0.1" value={newAssessmentForm.bodyFat} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, bodyFat: e.target.value})} placeholder="Ex: 18.2" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Massa Magra (kg)</label><input type="number" step="0.1" value={newAssessmentForm.muscle} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, muscle: e.target.value})} placeholder="Ex: 38.1" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Hidratação (%)</label><input type="number" step="0.1" value={newAssessmentForm.water} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, water: e.target.value})} placeholder="Ex: 58.3" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Peito (cm)</label><input type="number" value={newAssessmentForm.chest} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, chest: e.target.value})} placeholder="Ex: 105" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Cintura (cm)</label><input type="number" value={newAssessmentForm.waist} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, waist: e.target.value})} placeholder="Ex: 88" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Braço (cm)</label><input type="number" value={newAssessmentForm.arm} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, arm: e.target.value})} placeholder="Ex: 38" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Coxa (cm)</label><input type="number" value={newAssessmentForm.leg} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, leg: e.target.value})} placeholder="Ex: 62" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div className="col-span-2"><button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Salvar Avaliação</button></div>
                     </form>
                  </div>
               </div>
            )}

            {/* Modal Novo Agendamento */}
            {showNewSchedule && (
               <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowNewSchedule(false)}>
                  <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[3rem] p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-3xl font-black italic uppercase">Novo Agendamento</h3>
                        <button onClick={() => setShowNewSchedule(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                     </div>
                     <form onSubmit={(e) => { e.preventDefault(); alert('Agendamento criado com sucesso!\n\nTipo: ' + newScheduleForm.type + '\nData: ' + newScheduleForm.date + '\nHorário: ' + newScheduleForm.time); setNewScheduleForm({ type: 'Personal Training', date: '', time: '', notes: '' }); setShowNewSchedule(false); }} className="space-y-6">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Tipo de Sessão</label><select value={newScheduleForm.type} onChange={(e) => setNewScheduleForm({...newScheduleForm, type: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"><option>Personal Training</option><option>Avaliação Física</option><option>Consulta Nutricional</option></select></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Data</label><input required type="date" value={newScheduleForm.date} onChange={(e) => setNewScheduleForm({...newScheduleForm, date: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Horário</label><input required type="time" value={newScheduleForm.time} onChange={(e) => setNewScheduleForm({...newScheduleForm, time: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Observações</label><textarea rows={3} value={newScheduleForm.notes} onChange={(e) => setNewScheduleForm({...newScheduleForm, notes: e.target.value})} placeholder="Anotações sobre a sessão..." className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none resize-none"/></div>
                        <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Criar Agendamento</button>
                     </form>
                  </div>
               </div>
            )}
         </div>
      );
   }

   // Modais globais do módulo professor (não dependem de aluno selecionado)
   const renderProfessorModals = () => (
      <>
         {/* Modal Novo Aluno */}
         {showNewStudent && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowNewStudent(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[3rem] p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-black italic uppercase">Novo Aluno</h3>
                     <button onClick={() => setShowNewStudent(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); alert('Aluno cadastrado com sucesso!\n\nNome: ' + newStudentForm.name + '\nEmail: ' + newStudentForm.email + '\nPlano: ' + newStudentForm.plan); setNewStudentForm({ name: '', email: '', phone: '', plan: 'Básico Semanal', goal: 'Hipertrofia' }); setShowNewStudent(false); }} className="space-y-6">
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Nome Completo</label><input required value={newStudentForm.name} onChange={(e) => setNewStudentForm({...newStudentForm, name: e.target.value})} placeholder="Ex: João Silva" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Email</label><input required type="email" value={newStudentForm.email} onChange={(e) => setNewStudentForm({...newStudentForm, email: e.target.value})} placeholder="joao@email.com" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Telefone</label><input value={newStudentForm.phone} onChange={(e) => setNewStudentForm({...newStudentForm, phone: e.target.value})} placeholder="(11) 99999-9999" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     </div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Plano</label><select value={newStudentForm.plan} onChange={(e) => setNewStudentForm({...newStudentForm, plan: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"><option>Básico Semanal</option><option>Trimestral</option><option>VIP Performance</option></select></div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Objetivo</label><select value={newStudentForm.goal} onChange={(e) => setNewStudentForm({...newStudentForm, goal: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"><option>Hipertrofia</option><option>Emagrecimento</option><option>Condicionamento</option><option>Reabilitação</option></select></div>
                     <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Cadastrar Aluno</button>
                  </form>
               </div>
            </div>
         )}

         {/* Modal Novo Modelo */}
         {showNewTemplate && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowNewTemplate(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-[3rem] p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-black italic uppercase">Novo Modelo de Treino</h3>
                     <button onClick={() => setShowNewTemplate(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); if (onAddTemplate) onAddTemplate({ id: 't' + Date.now(), title: newTemplateForm.title, category: newTemplateForm.category, exercises: [] }); alert('Modelo salvo com sucesso!\n\nTítulo: ' + newTemplateForm.title + '\nCategoria: ' + newTemplateForm.category); setNewTemplateForm({ title: '', category: '' }); setShowNewTemplate(false); }} className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Nome do Modelo</label><input required value={newTemplateForm.title} onChange={(e) => setNewTemplateForm({...newTemplateForm, title: e.target.value})} placeholder="Ex: Hipertrofia Base - Peito/Tríceps" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Categoria</label><input required value={newTemplateForm.category} onChange={(e) => setNewTemplateForm({...newTemplateForm, category: e.target.value})} placeholder="Ex: A, B, Push, Pull..." className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     </div>
                     <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                           <h4 className="text-sm font-black uppercase">Exercícios do Modelo</h4>
                           <button type="button" className="bg-lime-400 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase"><Plus size={14}/> Adicionar Exercício</button>
                        </div>
                        <p className="text-xs text-zinc-500 italic">Nenhum exercício adicionado ainda</p>
                     </div>
                     <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Salvar Modelo</button>
                  </form>
               </div>
            </div>
         )}
      </>
   );

   switch(view) {
      case 'dashboard':
         return (
            <div className="space-y-10 animate-in fade-in duration-700">
               <header><h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Painel do Treinador</h1><p className="text-zinc-500 font-medium">Gerencie seus alunos e treinos</p></header>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard label="Total Alunos" value={students.length} color="text-white" icon={Users} />
                  <StatCard label="Em Risco" value={students.filter((s: Student) => s.risk).length} color="text-red-500" icon={AlertTriangle} />
                  <StatCard label="Treinos Hoje" value="18" color="text-lime-400" icon={Dumbbell} />
                  <StatCard label="Avaliações Mês" value="12" color="text-blue-400" icon={ClipboardList} />
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3"><Users size={20} className="text-lime-400"/> Alunos Recentes</h3>
                     <div className="space-y-3">
                        {students.slice(0, 5).map(s => (
                           <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-lime-400/50 transition-all">
                              <div className="flex items-center gap-3">
                                 <img src={s.avatar} className="size-10 rounded-xl"/>
                                 <div><h4 className="font-bold text-sm">{s.name}</h4><p className="text-[9px] text-zinc-500 font-bold">{s.lastVisit}</p></div>
                              </div>
                              <ChevronRight size={16} className="text-zinc-600"/>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3"><Calendar size={20} className="text-blue-400"/> Agenda de Hoje</h3>
                     <div className="space-y-3">
                        {schedules.map(s => (
                           <div key={s.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
                              <div className="flex justify-between items-start mb-2">
                                 <div><h4 className="font-bold text-sm">{students.find(st => st.id === s.studentId)?.name}</h4><p className="text-[9px] text-zinc-500 font-bold">{s.type}</p></div>
                                 <span className="text-xs font-black text-lime-400">{s.time}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         );
      case 'students':
         return (
            <>
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex justify-between items-end">
                  <div><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Meus Alunos</h2><p className="text-zinc-500 font-medium">{students.length} alunos ativos</p></div>
                  <button onClick={() => setShowNewStudent(true)} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><UserPlus size={16}/> Novo Aluno</button>
               </header>
               <div className="grid gap-4">
                  {students.map((s: Student) => (
                     <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between cursor-pointer hover:border-lime-400/50 transition-all group">
                        <div className="flex items-center gap-4">
                           <img src={s.avatar} className="size-14 rounded-2xl object-cover"/>
                           <div>
                              <h4 className="font-black italic uppercase text-lg group-hover:text-lime-400 transition-colors">{s.name}</h4>
                              <p className="text-[10px] font-bold text-zinc-500">{s.lastVisit}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right mr-4">
                              <p className="text-[10px] text-zinc-600 font-black uppercase">Progresso</p>
                              <p className="text-xl font-black italic text-lime-400">{s.progress}%</p>
                           </div>
                           {s.risk && <span className="px-3 py-1 bg-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-lg">⚠️ Risco</span>}
                           <ChevronRight className="text-zinc-600 group-hover:text-lime-400 transition-colors"/>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
            {renderProfessorModals()}
            </>
         );
      case 'templates':
         return (
            <>
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex justify-between items-end">
                  <div><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Modelos de Treino</h2><p className="text-zinc-500 font-medium">Templates reutilizáveis</p></div>
                  <button onClick={() => setShowNewTemplate(true)} className="bg-lime-400 text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><Plus size={16}/> Novo Modelo</button>
               </header>
               <div className="grid gap-4">
                  {templates.map((t: WorkoutTemplate) => (
                     <div key={t.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex justify-between items-center group hover:border-lime-400/30 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="size-16 bg-lime-400/10 text-lime-400 rounded-2xl flex items-center justify-center"><Dumbbell size={24}/></div>
                           <div>
                              <h4 className="font-black italic uppercase text-lg">{t.title}</h4>
                              <p className="text-[10px] text-zinc-500 font-bold">{t.exercises.length} Exercícios • Série {t.category}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button className="size-10 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-600 hover:text-lime-400 transition-colors"><Copy size={16}/></button>
                           <button onClick={() => onRemoveTemplate(t.id)} className="size-10 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
            {renderProfessorModals()}
            </>
         );
      case 'schedule':
         return (
            <>
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex justify-between items-end">
                  <div><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Agenda de Atendimentos</h2><p className="text-zinc-500 font-medium">Gerencie suas sessões</p></div>
                  <button onClick={() => setShowNewSchedule(true)} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><Plus size={16}/> Novo Agendamento</button>
               </header>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {schedules.map(schedule => (
                     <div key={schedule.id} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] hover:border-lime-400/30 transition-all">
                        <div className="flex items-start gap-6 mb-6">
                           <div className="size-20 bg-lime-400/10 text-lime-400 rounded-3xl flex items-center justify-center shrink-0">
                              <Calendar size={32}/>
                           </div>
                           <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                 <div>
                                    <h4 className="font-black text-2xl mb-1">{schedule.type}</h4>
                                    <p className="text-sm text-zinc-500 font-bold">{schedule.date} às {schedule.time}</p>
                                 </div>
                                 <span className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase shrink-0 ${schedule.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                    {schedule.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                                 </span>
                              </div>
                              <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                                 <img src={students.find(s => s.id === schedule.studentId)?.avatar} className="size-12 rounded-xl object-cover"/>
                                 <div>
                                    <p className="font-black text-sm">{students.find(s => s.id === schedule.studentId)?.name}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold">{students.find(s => s.id === schedule.studentId)?.plan}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button className="flex-1 bg-green-500/20 text-green-500 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-green-500/30 transition-all flex items-center justify-center gap-2">
                              <Check size={16}/> Confirmar
                           </button>
                           <button className="flex-1 bg-red-500/20 text-red-500 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500/30 transition-all flex items-center justify-center gap-2">
                              <X size={16}/> Cancelar
                           </button>
                           <button className="bg-blue-500/20 text-blue-500 py-3 px-5 rounded-2xl hover:bg-blue-500/30 transition-all flex items-center justify-center">
                              <Pencil size={16}/>
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
            {renderProfessorModals()}
            </>
         );
      case 'assessments':
         return (
            <>
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex justify-between items-end">
                  <div><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Avaliações Físicas</h2><p className="text-zinc-500 font-medium">Histórico completo de avaliações</p></div>
                  <button onClick={() => setShowAssessment(true)} className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><ClipboardList size={16}/> Nova Avaliação</button>
               </header>
               <div className="grid gap-6">
                  {students.map((s: Student) => (
                     <div key={s.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-4">
                              <img src={s.avatar} className="size-14 rounded-2xl object-cover"/>
                              <div>
                                 <h4 className="font-black italic uppercase text-lg">{s.name}</h4>
                                 <p className="text-[10px] text-zinc-500 font-bold">Última avaliação: 01/02/2026</p>
                              </div>
                           </div>
                           <button onClick={() => setSelectedStudent(s)} className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px]">Ver Histórico</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                           <div className="bg-zinc-950 p-4 rounded-2xl text-center"><p className="text-[9px] text-zinc-600 font-black uppercase">Peso</p><p className="text-lg font-black italic">87.2kg</p></div>
                           <div className="bg-zinc-950 p-4 rounded-2xl text-center"><p className="text-[9px] text-zinc-600 font-black uppercase">% Gordura</p><p className="text-lg font-black italic text-orange-400">17.1%</p></div>
                           <div className="bg-zinc-950 p-4 rounded-2xl text-center"><p className="text-[9px] text-zinc-600 font-black uppercase">Massa Magra</p><p className="text-lg font-black italic text-lime-400">39.2kg</p></div>
                           <div className="bg-zinc-950 p-4 rounded-2xl text-center"><p className="text-[9px] text-zinc-600 font-black uppercase">Evolução</p><p className="text-lg font-black italic text-green-500">+2.3%</p></div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
            {renderProfessorModals()}
            </>
         );
      default: return null;
   }
}

const NutriModule = ({ view, students, setView }: any) => {
   const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
   const [subView, setSubView] = useState<string>('overview');
   const [showCreateDiet, setShowCreateDiet] = useState(false);
   const [showCompositionAnalysis, setShowCompositionAnalysis] = useState(false);
   
   // Form states
   const [dietForm, setDietForm] = useState({ calories: '', type: 'Equilibrada', restrictions: '' });
   const [compositionForm, setCompositionForm] = useState({ weight: '', bodyFat: '', muscle: '', water: '' });
   
   const [mealDiary, setMealDiary] = useState<any[]>([
      { id: 1, studentId: 1, meal: 'Café da Manhã', time: '08:15', img: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400', status: 'approved', feedback: 'Ótima escolha! Boa quantidade de proteínas.' },
      { id: 2, studentId: 1, meal: 'Almoço', time: '13:30', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', status: 'warning', feedback: 'Aumentar a porção de vegetais na próxima.' },
      { id: 3, studentId: 1, meal: 'Jantar', time: '19:45', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', status: 'pending', feedback: '' },
   ]);

   const [compositionHistory, setCompositionHistory] = useState<any[]>([
      { date: '01/01', weight: 88.5, bodyFat: 18.2, muscleMass: 38.1, water: 58.3 },
      { date: '15/01', weight: 87.8, bodyFat: 17.8, muscleMass: 38.5, water: 58.8 },
      { date: '01/02', weight: 87.2, bodyFat: 17.1, muscleMass: 39.2, water: 59.1 },
   ]);

   const [educationalContent, setEducationalContent] = useState([
      { id: 1, title: 'Proteína: Quanto Consumir?', category: 'Nutrição', duration: '5 min', icon: <BookOpen /> },
      { id: 2, title: 'Timing de Carboidratos', category: 'Performance', duration: '8 min', icon: <Zap /> },
      { id: 3, title: 'Hidratação no Treino', category: 'Básico', duration: '4 min', icon: <Droplets /> },
   ]);

   if (selectedStudent) {
      return (
         <div className="animate-in fade-in slide-in-from-right duration-500 space-y-8">
            <button onClick={() => { setSelectedStudent(null); setSubView('overview'); }} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-4"><ArrowLeft size={20}/><span className="text-xs font-black uppercase">Voltar</span></button>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
               <div className="flex items-center gap-6">
                  <img src={selectedStudent.avatar} className="size-24 rounded-3xl object-cover border-4 border-zinc-900"/>
                  <div>
                     <h2 className="text-4xl font-black italic uppercase">{selectedStudent.name}</h2>
                     <p className="text-zinc-500 font-bold">Plano Nutricional Personalizado</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setShowCreateDiet(true)} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><Plus size={16}/> Nova Dieta</button>
                  <button onClick={() => setShowCompositionAnalysis(true)} className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><Scale size={16}/> Análise</button>
               </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl">
               {[
                  { id: 'overview', label: 'Visão Geral', icon: <LayoutDashboard size={16}/> },
                  { id: 'diet', label: 'Plano Alimentar', icon: <Utensils size={16}/> },
                  { id: 'diary', label: 'Diário Visual', icon: <Camera size={16}/> },
                  { id: 'composition', label: 'Composição', icon: <Scale size={16}/> },
                  { id: 'education', label: 'Educação', icon: <BookOpen size={16}/> },
               ].map(tab => (
                  <button key={tab.id} onClick={() => setSubView(tab.id)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${subView === tab.id ? 'bg-lime-400 text-black' : 'text-zinc-500 hover:text-white'}`}>
                     {tab.icon} {tab.label}
                  </button>
               ))}
            </div>

            {subView === 'overview' && (
               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                     <StatCard label="Peso Atual" value="87.2kg" color="text-lime-400" icon={Scale} trend="-1.3kg" />
                     <StatCard label="% Gordura" value="17.1%" color="text-orange-400" icon={Flame} trend="-1.1%" />
                     <StatCard label="Aderência" value="85%" color="text-blue-400" icon={Target} />
                     <StatCard label="Meta Kcal" value="2800" color="text-purple-400" icon={Zap} />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3"><TrendingUp size={20} className="text-lime-400"/> Evolução de Peso</h3>
                        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={compositionHistory}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Line type="monotone" dataKey="weight" stroke="#D9FF00" strokeWidth={3} dot={{ fill: '#D9FF00', r: 5 }} /></LineChart></ResponsiveContainer></div>
                     </div>
                     <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3"><Camera size={20} className="text-blue-400"/> Refeições Recentes</h3>
                        <div className="space-y-3">
                           {mealDiary.slice(0, 3).map(meal => (
                              <div key={meal.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex gap-4">
                                 <img src={meal.img} className="size-16 rounded-xl object-cover"/>
                                 <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                       <h4 className="font-bold text-sm">{meal.meal}</h4>
                                       <span className={`size-3 rounded-full ${meal.status === 'approved' ? 'bg-green-500' : meal.status === 'warning' ? 'bg-orange-500' : 'bg-zinc-600'}`}/>
                                    </div>
                                    <p className="text-[9px] text-zinc-500 font-bold">{meal.time}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {subView === 'diet' && (
               <div className="space-y-6">
                  {DAYS_SHORT.map((day, idx) => {
                     const diet = INITIAL_DIETS_WEEKLY[1][idx];
                     return (
                        <div key={idx} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <h3 className="text-2xl font-black italic uppercase">{day} - {diet.title}</h3>
                                 <p className="text-zinc-500 font-bold">{diet.kcal} kcal • {diet.meals?.length || 0} refeições</p>
                              </div>
                              <button className="text-lime-400 hover:text-lime-300"><Pencil size={16}/></button>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {diet.meals?.slice(0, 3).map((meal: any, i: number) => (
                                 <div key={i} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                       <div className="size-8 bg-lime-400/10 text-lime-400 rounded-lg flex items-center justify-center">{meal.icon}</div>
                                       <div className="flex-1">
                                          <p className="font-black text-xs uppercase">{meal.n}</p>
                                          <p className="text-[9px] text-zinc-500 font-bold">{meal.kcal} kcal</p>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}

            {subView === 'diary' && (
               <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                  <h3 className="text-2xl font-black italic uppercase mb-6">Diário Alimentar Visual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {mealDiary.map(meal => (
                        <div key={meal.id} className={`bg-zinc-950 border-2 rounded-2xl overflow-hidden transition-all ${meal.status === 'approved' ? 'border-green-500/30' : meal.status === 'warning' ? 'border-orange-500/30' : 'border-zinc-800'}`}>
                           <img src={meal.img} className="w-full aspect-video object-cover"/>
                           <div className="p-6">
                              <div className="flex justify-between items-start mb-3">
                                 <div>
                                    <h4 className="font-black text-lg">{meal.meal}</h4>
                                    <p className="text-[10px] text-zinc-500 font-bold">{meal.time}</p>
                                 </div>
                                 <div className="flex gap-2">
                                    <button className="size-10 bg-green-500/20 text-green-500 rounded-xl hover:bg-green-500/30"><Check size={16}/></button>
                                    <button className="size-10 bg-orange-500/20 text-orange-500 rounded-xl hover:bg-orange-500/30"><AlertTriangle size={16}/></button>
                                 </div>
                              </div>
                              {meal.feedback && (
                                 <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                                    <p className="text-xs text-zinc-300 italic">{meal.feedback}</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {subView === 'composition' && (
               <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6">% Gordura Corporal</h3>
                        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={compositionHistory}><defs><linearGradient id="colorFat2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Area type="monotone" dataKey="bodyFat" stroke="#f97316" strokeWidth={3} fill="url(#colorFat2)" /></AreaChart></ResponsiveContainer></div>
                     </div>
                     <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6">Massa Magra</h3>
                        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={compositionHistory}><defs><linearGradient id="colorMuscle2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D9FF00" stopOpacity={0.3}/><stop offset="95%" stopColor="#D9FF00" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Area type="monotone" dataKey="muscleMass" stroke="#D9FF00" strokeWidth={3} fill="url(#colorMuscle2)" /></AreaChart></ResponsiveContainer></div>
                     </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Última Análise</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-zinc-950 p-6 rounded-2xl text-center"><p className="text-[10px] text-zinc-600 font-black uppercase mb-2">Peso</p><p className="text-3xl font-black italic text-white">{compositionHistory[compositionHistory.length - 1].weight}kg</p></div>
                        <div className="bg-zinc-950 p-6 rounded-2xl text-center"><p className="text-[10px] text-zinc-600 font-black uppercase mb-2">% Gordura</p><p className="text-3xl font-black italic text-orange-400">{compositionHistory[compositionHistory.length - 1].bodyFat}%</p></div>
                        <div className="bg-zinc-950 p-6 rounded-2xl text-center"><p className="text-[10px] text-zinc-600 font-black uppercase mb-2">Massa Magra</p><p className="text-3xl font-black italic text-lime-400">{compositionHistory[compositionHistory.length - 1].muscleMass}kg</p></div>
                        <div className="bg-zinc-950 p-6 rounded-2xl text-center"><p className="text-[10px] text-zinc-600 font-black uppercase mb-2">Hidratação</p><p className="text-3xl font-black italic text-blue-400">{compositionHistory[compositionHistory.length - 1].water}%</p></div>
                     </div>
                  </div>
               </div>
            )}

            {subView === 'education' && (
               <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                  <h3 className="text-2xl font-black italic uppercase mb-6">Conteúdos Educacionais</h3>
                  <div className="grid gap-4">
                     {educationalContent.map(content => (
                        <div key={content.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between hover:border-lime-400/30 transition-all cursor-pointer group">
                           <div className="flex items-center gap-6">
                              <div className="size-16 bg-lime-400/10 text-lime-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">{content.icon}</div>
                              <div>
                                 <h4 className="font-black text-lg group-hover:text-lime-400 transition-colors">{content.title}</h4>
                                 <div className="flex gap-3 mt-1">
                                    <span className="text-[10px] bg-zinc-900 px-3 py-1 rounded-lg font-black uppercase text-zinc-500">{content.category}</span>
                                    <span className="text-[10px] bg-zinc-900 px-3 py-1 rounded-lg font-black uppercase text-zinc-500">{content.duration}</span>
                                 </div>
                              </div>
                           </div>
                           <ChevronRight size={20} className="text-zinc-600 group-hover:text-lime-400 transition-colors"/>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* Modal Criar Dieta */}
            {showCreateDiet && (
               <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowCreateDiet(false)}>
                  <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[3rem] p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-3xl font-black italic uppercase">Novo Plano Alimentar</h3>
                        <button onClick={() => setShowCreateDiet(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                     </div>
                     <form onSubmit={(e) => { e.preventDefault(); alert('Plano alimentar gerado com sucesso!\n\nCalorias: ' + dietForm.calories + ' kcal\nTipo: ' + dietForm.type); setDietForm({ calories: '', type: 'Equilibrada', restrictions: '' }); setShowCreateDiet(false); }} className="space-y-6">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Meta Calórica Diária</label><input required type="number" value={dietForm.calories} onChange={(e) => setDietForm({...dietForm, calories: e.target.value})} placeholder="Ex: 2800" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Tipo de Dieta</label><select value={dietForm.type} onChange={(e) => setDietForm({...dietForm, type: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none appearance-none"><option>Equilibrada</option><option>Low Carb</option><option>Cetogênica</option><option>Vegetariana</option><option>Vegana</option><option>Bulking (Ganho de Massa)</option><option>Cutting (Definição)</option></select></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Restrições Alimentares</label><input value={dietForm.restrictions} onChange={(e) => setDietForm({...dietForm, restrictions: e.target.value})} placeholder="Ex: Sem lactose, sem glúten..." className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"><Sparkles size={20}/> Gerar com AI</button>
                     </form>
                  </div>
               </div>
            )}

            {/* Modal Análise de Composição */}
            {showCompositionAnalysis && (
               <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowCompositionAnalysis(false)}>
                  <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[3rem] p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-3xl font-black italic uppercase">Nova Análise de Composição</h3>
                        <button onClick={() => setShowCompositionAnalysis(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Peso (kg)</label><input required type="number" step="0.1" value={compositionForm.weight} onChange={(e) => setCompositionForm({...compositionForm, weight: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">% Gordura</label><input required type="number" step="0.1" value={compositionForm.bodyFat} onChange={(e) => setCompositionForm({...compositionForm, bodyFat: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Massa Magra (kg)</label><input type="number" step="0.1" value={compositionForm.muscle} onChange={(e) => setCompositionForm({...compositionForm, muscle: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">% Hidratação</label><input type="number" step="0.1" value={compositionForm.water} onChange={(e) => setCompositionForm({...compositionForm, water: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     </div>
                     <button onClick={(e) => { e.preventDefault(); alert('Análise salva com sucesso!\n\nPeso: ' + compositionForm.weight + 'kg\n% Gordura: ' + compositionForm.bodyFat + '%'); setCompositionForm({ weight: '', bodyFat: '', muscle: '', water: '' }); setShowCompositionAnalysis(false); }} className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all mt-8">Salvar Análise</button>
                  </div>
               </div>
            )}
         </div>
      );
   }

   switch(view) {
      case 'dashboard':
         return (
            <div className="space-y-10 animate-in fade-in duration-700">
               <header><h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Painel Nutricional</h1><p className="text-zinc-500 font-medium">Gestão completa de nutrição</p></header>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard label="Pacientes Ativos" value={students.length} color="text-white" icon={Users} />
                  <StatCard label="Dietas Criadas" value="24" color="text-lime-400" icon={Utensils} />
                  <StatCard label="Aderência Média" value="82%" color="text-blue-400" icon={Target} />
                  <StatCard label="Refeições Hoje" value="38" color="text-orange-400" icon={Camera} />
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Pacientes Recentes</h3>
                     <div className="space-y-3">
                        {students.slice(0, 5).map(s => (
                           <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-lime-400/50 transition-all">
                              <div className="flex items-center gap-3">
                                 <img src={s.avatar} className="size-10 rounded-xl"/>
                                 <div><h4 className="font-bold text-sm">{s.name}</h4><p className="text-[9px] text-zinc-500 font-bold">Aderência: 85%</p></div>
                              </div>
                              <ChevronRight size={16} className="text-zinc-600"/>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Refeições Pendentes</h3>
                     <div className="space-y-3">
                        {mealDiary.filter(m => m.status === 'pending').map(meal => (
                           <div key={meal.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex gap-4">
                              <img src={meal.img} className="size-16 rounded-xl object-cover"/>
                              <div className="flex-1">
                                 <h4 className="font-bold text-sm">{students.find(s => s.id === meal.studentId)?.name}</h4>
                                 <p className="text-[9px] text-zinc-500 font-bold">{meal.meal} • {meal.time}</p>
                              </div>
                              <button className="text-lime-400 hover:text-lime-300"><Eye size={16}/></button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         );
      case 'students':
         return (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex justify-between items-end">
                  <div><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Meus Pacientes</h2><p className="text-zinc-500 font-medium">{students.length} pacientes ativos</p></div>
                  <button className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><UserPlus size={16}/> Novo Paciente</button>
               </header>
               <div className="grid gap-4">
                  {students.map((s: Student) => (
                     <div key={s.id} onClick={() => setSelectedStudent(s)} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between cursor-pointer hover:border-lime-400/50 transition-all group">
                        <div className="flex items-center gap-4">
                           <img src={s.avatar} className="size-14 rounded-2xl object-cover"/>
                           <div>
                              <h4 className="font-black italic uppercase text-lg group-hover:text-lime-400 transition-colors">{s.name}</h4>
                              <p className="text-[10px] font-bold text-zinc-500">Meta: 2800 kcal • Aderência: 85%</p>
                           </div>
                        </div>
                        <ChevronRight className="text-zinc-600 group-hover:text-lime-400 transition-colors"/>
                     </div>
                  ))}
               </div>
            </div>
         );
      case 'diets':
         return (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex justify-between items-end">
                  <div><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Planos Alimentares</h2><p className="text-zinc-500 font-medium">Gerencie dietas personalizadas</p></div>
                  <button className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><Plus size={16}/> Nova Dieta</button>
               </header>
               <div className="grid gap-6">
                  {students.map((s: Student) => (
                     <div key={s.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-4">
                              <img src={s.avatar} className="size-14 rounded-2xl object-cover"/>
                              <div>
                                 <h4 className="font-black italic uppercase text-lg">{s.name}</h4>
                                 <p className="text-[10px] text-zinc-500 font-bold">Meta: 2800 kcal/dia</p>
                              </div>
                           </div>
                           <button onClick={() => setSelectedStudent(s)} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px]">Gerenciar</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                           <div className="bg-zinc-950 p-4 rounded-2xl text-center"><p className="text-[9px] text-zinc-600 font-black uppercase">Proteína</p><p className="text-lg font-black italic text-orange-400">180g</p></div>
                           <div className="bg-zinc-950 p-4 rounded-2xl text-center"><p className="text-[9px] text-zinc-600 font-black uppercase">Carbo</p><p className="text-lg font-black italic text-blue-400">320g</p></div>
                           <div className="bg-zinc-950 p-4 rounded-2xl text-center"><p className="text-[9px] text-zinc-600 font-black uppercase">Gordura</p><p className="text-lg font-black italic text-lime-400">70g</p></div>
                           <div className="bg-zinc-950 p-4 rounded-2xl text-center"><p className="text-[9px] text-zinc-600 font-black uppercase">Aderência</p><p className="text-lg font-black italic text-purple-400">85%</p></div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         );
      case 'diary':
         return (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Diário Visual de Refeições</h2><p className="text-zinc-500 font-medium">Avalie fotos das refeições dos pacientes</p></header>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mealDiary.map(meal => (
                     <div key={meal.id} className={`bg-zinc-900 border-2 rounded-2xl overflow-hidden transition-all cursor-pointer hover:scale-105 ${meal.status === 'approved' ? 'border-green-500/30' : meal.status === 'warning' ? 'border-orange-500/30' : 'border-zinc-800 hover:border-lime-400/30'}`}>
                        <img src={meal.img} className="w-full aspect-square object-cover"/>
                        <div className="p-4">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <h4 className="font-black text-sm">{students.find(s => s.id === meal.studentId)?.name}</h4>
                                 <p className="text-[9px] text-zinc-500 font-bold">{meal.meal} • {meal.time}</p>
                              </div>
                              {meal.status === 'pending' && (
                                 <span className="px-2 py-1 bg-orange-500/20 text-orange-500 text-[8px] font-black uppercase rounded">Pendente</span>
                              )}
                           </div>
                           {meal.status === 'pending' && (
                              <div className="flex gap-2 mt-3">
                                 <button className="flex-1 bg-green-500/20 text-green-500 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-green-500/30">Aprovar</button>
                                 <button className="flex-1 bg-orange-500/20 text-orange-500 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-orange-500/30">Atenção</button>
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         );
      case 'composition':
         return (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Análise de Composição Corporal</h2><p className="text-zinc-500 font-medium">Acompanhe a evolução dos pacientes</p></header>
               <div className="grid gap-6">
                  {students.map((s: Student) => (
                     <div key={s.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-4">
                              <img src={s.avatar} className="size-14 rounded-2xl object-cover"/>
                              <div>
                                 <h4 className="font-black italic uppercase text-lg">{s.name}</h4>
                                 <p className="text-[10px] text-zinc-500 font-bold">Última análise: 01/02</p>
                              </div>
                           </div>
                           <button onClick={() => setSelectedStudent(s)} className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><Scale size={16}/> Ver Detalhes</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                           <div className="bg-zinc-950 p-4 rounded-2xl text-center"><p className="text-[9px] text-zinc-600 font-black uppercase">Peso</p><p className="text-lg font-black italic">87.2kg</p></div>
                           <div className="bg-zinc-950 p-4 rounded-2xl text-center"><p className="text-[9px] text-zinc-600 font-black uppercase">% Gordura</p><p className="text-lg font-black italic text-orange-400">17.1%</p></div>
                           <div className="bg-zinc-950 p-4 rounded-2xl text-center"><p className="text-[9px] text-zinc-600 font-black uppercase">Massa Magra</p><p className="text-lg font-black italic text-lime-400">39.2kg</p></div>
                           <div className="bg-zinc-950 p-4 rounded-2xl text-center"><p className="text-[9px] text-zinc-600 font-black uppercase">Hidratação</p><p className="text-lg font-black italic text-blue-400">59.1%</p></div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         );
      case 'education':
         return (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex justify-between items-end">
                  <div><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Conteúdos Educacionais</h2><p className="text-zinc-500 font-medium">Biblioteca de materiais para pacientes</p></div>
                  <button className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><Plus size={16}/> Novo Conteúdo</button>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {educationalContent.map(content => (
                     <div key={content.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-lime-400/30 transition-all cursor-pointer group">
                        <div className="size-16 bg-lime-400/10 text-lime-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">{content.icon}</div>
                        <h4 className="font-black text-lg mb-2 group-hover:text-lime-400 transition-colors">{content.title}</h4>
                        <div className="flex gap-2 mb-4">
                           <span className="text-[9px] bg-zinc-950 px-3 py-1 rounded-lg font-black uppercase text-zinc-500">{content.category}</span>
                           <span className="text-[9px] bg-zinc-950 px-3 py-1 rounded-lg font-black uppercase text-zinc-500">{content.duration}</span>
                        </div>
                        <button className="w-full bg-zinc-950 hover:bg-lime-400 hover:text-black py-3 rounded-xl font-black uppercase text-[10px] transition-all">Visualizar</button>
                     </div>
                  ))}
               </div>
            </div>
         );
      default: return null;
   }
};

const AdminModule = ({ view }: any) => {
   const tab = view || 'dashboard';
   const [showAddLead, setShowAddLead] = useState(false);
   const [showAddTicket, setShowAddTicket] = useState(false);
   const [showAddEmployee, setShowAddEmployee] = useState(false);
   const [draggedLead, setDraggedLead] = useState<any>(null);
   const [crmLeads, setCrmLeads] = useState(CRM_DATA);
   const [leadForm, setLeadForm] = useState({ name: '', contact: '', origin: 'Instagram', value: '', notes: '' });
   
   const kanbanColumns = [
      { id: 'lead', title: 'Novo Lead', color: 'zinc', icon: UserPlus },
      { id: 'contact', title: 'Contato Inicial', color: 'blue', icon: Phone },
      { id: 'proposal', title: 'Proposta Enviada', color: 'purple', icon: FileText },
      { id: 'negotiation', title: 'Negociação', color: 'orange', icon: MessageCircle },
      { id: 'won', title: 'Ganho', color: 'lime', icon: CheckCircle },
      { id: 'lost', title: 'Perdido', color: 'red', icon: XCircle },
   ];

   const handleDragStart = (lead: any) => {
      setDraggedLead(lead);
   };

   const handleDragOver = (e: any) => {
      e.preventDefault();
   };

   const handleDrop = (newStatus: string) => {
      if (draggedLead) {
         setCrmLeads(prev => prev.map(lead => 
            lead.id === draggedLead.id ? { ...lead, status: newStatus } : lead
         ));
         setDraggedLead(null);
      }
   };
   
   const [financialData] = useState({
      revenue: 145800,
      expenses: 42300,
      profit: 103500,
      pendingPayments: 12400,
   });

   const [stockData] = useState([
      { id: 1, name: 'Whey Protein', quantity: 45, minStock: 20, status: 'ok' },
      { id: 2, name: 'Creatina', quantity: 8, minStock: 15, status: 'low' },
      { id: 3, name: 'BCAA', quantity: 3, minStock: 10, status: 'critical' },
   ]);

   const [employeesData] = useState([
      { id: 1, name: 'Carlos Silva', role: 'Professor', salary: 4500, performance: 95 },
      { id: 2, name: 'Ana Costa', role: 'Nutricionista', salary: 5000, performance: 88 },
      { id: 3, name: 'João Pereira', role: 'Recepção', salary: 2800, performance: 92 },
   ]);

   const [accessData] = useState([
      { hour: '06h', count: 12 },
      { hour: '07h', count: 45 },
      { hour: '08h', count: 78 },
      { hour: '09h', count: 92 },
      { hour: '18h', count: 105 },
      { hour: '19h', count: 88 },
      { hour: '20h', count: 54 },
   ]);

   return (
      <div className="space-y-10 animate-in fade-in duration-700">
         <header className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div><h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Administração</h1><p className="text-zinc-500 font-medium">Gestão completa da academia</p></div>

         </header>

         {tab === 'dashboard' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard label="Receita Mensal" value={`R$ ${(financialData.revenue / 1000).toFixed(1)}k`} color="text-lime-400" icon={DollarSign} trend="+12%" />
                  <StatCard label="Lucro Líquido" value={`R$ ${(financialData.profit / 1000).toFixed(1)}k`} color="text-green-500" icon={TrendingUp} trend="+8%" />
                  <StatCard label="Alunos Ativos" value="342" color="text-blue-400" icon={Users} trend="+23" />
                  <StatCard label="Taxa Retenção" value="94%" color="text-purple-400" icon={Target} trend="+2%" />
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Horários de Pico</h3>
                     <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={accessData}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="hour" stroke="#52525b" fontSize={10} fontWeight="bold" /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Bar dataKey="count" fill="#D9FF00" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Estoque Crítico</h3>
                     <div className="space-y-3">
                        {stockData.filter(s => s.status !== 'ok').map(item => (
                           <div key={item.id} className={`p-4 rounded-2xl border-2 ${item.status === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                              <div className="flex justify-between items-center">
                                 <div>
                                    <h4 className="font-black text-sm">{item.name}</h4>
                                    <p className="text-[10px] text-zinc-500 font-bold">Estoque: {item.quantity} un (Min: {item.minStock})</p>
                                 </div>
                                 <AlertTriangle size={20} className={item.status === 'critical' ? 'text-red-500' : 'text-orange-500'}/>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {tab === 'financial' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard label="Receita Total" value={`R$ ${(financialData.revenue / 1000).toFixed(1)}k`} color="text-lime-400" icon={DollarSign} />
                  <StatCard label="Despesas" value={`R$ ${(financialData.expenses / 1000).toFixed(1)}k`} color="text-red-400" icon={Flame} />
                  <StatCard label="Lucro" value={`R$ ${(financialData.profit / 1000).toFixed(1)}k`} color="text-green-500" icon={TrendingUp} />
               </div>
               <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                  <h3 className="text-2xl font-black italic uppercase mb-6">Pagamentos Pendentes</h3>
                  <div className="space-y-3">
                     {INITIAL_STUDENTS.filter(s => s.financialStatus === 'LATE').map(student => (
                        <div key={student.id} className="bg-zinc-950 border-2 border-red-500/30 p-6 rounded-2xl flex justify-between items-center">
                           <div className="flex items-center gap-4">
                              <img src={student.avatar} className="size-12 rounded-xl"/>
                              <div>
                                 <h4 className="font-black text-lg">{student.name}</h4>
                                 <p className="text-[10px] text-zinc-500 font-bold">Mensalidade vencida há 5 dias</p>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button className="px-6 py-3 bg-lime-400 text-black rounded-xl font-black uppercase text-[10px]">Cobrar</button>
                              <button className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-black uppercase text-[10px]">Detalhes</button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {tab === 'crm' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center mb-8">
                  <div>
                     <h2 className="text-3xl font-black italic uppercase mb-2">Pipeline de Vendas</h2>
                     <p className="text-zinc-500 font-medium">{crmLeads.filter(l => !['won', 'lost'].includes(l.status)).length} leads ativos</p>
                  </div>
                  <button onClick={() => setShowAddLead(true)} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><Plus size={16}/> Novo Lead</button>
               </div>

               {/* Kanban Board */}
               <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                  {kanbanColumns.map(column => {
                     const columnLeads = crmLeads.filter(lead => lead.status === column.id);
                     const Icon = column.icon;
                     
                     return (
                        <div 
                           key={column.id}
                           onDragOver={handleDragOver}
                           onDrop={() => handleDrop(column.id)}
                           className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 min-h-[600px]"
                        >
                           <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-800">
                              <div className={`size-8 rounded-xl flex items-center justify-center ${
                                 column.color === 'lime' ? 'bg-lime-400/10 text-lime-400' :
                                 column.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                                 column.color === 'purple' ? 'bg-purple-500/10 text-purple-400' :
                                 column.color === 'orange' ? 'bg-orange-500/10 text-orange-400' :
                                 column.color === 'red' ? 'bg-red-500/10 text-red-400' :
                                 'bg-zinc-800 text-zinc-400'
                              }`}>
                                 <Icon size={16}/>
                              </div>
                              <div className="flex-1">
                                 <h3 className="font-black text-xs uppercase">{column.title}</h3>
                                 <p className="text-[9px] text-zinc-500 font-bold">{columnLeads.length} lead{columnLeads.length !== 1 ? 's' : ''}</p>
                              </div>
                           </div>

                           <div className="space-y-3">
                              {columnLeads.map(lead => (
                                 <div
                                    key={lead.id}
                                    draggable
                                    onDragStart={() => handleDragStart(lead)}
                                    className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl hover:border-lime-400/30 transition-all cursor-move group"
                                 >
                                    <div className="flex items-start gap-3 mb-3">
                                       <div className="size-10 bg-zinc-950 rounded-xl flex items-center justify-center font-black text-lime-400 text-sm">{lead.name.charAt(0)}</div>
                                       <div className="flex-1 min-w-0">
                                          <h4 className="font-black text-sm mb-1 truncate">{lead.name}</h4>
                                          <p className="text-[9px] text-zinc-500 font-bold truncate">{lead.contact}</p>
                                       </div>
                                    </div>
                                    <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                          <DollarSign size={12} className="text-lime-400"/>
                                          <span className="text-[10px] font-black text-lime-400">{lead.value}</span>
                                       </div>
                                       <div className="flex items-center gap-2">
                                          <MapPin size={12} className="text-zinc-500"/>
                                          <span className="text-[9px] text-zinc-500 font-bold">{lead.origin}</span>
                                       </div>
                                       {lead.notes && (
                                          <p className="text-[9px] text-zinc-400 italic mt-2 line-clamp-2">{lead.notes}</p>
                                       )}
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                       <button className="flex-1 bg-zinc-950 hover:bg-lime-400 hover:text-black py-2 rounded-lg transition-all">
                                          <Phone size={12} className="mx-auto"/>
                                       </button>
                                       <button className="flex-1 bg-zinc-950 hover:bg-lime-400 hover:text-black py-2 rounded-lg transition-all">
                                          <MessageCircle size={12} className="mx-auto"/>
                                       </button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     );
                  })}
               </div>

               {/* Modal Novo Lead */}
               {showAddLead && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={() => setShowAddLead(false)}>
                     <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-2xl w-full animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <h3 className="text-2xl font-black italic uppercase mb-1">Novo Lead</h3>
                              <p className="text-zinc-500 text-sm font-medium">Adicione um novo lead ao pipeline</p>
                           </div>
                           <button onClick={() => setShowAddLead(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24}/></button>
                        </div>
                        <form onSubmit={(e) => {
                           e.preventDefault();
                           if (leadForm.name && leadForm.contact) {
                              const newLead = {
                                 id: crmLeads.length + 1,
                                 name: leadForm.name,
                                 contact: leadForm.contact,
                                 origin: leadForm.origin,
                                 value: leadForm.value || 'R$ 150/mês',
                                 notes: leadForm.notes,
                                 status: 'lead'
                              };
                              setCrmLeads([...crmLeads, newLead]);
                              setLeadForm({ name: '', contact: '', origin: 'Instagram', value: '', notes: '' });
                              setShowAddLead(false);
                              alert(`Lead "${newLead.name}" adicionado com sucesso!`);
                           }
                        }} className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Nome Completo *</label>
                                 <input required value={leadForm.name} onChange={(e) => setLeadForm({...leadForm, name: e.target.value})} type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-lime-400 transition-colors" placeholder="Ex: João Silva"/>
                              </div>
                              <div>
                                 <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Contato *</label>
                                 <input required value={leadForm.contact} onChange={(e) => setLeadForm({...leadForm, contact: e.target.value})} type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-lime-400 transition-colors" placeholder="11 99999-9999"/>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Origem</label>
                                 <select value={leadForm.origin} onChange={(e) => setLeadForm({...leadForm, origin: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-lime-400 transition-colors">
                                    <option value="Instagram">Instagram</option>
                                    <option value="Facebook">Facebook</option>
                                    <option value="Google">Google</option>
                                    <option value="Indicação">Indicação</option>
                                    <option value="Site">Site</option>
                                    <option value="Walk-in">Walk-in</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Valor Mensal</label>
                                 <input value={leadForm.value} onChange={(e) => setLeadForm({...leadForm, value: e.target.value})} type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-lime-400 transition-colors" placeholder="R$ 150/mês"/>
                              </div>
                           </div>
                           <div>
                              <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Observações</label>
                              <textarea value={leadForm.notes} onChange={(e) => setLeadForm({...leadForm, notes: e.target.value})} rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-lime-400 transition-colors resize-none" placeholder="Informações adicionais sobre o lead..."/>
                           </div>
                           <div className="flex gap-3 pt-4">
                              <button type="button" onClick={() => setShowAddLead(false)} className="flex-1 bg-zinc-950 hover:bg-zinc-800 py-3 rounded-xl font-black uppercase text-[10px] transition-all">Cancelar</button>
                              <button type="submit" className="flex-1 bg-lime-400 hover:bg-lime-300 text-black py-3 rounded-xl font-black uppercase text-[10px] transition-all">Adicionar Lead</button>
                           </div>
                        </form>
                     </div>
                  </div>
               )}
            </div>
         )}

         {tab === 'stock' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black italic uppercase">Controle de Estoque</h2>
                  <button className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><Plus size={16}/> Novo Produto</button>
               </div>
               <div className="grid gap-4">
                  {stockData.map(item => (
                     <div key={item.id} className={`bg-zinc-900 border-2 p-6 rounded-3xl flex justify-between items-center ${item.status === 'critical' ? 'border-red-500/30' : item.status === 'low' ? 'border-orange-500/30' : 'border-zinc-800'}`}>
                        <div className="flex items-center gap-6">
                           <div className={`size-16 rounded-2xl flex items-center justify-center ${item.status === 'critical' ? 'bg-red-500/20 text-red-500' : item.status === 'low' ? 'bg-orange-500/20 text-orange-500' : 'bg-lime-400/20 text-lime-400'}`}><Package size={24}/></div>
                           <div>
                              <h4 className="font-black text-lg">{item.name}</h4>
                              <p className="text-[10px] text-zinc-500 font-bold">Quantidade: {item.quantity} un • Mínimo: {item.minStock} un</p>
                           </div>
                        </div>
                        <button className="px-6 py-3 bg-lime-400 text-black rounded-xl font-black uppercase text-[10px]">Repor</button>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {tab === 'employees' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black italic uppercase">Equipe</h2>
                  <button onClick={() => setShowAddEmployee(true)} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><Plus size={16}/> Novo Funcionário</button>
               </div>
               <div className="grid gap-4">
                  {employeesData.map(emp => (
                     <div key={emp.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex justify-between items-center hover:border-lime-400/30 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="size-16 bg-lime-400/10 text-lime-400 rounded-2xl flex items-center justify-center font-black text-2xl">{emp.name.charAt(0)}</div>
                           <div>
                              <h4 className="font-black text-lg">{emp.name}</h4>
                              <p className="text-[10px] text-zinc-500 font-bold">{emp.role} • R$ {emp.salary.toLocaleString('pt-BR')}/mês</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right">
                              <p className="text-[10px] text-zinc-600 font-black uppercase">Performance</p>
                              <p className="text-2xl font-black italic text-lime-400">{emp.performance}%</p>
                           </div>
                           <button className="size-10 bg-zinc-950 rounded-xl flex items-center justify-center text-zinc-600 hover:text-white"><MoreVertical size={16}/></button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {tab === 'maintenance' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black italic uppercase">Manutenção de Equipamentos</h2>
                  <button onClick={() => setShowAddTicket(true)} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><Plus size={16}/> Novo Chamado</button>
               </div>
               <div className="grid gap-4">
                  {MAINTENANCE_TICKETS.map((ticket: any) => (
                     <div key={ticket.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-lime-400/30 transition-all">
                        <div className="flex items-center gap-6">
                           <div className={`size-16 rounded-2xl flex items-center justify-center ${ticket.status === 'FIXED' ? 'bg-green-500/20 text-green-500' : ticket.status === 'PENDING' ? 'bg-orange-500/20 text-orange-500' : 'bg-red-500/20 text-red-500'}`}><Wrench size={24}/></div>
                           <div>
                              <h4 className="font-black text-lg">{ticket.equipment}</h4>
                              <p className="text-[10px] text-zinc-500 font-bold">{ticket.issue} • {ticket.date}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${ticket.priority === 'HIGH' ? 'bg-red-500 text-white' : ticket.priority === 'MEDIUM' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{ticket.priority}</span>
                           <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${ticket.status === 'FIXED' ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-400'}`}>{ticket.status}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {tab === 'analytics' && (
            <div className="space-y-6">
               <h2 className="text-3xl font-black italic uppercase">Relatórios e Analytics</h2>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Taxa de Retenção</h3>
                     <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={[{month: 'Jan', rate: 88}, {month: 'Fev', rate: 91}, {month: 'Mar', rate: 89}, {month: 'Abr', rate: 93}, {month: 'Mai', rate: 94}]}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis dataKey="month" stroke="#52525b" fontSize={10} fontWeight="bold" /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Line type="monotone" dataKey="rate" stroke="#D9FF00" strokeWidth={3} dot={{ fill: '#D9FF00', r: 5 }} /></LineChart></ResponsiveContainer></div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Origem de Novos Alunos</h3>
                     <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Pie data={[{name: 'Instagram', value: 45, fill: '#D9FF00'}, {name: 'Google', value: 25, fill: '#3b82f6'}, {name: 'Indicação', value: 20, fill: '#f97316'}, {name: 'Walk-in', value: 10, fill: '#8b5cf6'}]} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none" /></PieChart></ResponsiveContainer></div>
                  </div>
               </div>
            </div>
         )}

         {/* Modals */}
         {showAddLead && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowAddLead(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[3rem] p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-black italic uppercase">Novo Lead</h3>
                     <button onClick={() => setShowAddLead(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                  </div>
                  <div className="space-y-6">
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Nome Completo</label><input className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Telefone</label><input className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Origem</label><select className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none appearance-none"><option>Instagram</option><option>Google</option><option>Indicação</option><option>Walk-in</option></select></div>
                     <button className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Salvar Lead</button>
                  </div>
               </div>
            </div>
         )}
         
         {showAddTicket && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowAddTicket(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[3rem] p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-black italic uppercase">Novo Chamado</h3>
                     <button onClick={() => setShowAddTicket(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                  </div>
                  <div className="space-y-6">
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Equipamento</label><input placeholder="Ex: Esteira 04" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Problema</label><input placeholder="Ex: Motor fazendo barulho" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Prioridade</label><select className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none appearance-none"><option>Baixa</option><option>Média</option><option>Alta</option></select></div>
                     <button className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Criar Chamado</button>
                  </div>
               </div>
            </div>
         )}

         {showAddEmployee && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowAddEmployee(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[3rem] p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-black italic uppercase">Novo Funcionário</h3>
                     <button onClick={() => setShowAddEmployee(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                  </div>
                  <div className="space-y-6">
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Nome Completo</label><input className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Cargo</label><select className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none appearance-none"><option>Professor</option><option>Nutricionista</option><option>Recepção</option><option>Gerente</option></select></div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Salário Mensal</label><input type="number" placeholder="Ex: 4500" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <button className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Contratar</button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

const App: React.FC = () => {
  const [role, setRole] = useState<Role>('ALUNO');
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  
  // Carrinho com persistência
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('fitness_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  
  // Perfil com persistência
  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem('fitness_profile_img') || "https://picsum.photos/seed/fitness/300";
  });
  
  const [biometrics, setBiometrics] = useState<Biometrics>(() => {
    try {
      const saved = localStorage.getItem('fitness_biometrics');
      return saved ? JSON.parse(saved) : { height: '1.82', weight: '84.2', age: '26', goal: 'Hipertrofia' };
    } catch {
      return { height: '1.82', weight: '84.2', age: '26', goal: 'Hipertrofia' };
    }
  });
  
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>(INITIAL_TEMPLATES);
  const [dietPlans, setDietPlans] = useState<Record<number, any>>(INITIAL_DIETS);
  
  // State for active workout session
  const [activeSession, setActiveSession] = useState<any>(null);
  const [activeSessionTime, setActiveSessionTime] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);
  
  // State for Watch Integration
  const [watchConnected, setWatchConnected] = useState(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState("");

  // Timer do treino ativo
  useEffect(() => {
    let interval: any;
    if (activeSession) {
      interval = setInterval(() => {
        setActiveSessionTime(t => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  // Persistir carrinho
  useEffect(() => {
    try {
      localStorage.setItem('fitness_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Erro ao salvar carrinho:', e);
    }
  }, [cart]);

  // Persistir biometria
  useEffect(() => {
    try {
      localStorage.setItem('fitness_biometrics', JSON.stringify(biometrics));
    } catch (e) {
      console.error('Erro ao salvar biometria:', e);
    }
  }, [biometrics]);

  // Persistir foto de perfil
  useEffect(() => {
    try {
      localStorage.setItem('fitness_profile_img', profileImage);
    } catch (e) {
      console.error('Erro ao salvar foto:', e);
    }
  }, [profileImage]);

  const subtotal = cart.reduce((acc, item) => {
    const itemTotal = item.price * (item.quantity || 1);
    return acc + itemTotal;
  }, 0);
  
  const discount = paymentMethod === 'pix' ? subtotal * 0.05 : 0;
  const total = Math.max(0, subtotal - discount);

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
          {role === 'PROFESSOR' && (
            <>
              <NavItem icon={<Users size={24}/>} label="Alunos" active={activeView === 'students'} onClick={() => setActiveView('students')} collapsed={!sidebarOpen} />
              <NavItem icon={<BookMarked size={24}/>} label="Modelos" active={activeView === 'templates'} onClick={() => setActiveView('templates')} collapsed={!sidebarOpen} />
              <NavItem icon={<Calendar size={24}/>} label="Agenda" active={activeView === 'schedule'} onClick={() => setActiveView('schedule')} collapsed={!sidebarOpen} />
              <NavItem icon={<ClipboardList size={24}/>} label="Avaliações" active={activeView === 'assessments'} onClick={() => setActiveView('assessments')} collapsed={!sidebarOpen} />
            </>
          )}
          {role === 'NUTRI' && (
            <>
              <NavItem icon={<Users size={24}/>} label="Pacientes" active={activeView === 'students'} onClick={() => setActiveView('students')} collapsed={!sidebarOpen} />
              <NavItem icon={<Utensils size={24}/>} label="Dietas" active={activeView === 'diets'} onClick={() => setActiveView('diets')} collapsed={!sidebarOpen} />
              <NavItem icon={<Camera size={24}/>} label="Diário Visual" active={activeView === 'diary'} onClick={() => setActiveView('diary')} collapsed={!sidebarOpen} />
              <NavItem icon={<Scale size={24}/>} label="Composição" active={activeView === 'composition'} onClick={() => setActiveView('composition')} collapsed={!sidebarOpen} />
              <NavItem icon={<BookOpen size={24}/>} label="Educação" active={activeView === 'education'} onClick={() => setActiveView('education')} collapsed={!sidebarOpen} />
            </>
          )}
          {role === 'ADMIN' && (
            <>
              <NavItem icon={<DollarSign size={24}/>} label="Financeiro" active={activeView === 'financial'} onClick={() => setActiveView('financial')} collapsed={!sidebarOpen} />
              <NavItem icon={<Users size={24}/>} label="CRM" active={activeView === 'crm'} onClick={() => setActiveView('crm')} collapsed={!sidebarOpen} />
              <NavItem icon={<Package size={24}/>} label="Estoque" active={activeView === 'stock'} onClick={() => setActiveView('stock')} collapsed={!sidebarOpen} />
              <NavItem icon={<Briefcase size={24}/>} label="Equipe" active={activeView === 'employees'} onClick={() => setActiveView('employees')} collapsed={!sidebarOpen} />
              <NavItem icon={<Wrench size={24}/>} label="Manutenção" active={activeView === 'maintenance'} onClick={() => setActiveView('maintenance')} collapsed={!sidebarOpen} />
              <NavItem icon={<BarChart3 size={24}/>} label="Analytics" active={activeView === 'analytics'} onClick={() => setActiveView('analytics')} collapsed={!sidebarOpen} />
            </>
          )}
        </nav>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl flex justify-center text-zinc-400 hover:text-white transition-all">{sidebarOpen ? <ArrowLeft size={24}/> : <ArrowRight size={24}/>}</button>
      </aside>

      <main className="flex-1 p-6 md:p-12 lg:px-20 max-w-8xl mx-auto w-full pb-32">
        {role === 'ALUNO' && (
          <StudentModule 
            view={activeView} setView={setActiveView} products={products} 
            addToCart={(p:any)=>{
              const existingIndex = cart.findIndex(item => item.id === p.id);
              if (existingIndex >= 0) {
                // Produto já existe - incrementa quantidade
                const updatedCart = [...cart];
                updatedCart[existingIndex].quantity += 1;
                setCart(updatedCart);
              } else {
                // Produto novo - adiciona com quantidade 1
                setCart([...cart, {...p, quantity: 1}]);
              }
            }}
            cartCount={cart.length} setIsCartOpen={setIsCartOpen} 
            profileImage={profileImage} onImageChange={setProfileImage} 
            biometrics={biometrics} onBiometricsChange={setBiometrics} 
            dietPlans={dietPlans} setDietPlans={setDietPlans}
            watchConnected={watchConnected} toggleWatch={handleToggleWatch}
            deviceName={connectedDeviceName}
            activeSession={activeSession}
            setActiveSession={setActiveSession}
            activeSessionTime={activeSessionTime}
            sessionFinished={sessionFinished}
            setSessionFinished={setSessionFinished}
            setActiveSessionTime={setActiveSessionTime}
          />
        )}
        {role === 'PROFESSOR' && (
          <ProfessorModule 
            view={activeView} setView={setActiveView} students={students} 
            onAddStudent={()=>{}} templates={workoutTemplates} 
            onAddTemplate={(d:any)=>setWorkoutTemplates([d, ...workoutTemplates])} 
            onRemoveTemplate={(id:any)=>setWorkoutTemplates(workoutTemplates.filter(t=>t.id!==id))} 
            dietPlans={dietPlans} setDietPlans={setDietPlans}
          />
        )}
        {role === 'NUTRI' && (
          <NutriModule 
            view={activeView} setView={setActiveView} students={students}
          />
        )}
        {role === 'ADMIN' && <AdminModule view={activeView} />}
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
                  {cart.length === 0 ? (
                    <div className="py-12 text-center text-zinc-600 italic font-bold">Carrinho vazio</div>
                  ) : cart.map((item, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-[2rem] flex gap-4">
                      <img src={item.img} className="size-16 rounded-2xl object-cover"/>
                      <div className="flex-1">
                        <h5 className="font-bold text-xs uppercase italic text-white mb-2">{item.name}</h5>
                        <div className="flex items-center gap-2 mb-2">
                          <button 
                            onClick={() => {
                              const updated = [...cart];
                              if (updated[i].quantity > 1) {
                                updated[i].quantity -= 1;
                                setCart(updated);
                              }
                            }} 
                            className="size-6 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white"
                          >-</button>
                          <span className="text-xs font-black text-white w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => {
                              const updated = [...cart];
                              if (updated[i].quantity < item.stock) {
                                updated[i].quantity += 1;
                                setCart(updated);
                              }
                            }} 
                            className="size-6 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white"
                          >+</button>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="font-black text-lime-400 italic text-sm">R$ {(item.price * item.quantity).toFixed(2)}</p>
                          <button onClick={() => setCart(cart.filter((_, idx)=>idx!==i))} className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
               {cart.length > 0 && (<section className="space-y-3"><h6 className="text-[10px] font-black uppercase text-zinc-600 mb-6">Pagamento</h6>{['pix', 'credit_card'].map(m=>(<button key={m} onClick={()=>setPaymentMethod(m)} className={`w-full flex items-center gap-4 p-5 rounded-3xl border transition-all ${paymentMethod === m ? 'bg-lime-400/10 border-lime-400' : 'bg-zinc-900 border-zinc-800'}`}>{m === 'pix' ? <QrCode size={24}/> : <CreditCard size={24}/>}<div><p className="font-black uppercase italic text-sm">{m === 'pix' ? 'PIX' : 'Cartão'}</p></div></button>))}</section>)}
             </div>
             <div className="p-8 bg-zinc-900/50 border-t border-zinc-900 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-zinc-500 font-bold text-[10px] uppercase">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-500 font-bold text-[10px] uppercase">
                      <span>Desconto PIX (5%)</span>
                      <span>- R$ {discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                    <span className="text-zinc-500 font-black uppercase text-[10px]">Total</span>
                    <span className="text-3xl font-black italic text-white">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  disabled={cart.length === 0 || !paymentMethod} 
                  onClick={() => {
                    if (cart.length > 0 && paymentMethod) {
                      alert(`Pedido finalizado! Total: R$ ${total.toFixed(2)}\nPagamento: ${paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}`);
                      setCart([]);
                      setPaymentMethod(null);
                      setIsCartOpen(false);
                    }
                  }}
                  className={`w-full py-6 rounded-2xl font-black uppercase text-sm transition-all active:scale-95 ${cart.length === 0 || !paymentMethod ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-lime-400 text-black shadow-xl shadow-lime-400/20 hover:bg-lime-300'}`}
                >
                  {!paymentMethod ? 'Selecione o Pagamento' : 'Finalizar Pedido'}
                </button>
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
