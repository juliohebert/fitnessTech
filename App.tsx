
import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, LayoutDashboard, Apple, TrendingUp, Users, Trophy,
  ArrowLeft, ArrowRight, Flame, DollarSign, Package, ClipboardList,
  ChevronRight, Plus, UserCheck, Calendar, Search, ShoppingCart, 
  CheckCircle2, Clock, Info, MoreVertical, Play, Repeat, Weight,
  Check, X, Timer, SkipForward, Award, Video, ListChecks, Wrench, ChevronDown, ChevronUp,
  Utensils, Coffee, Sun, Moon, Zap, Circle, Droplets, Target, Star, Trash2, CreditCard,
  QrCode, Smartphone, Wallet
} from 'lucide-react';
import { 
  BarChart, Bar, ResponsiveContainer, Cell, 
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, AreaChart, Area
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

interface Sale {
  id: string;
  customer: string;
  items: CartItem[];
  total: number;
  date: string;
  paymentMethod: string;
  status: 'PENDENTE' | 'PAGO' | 'ENVIADO';
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

const PRODUCTS: Product[] = [
  { id: 1, name: 'Whey Protein Isolado', price: 189.90, img: 'https://images.unsplash.com/photo-1593095191071-82b0c9533371?auto=format&fit=crop&q=80&w=200', brand: 'Performance Lab' },
  { id: 2, name: 'Creatina Monohidratada', price: 95.00, img: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&q=80&w=200', brand: 'Iron Power' },
  { id: 3, name: 'Pré-Treino Focus', price: 145.00, img: 'https://images.unsplash.com/photo-1579722820308-d74e5719d38f?auto=format&fit=crop&q=80&w=200', brand: 'Max Energy' },
  { id: 4, name: 'BCAA Recovery', price: 68.00, img: 'https://images.unsplash.com/photo-1611073117402-45e0d37e699b?auto=format&fit=crop&q=80&w=200', brand: 'Pure Form' },
];

const WEEKLY_WORKOUTS: Record<number, any> = {
  1: { title: 'Push Day: Peito & Ombro', category: 'A', exercises: [
    { n: 'Supino Reto c/ Barra', s: 4, r: '8-10', w: '80kg', rest: 60, desc: 'Foco na cadência 2020', video: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpibXRhZ2Zidm5xbXpibXRhZ2Zidm5xbXpibXRhZ2Zidm5xbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif', equip: ['Barra Olímpica', 'Banco Reto'], steps: ['Deite no banco', 'Segure a barra', 'Desça controladamente'] },
    { n: 'Crucifixo Inclinado', s: 3, r: '12', w: '24kg', rest: 45, desc: 'Máximo alongamento' },
  ], duration: '55m' },
  2: { title: 'Pull Day: Costas & Bíceps', category: 'B', exercises: [{ n: 'Puxada Aberta', s: 4, r: '10', w: '70kg', rest: 60 }], duration: '60m' },
  3: { title: 'Leg Day: Quadríceps', category: 'C', exercises: [{ n: 'Agachamento Livre', s: 4, r: '10', w: '100kg', rest: 90 }], duration: '65m' },
  4: { title: 'Rest Day / Cardio', category: 'Descanso', exercises: [], duration: '30m' },
  5: { title: 'Push Day: Tríceps & Peito', category: 'D', exercises: [{ n: 'Supino Inclinado Halter', s: 4, r: '10', w: '30kg', rest: 60 }], duration: '50m' },
  6: { title: 'Full Body Performance', category: 'E', exercises: [{ n: 'Levantamento Terra', s: 3, r: '5', w: '140kg', rest: 120 }], duration: '75m' },
  0: { title: 'Recuperação Ativa', category: 'Cardio', exercises: [], duration: '20m' },
};

const WEEKLY_DIETS: Record<number, any> = {
  1: { title: 'Hypertrophy: Dia de Treino Pesado', kcal: 3150, meals: [
    { n: 'Café da Manhã', t: '07:30', kcal: 650, icon: <Coffee />, items: [{ name: '4 Ovos Mexidos', kcal: 320 }, { name: '100g Aveia', kcal: 250 }], macros: { p: 40, c: 70, f: 15 } },
    { n: 'Almoço', t: '13:00', kcal: 850, icon: <Sun />, items: [{ name: '200g Frango Grelhado', kcal: 330 }, { name: '250g Arroz', kcal: 500 }], macros: { p: 55, c: 110, f: 10 } },
    { n: 'Jantar', t: '20:00', kcal: 650, icon: <Moon />, items: [{ name: '200g Tilápia', kcal: 250 }, { name: 'Batata Doce', kcal: 380 }], macros: { p: 45, c: 60, f: 12 } },
  ]},
  6: { title: 'Hypertrophy: Weekend Warrior', kcal: 2800, meals: [
    { n: 'Café da Manhã', t: '09:00', kcal: 500, icon: <Coffee />, items: [{ name: 'Omelete', kcal: 500 }], macros: { p: 30, c: 20, f: 25 } },
    { n: 'Almoço', t: '14:00', kcal: 800, icon: <Sun />, items: [{ name: 'Churrasco Magro', kcal: 800 }], macros: { p: 60, c: 40, f: 30 } },
  ]},
};

// --- SHARED UI ATOMS ---

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

// --- MARKETPLACE VIEW ---

const MarketplaceView = ({ onPurchase }: { onPurchase: (items: CartItem[], method: PaymentMethod) => void }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    // Feedback visual opcional aqui se necessário
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = () => {
    if (!paymentMethod) return;
    
    setIsProcessing(true);
    
    // Simula tempo de processamento do gateway
    setTimeout(() => {
      onPurchase(cart, paymentMethod);
      setCart([]);
      setIsCartOpen(false);
      setIsProcessing(false);
      setPaymentMethod(null);
      setPurchaseSuccess(true);
      setTimeout(() => setPurchaseSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-10 relative">
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">Marketplace</h2>
          <p className="text-zinc-500 font-medium">Equipamentos e suplementação de alta performance.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center text-zinc-500 group-focus-within:text-lime-400 transition-colors"><Search size={18} /></div>
            <input type="text" placeholder="Buscar..." className="bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:outline-none focus:border-lime-400 w-full md:w-64 transition-all" />
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative size-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-lime-400 hover:border-lime-400/50 transition-all shadow-xl"
          >
            <ShoppingCart size={24} />
            {cartCount > 0 && <span className="absolute -top-2 -right-2 size-6 bg-lime-400 text-black text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-lime-400/30">{cartCount}</span>}
          </button>
        </div>
      </header>

      {purchaseSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-lime-400 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl z-[200] animate-in slide-in-from-top-4 flex items-center gap-3">
          <CheckCircle2 size={24} /> Pedido Realizado!
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {PRODUCTS.map(p => (
          <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-2xl hover:border-lime-400/40 transition-all group flex flex-col">
            <div className="aspect-square bg-zinc-950 rounded-2xl mb-6 overflow-hidden border border-zinc-800 relative">
              <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <p className="text-[10px] font-black uppercase text-lime-400 mb-1">{p.brand}</p>
            <h4 className="font-bold text-lg mb-4 line-clamp-1">{p.name}</h4>
            <div className="mt-auto flex items-center justify-between">
              <p className="text-2xl font-black italic">R$ {p.price.toFixed(2)}</p>
              <button 
                onClick={() => addToCart(p)}
                className="bg-white text-black size-12 rounded-xl flex items-center justify-center hover:bg-lime-400 transition-all shadow-lg active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150]" onClick={() => !isProcessing && setIsCartOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-[160] p-8 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">Carrinho</h3>
              <button 
                disabled={isProcessing}
                onClick={() => setIsCartOpen(false)} 
                className="size-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-all disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pb-10">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-40">
                  <ShoppingCart size={80} strokeWidth={1} className="mb-4" />
                  <p className="font-bold uppercase tracking-widest text-sm">Vazio</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-3xl relative group">
                        <img src={item.img} className="size-16 rounded-xl object-cover" alt={item.name} />
                        <div className="flex-1">
                          <h4 className="font-bold text-sm mb-1">{item.name}</h4>
                          <div className="flex items-center justify-between">
                            <p className="font-black text-lime-400 text-sm">R$ {item.price.toFixed(2)}</p>
                            <span className="text-[10px] font-black text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">QTD: {item.quantity}</span>
                          </div>
                        </div>
                        <button 
                          disabled={isProcessing}
                          onClick={() => removeFromCart(item.id)} 
                          className="absolute -top-2 -right-2 size-7 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 disabled:hidden"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Payment Methods Section */}
                  <div className="pt-8 border-t border-zinc-800">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6">Selecione o Pagamento</h5>
                    <div className="space-y-3">
                      <button 
                        onClick={() => setPaymentMethod('PIX')}
                        disabled={isProcessing}
                        className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${paymentMethod === 'PIX' ? 'bg-lime-400 border-lime-400 text-black shadow-lg shadow-lime-400/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                      >
                        <div className="flex items-center gap-3">
                          <QrCode size={20} />
                          <span className="font-black text-xs uppercase">Pix (Rápido e Seguro)</span>
                        </div>
                        {paymentMethod === 'PIX' && <CheckCircle2 size={18} />}
                      </button>

                      <button 
                        onClick={() => setPaymentMethod('CREDIT_CARD')}
                        disabled={isProcessing}
                        className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${paymentMethod === 'CREDIT_CARD' ? 'bg-lime-400 border-lime-400 text-black shadow-lg shadow-lime-400/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard size={20} />
                          <span className="font-black text-xs uppercase">Cartão de Crédito</span>
                        </div>
                        {paymentMethod === 'CREDIT_CARD' && <CheckCircle2 size={18} />}
                      </button>

                      <button 
                        onClick={() => setPaymentMethod('APPLE_PAY')}
                        disabled={isProcessing}
                        className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${paymentMethod === 'APPLE_PAY' ? 'bg-lime-400 border-lime-400 text-black shadow-lg shadow-lime-400/20' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Smartphone size={20} />
                          <span className="font-black text-xs uppercase">Apple Pay</span>
                        </div>
                        {paymentMethod === 'APPLE_PAY' && <CheckCircle2 size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Pix Simulation (if selected) */}
                  {paymentMethod === 'PIX' && !isProcessing && (
                    <div className="p-6 bg-zinc-900 border border-lime-400/30 rounded-3xl animate-in zoom-in duration-300">
                      <div className="flex flex-col items-center">
                        <div className="bg-white p-2 rounded-xl mb-4">
                           <QrCode size={120} className="text-black" />
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold text-center mb-4">Aponte sua câmera para pagar ou copie o código abaixo</p>
                        <button className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-lime-400 flex items-center justify-center gap-2">Copiar Código Pix <Repeat size={14} /></button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="mt-auto pt-8 border-t border-zinc-800 space-y-6">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Total</p>
                  <p className="text-4xl font-black italic text-white">R$ {cartTotal.toFixed(2)}</p>
                </div>
                <button 
                  disabled={!paymentMethod || isProcessing}
                  onClick={handleCheckout}
                  className={`w-full py-6 rounded-3xl font-black uppercase tracking-widest text-lg flex items-center justify-center gap-3 transition-all ${!paymentMethod || isProcessing ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed' : 'bg-lime-400 text-black shadow-xl shadow-lime-400/20 hover:scale-[1.02] active:scale-95'}`}
                >
                  {isProcessing ? (
                    <>
                      <div className="size-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Wallet size={24} /> Pagar Agora
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// --- ADMIN VIEW ---

const AdminDashboard = ({ sales }: { sales: Sale[] }) => {
  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">Vendas Recentes</h2>
          <p className="text-zinc-500 font-medium">Relatórios e logs de transações do Marketplace.</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 px-8 py-5 rounded-[2rem] shadow-xl flex items-center gap-10">
           <div><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Receita</p><p className="text-3xl font-black text-lime-400 italic">R$ {sales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}</p></div>
           <div className="h-10 w-px bg-zinc-800" />
           <div><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Total Pedidos</p><p className="text-3xl font-black text-white italic">{sales.length}</p></div>
        </div>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Transação</th>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Cliente</th>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Pagamento</th>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Produtos</th>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Valor</th>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {sales.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs opacity-40 italic">Nenhum dado financeiro disponível</td></tr>
              ) : (
                sales.slice().reverse().map(sale => (
                  <tr key={sale.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-6">
                       <p className="font-mono text-[10px] text-zinc-500 mb-1">#{sale.id}</p>
                       <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{sale.date}</p>
                    </td>
                    <td className="p-6 font-bold text-zinc-100">{sale.customer}</td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-zinc-400">
                        {sale.paymentMethod === 'PIX' && <QrCode size={14} className="text-lime-400" />}
                        {sale.paymentMethod === 'CREDIT_CARD' && <CreditCard size={14} className="text-blue-400" />}
                        {sale.paymentMethod === 'APPLE_PAY' && <Smartphone size={14} className="text-white" />}
                        <span className="text-[10px] font-black uppercase">{sale.paymentMethod?.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex -space-x-3">
                        {sale.items.map(i => <div key={i.id} title={`${i.quantity}x ${i.name}`} className="size-10 bg-zinc-950 border-2 border-zinc-900 rounded-xl overflow-hidden shadow-lg"><img src={i.img} className="w-full h-full object-cover" /></div>)}
                      </div>
                    </td>
                    <td className="p-6 font-black text-lime-400 italic text-lg">R$ {sale.total.toFixed(2)}</td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                         <div className="size-2 bg-lime-400 rounded-full animate-pulse shadow-[0_0_8px_#D9FF00]" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-lime-400/80">APROVADO</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- STUDENT COMPONENTS (EVOLUTION & DASHBOARD) ---

const EvolutionView = () => (
  <div className="animate-in fade-in duration-700 space-y-10">
    <header><h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">Evolução</h2><p className="text-zinc-500 font-medium">Análise biométrica e tática.</p></header>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl h-[400px]">
        <h3 className="text-xl font-black italic uppercase mb-8">Peso (kg)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={WEIGHT_HISTORY}>
            <defs><linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D9FF00" stopOpacity={0.3}/><stop offset="95%" stopColor="#D9FF00" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="day" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis hide /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', fontWeight: 'bold' }} />
            <Area type="monotone" dataKey="weight" stroke="#D9FF00" strokeWidth={4} fillOpacity={1} fill="url(#colorWeight)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center">
        <h3 className="text-xl font-black italic uppercase mb-8 self-start">Macros</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={MACRO_DISTRIBUTION} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
              {MACRO_DISTRIBUTION.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="w-full space-y-3 mt-6">
          {MACRO_DISTRIBUTION.map((m) => (
            <div key={m.name} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="size-2 rounded-full" style={{ backgroundColor: m.fill }} /><span className="text-xs font-bold text-zinc-400">{m.name}</span></div><span className="text-xs font-black">{m.value}%</span></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const StudentDashboard = ({ setView, startTodayWorkout }: any) => {
  const [waterCups, setWaterCups] = useState(4);
  const today = new Date().getDay();
  const workout = WEEKLY_WORKOUTS[today];
  const diet = WEEKLY_DIETS[today] || { meals: [{n: 'Rest', t: '---', macros: {p:0, c:0}, items:[]}], kcal: 2000 };
  const nextMeal = diet.meals[0];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img src="https://picsum.photos/seed/alex/128/128" className="size-20 rounded-[2rem] border-4 border-lime-400 shadow-2xl" alt="Avatar"/>
            <div className="absolute -bottom-1 -right-1 size-8 bg-zinc-950 border-4 border-zinc-950 rounded-xl flex items-center justify-center text-lime-400 shadow-xl"><Trophy size={16} strokeWidth={3} /></div>
          </div>
          <div>
            <div className="flex items-center gap-3"><h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Alex Rivers</h1><span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-zinc-500">Lv. 24</span></div>
            <div className="mt-2 w-48 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800"><div className="h-full bg-lime-400 w-3/4 shadow-[0_0_10px_#D9FF00]"></div></div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setView('evolution')} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"><TrendingUp size={24} /></button>
          <button onClick={() => setView('market')} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"><ShoppingCart size={24} /></button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Peso" value="84.2kg" trend="-0.4kg" color="text-lime-400" />
        <StatCard label="Energia" value="2.140" subValue={`/ ${diet.kcal}`} color="text-blue-400" />
        <StatCard label="Streak" value="12 Dias" trend="🔥" color="text-orange-500" />
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-xl">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform text-blue-400"><Droplets size={80} /></div>
           <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-4">Água</p>
           <div className="flex items-center justify-between">
              <div className="flex gap-1.5">{[...Array(8)].map((_, i) => <div key={i} className={`size-2.5 rounded-full ${i < waterCups ? 'bg-blue-400 shadow-[0_0_8px_#3b82f6]' : 'bg-zinc-800'}`} />)}</div>
              <button onClick={() => setWaterCups(prev => Math.min(8, prev + 1))} className="size-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all active:scale-90"><Droplets size={18} /></button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div onClick={startTodayWorkout} className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 relative overflow-hidden group cursor-pointer hover:border-lime-400/30 shadow-2xl transition-all">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000"><Dumbbell size={240} /></div>
          <div className="relative z-10">
            <span className="text-[10px] bg-lime-400 text-black px-4 py-1.5 rounded-full font-black uppercase tracking-[0.2em] mb-6 inline-block">Missão de Hoje</span>
            <h3 className="text-5xl font-black italic uppercase tracking-tighter mb-4 leading-none">{workout.exercises.length > 0 ? workout.title.split(':')[0] : 'Rest'}</h3>
            <p className="text-zinc-500 mb-10 max-w-sm text-lg leading-relaxed">{workout.exercises.length > 0 ? `${workout.exercises.length} exercícios focados em performance.` : 'Recupere sua força hoje.'}</p>
            <button className="bg-lime-400 text-black px-10 py-5 rounded-2xl font-black uppercase text-sm flex items-center gap-3 group-hover:px-12 transition-all shadow-xl">Iniciar <ArrowRight size={22} /></button>
          </div>
        </div>
        <div className="grid lg:col-span-5">
          <div onClick={() => setView('diet')} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer hover:border-blue-400/30 shadow-2xl transition-all h-full flex flex-col">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 group-hover:-rotate-6 transition-all text-blue-500"><Apple size={160} /></div>
            <div className="relative z-10 flex-1">
              <div className="flex justify-between items-start mb-8"><span className="text-[10px] bg-blue-500 text-black px-3 py-1 rounded-full font-black uppercase">Próxima Refeição</span><span className="font-black text-blue-400 italic text-sm">{nextMeal.t}</span></div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">{nextMeal.n}</h3>
              <div className="space-y-3">{nextMeal.items.slice(0, 2).map((it:any, idx:number) => (<div key={idx} className="flex items-center gap-2 text-zinc-400 text-sm font-medium"><div className="size-1.5 bg-blue-500 rounded-full" /> {it.name}</div>))}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP COMPONENT ---

const App: React.FC = () => {
  const [role, setRole] = useState<Role>('ALUNO');
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);

  const handleNewSale = (items: CartItem[], method: PaymentMethod) => {
    const total = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      customer: 'Alex Rivers',
      items,
      total,
      date: new Date().toLocaleDateString('pt-BR'),
      paymentMethod: method || 'N/A',
      status: 'PAGO'
    };
    setSales(prev => [...prev, newSale]);
  };

  const renderContent = () => {
    switch (role) {
      case 'ALUNO': return <StudentModule view={activeView} setView={setActiveView} onPurchase={handleNewSale} />;
      case 'ADMIN': return <AdminDashboard sales={sales} />;
      default: return <div className="p-20 text-center text-zinc-600 font-black italic uppercase text-3xl opacity-40">Módulo em Desenvolvimento</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <div className="fixed top-4 right-4 z-[100] bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-1.5 rounded-2xl flex gap-1 shadow-2xl">
        {(['ALUNO', 'PROFESSOR', 'NUTRI', 'ADMIN'] as Role[]).map(r => (
          <button key={r} onClick={() => { setRole(r); setActiveView('dashboard'); }} className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all ${role === r ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 hover:text-white'}`}>{r}</button>
        ))}
      </div>

      <aside className={`hidden md:flex flex-col border-r border-zinc-800 p-6 space-y-8 bg-zinc-950 sticky top-0 h-screen transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-22'}`}>
        <div className="flex items-center gap-3 text-lime-400 font-black text-xl italic uppercase tracking-tighter shrink-0">
          <div className="size-10 bg-lime-400 text-black rounded-xl flex items-center justify-center rotate-3"><Dumbbell size={24} strokeWidth={3} /></div>
          {sidebarOpen && <span>Fitness Tech</span>}
        </div>
        <nav className="flex-1 space-y-1.5">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Painel" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} collapsed={!sidebarOpen} />
          {role === 'ALUNO' && (
            <>
              <NavItem icon={<Dumbbell size={20}/>} label="Treinos" active={activeView === 'workouts'} onClick={() => setActiveView('workouts')} collapsed={!sidebarOpen} />
              <NavItem icon={<Apple size={20}/>} label="Dieta" active={activeView === 'diet'} onClick={() => setActiveView('diet')} collapsed={!sidebarOpen} />
              <NavItem icon={<ShoppingCart size={20}/>} label="Loja" active={activeView === 'market'} onClick={() => setActiveView('market')} collapsed={!sidebarOpen} />
              <NavItem icon={<TrendingUp size={20}/>} label="Evolução" active={activeView === 'evolution'} onClick={() => setActiveView('evolution')} collapsed={!sidebarOpen} />
            </>
          )}
          {role === 'ADMIN' && <NavItem icon={<DollarSign size={20}/>} label="Vendas" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard'} collapsed={!sidebarOpen} />}
        </nav>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors flex justify-center text-zinc-400">{sidebarOpen ? <ArrowLeft size={20}/> : <ArrowRight size={20}/>}</button>
      </aside>

      <main className="flex-1 p-4 md:p-10 lg:px-16 max-w-7xl mx-auto w-full pb-24 md:pb-10 overflow-x-hidden">{renderContent()}</main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-18 bg-zinc-950/80 backdrop-blur-2xl border-t border-zinc-800/50 flex items-center justify-around z-50 px-6 pb-2">
        <button onClick={() => setActiveView('dashboard')} className={activeView === 'dashboard' ? 'text-lime-400' : 'text-zinc-600'}><LayoutDashboard size={24}/></button>
        <button onClick={() => setActiveView('workouts')} className={activeView === 'workouts' ? 'text-lime-400' : 'text-zinc-600'}><Dumbbell size={24}/></button>
        <div className="size-14 bg-lime-400 rounded-2xl flex items-center justify-center text-black -translate-y-5 shadow-xl shadow-lime-400/30 rotate-3"><Plus size={32} strokeWidth={3} /></div>
        <button onClick={() => setActiveView('diet')} className={activeView === 'diet' ? 'text-lime-400' : 'text-zinc-600'}><Apple size={24}/></button>
        <button onClick={() => setActiveView('market')} className={activeView === 'market' ? 'text-lime-400' : 'text-zinc-600'}><ShoppingCart size={24}/></button>
      </nav>
    </div>
  );
};

// --- CORE STUDENT MODULE ---

const StudentModule = ({ view, setView, onPurchase }: any) => {
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(new Date().getDay());
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutFinished, setWorkoutFinished] = useState(false);
  const [selectedDietDay, setSelectedDietDay] = useState(new Date().getDay());
  const [completedMeals, setCompletedMeals] = useState<Record<number, number[]>>({});

  const startTodayWorkout = () => {
    const today = new Date().getDay();
    setSelectedWorkoutDay(today);
    if (WEEKLY_WORKOUTS[today].exercises.length > 0) {
      setCurrentExerciseIndex(0); setIsWorkoutActive(true); setWorkoutFinished(false); setView('workouts');
    } else setView('workouts');
  };

  if (view === 'workouts') return (
    <WorkoutListView 
      selectedDay={selectedWorkoutDay} setSelectedDay={setSelectedWorkoutDay}
      isWorkoutActive={isWorkoutActive} setIsWorkoutActive={setIsWorkoutActive}
      currentExerciseIndex={currentExerciseIndex} setCurrentExerciseIndex={setCurrentExerciseIndex}
      workoutFinished={workoutFinished} setWorkoutFinished={setWorkoutFinished}
    />
  );
  if (view === 'diet') return <DietListView selectedDay={selectedDietDay} setSelectedDay={setSelectedDietDay} completedMeals={completedMeals} setCompletedMeals={setCompletedMeals} />;
  if (view === 'market') return <MarketplaceView onPurchase={onPurchase} />;
  if (view === 'evolution') return <EvolutionView />;

  return <StudentDashboard setView={setView} startTodayWorkout={startTodayWorkout} />;
};

// --- AUXILIARY COMPONENTS ---

// Fixed the missing CalendarBase component
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
            className={`min-w-[3.5rem] h-14 flex flex-col items-center justify-center rounded-2xl transition-all ${selectedDay === i ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20 scale-105' : 'text-zinc-500 hover:bg-zinc-800 hover:text-white'}`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">{d}</span>
          </button>
        ))}
      </div>
    </header>
    {children}
  </div>
);

const WorkoutListView = ({ selectedDay, setSelectedDay, isWorkoutActive, setIsWorkoutActive, currentExerciseIndex, setCurrentExerciseIndex, workoutFinished, setWorkoutFinished }: any) => {
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(60);
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const currentWorkout = WEEKLY_WORKOUTS[selectedDay];

  useEffect(() => {
    let timer: any;
    if (isResting && restTimeLeft > 0) timer = setInterval(() => setRestTimeLeft((prev) => prev - 1), 1000);
    else if (restTimeLeft === 0) { setIsResting(false); setRestTimeLeft(60); }
    return () => clearInterval(timer);
  }, [isResting, restTimeLeft]);

  const handleNextExercise = () => {
    if (currentExerciseIndex < currentWorkout.exercises.length - 1) {
      setIsResting(true); setRestTimeLeft(60); setCurrentExerciseIndex((prev: number) => prev + 1);
    } else { setWorkoutFinished(true); setIsWorkoutActive(false); }
  };

  if (workoutFinished) return <FinishedSessionView title="Treino Concluido!" reset={() => { setWorkoutFinished(false); setIsWorkoutActive(false); setCurrentExerciseIndex(0); }} />;
  if (isWorkoutActive) return (
    <ActiveWorkoutSession 
      exercise={currentWorkout.exercises[currentExerciseIndex]} progress={((currentExerciseIndex + 1) / currentWorkout.exercises.length) * 100} 
      currentIdx={currentExerciseIndex} total={currentWorkout.exercises.length} isResting={isResting} restTime={restTimeLeft}
      onNext={handleNextExercise} onSkipRest={() => setIsResting(false)} onClose={() => setIsWorkoutActive(false)}
      nextExerciseName={currentWorkout.exercises[currentExerciseIndex + 1]?.n}
    />
  );
  return (
    <CalendarBase title="Treinos" sub="Programação Semanal." selectedDay={selectedDay} setSelectedDay={setSelectedDay} days={days}>
      <WorkoutDetailCard workout={currentWorkout} onStart={() => setIsWorkoutActive(true)} dayLabel={days[selectedDay]} />
    </CalendarBase>
  );
};

const DietListView = ({ selectedDay, setSelectedDay, completedMeals, setCompletedMeals }: any) => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const currentDiet = WEEKLY_DIETS[selectedDay] || { title: 'Rest Day', kcal: 0, meals: [] };
  const toggleMealCompletion = (day: number, mealIdx: number) => {
    setCompletedMeals((prev: any) => {
      const dayMeals = prev[day] || [];
      return dayMeals.includes(mealIdx) ? { ...prev, [day]: dayMeals.filter((i: number) => i !== mealIdx) } : { ...prev, [day]: [...dayMeals, mealIdx] };
    });
  };
  const currentDayCompletions = completedMeals[selectedDay] || [];
  const globalProgress = currentDiet.meals.length > 0 ? (currentDayCompletions.length / currentDiet.meals.length) * 100 : 0;
  return (
    <CalendarBase title="Dieta" sub="Plano de combustível." selectedDay={selectedDay} setSelectedDay={setSelectedDay} days={days}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-blue-500"><Apple size={180} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8"><span className="px-4 py-1.5 bg-blue-500 text-black rounded-full text-[10px] font-black uppercase tracking-widest">{currentDiet.title}</span><span className="text-zinc-500 text-sm font-bold"><Flame size={14} className="inline mr-1"/> {currentDiet.kcal} Kcal</span></div>
          <div className="mb-10"><div className="flex justify-between items-end mb-3"><h3 className="text-4xl font-black italic uppercase tracking-tighter">Estratégia</h3><p className="text-2xl font-black text-blue-400">{Math.round(globalProgress)}%</p></div><div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5"><div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${globalProgress}%` }}></div></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentDiet.meals.map((meal: any, i: number) => (
              <div key={i} className={`flex flex-col p-6 rounded-[2rem] border transition-all ${currentDayCompletions.includes(i) ? 'bg-zinc-900/40 border-blue-400/40 opacity-80' : 'bg-zinc-950/60 border-zinc-800 hover:border-blue-400/50 hover:bg-zinc-900/60'}`}>
                <div className="flex items-center gap-4 mb-6">
                   <button onClick={() => toggleMealCompletion(selectedDay, i)} className={`size-12 rounded-2xl flex items-center justify-center transition-all ${currentDayCompletions.includes(i) ? 'bg-blue-500 text-black' : 'bg-zinc-900 text-zinc-600 hover:text-white'}`}>{currentDayCompletions.includes(i) ? <Check size={28} strokeWidth={4} /> : <Circle size={24} />}</button>
                   <div><p className={`font-black text-lg ${currentDayCompletions.includes(i) ? 'line-through text-zinc-500' : ''}`}>{meal.n}</p><p className="text-[10px] text-zinc-500 font-black uppercase"><Clock size={12} className="inline mr-1" /> {meal.t}</p></div>
                </div>
                <div className="bg-zinc-950/40 rounded-2xl p-4 border border-zinc-800/50"><ul className="space-y-2">{meal.items.map((it:any, idx:number) => (<li key={idx} className="flex items-center justify-between text-xs font-bold text-zinc-400"><div className="flex items-center gap-2"><div className="size-1 bg-blue-500 rounded-full"/>{it.name}</div><span>{it.kcal}K</span></li>))}</ul></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CalendarBase>
  );
};

const WorkoutDetailCard = ({ workout, onStart, dayLabel }: any) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-2xl">
    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-lime-400"><Dumbbell size={180} /></div>
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-6"><span className="px-4 py-1.5 bg-lime-400 text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Categoria {workout.category}</span><span className="text-zinc-500 text-sm font-bold flex items-center gap-1"><Clock size={14} /> {workout.duration}</span></div>
      <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-4">{workout.title}</h3>
      {workout.exercises.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workout.exercises.map((ex: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-5 bg-zinc-950/60 rounded-3xl border border-zinc-800 transition-all">
                <div className="flex items-center gap-4"><div className="size-10 bg-zinc-900 rounded-xl flex items-center justify-center text-lime-400"><Weight size={20} /></div><div><p className="font-bold text-sm">{ex.n}</p><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{ex.s} SÉRIES • {ex.r} REPS</p></div></div>
                <span className="text-xs font-black text-zinc-400 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">{ex.w}</span>
              </div>
            ))}
          </div>
          <button onClick={onStart} className="w-full mt-6 bg-lime-400 text-black py-5 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all"><Play size={20} fill="currentColor" /> Iniciar Treino</button>
        </div>
      ) : <div className="p-10 border-2 border-dashed border-zinc-800 rounded-[2rem] text-center opacity-60"><Info size={40} className="mx-auto mb-4 text-zinc-700" /><p className="font-bold text-zinc-400 italic">Descanso Ativo</p></div>}
    </div>
  </div>
);

const ActiveWorkoutSession = ({ exercise, progress, currentIdx, total, isResting, restTime, onNext, onSkipRest, onClose, nextExerciseName }: any) => (
  <div className="animate-in fade-in slide-in-from-bottom-10 duration-500 pb-20 max-w-2xl mx-auto">
    <div className="flex justify-between items-center mb-8"><button onClick={onClose} className="size-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white transition-all"><X size={20} /></button><div className="text-center"><p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Passo {currentIdx + 1} de {total}</p><h3 className="font-bold text-lg text-white">Sessão Ativa</h3></div><div className="size-12"></div></div>
    <div className="w-full h-1.5 bg-zinc-900 rounded-full mb-10 overflow-hidden"><div className="h-full bg-lime-400 transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
    {isResting ? (
      <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-300">
        <div className="relative size-48 flex items-center justify-center mb-10"><svg className="size-full -rotate-90"><circle cx="96" cy="96" r="88" className="stroke-zinc-900 fill-none stroke-[8px]" /><circle cx="96" cy="96" r="88" className="stroke-lime-400 fill-none stroke-[8px] transition-all duration-1000" style={{ strokeDasharray: 552.92, strokeDashoffset: 552.92 - (552.92 * restTime) / 60 }} strokeLinecap="round"/></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><Timer size={24} className="text-lime-400 mb-1" /><span className="text-5xl font-black italic">{restTime}s</span></div></div>
        <h4 className="text-2xl font-black italic uppercase mb-2">Descanso</h4><p className="text-zinc-500 font-medium mb-10">Próximo: <span className="text-white">{nextExerciseName}</span></p><button onClick={onSkipRest} className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all hover:bg-zinc-800 hover:text-white">Pular <SkipForward size={18} /></button>
      </div>
    ) : (
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-lime-400"><Play size={200} fill="currentColor" /></div>
        <div className="relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 leading-none">{exercise.n}</h2>
          <p className="text-zinc-500 text-lg font-medium mb-10">{exercise.desc || 'Mantenha o foco.'}</p>
          <div className="grid grid-cols-3 gap-4 mb-12">
             <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl"><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Séries</p><p className="text-3xl font-black italic text-lime-400">{exercise.s}</p></div>
             <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl"><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Reps</p><p className="text-3xl font-black italic text-blue-400">{exercise.r}</p></div>
             <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl"><p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Carga</p><p className="text-3xl font-black italic text-orange-500">{exercise.w}</p></div>
          </div>
          <button onClick={onNext} className="w-full bg-lime-400 text-black py-6 rounded-3xl font-black uppercase tracking-widest text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"><Check size={28} strokeWidth={4} /> Próxima Série</button>
        </div>
      </div>
    )}
  </div>
);

const FinishedSessionView = ({ title, reset }: any) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in duration-500">
    <div className="size-24 bg-lime-400 text-black rounded-full flex items-center justify-center mb-8 shadow-2xl rotate-12"><Award size={48} strokeWidth={3} /></div>
    <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4 text-center">{title}</h2>
    <p className="text-zinc-500 font-medium mb-10 text-center">Desempenho excepcional. Ganhos garantidos.</p>
    <button onClick={reset} className="bg-white text-black px-12 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-lime-400 transition-all shadow-xl">Dashboard</button>
  </div>
);

export default App;
