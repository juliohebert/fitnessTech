import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Dumbbell, LayoutDashboard, Apple, TrendingUp, Trophy,
  ArrowLeft, ArrowRight, Flame, DollarSign, Search, ShoppingCart, 
  CheckCircle2, Clock, Info, Play, Weight,
  Check, X, Timer, SkipForward, Award, Circle, Droplets, Zap, Activity,
  Smartphone, QrCode, CreditCard, Wallet, Trash2, Coffee, Sun, Moon, Repeat, Plus,
  ChevronRight, CheckCircle, Video, Wrench, BookOpen, ExternalLink, PlayCircle,
  Timer as TimerIcon, ChevronDown, ChevronUp, History, RotateCcw, Users, Salad, Utensils, MousePointer2,
  Package, Tag, Filter, ShoppingBag, Percent, Scale, ZapOff, Target, ChevronLeft, User, Settings, Bell, ShieldCheck, Shield, LogOut, CreditCard as CardIcon, Save, Camera, Mail, Phone, Calendar, MoreVertical,
  MessageCircle, UserPlus, Pencil, Trash, Copy, BookMarked, Download, AlertTriangle, Eye, BarChart3, RefreshCw, ClipboardList, Hammer, Briefcase,
  Sparkles, Bot, Send, Loader2, BrainCircuit, ChefHat, Volume2, Upload, FileVideo, Mic, Watch, Heart, Bluetooth, Signal, FileText, XCircle, MapPin, Star, TrendingDown, Menu, Edit3, CalendarCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, Cell, 
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, AreaChart, Area, BarChart, Bar, Legend, LineChart, Line,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { GoogleGenerativeAI } from "@google/generative-ai";

// URL base da API
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3002';

// ===== BLUETOOTH HEART RATE MONITOR =====
class BluetoothHeartRateMonitor {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private listeners: ((rate: number) => void)[] = [];

  // UUIDs padrão do Bluetooth para Heart Rate Service
  private readonly HEART_RATE_SERVICE = 0x180D;
  private readonly HEART_RATE_MEASUREMENT = 0x2A37;

  async requestDevice(): Promise<BluetoothDevice | null> {
    try {
      if (!navigator.bluetooth) {
        console.warn('Web Bluetooth API não disponível neste navegador');
        return null;
      }

      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.HEART_RATE_SERVICE] }],
        optionalServices: [this.HEART_RATE_SERVICE]
      });

      console.log('✅ Dispositivo selecionado:', this.device.name);
      return this.device;
    } catch (err: any) {
      console.error('❌ Erro ao selecionar dispositivo:', err.message);
      return null;
    }
  }

  async connect(): Promise<boolean> {
    try {
      if (!this.device) {
        console.error('Nenhum dispositivo selecionado');
        return false;
      }

      console.log('🔄 Conectando ao servidor GATT...');
      this.server = await this.device.gatt!.connect();
      console.log('✅ Conectado ao servidor GATT');

      console.log('🔄 Obtendo serviço de Heart Rate...');
      const service = await this.server.getPrimaryService(this.HEART_RATE_SERVICE);
      console.log('✅ Serviço de Heart Rate obtido');

      console.log('🔄 Obtendo característica de Heart Rate Measurement...');
      this.characteristic = await service.getCharacteristic(this.HEART_RATE_MEASUREMENT);
      console.log('✅ Característica obtida');

      // Iniciar notificações
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged', this.handleHeartRateChanged.bind(this));
      console.log('✅ Monitoramento de batimento cardíaco iniciado!');

      return true;
    } catch (err: any) {
      console.error('❌ Erro ao conectar:', err.message);
      return false;
    }
  }

  private handleHeartRateChanged(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value!;
    
    // Parse Heart Rate Measurement
    // Byte 0: Flags
    // Byte 1: Heart Rate Value (se flags & 0x01 === 0, senão bytes 1-2)
    const flags = value.getUint8(0);
    const is16Bit = flags & 0x01;
    
    let heartRate: number;
    if (is16Bit) {
      heartRate = value.getUint16(1, true); // little-endian
    } else {
      heartRate = value.getUint8(1);
    }

    console.log('💓 BPM:', heartRate);
    
    // Notificar todos os listeners
    this.listeners.forEach(listener => listener(heartRate));
  }

  onHeartRateChange(callback: (rate: number) => void) {
    this.listeners.push(callback);
  }

  offHeartRateChange(callback: (rate: number) => void) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  async disconnect() {
    try {
      if (this.characteristic) {
        await this.characteristic.stopNotifications();
        this.characteristic.removeEventListener('characteristicvaluechanged', this.handleHeartRateChanged.bind(this));
      }
      if (this.server) {
        this.server.disconnect();
      }
      this.device = null;
      this.server = null;
      this.characteristic = null;
      this.listeners = [];
      console.log('✅ Desconectado do sensor de batimento cardíaco');
    } catch (err: any) {
      console.error('❌ Erro ao desconectar:', err.message);
    }
  }
}

// Instância global do monitor Bluetooth
declare global {
  interface Window {
    bluetoothHRM?: BluetoothHeartRateMonitor;
  }
}

if (typeof window !== 'undefined') {
  window.bluetoothHRM = new BluetoothHeartRateMonitor();
}

// --- AI CONFIG ---
// Initialize Gemini AI. Assumes API_KEY is available in import.meta.env
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY || '');

// --- AUTH CONTEXT ---
const AuthContext = React.createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('fitness_token');
  });

  useEffect(() => {
    if (token) {
      // Verificar token e carregar dados do usuário
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('📥 User data loaded:', userData);
        
        // Mapear funcao para role de forma segura
        const user = userData.user || userData.usuario;
        if (!user) {
          console.error('❌ Usuário não encontrado na resposta');
          logout();
          return;
        }
        
        const userWithRole = {
          ...user,
          role: user.funcao || user.role
        };
        
        console.log('👤 User com role mapeado:', userWithRole);
        
        setUser(userWithRole);
        setAcademia(userData.academia);
        setLoading(false);
      } else {
        console.error('❌ Falha ao carregar dados do usuário:', response.status);
        logout();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do usuário:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Login response data:', data);
        
        // Mapear funcao para role de forma segura
        const user = data.user || data.usuario;
        if (!user) {
          console.error('❌ Usuário não encontrado na resposta');
          return false;
        }
        
        const userWithRole = {
          ...user,
          role: user.funcao || user.role
        };
        
        console.log('👤 User com role mapeado:', userWithRole);
        
        setToken(data.token);
        setUser(userWithRole);
        setAcademia(data.academia);
        localStorage.setItem('fitness_token', data.token);
        return true;
      }
      
      const errorData = await response.text();
      console.error('❌ Login falhou:', response.status, errorData);
      return false;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Register response data:', data);
        
        // Mapear funcao para role de forma segura
        const user = data.user || data.usuario;
        if (!user) {
          console.error('❌ Usuário não encontrado na resposta');
          return false;
        }
        
        const userWithRole = {
          ...user,
          role: user.funcao || user.role
        };
        
        console.log('👤 User registrado com role mapeado:', userWithRole);
        
        setToken(data.token);
        setUser(userWithRole);
        setAcademia(data.academia);
        localStorage.setItem('fitness_token', data.token);
        return true;
      }
      
      const errorData = await response.text();
      console.error('❌ Registro falhou:', response.status, errorData);
      return false;
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setAcademia(null);
    setToken(null);
    localStorage.removeItem('fitness_token');
  };

  const isAuthenticated = !!user && !!token;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-400 mb-4"></div>
          <p className="text-lime-400 font-bold">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      academia,
      token,
      login,
      register,
      logout,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ... (Types and Interfaces remain the same)
type Role = 'ALUNO' | 'PROFESSOR' | 'NUTRI' | 'ADMIN';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  academiaId: string;
  avatar?: string;
  createdAt: Date;
}

interface Academia {
  id: string;
  name: string;
  logo?: string;
  subscription: 'BASIC' | 'PRO' | 'ENTERPRISE';
  maxUsers: number;
  features: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  academia: Academia | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  img: string;
  brand: string;
  category: string;
  stock: number;
  academiaId: string;
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


const FOOD_SUBSTITUTIONS: Record<string, string[]> = {
  'Frango': ['Peixe Branco', 'Lombo Suíno', 'Ovos', 'Tofu'],
  'Arroz': ['Batata Inglesa', 'Batata Doce', 'Mandioca', 'Macarrão'],
  'Aveia': ['Granola Sem Açúcar', 'Farinha de Arroz', 'Corn Flakes'],
  'Ovos': ['Albumina', 'Queijo Cotagge', 'Whey Protein'],
};

// Funções para carregar dados do módulo administrativo
const carregarLeads = async (token: string) => {
  // Endpoint não implementado - retornar vazio
  return [];
};

const carregarTicketsManutencao = async (token: string) => {
  // Endpoint não implementado - retornar vazio
  return [];
};

const carregarProdutos = async (token: string) => {
  // Endpoint não implementado - retornar vazio
  return [];
};

const carregarFuncionarios = async (token: string) => {
  // Endpoint não implementado - retornar vazio
  return [];
};

const carregarRelatoriosFinanceiros = async (token: string) => {
  // Endpoint não implementado - retornar vazio
  return [];
};

const carregarRegistrosAcesso = async (token: string, data?: string) => {
  // Endpoint não implementado - retornar vazio
  return [];
};

// Funções para os módulos aluno/professor/nutricionista
const carregarHistoricoTreinos = async (token: string, usuarioId?: string) => {
  try {
    const url = usuarioId ? `${API_URL}/api/historico-treinos?usuarioId=${usuarioId}` : `${API_URL}/api/historico-treinos`;
    console.log('🔍 Carregando treinos para usuarioId:', usuarioId);
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = response.ok ? await response.json() : [];
    console.log('📋 Treinos carregados:', data.length);
    return data;
  } catch (error) {
    console.error('Erro ao carregar histórico de treinos:', error);
    return [];
  }
};

const carregarHistoricoDietas = async (token: string, usuarioId?: string) => {
  try {
    const url = usuarioId ? `${API_URL}/api/historico-dietas?usuarioId=${usuarioId}` : `${API_URL}/api/historico-dietas`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error('Erro ao carregar histórico de dietas:', error);
    return [];
  }
};

const carregarMedicoes = async (token: string, usuarioId?: string) => {
  try {
    const url = usuarioId ? `/api/medicoes?usuarioId=${usuarioId}` : '/api/medicoes';
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error('Erro ao carregar medições:', error);
    return [];
  }
};

const carregarFotosProgresso = async (token: string, usuarioId?: string) => {
  try {
    const url = usuarioId ? `/api/fotos-progresso?usuarioId=${usuarioId}` : '/api/fotos-progresso';
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error('Erro ao carregar fotos de progresso:', error);
    return [];
  }
};

const carregarMetas = async (token: string, usuarioId?: string) => {
  try {
    const url = usuarioId ? `/api/metas?usuarioId=${usuarioId}` : '/api/metas';
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error('Erro ao carregar metas:', error);
    return [];
  }
};

const carregarGrupos = async (token: string) => {
  try {
    const response = await fetch('/api/grupos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error('Erro ao carregar grupos:', error);
    return [];
  }
};

const carregarNotificacoes = async (token: string) => {
  try {
    const response = await fetch('/api/notificacoes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error('Erro ao carregar notificações:', error);
    return [];
  }
};

const salvarTreino = async (token: string, dadosTreino: any) => {
  try {
    console.log('🔄 ===== FUNÇÃO SALVAR TREINO =====');
    console.log('🔄 Dados recebidos:', dadosTreino);
    console.log('🔄 Propriedade titulo:', dadosTreino.titulo);
    console.log('🔄 Propriedades do objeto:', Object.keys(dadosTreino));
    
    const bodyData = JSON.stringify(dadosTreino);
    console.log('🔄 Body que será enviado (string JSON):', bodyData);
    
    const response = await fetch(`${API_URL}/api/historico-treinos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: bodyData
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erro na resposta da API:', error);
      return null;
    }
    
    const resultado = await response.json();
    console.log('✅ Treino salvo com sucesso:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao salvar treino:', error);
    return null;
  }
};

const atualizarTreino = async (token: string, treinoId: string, dadosTreino: any) => {
  try {
    console.log('🔄 ===== FUNÇÃO ATUALIZAR TREINO =====');
    console.log('🔄 ID do treino:', treinoId);
    console.log('🔄 Dados para atualização:', dadosTreino);
    
    const bodyData = JSON.stringify(dadosTreino);
    console.log('🔄 Body que será enviado:', bodyData);
    
    const response = await fetch(`${API_URL}/api/historico-treinos/${treinoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: bodyData
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erro na resposta da API:', error);
      return null;
    }
    
    const resultado = await response.json();
    console.log('✅ Treino atualizado com sucesso:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao atualizar treino:', error);
    return null;
  }
};

const atualizarDieta = async (token: string, dietaId: string, dadosDieta: any) => {
  try {
    console.log('🔄 ===== FUNÇÃO ATUALIZAR DIETA =====');
    console.log('🔄 ID da dieta:', dietaId);
    console.log('🔄 Dados para atualização:', dadosDieta);
    
    const bodyData = JSON.stringify(dadosDieta);
    console.log('🔄 Body que será enviado:', bodyData);
    
    const response = await fetch(`${API_URL}/api/historico-dietas/${dietaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: bodyData
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erro na resposta da API:', error);
      return null;
    }
    
    const resultado = await response.json();
    console.log('✅ Dieta atualizada com sucesso:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao atualizar dieta:', error);
    return null;
  }
};

const salvarDieta = async (token: string, dadosDieta: any) => {
  try {
    console.log('📤 Enviando dieta para API:', dadosDieta);
    const response = await fetch(`${API_URL}/api/historico-dietas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dadosDieta)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta da API:', response.status, errorText);
      return null;
    }
    
    const result = await response.json();
    console.log('✅ Dieta salva com sucesso:', result);
    return result;
  } catch (error) {
    console.error('❌ Erro ao salvar dieta:', error);
    return null;
  }
};

const removerTreino = async (token: string, treinoId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/historico-treinos/${treinoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao remover treino:', response.status, errorText);
      return false;
    }
    
    console.log('✅ Treino removido com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao remover treino:', error);
    return false;
  }
};

const removerDieta = async (token: string, dietaId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/historico-dietas/${dietaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao remover dieta:', response.status, errorText);
      return false;
    }
    
    console.log('✅ Dieta removida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao remover dieta:', error);
    return false;
  }
};

// Funções para módulo de nutricionista
const carregarRefeicoesDisario = async (token: string, usuarioId?: string) => {
  try {
    const url = usuarioId ? `${API_URL}/api/refeicoes-diario?usuarioId=${usuarioId}` : `${API_URL}/api/refeicoes-diario`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error('Erro ao carregar refeições do diário:', error);
    return [];
  }
};

const salvarRefeicaoDiario = async (token: string, dadosRefeicao: any) => {
  try {
    const response = await fetch(`${API_URL}/api/refeicoes-diario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dadosRefeicao)
    });
    if (!response.ok) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('Erro ao salvar refeição:', error);
    return null;
  }
};

const atualizarFeedbackRefeicao = async (token: string, id: string, status: string, feedback: string) => {
  try {
    const response = await fetch(`${API_URL}/api/refeicoes-diario/${id}/feedback`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status, feedback })
    });
    if (!response.ok) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('Erro ao atualizar feedback:', error);
    return null;
  }
};

const carregarAnalisesComposicao = async (token: string, usuarioId?: string) => {
  try {
    const url = usuarioId ? `${API_URL}/api/analises-composicao?usuarioId=${usuarioId}` : `${API_URL}/api/analises-composicao`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error('Erro ao carregar análises de composição:', error);
    return [];
  }
};

const salvarAnaliseComposicao = async (token: string, dadosAnalise: any) => {
  try {
    const response = await fetch(`${API_URL}/api/analises-composicao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dadosAnalise)
    });
    if (!response.ok) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('Erro ao salvar análise de composição:', error);
    return null;
  }
};

const carregarConteudosEducacionais = async (token: string, categoria?: string, tipo?: string) => {
  try {
    let url = `${API_URL}/api/conteudos-educacionais`;
    const params = new URLSearchParams();
    if (categoria) params.append('categoria', categoria);
    if (tipo) params.append('tipo', tipo);
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error('Erro ao carregar conteúdos educacionais:', error);
    return [];
  }
};

const salvarConteudoEducacional = async (token: string, dadosConteudo: any) => {
  try {
    const response = await fetch(`${API_URL}/api/conteudos-educacionais`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dadosConteudo)
    });
    if (!response.ok) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('Erro ao salvar conteúdo educacional:', error);
    return null;
  }
};

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
  <div className="bg-zinc-900 border border-zinc-800 p-4 md:p-6 rounded-2xl relative overflow-hidden group active:translate-y-[-2px] transition-all shadow-xl">
    <div className={`absolute top-0 right-0 p-3 md:p-4 opacity-5 group-hover:scale-125 transition-transform duration-700 ${color}`}>{Icon && <Icon size={48} className="md:size-16" />}</div>
    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.15em] mb-1">{label}</p>
    <div className="flex flex-col gap-1">
      <p className={`text-2xl md:text-3xl font-black italic tracking-tighter ${color}`}>{value}</p>
      {trend && <span className="text-[8px] md:text-[9px] font-bold bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 w-fit">{trend}</span>}
    </div>
  </div>
);

const LoginForm = ({ setActiveView }: { setActiveView: (view: string) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [nomeAcademia, setNomeAcademia] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('ALUNO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const success = await login(email, senha);
        if (!success) {
          setError('Credenciais inválidas');
        } else {
          setActiveView('dashboard');
        }
      } else {
        const success = await register({
          email,
          senha,
          nome,
          nomeAcademia: selectedRole === 'ADMIN' ? nomeAcademia : undefined,
          role: selectedRole
        });
        if (!success) {
          setError('Erro ao criar conta');
        } else {
          setActiveView('dashboard');
        }
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[3rem] p-6 md:p-10 shadow-2xl">
          <div className="text-center mb-10">
            <div className="size-20 bg-lime-400 text-black rounded-[2rem] flex items-center justify-center mx-auto mb-6 rotate-3 border-[4px] border-zinc-950 shadow-xl">
              <Dumbbell size={40} strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-black italic uppercase text-white mb-2">FITNESS TECH</h1>
            <p className="text-zinc-500 font-medium">{isLogin ? 'Entre na sua conta' : 'Criar nova conta'}</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3 ml-2">
                  Tipo de Conta
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['ALUNO', 'PROFESSOR', 'NUTRI', 'ADMIN'] as Role[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                        selectedRole === role
                          ? 'bg-lime-400 text-black border-lime-400'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder-zinc-500 outline-none focus:border-lime-400 transition-colors"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder-zinc-500 outline-none focus:border-lime-400 transition-colors"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder-zinc-500 outline-none focus:border-lime-400 transition-colors"
                  />
                </div>
                {selectedRole === 'ADMIN' && (
                  <div>
                    <input
                      type="text"
                      placeholder="Nome da academia"
                      value={nomeAcademia}
                      onChange={(e) => setNomeAcademia(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder-zinc-500 outline-none focus:border-lime-400 transition-colors"
                    />
                    <p className="text-xs text-zinc-600 mt-2 ml-2">
                      Como ADMIN, você será o proprietário da academia
                    </p>
                  </div>
                )}
                {selectedRole !== 'ADMIN' && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      <span className="text-lime-400 font-bold">Nota:</span> Para se registrar como {selectedRole}, 
                      você precisará solicitar acesso ao administrador da sua academia após criar a conta.
                    </p>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime-400 text-black py-4 rounded-2xl font-black uppercase text-sm hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                isLogin ? 'Entrar' : 'Criar Conta'
              )}
            </button>
          </form>

          <div className="text-center mt-8">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-zinc-500 hover:text-white transition-colors font-medium text-sm"
            >
              {isLogin ? 'Não tem conta? Registre-se aqui' : 'Já tem conta? Faça login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE DE GERENCIAMENTO DE USUÁRIOS (ADMIN) =====
const UserManagement: React.FC = () => {
  const { user, academia } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [instrutores, setInstrutores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVinculoModal, setShowVinculoModal] = useState(false);
  const [selectedAluno, setSelectedAluno] = useState<any>(null);

  useEffect(() => {
    carregarUsuarios();
    carregarInstrutores();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const token = localStorage.getItem('fitness_token');
      const response = await fetch(`${API_URL}/api/admin/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarInstrutores = async () => {
    try {
      const token = localStorage.getItem('fitness_token');
      const response = await fetch(`${API_URL}/api/admin/instrutores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInstrutores(data);
      }
    } catch (error) {
      console.error('Erro ao carregar instrutores:', error);
    }
  };

  const alternarStatus = async (usuarioId: string, ativo: boolean) => {
    try {
      const token = localStorage.getItem('fitness_token');
      const response = await fetch(`${API_URL}/api/admin/usuarios/${usuarioId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ativo: !ativo })
      });
      
      if (response.ok) {
        carregarUsuarios();
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const vincularInstrutor = async (alunoId: string, instrutorId: string, tipoInstrutor: string) => {
    try {
      const token = localStorage.getItem('fitness_token');
      const response = await fetch(`${API_URL}/api/admin/vinculos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ alunoId, instrutorId, tipoInstrutor })
      });
      
      if (response.ok) {
        setShowVinculoModal(false);
        alert('Vínculo criado com sucesso!');
      } else {
        const error = await response.json();
        alert(error.erro || 'Erro ao criar vínculo');
      }
    } catch (error) {
      console.error('Erro ao vincular instrutor:', error);
      alert('Erro ao criar vínculo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={48} className="animate-spin text-lime-400" />
      </div>
    );
  }

  const alunos = usuarios.filter(u => u.funcao === 'ALUNO');
  const professores = usuarios.filter(u => u.funcao === 'PROFESSOR');
  const nutricionistas = usuarios.filter(u => u.funcao === 'NUTRI');
  const admins = usuarios.filter(u => u.funcao === 'ADMIN');

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">
          Gerenciar Usuários
        </h2>
        <p className="text-zinc-500 font-medium">
          Administre alunos, professores e nutricionistas da {academia?.name}
        </p>
      </header>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-lime-500/20 to-lime-600/10 p-6 rounded-3xl border border-lime-500/30">
          <Users size={32} className="text-lime-400 mb-2" />
          <p className="text-3xl font-black">{alunos.length}</p>
          <p className="text-sm text-zinc-400">{alunos.length === 1 ? 'Aluno' : 'Alunos'}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-6 rounded-3xl border border-blue-500/30">
          <Dumbbell size={32} className="text-blue-400 mb-2" />
          <p className="text-3xl font-black">{professores.length}</p>
          <p className="text-sm text-zinc-400">{professores.length === 1 ? 'Professor' : 'Professores'}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-6 rounded-3xl border border-green-500/30">
          <Apple size={32} className="text-green-400 mb-2" />
          <p className="text-3xl font-black">{nutricionistas.length}</p>
          <p className="text-sm text-zinc-400">{nutricionistas.length === 1 ? 'Nutricionista' : 'Nutricionistas'}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-purple-500/30">
          <Shield size={32} className="text-purple-400 mb-2" />
          <p className="text-3xl font-black">{admins.length}</p>
          <p className="text-sm text-zinc-400">{admins.length === 1 ? 'Administrador' : 'Administradores'}</p>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-3xl overflow-x-auto">
        <table className="w-full min-w-[800px]">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="text-left p-3 md:p-4 font-black uppercase text-[10px] md:text-xs tracking-wider">Nome</th>
                <th className="text-left p-3 md:p-4 font-black uppercase text-[10px] md:text-xs tracking-wider">Email</th>
                <th className="text-left p-3 md:p-4 font-black uppercase text-[10px] md:text-xs tracking-wider">Função</th>
                <th className="text-left p-3 md:p-4 font-black uppercase text-[10px] md:text-xs tracking-wider">Status</th>
                <th className="text-left p-3 md:p-4 font-black uppercase text-[10px] md:text-xs tracking-wider">Cadastro</th>
                <th className="text-left p-3 md:p-4 font-black uppercase text-[10px] md:text-xs tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-t border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-black font-black text-sm md:text-base">
                        {usuario.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm md:text-base">{usuario.nome}</span>
                    </div>
                  </td>
                  <td className="p-3 md:p-4 text-zinc-400 text-xs md:text-sm">{usuario.email}</td>
                  <td className="p-3 md:p-4">
                    <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase whitespace-nowrap ${
                      usuario.funcao === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                      usuario.funcao === 'PROFESSOR' ? 'bg-blue-500/20 text-blue-400' :
                      usuario.funcao === 'NUTRI' ? 'bg-green-500/20 text-green-400' :
                      'bg-lime-500/20 text-lime-400'
                    }`}>
                      {usuario.funcao}
                    </span>
                  </td>
                  <td className="p-3 md:p-4">
                    <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap ${
                      usuario.ativo ? 'bg-lime-500/20 text-lime-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {usuario.ativo ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                  <td className="p-3 md:p-4 text-zinc-400 text-xs md:text-sm whitespace-nowrap">
                    {new Date(usuario.criadoEm).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-3 md:p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => alternarStatus(usuario.id, usuario.ativo)}
                        className={`px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-colors whitespace-nowrap ${
                          usuario.ativo 
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                            : 'bg-lime-500/20 text-lime-400 hover:bg-lime-500/30'
                        }`}
                      >
                        {usuario.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      {usuario.funcao === 'ALUNO' && (
                        <button
                          onClick={() => {
                            setSelectedAluno(usuario);
                            setShowVinculoModal(true);
                          }}
                          className="px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors whitespace-nowrap"
                        >
                          Vincular
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {/* Modal de Vínculo */}
      {showVinculoModal && selectedAluno && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-black mb-6">
              Vincular Instrutor ao Aluno
            </h3>
            <p className="text-zinc-400 mb-6">
              Aluno: <span className="text-white font-bold">{selectedAluno.nome}</span>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-lime-400">
                  Professores
                </h4>
                {professores.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nenhum professor cadastrado</p>
                ) : (
                  <div className="space-y-2">
                    {professores.map(prof => (
                      <button
                        key={prof.id}
                        onClick={() => vincularInstrutor(selectedAluno.id, prof.id, 'PROFESSOR')}
                        className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition-colors"
                      >
                        <p className="font-semibold">{prof.nome}</p>
                        <p className="text-xs text-zinc-400">{prof.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-green-400">
                  Nutricionistas
                </h4>
                {nutricionistas.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nenhum nutricionista cadastrado</p>
                ) : (
                  <div className="space-y-2">
                    {nutricionistas.map(nutri => (
                      <button
                        key={nutri.id}
                        onClick={() => vincularInstrutor(selectedAluno.id, nutri.id, 'NUTRI')}
                        className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition-colors"
                      >
                        <p className="font-semibold">{nutri.nome}</p>
                        <p className="text-xs text-zinc-400">{nutri.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setShowVinculoModal(false);
                setSelectedAluno(null);
              }}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CalendarBase = ({ title, sub, selectedDay, setSelectedDay, days, children, headerButton }: any) => (
  <div className="animate-in fade-in duration-700 space-y-6">
    <header className="flex flex-col gap-4">
      <div><h2 className="text-3xl md:text-4xl lg:text-5xl font-black italic uppercase tracking-tighter mb-1 leading-none">{title}</h2><p className="text-xs md:text-sm text-zinc-500 font-medium">{sub}</p></div>
      <div className="flex flex-col gap-3">
        {headerButton}
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-2xl gap-1 shadow-xl overflow-x-auto no-scrollbar">
          {days.map((day: string, idx: number) => (<button key={idx} onClick={() => setSelectedDay(idx)} className={`min-w-[3.5rem] h-11 flex items-center justify-center rounded-xl transition-all text-[9px] font-black uppercase tracking-widest px-2 active:scale-95 ${selectedDay === idx ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20' : 'text-zinc-500 active:bg-zinc-800'}`}>{day}</button>))}
        </div>
      </div>
    </header>
    <div className="min-h-[40vh]">{children}</div>
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
      
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const chat = model.startChat({
        history: history.map(h => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.parts[0].text }]
        })),
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const result = await chat.sendMessage(userMsg);
      const response = await result.response;
      setMessages(prev => [...prev, { role: 'model', text: response.text() || "Desculpe, não consegui processar." }]);
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
  // Verificação de segurança para exercises
  const exercises = Array.isArray(workout?.exercises) ? workout.exercises : [];
  
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, number>>(() => {
    // Inicializa progresso zerado para cada exercício
    const initial: Record<string, number> = {};
    exercises.forEach((ex: any) => {
      // Garantir que cada exercício tenha um ID único
      const exerciseId = ex.id || ex.n || `ex-${Date.now()}-${Math.random()}`;
      initial[exerciseId] = 0;
    });
    return initial;
  });
  const [expandedId, setExpandedId] = useState<string | null>(exercises[0]?.id || exercises[0]?.n || null);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [restingExerciseId, setRestingExerciseId] = useState<string | null>(null);
  const [restSeconds, setRestSeconds] = useState<number>(0);
  
  // AI Posture & Voice States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [postureFeedback, setPostureFeedback] = useState<string | null>(null);
  const [showPostureModal, setShowPostureModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Heart Rate Monitoring - Real & Simulated
  const [bpm, setBpm] = useState(85);
  const [cal, setCal] = useState(0);
  const [isRealSensor, setIsRealSensor] = useState(false);

  useEffect(() => {
    let interval: any;
    if (restingExerciseId && restSeconds > 0) interval = setInterval(() => setRestSeconds((p: number) => p - 1), 1000);
    else if (restSeconds === 0) setRestingExerciseId(null);
    return () => clearInterval(interval);
  }, [restingExerciseId, restSeconds]);

  // Real or Simulated Heart Rate
  useEffect(() => {
    if (!watchConnected) {
      setIsRealSensor(false);
      return;
    }

    // Tenta conectar ao sensor real via Bluetooth
    const connectRealSensor = async () => {
      try {
        const hrMonitor = await window.bluetoothHRM?.connect();
        if (hrMonitor) {
          setIsRealSensor(true);
          console.log('✅ Sensor real conectado!');
        }
      } catch (err) {
        console.log('⚠️ Sensor real não disponível, usando simulação');
        setIsRealSensor(false);
      }
    };

    connectRealSensor();

    // Simulação caso sensor real não esteja disponível
    if (!isRealSensor) {
      const interval = setInterval(() => {
        setBpm(prev => Math.min(185, Math.max(90, prev + Math.floor(Math.random() * 10) - 4)));
        setCal(prev => prev + 0.2);
      }, 2000);
      return () => clearInterval(interval);
    }

    return () => {
      window.bluetoothHRM?.disconnect();
    };
  }, [watchConnected, isRealSensor]);

  // Receber dados do sensor real
  useEffect(() => {
    if (!isRealSensor || !watchConnected) return;

    const handleHeartRate = (rate: number) => {
      setBpm(rate);
      setCal(prev => prev + 0.15); // Calcula calorias baseado na FC real
    };

    window.bluetoothHRM?.onHeartRateChange(handleHeartRate);

    return () => {
      window.bluetoothHRM?.offHeartRateChange(handleHeartRate);
    };
  }, [isRealSensor, watchConnected]);

  const totalPossibleSets: number = exercises.reduce((acc: number, ex: any) => {
    const sets = typeof ex.s === 'string' ? parseInt(ex.s) : Number(ex.s);
    return acc + (isNaN(sets) ? 0 : sets);
  }, 0);
  
  const totalCompletedSets: number = exercises.reduce((acc: number, ex: any) => {
    const exerciseId = ex.id || ex.n || `ex-${Date.now()}-${Math.random()}`;
    return acc + (exerciseProgress[exerciseId] || 0);
  }, 0);
  
  const workoutPercentage = totalPossibleSets > 0 ? Math.min(100, (totalCompletedSets / totalPossibleSets) * 100) : 0;

  // Verificar se todos os exercícios foram completados
  useEffect(() => {
    if (!exercises || exercises.length === 0) return;
    
    const allCompleted = exercises.every((ex: any) => {
      const exerciseId = ex.id || ex.n || `ex-${Date.now()}-${Math.random()}`;
      const completed = exerciseProgress[exerciseId] || 0;
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
  }, [exerciseProgress, exercises, totalCompletedSets, totalPossibleSets, onFinish]);

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
      
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent([
        "Analise a técnica deste exercício de musculação baseado nesses frames do vídeo. Identifique erros de postura (como valgo, coluna torta, amplitude) e dê 3 dicas de correção diretas e motivadoras. Responda em português.",
        ...parts
      ]);
      const response = await result.response;
      setPostureFeedback(response.text() || "Não foi possível analisar o vídeo.");
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
               <div className="flex flex-col items-center gap-0.5">
                 <div className="flex items-center gap-1.5 text-red-500 font-black italic text-xs animate-in slide-in-from-top-2">
                    <Heart size={10} fill="currentColor" className="animate-pulse"/> {bpm} BPM
                 </div>
                 {isRealSensor && (
                   <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full">
                     <div className="size-1.5 bg-green-500 rounded-full animate-pulse" />
                     <span className="text-[7px] font-black uppercase text-green-400 tracking-wider">SENSOR REAL</span>
                   </div>
                 )}
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
        {exercises.map((ex: any, idx: number) => {
          const exerciseId = ex.id || ex.n || `ex-${idx}`;
          const completed = exerciseProgress[exerciseId] || 0;
          const isDone = completed === Number(ex.s);
          const isExpanded = expandedId === exerciseId;
          const isResting = restingExerciseId === exerciseId;
          return (
            <div key={exerciseId} className={`bg-zinc-900 border transition-all duration-300 rounded-[2.5rem] overflow-hidden ${isDone ? 'border-zinc-800/50 opacity-50' : isExpanded ? 'border-lime-400/40 shadow-2xl' : 'border-zinc-800 hover:border-zinc-700'}`}>
              <div className="p-8 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : exerciseId)}>
                <div className="flex items-center gap-5">
                  <div className={`size-14 rounded-2xl border-2 flex items-center justify-center transition-all ${isDone ? 'bg-zinc-800 border-zinc-700 text-zinc-500' : isExpanded ? 'bg-lime-400 border-lime-400 text-black shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>{isDone ? <Check size={28} strokeWidth={4} /> : <span className="text-lg font-black italic tracking-tighter">{idx + 1}</span>}</div>
                  <div>
                    <h4 className={`font-black italic uppercase tracking-tight text-xl leading-none mb-1.5 ${isDone ? 'line-through text-zinc-600' : ''}`}>{ex.n}</h4>
                    <div className="flex items-center gap-3"><span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{ex.group || 'Geral'}</span><div className="size-1 bg-zinc-800 rounded-full" /><span className="text-[10px] font-black uppercase text-lime-400 tracking-widest">{completed} de {ex.s} séries</span></div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={24} className="text-zinc-600" /> : <ChevronDown size={24} className="text-zinc-600" />}
              </div>
              {isExpanded && (
                <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-zinc-800 relative group">
                      {ex.video && isYouTubeUrl(ex.video) ? (
                        <iframe 
                          src={getYouTubeEmbedUrl(ex.video) || ex.video} 
                          className="w-full h-full" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        />
                      ) : ex.video ? (
                        <video src={ex.video} loop muted playsInline controls className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Video size={48} />
                        </div>
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
                           <button onClick={() => handleVoiceGuidance((ex.orientations || ['Execute o movimento com boa técnica']).join('. '))} className={`flex items-center gap-2 text-[10px] font-black uppercase transition-colors px-3 py-1.5 rounded-lg border ${isSpeaking ? 'bg-lime-400 text-black border-lime-400 animate-pulse' : 'bg-zinc-900 text-lime-400 border-zinc-800 hover:border-lime-400/50'}`}>
                              {isSpeaking ? <Volume2 size={12} className="animate-bounce"/> : <Volume2 size={12}/>} 
                              {isSpeaking ? 'Falando...' : 'Ouvir Dicas'}
                           </button>
                        </div>
                        <ul className="space-y-2">{(ex.orientations || ['Execute o movimento com boa técnica', 'Mantenha a respiração controlada']).map((item: string, i: number) => (<li key={i} className="text-xs text-zinc-400 italic"><span className="text-lime-400 font-black mr-1">{i+1}.</span> {item}</li>))}</ul>
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
                           const next = (exerciseProgress[exerciseId] || 0) + 1; 
                           setExerciseProgress({...exerciseProgress, [exerciseId]: next}); 
                           const requiredSets = typeof ex.s === 'string' ? parseInt(ex.s) : Number(ex.s);
                           if(next >= requiredSets) {
                             // Exercício completo - avançar para o próximo
                             const currentIndex = exercises.findIndex((e: any) => (e.id || e.n) === exerciseId);
                             const nextExercise = exercises[currentIndex + 1];
                             if(nextExercise) {
                               setExpandedId(nextExercise.id || nextExercise.n);
                             } else {
                               setExpandedId(null);
                             }
                           } else { 
                             setRestingExerciseId(exerciseId); 
                             setRestSeconds(typeof ex.rest === 'string' ? parseInt(ex.rest) : Number(ex.rest) || 90); 
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
           <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300 relative" onClick={e => e.stopPropagation()}>
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
                    <div className="bg-gradient-to-br from-lime-400/10 to-emerald-500/10 border border-lime-400/30 p-6 rounded-3xl max-h-[70vh] overflow-y-auto">
                       <div className="flex items-center gap-3 mb-6 pb-4 border-b border-lime-400/20">
                          <div className="size-10 bg-lime-400 rounded-xl flex items-center justify-center">
                             <Sparkles size={20} className="text-black"/>
                          </div>
                          <div>
                             <h4 className="text-sm font-black uppercase text-white">Análise Completa</h4>
                             <p className="text-xs text-lime-400">Coach AI • Biomecânica</p>
                          </div>
                       </div>
                       
                       {/* Parse e formata o feedback em seções */}
                       <div className="space-y-4">
                          {postureFeedback.split('\n\n').map((section: string, idx: number) => {
                             const lines = section.trim().split('\n');
                             const title = lines[0];
                             const isTitle = title.includes('**') || title.includes(':') || title.match(/^\d+\./);
                             
                             return (
                                <div key={idx} className={`${isTitle ? 'bg-zinc-900/50 p-4 rounded-xl' : ''}`}>
                                   {isTitle ? (
                                      <>
                                         <h5 className="text-sm font-black uppercase text-lime-400 mb-2 flex items-center gap-2">
                                            {title.includes('Positivo') || title.includes('✅') ? 
                                               <CheckCircle size={16} className="text-green-400"/> : 
                                             title.includes('Melhoria') || title.includes('Correção') ? 
                                               <AlertTriangle size={16} className="text-orange-400"/> :
                                             title.includes('Risco') || title.includes('Lesão') ?
                                               <XCircle size={16} className="text-red-400"/> :
                                               <ChevronRight size={16}/>
                                            }
                                            {title.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '')}
                                         </h5>
                                         {lines.slice(1).map((line: string, i: number) => (
                                            <p key={i} className="text-sm text-zinc-300 leading-relaxed ml-6 mb-1">
                                               {line.startsWith('-') ? 
                                                  <span className="flex items-start gap-2">
                                                     <span className="text-lime-400 mt-1">•</span>
                                                     <span>{line.replace(/^-\s*/, '')}</span>
                                                  </span> : 
                                                  line
                                               }
                                            </p>
                                         ))}
                                      </>
                                   ) : (
                                      <p className="text-sm text-zinc-300 leading-relaxed">{section}</p>
                                   )}
                                </div>
                             );
                          })}
                       </div>
                    </div>
                    <button onClick={() => setPostureFeedback(null)} className="w-full bg-lime-400 text-black py-4 rounded-2xl font-black uppercase text-xs hover:bg-lime-300 transition-colors flex items-center justify-center gap-2">
                       <RotateCcw size={16}/>
                       Nova Análise
                    </button>
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
    <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 leading-none">DOMINADO!</h2>
    <p className="text-zinc-500 text-xl font-medium mb-12 max-w-sm">Você destruiu a sessão de hoje em <span className="text-white font-black">{formatTime(totalTime)}</span>.</p>
    <button onClick={reset} className="bg-white text-black px-16 py-6 rounded-3xl font-black uppercase tracking-widest text-lg flex items-center gap-4 hover:scale-105 transition-all shadow-2xl">IR PARA O PAINEL <ArrowRight size={24} /></button>
  </div>
);

const WorkoutDetailCard = ({ workout, onStart, onGenerateAI }: any) => {
  if (!workout) return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-12 text-center shadow-2xl">
      <div className="size-16 md:size-24 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-6">
        <Dumbbell size={32} className="text-zinc-700 md:size-12"/>
      </div>
      <h3 className="text-xl md:text-3xl font-black italic uppercase mb-3">Nenhum Treino Prescrito</h3>
      <p className="text-zinc-500 text-sm font-medium mb-6 max-w-md mx-auto">
        Seu instrutor ainda não prescreveu treinos. Entre em contato com ele para receber seu plano de treinos personalizado!
      </p>
      {onGenerateAI && (
        <button
          onClick={onGenerateAI}
          className="bg-lime-400 active:bg-lime-300 text-black px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] flex items-center gap-2 mx-auto shadow-xl active:scale-95 transition-all"
        >
          <Sparkles size={16} />
          Gerar Treino com IA
        </button>
      )}
    </div>
  );
  
  // Verificação de segurança para exercises
  const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
  
  if (exercises.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-12 text-center shadow-2xl">
        <div className="size-16 md:size-24 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-700">
          <RotateCcw size={32} className="md:size-12" />
        </div>
        <h3 className="text-xl md:text-3xl font-black italic uppercase mb-2">Dia de Descanso</h3>
        <p className="text-zinc-500 text-xs md:text-sm font-bold uppercase tracking-widest">Foque na recuperação.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 lg:p-10 shadow-2xl">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="bg-lime-400 text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Série {workout.category}</span>
        <span className="text-zinc-500 text-xs font-bold flex items-center gap-1.5"><Clock size={14} /> {workout.duration}</span>
      </div>
      <h3 className="text-2xl md:text-3xl lg:text-4xl font-black italic uppercase tracking-tighter mb-6 md:mb-8 leading-tight">{workout.title}</h3>
      <div className="grid grid-cols-1 gap-3 mb-6">{exercises.map((ex: any, i: number) => (<div key={i} className="flex items-center justify-between p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800 active:bg-zinc-950 active:scale-[0.98] transition-all"><div className="flex items-center gap-3 min-w-0 flex-1"><div className="size-9 bg-zinc-900 rounded-xl flex items-center justify-center text-lime-400 font-black italic text-sm shrink-0">{i+1}</div><div className="min-w-0"><p className="font-bold text-sm truncate uppercase tracking-tight italic">{ex.nome || ex.exercicio || ex.n}</p><p className="text-[10px] text-zinc-500 font-bold uppercase">{ex.s}X {ex.r} • {ex.w} • {ex.rest}s</p></div></div></div>))}</div>
      <button onClick={onStart} className="w-full bg-lime-400 text-black py-5 md:py-6 rounded-2xl font-black uppercase tracking-widest text-base md:text-lg flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all shadow-lime-400/20"><Play size={24} fill="currentColor" /> COMEÇAR AGORA</button>
    </div>
  );
};

const EvolutionView = () => {
  // Simular dados vazios (sem histórico de evolução cadastrado)
  const weightHistory: any[] = [];
  const liftProgress: any[] = [];
  const personalRecords: any[] = [];

  return (
    <div className="animate-in fade-in duration-700 space-y-12 min-h-screen text-white">
      {/* Empty State */}
      {weightHistory.length === 0 && liftProgress.length === 0 && personalRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="size-24 bg-lime-400/10 text-lime-400 rounded-3xl flex items-center justify-center mb-6">
            <TrendingUp size={48} />
          </div>
          <h2 className="text-3xl font-black italic text-white mb-3">
            Nenhum Dado de Evolução
          </h2>
          <p className="text-zinc-400 max-w-md mb-8">
            Comece a registrar pesos, medidas e treinos para acompanhar a evolução do aluno.
          </p>
          <button className="px-8 py-4 bg-lime-400 hover:bg-lime-500 text-black rounded-full font-black uppercase text-sm tracking-wider transition-all">
            Registrar Dados
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem] shadow-2xl">
              <div className="flex justify-between items-start mb-10"><div><p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Peso Corporal (kg)</p><h4 className="text-3xl font-black italic text-white">-4.3kg este mês</h4></div><div className="size-12 bg-lime-400/10 text-lime-400 rounded-2xl flex items-center justify-center"><Scale size={24} /></div></div>
              <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weightHistory}><defs><linearGradient id="colorW" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D9FF00" stopOpacity={0.3}/><stop offset="95%" stopColor="#D9FF00" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Area type="monotone" dataKey="weight" stroke="#D9FF00" strokeWidth={4} fill="url(#colorW)" /></AreaChart></ResponsiveContainer></div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem] shadow-2xl">
              <div className="flex justify-between items-start mb-10"><div><p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Progressão de Carga (kg)</p><h4 className="text-3xl font-black italic text-blue-400">+22kg total</h4></div><div className="size-12 bg-blue-400/10 text-blue-400 rounded-2xl flex items-center justify-center"><Zap size={24} /></div></div>
              <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={liftProgress}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="week" stroke="#52525b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Bar dataKey="load" fill="#3b82f6" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-2xl">
            <h4 className="text-xl font-black italic uppercase tracking-tighter mb-10 flex items-center gap-3"><Trophy size={20} className="text-orange-400"/> Recordes Pessoais</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {personalRecords.map((record, i) => (
                <div key={i} className="bg-zinc-950 border border-zinc-800 p-6 rounded-[2rem] hover:border-zinc-700 transition-all group">
                  <div className="flex justify-between items-start mb-6"><div className={`p-3 rounded-xl bg-zinc-900 ${record.color}`}>{record.icon}</div><span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{record.date}</span></div>
                  <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">{record.exercise}</p>
                  <p className="text-4xl font-black italic text-white tracking-tighter group-hover:scale-110 transition-transform origin-left">{record.weight}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ==================== CARDIO VIEW ====================

const CardioView = () => {
  const [activeTab, setActiveTab] = useState<'historico' | 'registrar' | 'gps' | 'integracoes' | 'stats'>('historico');
  const [atividades, setAtividades] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [integracoes, setIntegracoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Registro manual
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [novaAtividade, setNovaAtividade] = useState({
    tipo: 'CORRIDA',
    duracao: '',
    distancia: '',
    calorias: '',
    fcMedia: '',
    fcMaxima: '',
    sensacao: '5',
    clima: '',
    observacoes: ''
  });

  // GPS ao vivo
  const [gpsAtiva, setGpsAtiva] = useState(false);
  const [sessaoAtual, setSessaoAtual] = useState<any>(null);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [distanciaPercorrida, setDistanciaPercorrida] = useState(0);
  const [velocidadeAtual, setVelocidadeAtual] = useState(0);
  const [rotaGPS, setRotaGPS] = useState<any[]>([]);

  useEffect(() => {
    carregarAtividades();
    carregarStats();
    carregarIntegracoes();
  }, []);

  // Timer GPS
  useEffect(() => {
    if (gpsAtiva && sessaoAtual) {
      const interval = setInterval(() => {
        setTempoDecorrido(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gpsAtiva, sessaoAtual]);

  const carregarAtividades = async () => {
    try {
      setIsLoading(true);
      const { cardioAPI } = await import('./src/api');
      const data = await cardioAPI.getAll({ limit: 20 });
      setAtividades(data);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const carregarStats = async () => {
    try {
      const { cardioAPI } = await import('./src/api');
      const data = await cardioAPI.getStats('mes');
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const carregarIntegracoes = async () => {
    try {
      const { integracoesAPI } = await import('./src/api');
      const data = await integracoesAPI.getAll();
      setIntegracoes(data);
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
    }
  };

  const registrarAtividade = async () => {
    try {
      const { cardioAPI } = await import('./src/api');
      await cardioAPI.create({
        tipo: novaAtividade.tipo,
        duracao: parseInt(novaAtividade.duracao) * 60, // converter minutos para segundos
        distancia: novaAtividade.distancia ? parseFloat(novaAtividade.distancia) : undefined,
        calorias: novaAtividade.calorias ? parseInt(novaAtividade.calorias) : undefined,
        fcMedia: novaAtividade.fcMedia ? parseInt(novaAtividade.fcMedia) : undefined,
        fcMaxima: novaAtividade.fcMaxima ? parseInt(novaAtividade.fcMaxima) : undefined,
        sensacao: parseInt(novaAtividade.sensacao),
        clima: novaAtividade.clima || undefined,
        observacoes: novaAtividade.observacoes || undefined
      });
      
      alert('✅ Atividade registrada com sucesso!');
      setShowRegistroModal(false);
      setNovaAtividade({
        tipo: 'CORRIDA',
        duracao: '',
        distancia: '',
        calorias: '',
        fcMedia: '',
        fcMaxima: '',
        sensacao: '5',
        clima: '',
        observacoes: ''
      });
      await carregarAtividades();
      await carregarStats();
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
      alert('❌ Erro ao registrar atividade');
    }
  };

  const iniciarGPS = async () => {
    try {
      const { cardioAPI } = await import('./src/api');
      const sessao = await cardioAPI.gpsStart(novaAtividade.tipo);
      setSessaoAtual(sessao);
      setGpsAtiva(true);
      setTempoDecorrido(0);
      setDistanciaPercorrida(0);
      setRotaGPS([]);
      
      // Iniciar rastreamento GPS
      if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition((position) => {
          const novoPonto = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
            elevation: position.coords.altitude
          };
          
          setRotaGPS(prev => {
            const novaRota = [...prev, novoPonto];
            
            // Calcular distância
            if (prev.length > 0) {
              const ultimoPonto = prev[prev.length - 1];
              const dist = calcularDistancia(ultimoPonto.lat, ultimoPonto.lng, novoPonto.lat, novoPonto.lng);
              setDistanciaPercorrida(d => d + dist);
              
              // Calcular velocidade (km/h)
              const tempoDecorridoHoras = (novoPonto.timestamp - ultimoPonto.timestamp) / 3600000;
              if (tempoDecorridoHoras > 0) {
                setVelocidadeAtual(dist / tempoDecorridoHoras);
              }
            }
            
            return novaRota;
          });
        }, (error) => {
          console.error('Erro no GPS:', error);
        }, {
          enableHighAccuracy: true,
          maximumAge: 0
        });
      }
    } catch (error) {
      console.error('Erro ao iniciar GPS:', error);
      alert('❌ Erro ao iniciar GPS');
    }
  };

  const finalizarGPS = async () => {
    try {
      if (!sessaoAtual) return;
      
      const { cardioAPI } = await import('./src/api');
      
      // Atualizar rota final
      await cardioAPI.gpsUpdate(sessaoAtual.id, {
        pontos: rotaGPS,
        duracao: tempoDecorrido,
        distancia: distanciaPercorrida,
        velocidade: velocidadeAtual
      });
      
      // Finalizar sessão
      await cardioAPI.gpsFinish(sessaoAtual.id, {
        calorias: parseInt(novaAtividade.calorias) || undefined,
        fcMedia: parseInt(novaAtividade.fcMedia) || undefined,
        fcMaxima: parseInt(novaAtividade.fcMaxima) || undefined,
        sensacao: parseInt(novaAtividade.sensacao),
        observacoes: novaAtividade.observacoes || undefined
      });
      
      setGpsAtiva(false);
      setSessaoAtual(null);
      alert('✅ Treino finalizado com sucesso!');
      await carregarAtividades();
      await carregarStats();
    } catch (error) {
      console.error('Erro ao finalizar GPS:', error);
      alert('❌ Erro ao finalizar treino');
    }
  };

  const sincronizarAppleHealth = async () => {
    try {
      const explicacao = `🍎 INTEGRAÇÃO APPLE HEALTH

⚠️ LIMITAÇÃO: Apple não permite acesso via Web
Navegadores não podem acessar o HealthKit diretamente.

✅ ALTERNATIVAS DISPONÍVEIS:

1️⃣ EXPORTAR DO APPLE HEALTH (Manual):
   • Abra Apple Health no iPhone
   • Toque no perfil (canto superior direito)
   • "Exportar Todos os Dados de Saúde"
   • Aguarde arquivo .zip
   • (EM BREVE: Upload aqui no app)

2️⃣ USAR STRAVA (Automático):
   • Configure Strava no Apple Watch
   • Seus treinos sincronizam automaticamente
   • Use "Conectar Strava" aqui no Cardio
   • Importa tudo automaticamente!

3️⃣ MANUAL (Já disponível):
   • Use "Registrar Manual" no Cardio
   • Copie dados do Apple Health
   • Cole aqui manualmente

🔜 EM DESENVOLVIMENTO:
App iOS nativo com integração HealthKit real.

Recomendamos usar STRAVA para sincronização automática! 🚴`;

      alert(explicacao);
    } catch (error) {
      console.error('Erro ao sincronizar Apple Health:', error);
    }
  };

  const sincronizarGoogleFit = async () => {
    try {
      // TODO: Implementar integração real com Google Fit API
      alert('🟢 Google Fit: Em breve! Use a API do Google Fit para importar sessões.');
    } catch (error) {
      console.error('Erro ao sincronizar Google Fit:', error);
    }
  };

  const conectarStrava = async () => {
    try {
      const { integracoesAPI } = await import('./src/api');
      
      // Verificar se já está conectado
      const integracoes = await integracoesAPI.getAll();
      const stravaConectado = integracoes.some((i: any) => i.plataforma === 'STRAVA' && i.ativo);
      
      if (stravaConectado) {
        // Se já está conectado, sincronizar
        if (!confirm('Strava já conectado. Deseja sincronizar atividades?')) return;
        
        const resultado = await integracoesAPI.stravaSync();
        alert(`✅ ${resultado.importadas} novas atividades importadas!\nTotal de atividades encontradas: ${resultado.total}`);
        await carregarAtividades();
        await carregarStats();
        return;
      }
      
      // Se não está conectado, iniciar OAuth
      console.log('Buscando URL de autorização...');
      
      // Timestamp único para esta tentativa de auth
      const authTimestamp = Date.now();
      
      const response = await integracoesAPI.stravaGetAuthUrl(authTimestamp);
      console.log('Resposta da API:', response);
      
      if (!response || !response.authUrl) {
        throw new Error('URL de autorização não retornada pela API');
      }
      
      const { authUrl } = response;
      console.log('URL de autorização:', authUrl);
      
      // Abrir popup OAuth
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'Conectar Strava',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Escutar mensagem do callback
      const messageHandler = async (event: MessageEvent) => {
        if (event.data.type === 'strava-auth' && event.data.timestamp === authTimestamp) {
          window.removeEventListener('message', messageHandler);
          
          if (event.data.code) {
            try {
              const resultado = await integracoesAPI.stravaConnect(event.data.code);
              alert(`✅ ${resultado.mensagem}\nAtleta: ${resultado.atleta.nome}`);
              await carregarIntegracoes();
              
              // Perguntar se deseja sincronizar agora
              if (confirm('Deseja sincronizar atividades agora?')) {
                const sync = await integracoesAPI.stravaSync();
                alert(`🔄 ${sync.importadas} atividades importadas!`);
                await carregarAtividades();
                await carregarStats();
              }
            } catch (error: any) {
              console.error('Erro ao conectar:', error);
              alert('❌ Erro ao conectar Strava: ' + (error.erro || 'Erro desconhecido'));
            }
          } else {
            alert('❌ Autorização cancelada');
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Timeout de 5 minutos
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        if (popup && !popup.closed) {
          popup.close();
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('Erro ao conectar Strava:', error);
      alert('❌ Erro ao conectar Strava');
    }
  };

  const deletarAtividade = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta atividade?')) return;
    
    try {
      const { cardioAPI } = await import('./src/api');
      await cardioAPI.delete(id);
      await carregarAtividades();
      await carregarStats();
    } catch (error) {
      console.error('Erro ao deletar atividade:', error);
      alert('❌ Erro ao deletar atividade');
    }
  };

  const formatarDuracao = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos}min`;
    }
    return `${minutos}min ${segs}s`;
  };

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const mins = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
  };

  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getTipoIcon = (tipo: string) => {
    const icons: any = {
      'CORRIDA': '🏃',
      'CICLISMO': '🚴',
      'NATACAO': '🏊',
      'CAMINHADA': '🚶',
      'ELIPTICO': '🔄',
      'REMO': '🚣',
      'PULAR_CORDA': '🪢'
    };
    return icons[tipo] || '💪';
  };

  const getTipoNome = (tipo: string) => {
    const nomes: any = {
      'CORRIDA': 'Corrida',
      'CICLISMO': 'Ciclismo',
      'NATACAO': 'Natação',
      'CAMINHADA': 'Caminhada',
      'ELIPTICO': 'Elíptico',
      'REMO': 'Remo',
      'PULAR_CORDA': 'Pular Corda'
    };
    return nomes[tipo] || tipo;
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-6 md:space-y-8 min-h-screen text-white">
      <header className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl lg:text-6xl font-black italic uppercase tracking-tighter mb-1 md:mb-2 text-white leading-tight">Cardio & Aeróbico</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-medium">Registre, monitore e sincronize suas atividades</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-2">
        <button 
          onClick={() => setActiveTab('historico')}
          className={`px-4 md:px-5 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === 'historico' ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}
        >
          📊 HISTÓRICO
        </button>
        <button 
          onClick={() => { setActiveTab('registrar'); setShowRegistroModal(true); }}
          className={`px-4 md:px-5 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === 'registrar' ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}
        >
          ✏️ REGISTRAR
        </button>
        <button 
          onClick={() => setActiveTab('gps')}
          className={`px-4 md:px-5 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === 'gps' ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}
        >
          📍 GPS AO VIVO
        </button>
        <button 
          onClick={() => setActiveTab('integracoes')}
          className={`px-4 md:px-5 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === 'integracoes' ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}
        >
          🔗 INTEGRAÇÕES
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`px-4 md:px-5 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}
        >
          📈 ESTATÍSTICAS
        </button>
      </div>

      {/* HISTÓRICO */}
      {activeTab === 'historico' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin mx-auto mb-4" size={32} />
              <p className="text-zinc-500">Carregando atividades...</p>
            </div>
          ) : atividades.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 md:p-12 text-center">
              <Activity size={48} className="mx-auto mb-4 text-zinc-700" />
              <h3 className="text-xl font-black italic uppercase mb-2">Nenhuma Atividade Registrada</h3>
              <p className="text-zinc-500 text-sm mb-6">Comece a registrar suas atividades de cardio!</p>
              <button
                onClick={() => setShowRegistroModal(true)}
                className="bg-lime-400 text-black px-6 py-3 rounded-xl font-black uppercase text-xs"
              >
                Registrar Primeira Atividade
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {atividades.map((atividade) => (
                <div key={atividade.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl hover:border-lime-400/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{getTipoIcon(atividade.tipo)}</div>
                      <div>
                        <h3 className="font-bold text-white">{getTipoNome(atividade.tipo)}</h3>
                        <p className="text-xs text-zinc-500">
                          {new Date(atividade.dataInicio).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deletarAtividade(atividade.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-zinc-950 p-3 rounded-xl">
                      <div className="text-xs text-zinc-500 mb-1">Duração</div>
                      <div className="font-bold text-white">{formatarDuracao(atividade.duracao)}</div>
                    </div>
                    {atividade.distancia && (
                      <div className="bg-zinc-950 p-3 rounded-xl">
                        <div className="text-xs text-zinc-500 mb-1">Distância</div>
                        <div className="font-bold text-white">{atividade.distancia.toFixed(2)} km</div>
                      </div>
                    )}
                    {atividade.calorias && (
                      <div className="bg-zinc-950 p-3 rounded-xl">
                        <div className="text-xs text-zinc-500 mb-1">Calorias</div>
                        <div className="font-bold text-lime-400">{atividade.calorias} kcal</div>
                      </div>
                    )}
                    {atividade.fcMedia && (
                      <div className="bg-zinc-950 p-3 rounded-xl">
                        <div className="text-xs text-zinc-500 mb-1">FC Média</div>
                        <div className="font-bold text-red-400">{atividade.fcMedia} bpm</div>
                      </div>
                    )}
                  </div>

                  {atividade.velocidade && (
                    <div className="text-xs text-zinc-500">
                      ⚡ {atividade.velocidade.toFixed(1)} km/h
                    </div>
                  )}
                  
                  {atividade.origem !== 'MANUAL' && (
                    <div className="mt-2 text-xs text-blue-400">
                      Importado: {atividade.origem.replace('_', ' ')}
                    </div>
                  )}

                  {/* Mapa GPS */}
                  {atividade.rotaGPS && Array.isArray(atividade.rotaGPS) && atividade.rotaGPS.length > 0 && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-zinc-800">
                      <MapContainer
                        center={[atividade.rotaGPS[0].lat, atividade.rotaGPS[0].lng]}
                        zoom={14}
                        style={{ height: '200px', width: '100%' }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        <Polyline
                          positions={atividade.rotaGPS.map((p: any) => [p.lat, p.lng])}
                          color="#D9FF00"
                          weight={4}
                        />
                        <Marker position={[atividade.rotaGPS[0].lat, atividade.rotaGPS[0].lng]}>
                          <Popup>Início</Popup>
                        </Marker>
                        <Marker position={[atividade.rotaGPS[atividade.rotaGPS.length - 1].lat, atividade.rotaGPS[atividade.rotaGPS.length - 1].lng]}>
                          <Popup>Fim</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GPS AO VIVO */}
      {activeTab === 'gps' && (
        <div className="space-y-6">
          {!gpsAtiva ? (
            <div className="bg-gradient-to-br from-lime-400/10 to-green-400/10 border border-lime-400/30 rounded-2xl p-8 md:p-12 text-center">
              <div className="size-20 bg-lime-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin size={40} className="text-black" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black italic uppercase mb-4">Rastreamento GPS</h2>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                Inicie uma sessão de treino com GPS em tempo real. Acompanhe distância, velocidade e rota.
              </p>
              
              <div className="max-w-md mx-auto mb-8">
                <label className="block text-left text-sm font-bold text-zinc-400 mb-2">Tipo de Atividade</label>
                <select
                  value={novaAtividade.tipo}
                  onChange={(e) => setNovaAtividade({ ...novaAtividade, tipo: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                >
                  <option value="CORRIDA">🏃 Corrida</option>
                  <option value="CICLISMO">🚴 Ciclismo</option>
                  <option value="CAMINHADA">🚶 Caminhada</option>
                  <option value="NATACAO">🏊 Natação</option>
                </select>
              </div>

              <button
                onClick={iniciarGPS}
                className="bg-lime-400 text-black px-8 py-4 rounded-xl font-black uppercase text-sm shadow-xl hover:bg-lime-300 transition-all"
              >
                🚀 Iniciar Treino
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dashboard em tempo real */}
              <div className="bg-zinc-900 border-2 border-lime-400 rounded-2xl p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black uppercase text-lime-400">🔴 GRAVANDO</h3>
                  <div className="text-4xl font-black text-white">{formatarTempo(tempoDecorrido)}</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-zinc-950 p-4 rounded-xl text-center">
                    <div className="text-xs text-zinc-500 mb-2">Distância</div>
                    <div className="text-2xl font-black text-white">{distanciaPercorrida.toFixed(2)}</div>
                    <div className="text-xs text-zinc-500">km</div>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl text-center">
                    <div className="text-xs text-zinc-500 mb-2">Velocidade</div>
                    <div className="text-2xl font-black text-lime-400">{velocidadeAtual.toFixed(1)}</div>
                    <div className="text-xs text-zinc-500">km/h</div>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl text-center">
                    <div className="text-xs text-zinc-500 mb-2">Ritmo</div>
                    <div className="text-2xl font-black text-blue-400">
                      {velocidadeAtual > 0 ? (60 / velocidadeAtual).toFixed(1) : '0'}
                    </div>
                    <div className="text-xs text-zinc-500">min/km</div>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl text-center">
                    <div className="text-xs text-zinc-500 mb-2">Pontos GPS</div>
                    <div className="text-2xl font-black text-purple-400">{rotaGPS.length}</div>
                    <div className="text-xs text-zinc-500">registrados</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={finalizarGPS}
                    className="bg-lime-400 text-black px-6 py-4 rounded-xl font-black uppercase text-sm"
                  >
                    ✅ Finalizar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja cancelar?')) {
                        setGpsAtiva(false);
                        setSessaoAtual(null);
                      }
                    }}
                    className="bg-red-500 text-white px-6 py-4 rounded-xl font-black uppercase text-sm"
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </div>

              {/* Mapa placeholder */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
                <MapPin size={48} className="mx-auto mb-4 text-zinc-700" />
                <p className="text-zinc-500 text-sm">
                  Mapa da rota será exibido aqui
                  <br />
                  {rotaGPS.length > 0 && `${rotaGPS.length} pontos registrados`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INTEGRAÇÕES */}
      {activeTab === 'integracoes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Apple Health */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-14 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center">
                <Heart size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-white">Apple Health</h3>
                <p className="text-xs text-zinc-500">HealthKit</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              Importe workouts do seu Apple Watch automaticamente
            </p>
            <button
              onClick={sincronizarAppleHealth}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-3 rounded-xl font-bold text-sm"
            >
              Sincronizar
            </button>
          </div>

          {/* Google Fit */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-14 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Activity size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-white">Google Fit</h3>
                <p className="text-xs text-zinc-500">Android & Wear OS</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              Conecte dispositivos Android e smartwatches
            </p>
            <button
              onClick={sincronizarGoogleFit}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-3 rounded-xl font-bold text-sm"
            >
              Conectar
            </button>
          </div>

          {/* Strava */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                <Zap size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-white">Strava</h3>
                <p className="text-xs text-zinc-500">Rede social fitness</p>
              </div>
            </div>
            
            {integracoes.some((i: any) => i.plataforma === 'STRAVA' && i.ativo) ? (
              <>
                <div className="bg-lime-400/10 border border-lime-400/30 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 text-lime-400 text-sm font-bold">
                    <div className="size-2 bg-lime-400 rounded-full animate-pulse" />
                    Conectado
                  </div>
                  {integracoes.find((i: any) => i.plataforma === 'STRAVA')?.ultimaSync && (
                    <div className="text-xs text-zinc-500 mt-1">
                      Última sincronização: {new Date(integracoes.find((i: any) => i.plataforma === 'STRAVA').ultimaSync).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const { integracoesAPI } = await import('./src/api');
                        const resultado = await integracoesAPI.stravaSync();
                        alert(`✅ Sincronizado!\n${resultado.importadas} novas\n${resultado.atualizadas} atualizadas`);
                        await carregarAtividades();
                        await carregarStats();
                      } catch (error: any) {
                        alert('❌ ' + (error.erro || 'Erro ao sincronizar'));
                      }
                    }}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-3 rounded-xl font-bold text-sm"
                  >
                    🔄 Sync
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('Desconectar Strava?')) return;
                      try {
                        const { integracoesAPI } = await import('./src/api');
                        await integracoesAPI.stravaDisconnect();
                        alert('✅ Desconectado');
                        await carregarIntegracoes();
                      } catch (error) {
                        alert('❌ Erro ao desconectar');
                      }
                    }}
                    className="bg-zinc-800 text-zinc-400 px-4 py-3 rounded-xl font-bold text-sm hover:bg-zinc-700"
                  >
                    ❌
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-400 mb-6">
                  Importe atividades da plataforma Strava
                </p>
                <button
                  onClick={conectarStrava}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-3 rounded-xl font-bold text-sm"
                >
                  Conectar Strava
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ESTATÍSTICAS */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Cards principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-lime-400/20 to-lime-400/5 border border-lime-400/30 p-6 rounded-2xl">
              <div className="text-sm text-zinc-400 mb-2">Total Atividades</div>
              <div className="text-3xl font-black text-lime-400">{stats.totalAtividades}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-400/20 to-blue-400/5 border border-blue-400/30 p-6 rounded-2xl">
              <div className="text-sm text-zinc-400 mb-2">Distância Total</div>
              <div className="text-3xl font-black text-blue-400">{stats.totalDistancia.toFixed(1)}</div>
              <div className="text-xs text-zinc-500">km</div>
            </div>
            <div className="bg-gradient-to-br from-red-400/20 to-red-400/5 border border-red-400/30 p-6 rounded-2xl">
              <div className="text-sm text-zinc-400 mb-2">Calorias Queimadas</div>
              <div className="text-3xl font-black text-red-400">{stats.totalCalorias}</div>
              <div className="text-xs text-zinc-500">kcal</div>
            </div>
            <div className="bg-gradient-to-br from-purple-400/20 to-purple-400/5 border border-purple-400/30 p-6 rounded-2xl">
              <div className="text-sm text-zinc-400 mb-2">Tempo Total</div>
              <div className="text-3xl font-black text-purple-400">{formatarDuracao(stats.totalDuracao)}</div>
            </div>
          </div>

          {/* Por tipo */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-xl font-black uppercase mb-6">Por Tipo de Atividade</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.porTipo || {}).map(([tipo, dados]: [string, any]) => (
                <div key={tipo} className="bg-zinc-950 p-5 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{getTipoIcon(tipo)}</div>
                    <div>
                      <h4 className="font-bold text-white">{getTipoNome(tipo)}</h4>
                      <p className="text-xs text-zinc-500">{dados.count} atividades</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Distância</span>
                      <span className="text-white font-bold">{dados.distancia.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Tempo</span>
                      <span className="text-white font-bold">{formatarDuracao(dados.duracao)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Médias */}
          {(stats.mediaFCMedia > 0 || stats.mediaVelocidade > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.mediaFCMedia > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-lg font-black uppercase mb-4">FC Média</h3>
                  <div className="text-4xl font-black text-red-400 mb-2">{Math.round(stats.mediaFCMedia)}</div>
                  <div className="text-sm text-zinc-500">batimentos por minuto</div>
                </div>
              )}
              {stats.mediaVelocidade > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h3 className="text-lg font-black uppercase mb-4">Velocidade Média</h3>
                  <div className="text-4xl font-black text-lime-400 mb-2">{stats.mediaVelocidade.toFixed(1)}</div>
                  <div className="text-sm text-zinc-500">km/h</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Registro Manual */}
      {showRegistroModal && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setShowRegistroModal(false)}>
          <div className="bg-zinc-950 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase">Registrar Atividade</h2>
              <button onClick={() => setShowRegistroModal(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Tipo de Atividade *</label>
                <select
                  value={novaAtividade.tipo}
                  onChange={(e) => setNovaAtividade({ ...novaAtividade, tipo: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                >
                  <option value="CORRIDA">🏃 Corrida</option>
                  <option value="CICLISMO">🚴 Ciclismo</option>
                  <option value="NATACAO">🏊 Natação</option>
                  <option value="CAMINHADA">🚶 Caminhada</option>
                  <option value="ELIPTICO">🔄 Elíptico</option>
                  <option value="REMO">🚣 Remo</option>
                  <option value="PULAR_CORDA">🪢 Pular Corda</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2">Duração (min) *</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={novaAtividade.duracao}
                    onChange={(e) => setNovaAtividade({ ...novaAtividade, duracao: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2">Distância (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    value={novaAtividade.distancia}
                    onChange={(e) => setNovaAtividade({ ...novaAtividade, distancia: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2">Calorias (kcal)</label>
                  <input
                    type="number"
                    placeholder="300"
                    value={novaAtividade.calorias}
                    onChange={(e) => setNovaAtividade({ ...novaAtividade, calorias: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2">FC Média (bpm)</label>
                  <input
                    type="number"
                    placeholder="145"
                    value={novaAtividade.fcMedia}
                    onChange={(e) => setNovaAtividade({ ...novaAtividade, fcMedia: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2">FC Máxima (bpm)</label>
                  <input
                    type="number"
                    placeholder="170"
                    value={novaAtividade.fcMaxima}
                    onChange={(e) => setNovaAtividade({ ...novaAtividade, fcMaxima: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2">Sensação (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={novaAtividade.sensacao}
                    onChange={(e) => setNovaAtividade({ ...novaAtividade, sensacao: e.target.value })}
                    className="w-full mt-3"
                  />
                  <div className="text-center text-2xl font-black text-lime-400 mt-1">{novaAtividade.sensacao}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Clima</label>
                <select
                  value={novaAtividade.clima}
                  onChange={(e) => setNovaAtividade({ ...novaAtividade, clima: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                >
                  <option value="">Selecione...</option>
                  <option value="ENSOLARADO">☀️ Ensolarado</option>
                  <option value="NUBLADO">☁️ Nublado</option>
                  <option value="CHUVA">🌧️ Chuva</option>
                  <option value="VENTO">💨 Ventoso</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Observações</label>
                <textarea
                  placeholder="Como foi o treino..."
                  value={novaAtividade.observacoes}
                  onChange={(e) => setNovaAtividade({ ...novaAtividade, observacoes: e.target.value })}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowRegistroModal(false)}
                className="flex-1 bg-zinc-800 text-white px-6 py-4 rounded-xl font-bold uppercase text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={registrarAtividade}
                disabled={!novaAtividade.tipo || !novaAtividade.duracao}
                className="flex-1 bg-lime-400 text-black px-6 py-4 rounded-xl font-bold uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✅ Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GoalsView = () => {
  const [activeGoalTab, setActiveGoalTab] = useState('personal');
  const [metas, setMetas] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [sequencias, setSequencias] = useState<any[]>([]);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    titulo: '',
    descricao: '',
    valorAlvo: '',
    valorAtual: '',
    unidade: 'kg',
    prazo: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar metas do banco
  useEffect(() => {
    carregarMetas();
    carregarBadges();
    carregarSequencias();
  }, []);

  const carregarBadges = async () => {
    try {
      const { badgeAPI } = await import('./src/api');
      const data = await badgeAPI.getMeus();
      setBadges(data);
    } catch (error) {
      console.error('Erro ao carregar badges:', error);
    }
  };

  const carregarSequencias = async () => {
    try {
      const { sequenciaAPI } = await import('./src/api');
      const data = await sequenciaAPI.getAll();
      setSequencias(data);
    } catch (error) {
      console.error('Erro ao carregar sequências:', error);
    }
  };

  const carregarMetas = async () => {
    const token = localStorage.getItem('fitness_token');
    if (!token) return;

    try {
      setIsLoading(true);
      const { metaAPI } = await import('./src/api');
      const data = await metaAPI.getAll();
      setMetas(data);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const salvarMeta = async () => {
    if (!newGoal.titulo || !newGoal.valorAlvo) {
      alert('Preencha pelo menos o título e valor alvo');
      return;
    }

    try {
      setIsSaving(true);
      const { metaAPI } = await import('./src/api');
      await metaAPI.create({
        titulo: newGoal.titulo,
        descricao: newGoal.descricao,
        valorAlvo: parseFloat(newGoal.valorAlvo),
        valorAtual: parseFloat(newGoal.valorAtual) || 0,
        unidade: newGoal.unidade,
        prazo: newGoal.prazo || undefined
      });
      
      alert('✅ Meta criada com sucesso!');
      setShowNewGoalModal(false);
      setNewGoal({ titulo: '', descricao: '', valorAlvo: '', valorAtual: '', unidade: 'kg', prazo: '' });
      await carregarMetas();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      alert('❌ Erro ao salvar meta');
    } finally {
      setIsSaving(false);
    }
  };

  const atualizarProgresso = async (metaId: string, novoValor: number) => {
    try {
      const { metaAPI } = await import('./src/api');
      await metaAPI.update(metaId, { valorAtual: novoValor });
      await carregarMetas();
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
    }
  };

  const excluirMeta = async (metaId: string) => {
    if (!confirm('Deseja realmente excluir esta meta?')) return;

    try {
      const { metaAPI } = await import('./src/api');
      await metaAPI.delete(metaId);
      await carregarMetas();
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
    }
  };

  const marcarConcluida = async (metaId: string, completada: boolean) => {
    try {
      const { metaAPI } = await import('./src/api');
      await metaAPI.update(metaId, { completada });
      await carregarMetas();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
    }
  };

  // Mapear ícones dos badges
  const getIcone = (nome: string) => {
    const icones: any = {
      'Star': <Star />,
      'Flame': <Flame />,
      'Zap': <Zap />,
      'Heart': <Heart />,
      'TrendingDown': <TrendingDown />,
      'Target': <Target />
    };
    return icones[nome] || <Star />;
  };

  // Mapear cores das sequências
  const getCoresSequencia = (tipo: string) => {
    const cores: any = {
      'TREINO': { color: 'text-lime-400', bg: 'bg-lime-400/10', nome: 'Treinos Consecutivos' },
      'CARDIO': { color: 'text-red-400', bg: 'bg-red-400/10', nome: 'Cardio Semanal' },
      'META_CALORICA': { color: 'text-blue-400', bg: 'bg-blue-400/10', nome: 'Meta Calórica' }
    };
    return cores[tipo] || { color: 'text-lime-400', bg: 'bg-lime-400/10', nome: tipo };
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-6 md:space-y-8 min-h-screen text-white">
      <header className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl lg:text-6xl font-black italic uppercase tracking-tighter mb-1 md:mb-2 text-white leading-tight">Metas & Conquistas</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-medium">Acompanhe seu progresso e desbloqueie conquistas</p>
      </header>
      
      <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-2">
        <button 
          onClick={() => setActiveGoalTab('personal')} 
          className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeGoalTab === 'personal' ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}
        >
          MINHAS METAS
        </button>
        <button 
          onClick={() => setActiveGoalTab('badges')} 
          className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeGoalTab === 'badges' ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}
        >
          BADGES
        </button>
        <button 
          onClick={() => setActiveGoalTab('streaks')} 
          className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeGoalTab === 'streaks' ? 'bg-lime-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}
        >
          SEQUÊNCIAS
        </button>
      </div>

      {activeGoalTab === 'personal' && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg md:text-xl font-black italic uppercase">Metas Pessoais</h3>
            <button
              onClick={() => setShowNewGoalModal(true)}
              className="bg-lime-400 text-black px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all"
            >
              <Plus size={16} />
              Nova Meta
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin mx-auto mb-4" size={32} />
              <p className="text-zinc-500">Carregando metas...</p>
            </div>
          ) : metas.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 md:p-12 text-center">
              <Target size={48} className="mx-auto mb-4 text-zinc-700" />
              <h3 className="text-xl font-black italic uppercase mb-2">Nenhuma Meta Cadastrada</h3>
              <p className="text-zinc-500 text-sm mb-6">Crie sua primeira meta e comece a acompanhar seu progresso!</p>
              <button
                onClick={() => setShowNewGoalModal(true)}
                className="bg-lime-400 text-black px-6 py-3 rounded-xl font-black uppercase text-xs"
              >
                Criar Primeira Meta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {metas.map((meta) => {
                const progresso = (meta.valorAtual / meta.valorAlvo) * 100;
                return (
                  <div key={meta.id} className={`p-5 md:p-6 rounded-2xl border transition-all ${meta.completada ? 'bg-lime-400/10 border-lime-400/30' : 'bg-zinc-900 border-zinc-800'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="font-black text-base md:text-lg mb-1 text-white">{meta.titulo}</h4>
                        {meta.descricao && <p className="text-xs md:text-sm text-zinc-400">{meta.descricao}</p>}
                      </div>
                      <button onClick={() => excluirMeta(meta.id)} className="text-zinc-500 hover:text-red-400 ml-2">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs md:text-sm mb-2">
                        <span className="text-zinc-400">Progresso</span>
                        <span className="font-bold text-white">{meta.valorAtual} / {meta.valorAlvo} {meta.unidade}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 md:h-3">
                        <div 
                          className={`h-2 md:h-3 rounded-full transition-all ${meta.completada ? 'bg-lime-400' : 'bg-blue-400'}`}
                          style={{width: `${Math.min(progresso, 100)}%`}}
                        ></div>
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">{progresso.toFixed(1)}%</div>
                    </div>

                    {meta.prazo && (
                      <div className="text-xs text-zinc-500 mb-3">
                        ⏰ Prazo: {new Date(meta.prazo).toLocaleDateString('pt-BR')}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!meta.completada && (
                        <>
                          <button
                            onClick={() => {
                              const novo = prompt(`Atualizar progresso (${meta.unidade}):`, meta.valorAtual);
                              if (novo) atualizarProgresso(meta.id, parseFloat(novo));
                            }}
                            className="flex-1 bg-zinc-800 text-white px-3 py-2 rounded-xl text-xs font-bold active:bg-zinc-700 transition-all"
                          >
                            Atualizar
                          </button>
                          <button
                            onClick={() => marcarConcluida(meta.id, true)}
                            className="flex-1 bg-lime-400 text-black px-3 py-2 rounded-xl text-xs font-bold active:bg-lime-300 transition-all"
                          >
                            Concluir
                          </button>
                        </>
                      )}
                      {meta.completada && (
                        <div className="w-full bg-lime-400/20 text-lime-400 px-3 py-2 rounded-xl text-xs font-bold text-center">
                          ✓ Concluída
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeGoalTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {badges.length === 0 ? (
            <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <Target size={48} className="mx-auto mb-4 text-zinc-700" />
              <p className="text-zinc-500">Carregando badges...</p>
            </div>
          ) : (
            badges.map((badge) => (
              <div key={badge.id} className={`p-5 md:p-6 rounded-2xl border transition-all ${badge.conquistado ? 'bg-zinc-900 border-lime-400/30' : 'bg-zinc-950 border-zinc-800'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${badge.conquistado ? 'bg-lime-400/20 text-lime-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {getIcone(badge.icone)}
                  </div>
                  {badge.conquistado && badge.conquistadoEm && (
                    <span className="text-xs font-bold text-lime-400 bg-lime-400/10 px-2 py-1 rounded-full">
                      {new Date(badge.conquistadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm md:text-base text-white mb-2">{badge.nome}</h3>
                <p className="text-xs md:text-sm text-zinc-400 mb-4">{badge.descricao}</p>
                {!badge.conquistado && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Progresso</span>
                      <span className="text-zinc-400">{badge.progresso.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div className="bg-lime-400 h-2 rounded-full transition-all" style={{width: `${badge.progresso}%`}}></div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeGoalTab === 'streaks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {sequencias.length === 0 ? (
            <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <Flame size={48} className="mx-auto mb-4 text-zinc-700" />
              <p className="text-zinc-500">Carregando sequências...</p>
            </div>
          ) : (
            sequencias.map((seq: any) => {
              const cores = getCoresSequencia(seq.tipo);
              return (
                <div key={seq.id} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl">
                  <div className={`size-10 md:size-12 ${cores.bg} ${cores.color} rounded-xl flex items-center justify-center mb-4 md:mb-6`}>
                    <Flame size={20} className="md:size-6" />
                  </div>
                  <h3 className="font-bold text-sm md:text-base text-white mb-2">{cores.nome}</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className={`text-2xl md:text-3xl font-black ${cores.color}`}>{seq.atual}</span>
                    <span className="text-xs md:text-sm text-zinc-500">dias</span>
                  </div>
                  <p className="text-xs text-zinc-500">Melhor: {seq.melhor} dias</p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Nova Meta */}
      {showNewGoalModal && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setShowNewGoalModal(false)}>
          <div className="bg-zinc-900 border-t-2 border-lime-400 sm:border sm:border-zinc-800 w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6 sm:mb-8">
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-black italic uppercase leading-tight text-white mb-1">
                  🎯 Nova Meta
                </h3>
                <p className="text-xs text-zinc-500 font-medium">Defina e acompanhe seu objetivo</p>
              </div>
              <button onClick={() => setShowNewGoalModal(false)} className="size-10 sm:size-11 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 active:bg-zinc-800 active:text-white transition-all shrink-0 ml-4">
                <X size={18} className="sm:size-5"/>
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-zinc-300 block">📝 Título da Meta</label>
                <input 
                  type="text" 
                  placeholder="Ex: Perder 5kg"
                  value={newGoal.titulo} 
                  onChange={e => setNewGoal({...newGoal, titulo: e.target.value})} 
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-base text-white outline-none focus:border-lime-400 active:border-lime-400 placeholder:text-zinc-600 transition-colors" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-zinc-300 block">💭 Descrição <span className="text-zinc-600 font-normal">(opcional)</span></label>
                <input 
                  type="text" 
                  placeholder="Ex: Chegar a 80kg até março"
                  value={newGoal.descricao} 
                  onChange={e => setNewGoal({...newGoal, descricao: e.target.value})} 
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-base text-white outline-none focus:border-lime-400 active:border-lime-400 placeholder:text-zinc-600 transition-colors" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-zinc-300 block">🎯 Valor Alvo</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="5"
                    value={newGoal.valorAlvo} 
                    onChange={e => setNewGoal({...newGoal, valorAlvo: e.target.value})} 
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-base text-white font-bold outline-none focus:border-lime-400 active:border-lime-400 placeholder:text-zinc-600 transition-colors" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-zinc-300 block">📊 Valor Atual</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="0"
                    value={newGoal.valorAtual} 
                    onChange={e => setNewGoal({...newGoal, valorAtual: e.target.value})} 
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-base text-white font-bold outline-none focus:border-lime-400 active:border-lime-400 placeholder:text-zinc-600 transition-colors" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-zinc-300 block">📏 Unidade</label>
                  <select 
                    value={newGoal.unidade} 
                    onChange={e => setNewGoal({...newGoal, unidade: e.target.value})}
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-base text-white outline-none appearance-none focus:border-lime-400 active:border-lime-400 transition-colors"
                  >
                    <option value="kg">kg (peso)</option>
                    <option value="cm">cm (medida)</option>
                    <option value="%">% (percentual)</option>
                    <option value="treinos">treinos (qtd)</option>
                    <option value="dias">dias (período)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-zinc-300 block">📅 Prazo</label>
                  <input 
                    type="date" 
                    value={newGoal.prazo} 
                    onChange={e => setNewGoal({...newGoal, prazo: e.target.value})} 
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-base text-white outline-none focus:border-lime-400 active:border-lime-400 transition-colors" 
                  />
                </div>
              </div>
              
              <button 
                onClick={salvarMeta} 
                disabled={isSaving} 
                className="w-full bg-lime-400 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm sm:text-base shadow-2xl shadow-lime-400/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={20} className="animate-spin"/> 
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Target size={20}/> 
                    <span>Criar Meta</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GroupsView = () => {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showGroupDetail, setShowGroupDetail] = useState<string | null>(null);
  const [grupoSelecionado, setGrupoSelecionado] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [periodoLeaderboard, setPeriodoLeaderboard] = useState(7);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [linkConvite, setLinkConvite] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [novoGrupo, setNovoGrupo] = useState({
    nome: '',
    descricao: '',
    categoria: 'Treino Geral',
    imagem: ''
  });

  useEffect(() => {
    carregarGrupos();
  }, []);

  const carregarGrupos = async () => {
    try {
      setIsLoading(true);
      const { gruposAPI } = await import('./src/api');
      const data = await gruposAPI.getAll();
      
      // Mapear meuPapel a partir do array de membros (já que estou logado, meu membro está lá)
      const gruposComPapel = data.map((grupo: any) => {
        // Se já tem meuPapel, retorna como está
        if (grupo.meuPapel) return grupo;
        
        // Se tem membros e isMembro é true, pegar a função do primeiro membro (que sou eu)
        if (grupo.isMembro && grupo.membros && grupo.membros.length > 0) {
          return {
            ...grupo,
            meuPapel: grupo.membros[0].funcao
          };
        }
        
        return grupo;
      });
      
      console.log('🔍 Grupos processados:', gruposComPapel.map((g: any) => ({ nome: g.nome, meuPapel: g.meuPapel })));
      setGrupos(gruposComPapel);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      alert('❌ Erro ao carregar grupos');
    } finally {
      setIsLoading(false);
    }
  };

  const criarGrupo = async () => {
    if (!novoGrupo.nome) {
      alert('⚠️ Digite um nome para o grupo');
      return;
    }

    setIsSaving(true);
    try {
      const { gruposAPI } = await import('./src/api');
      await gruposAPI.create(novoGrupo);
      setShowNewGroupModal(false);
      setNovoGrupo({ nome: '', descricao: '', categoria: 'Treino Geral', imagem: '' });
      await carregarGrupos();
      alert('✅ Grupo criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      alert('❌ Erro ao criar grupo');
    } finally {
      setIsSaving(false);
    }
  };

  const abrirGrupo = async (grupoId: string) => {
    try {
      const { gruposAPI } = await import('./src/api');
      const [grupo, leaderboardData] = await Promise.all([
        gruposAPI.getById(grupoId),
        gruposAPI.getLeaderboard(grupoId, periodoLeaderboard)
      ]);
      setGrupoSelecionado(grupo);
      setLeaderboard(leaderboardData.ranking);
      setShowGroupDetail(grupoId);
    } catch (error) {
      console.error('Erro ao abrir grupo:', error);
      alert('❌ Erro ao carregar grupo');
    }
  };

  const gerarConvite = async (grupo?: any) => {
    const grupoParaConvidar = grupo || grupoSelecionado;
    if (!grupoParaConvidar) return;
    
    console.log('🔍 Gerando convite para grupo:', grupoParaConvidar.id);
    console.log('🔍 Papel do usuário:', grupoParaConvidar.meuPapel);
    
    try {
      const { gruposAPI } = await import('./src/api');
      const { linkConvite } = await gruposAPI.generateInvite(grupoParaConvidar.id);
      console.log('✅ Link gerado:', linkConvite);
      setLinkConvite(linkConvite);
      setShowInviteModal(true);
    } catch (error: any) {
      console.error('❌ Erro ao gerar convite:', error);
      alert(error.response?.data?.erro || '❌ Erro ao gerar convite');
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkConvite);
    alert('✅ Link copiado!');
  };

  const sairDoGrupo = async (grupoId: string) => {
    if (!confirm('Tem certeza que deseja sair deste grupo?')) return;
    
    try {
      const { gruposAPI } = await import('./src/api');
      await gruposAPI.leave(grupoId);
      setShowGroupDetail(null);
      await carregarGrupos();
      alert('✅ Você saiu do grupo');
    } catch (error: any) {
      alert(error.message || '❌ Erro ao sair do grupo');
    }
  };

  const deletarGrupo = async (grupoId: string) => {
    if (!confirm('⚠️ ATENÇÃO: Isso vai deletar o grupo permanentemente para TODOS os membros. Confirma?')) return;
    
    try {
      const { gruposAPI } = await import('./src/api');
      await gruposAPI.delete(grupoId);
      setShowGroupDetail(null);
      await carregarGrupos();
      alert('✅ Grupo deletado com sucesso');
    } catch (error: any) {
      alert(error.message || '❌ Erro ao deletar grupo');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={40} className="animate-spin text-lime-400" />
      </div>
    );
  }

  // Detalhes do grupo
  if (showGroupDetail && grupoSelecionado) {
    return (
      <div className="animate-in fade-in duration-700 space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowGroupDetail(null)} className="size-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">{grupoSelecionado.nome}</h2>
            <p className="text-zinc-500 font-medium">{grupoSelecionado.totalMembros} membros • {grupoSelecionado.categoria}</p>
          </div>
          {grupoSelecionado.meuPapel === 'admin' && (
            <button onClick={gerarConvite} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-sm flex items-center gap-2 hover:bg-lime-500 transition-all">
              <UserPlus size={18} />
              Convidar
            </button>
          )}
        </div>

        {grupoSelecionado.descricao && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-300">{grupoSelecionado.descricao}</p>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black italic uppercase flex items-center gap-2">
              <Trophy size={20} className="text-lime-400" />
              Leaderboard
            </h3>
            <select value={periodoLeaderboard} onChange={(e) => setPeriodoLeaderboard(Number(e.target.value))} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none">
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
          </div>

          <div className="space-y-3">
            {leaderboard.map((membro, index) => (
              <div key={membro.usuarioId} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${index < 3 ? 'bg-lime-400/10 border border-lime-400/30' : 'bg-zinc-950'}`}>
                <div className="flex items-center gap-3 flex-1">
                  <span className={`size-8 flex items-center justify-center rounded-full font-black text-sm ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-gray-400 text-black' : index === 2 ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                    {index + 1}
                  </span>
                  <div className="size-12 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700">
                    <img src={membro.imagemPerfil || 'https://picsum.photos/seed/user/100'} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-white">{membro.nome}</p>
                    <p className="text-xs text-zinc-500 font-bold uppercase">{membro.funcao}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black italic text-lime-400">{membro.pontos}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Pontos</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-white">{membro.totalTreinos}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Treinos</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-white">{membro.totalCalorias}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">kcal</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {grupoSelecionado.meuPapel === 'admin' && (
            <button onClick={() => deletarGrupo(grupoSelecionado.id)} className="w-full bg-zinc-900 border-2 border-red-600 text-red-500 py-4 rounded-2xl font-black uppercase text-sm hover:bg-red-600 hover:text-white transition-all">
              Deletar Grupo
            </button>
          )}
          <button onClick={() => sairDoGrupo(grupoSelecionado.id)} className={`w-full bg-zinc-900 border border-red-900 text-red-400 py-4 rounded-2xl font-black uppercase text-sm hover:bg-red-900/20 transition-all ${grupoSelecionado.meuPapel === 'admin' ? '' : 'sm:col-span-2'}`}>
            Sair do Grupo
          </button>
        </div>
      </div>
    );
  }

  // Lista de grupos
  return (
    <div className="animate-in fade-in duration-700 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">Grupos</h2>
          <p className="text-zinc-500 font-medium">Compita com amigos</p>
        </div>
        <button onClick={() => setShowNewGroupModal(true)} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-sm flex items-center gap-2 hover:bg-lime-500 transition-all">
          <Plus size={18} />
          Criar Grupo
        </button>
      </div>

      {grupos.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
          <div className="size-20 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users size={40} className="text-zinc-600" />
          </div>
          <h3 className="text-2xl font-black italic uppercase mb-3">Nenhum grupo ainda</h3>
          <p className="text-zinc-500 mb-6 max-w-md mx-auto">
            Crie seu primeiro grupo e convide amigos para competir nos treinos!
          </p>
          <button onClick={() => setShowNewGroupModal(true)} className="bg-lime-400 text-black px-8 py-4 rounded-2xl font-black uppercase text-sm inline-flex items-center gap-3">
            <Plus size={20} />
            Criar Primeiro Grupo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grupos.map((grupo) => {
            console.log(`🔍 Renderizando grupo ${grupo.nome}, meuPapel:`, grupo.meuPapel);
            return (
              <div key={grupo.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-lime-400/40 transition-all group">
                <div className="flex items-start gap-4 mb-4">
                  <div 
                    onClick={() => abrirGrupo(grupo.id)}
                    className="size-16 bg-zinc-950 rounded-2xl flex items-center justify-center border-2 border-zinc-800 group-hover:border-lime-400 transition-all cursor-pointer"
                  >
                    {grupo.imagem ? (
                      <img src={grupo.imagem} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <Users size={28} className="text-zinc-600 group-hover:text-lime-400 transition-all" />
                    )}
                  </div>
                  <div className="flex-1 cursor-pointer" onClick={() => abrirGrupo(grupo.id)}>
                    <h3 className="text-xl font-black italic uppercase mb-1">{grupo.nome}</h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase">{grupo.categoria}</p>
                  </div>
                  {grupo.meuPapel === 'admin' ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🎯 Botão compartilhar clicado para:', grupo.nome);
                        gerarConvite(grupo);
                      }}
                      className="size-10 bg-lime-400/20 hover:bg-lime-400 text-lime-400 hover:text-black rounded-xl flex items-center justify-center transition-all shrink-0"
                      title="Compartilhar convite"
                    >
                      <UserPlus size={18} />
                    </button>
                  ) : (
                    <div className="size-10" />
                  )}
                </div>
                
                {grupo.descricao && (
                  <p className="text-sm text-zinc-400 mb-4 line-clamp-2 cursor-pointer" onClick={() => abrirGrupo(grupo.id)}>{grupo.descricao}</p>
                )}
                
                <div className="flex items-center gap-4 pt-4 border-t border-zinc-800 cursor-pointer" onClick={() => abrirGrupo(grupo.id)}>
                  <div className="flex -space-x-2">
                    {grupo.membros?.slice(0, 3).map((membro: any, i: number) => (
                      <div key={i} className="size-8 rounded-full bg-zinc-800 border-2 border-zinc-900 overflow-hidden">
                        <img src={membro?.usuario?.imagemPerfil || 'https://picsum.photos/seed/user/100'} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 font-bold">{grupo.totalMembros} {grupo.totalMembros === 1 ? 'membro' : 'membros'}</p>
                  <div className="flex-1" />
                  <ChevronRight size={20} className="text-zinc-600 group-hover:text-lime-400 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Novo Grupo */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setShowNewGroupModal(false)}>
          <div className="bg-zinc-900 border-t-2 border-lime-400 sm:border sm:border-zinc-800 w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6 sm:mb-8">
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-black italic uppercase leading-tight text-white mb-1">
                  🏆 Novo Grupo
                </h3>
                <p className="text-xs text-zinc-500 font-medium">Crie um grupo de competição</p>
              </div>
              <button onClick={() => setShowNewGroupModal(false)} className="size-10 sm:size-11 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-all shrink-0 ml-4">
                <X size={18} className="sm:size-5"/>
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-zinc-300 block">📝 Nome do Grupo</label>
                <input 
                  type="text" 
                  placeholder="Ex: Equipe Iron Gym"
                  value={novoGrupo.nome} 
                  onChange={e => setNovoGrupo({...novoGrupo, nome: e.target.value})} 
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-base text-white outline-none focus:border-lime-400 placeholder:text-zinc-600 transition-colors" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-zinc-300 block">💭 Descrição <span className="text-zinc-600 font-normal">(opcional)</span></label>
                <textarea 
                  rows={3}
                  placeholder="Ex: Grupo para quem treina de manhã e quer bater metas juntos"
                  value={novoGrupo.descricao} 
                  onChange={e => setNovoGrupo({...novoGrupo, descricao: e.target.value})} 
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-base text-white outline-none focus:border-lime-400 placeholder:text-zinc-600 transition-colors resize-none" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-zinc-300 block">🎯 Categoria</label>
                <select 
                  value={novoGrupo.categoria} 
                  onChange={e => setNovoGrupo({...novoGrupo, categoria: e.target.value})}
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-base text-white outline-none appearance-none focus:border-lime-400 transition-colors"
                >
                  <option value="Treino Geral">Treino Geral</option>
                  <option value="Hipertrofia">Hipertrofia</option>
                  <option value="Emagrecimento">Emagrecimento</option>
                  <option value="Corrida">Corrida</option>
                  <option value="Crossfit">Crossfit</option>
                  <option value="Funcional">Funcional</option>
                </select>
              </div>
              
              <button 
                onClick={criarGrupo} 
                disabled={isSaving || !novoGrupo.nome} 
                className="w-full bg-lime-400 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm sm:text-base shadow-2xl shadow-lime-400/30 hover:bg-lime-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={20} className="animate-spin"/> 
                    <span>Criando...</span>
                  </>
                ) : (
                  <>
                    <Users size={20}/> 
                    <span>Criar Grupo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Convite */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setShowInviteModal(false)}>
          <div className="bg-zinc-900 border-t-2 border-lime-400 sm:border sm:border-zinc-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 animate-in slide-in-from-bottom sm:zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-black italic uppercase text-white">🎉 Convite Gerado!</h3>
                <p className="text-xs text-zinc-500 mt-1">Compartilhe e desafie seus amigos</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="size-10 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-all shrink-0 ml-4">
                <X size={18} />
              </button>
            </div>
            
            <div className="bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-4 mb-4">
              <p className="text-xs text-lime-400 font-mono break-all leading-relaxed">{linkConvite}</p>
            </div>
            
            <div className="space-y-3">
              <button onClick={copiarLink} className="w-full bg-lime-400 text-black py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-lime-500 active:scale-[0.98] transition-all">
                <Copy size={18} />
                Copiar Link
              </button>
              
              <button 
                onClick={() => {
                  const mensagem = `🏋️ Entre no meu grupo de treino no FitnessTech! ${linkConvite}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
                }}
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-green-700 active:scale-[0.98] transition-all"
              >
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Enviar WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileView = ({ user, profileImage, onImageChange, biometrics, onBiometricsChange, watchConnected, toggleWatch, deviceName }: any) => {
  console.log('🔍 ProfileView - user recebido:', user);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempBiometrics, setTempBiometrics] = useState({...biometrics});
  const [notif, setNotif] = useState(true);
  const [isPairing, setIsPairing] = useState(false);

  useEffect(() => { if (!isEditing) setTempBiometrics({...biometrics}); }, [biometrics, isEditing]);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { userAPI } = await import('./src/api');
      await userAPI.updateProfile({
        altura: tempBiometrics.height,
        peso: tempBiometrics.weight,
        idade: tempBiometrics.age,
        objetivo: tempBiometrics.goal
      });
      onBiometricsChange({...tempBiometrics});
      setIsEditing(false);
      alert('✅ Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('❌ Erro ao salvar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => { setTempBiometrics({...biometrics}); setIsEditing(false); };

  const handleDevicePairing = async () => {
    if (watchConnected) {
      toggleWatch(false);
      if (window.bluetoothHRM) {
        await window.bluetoothHRM.disconnect();
      }
    } else {
      // Diagnóstico completo
      console.log('🔍 Diagnóstico Web Bluetooth:');
      console.log('- navigator.bluetooth:', navigator.bluetooth);
      console.log('- window.isSecureContext:', window.isSecureContext);
      console.log('- window.location.protocol:', window.location.protocol);
      console.log('- User Agent:', navigator.userAgent);

      // Verificar contexto seguro (HTTPS ou localhost)
      if (!window.isSecureContext) {
        alert('⚠️ Web Bluetooth requer HTTPS!\n\nO site precisa estar em:\n• https:// (produção)\n• localhost (desenvolvimento)\n\nAtualmente em: ' + window.location.protocol);
        return;
      }

      // Verificar se Web Bluetooth está disponível
      if (!navigator.bluetooth) {
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        const errorMsg = isChrome 
          ? '⚠️ Web Bluetooth não disponível!\n\nTente:\n1. Abrir chrome://flags/#enable-web-bluetooth\n2. Ativar "Experimental Web Platform features"\n3. Reiniciar o Chrome\n\nOu use Chrome Canary/Beta que tem suporte nativo.'
          : '⚠️ Web Bluetooth não está disponível.\n\nPor favor, use:\n• Chrome (Desktop ou Android)\n• Microsoft Edge\n• Opera';
        
        alert(errorMsg);
        return;
      }

      setIsPairing(true);
      
      try {
        console.log('🔍 Solicitando dispositivo Bluetooth...');
        const device = await window.bluetoothHRM.requestDevice();
        
        if (device) {
          console.log('✅ Dispositivo selecionado:', device.name);
          const connected = await window.bluetoothHRM.connect();
          
          if (connected) {
            toggleWatch(true, device.name || 'Heart Rate Monitor');
            alert(`✅ ${device.name || 'Dispositivo'} conectado com sucesso!`);
          } else {
            alert('❌ Falha ao conectar. Tente novamente.');
          }
        }
      } catch (err: any) {
        if (err.name === 'NotFoundError') {
          console.log('ℹ️ Nenhum dispositivo selecionado');
        } else {
          console.error('❌ Erro ao conectar:', err);
          alert(`❌ Erro: ${err.message}\n\nDicas:\n• Certifique-se que o dispositivo está ligado\n• Ative o sensor de FC (abra app de treino)\n• Verifique se Bluetooth está habilitado`);
        }
      } finally {
        setIsPairing(false);
      }
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8 md:space-y-12 max-w-4xl mx-auto">
      <header className="flex flex-col items-center gap-6 md:gap-10">
        <div className="relative group"><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend = () => onImageChange(r.result as string); r.readAsDataURL(f); } }}/><div onClick={() => fileInputRef.current?.click()} className="size-28 md:size-40 rounded-3xl md:rounded-[4rem] border-[6px] md:border-[10px] border-zinc-900 shadow-2xl overflow-hidden relative cursor-pointer"><img src={profileImage} className="w-full h-full object-cover transition-transform group-hover:scale-110 active:scale-110 duration-500"/><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 active:opacity-100 flex flex-col items-center justify-center transition-opacity"><Camera size={24} className="md:size-8 text-lime-400 mb-1" /><span className="text-[8px] md:text-[9px] font-black uppercase text-lime-400">Trocar Foto</span></div></div><div className="absolute -bottom-2 -right-2 size-10 md:size-14 bg-lime-400 text-black rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl border-4 md:border-[6px] border-zinc-950"><Trophy size={20} className="md:size-7" strokeWidth={3} /></div></div>
        <div className="text-center"><h1 className="text-3xl md:text-4xl lg:text-6xl font-black italic uppercase tracking-tighter leading-none mb-3 md:mb-4">{user?.nome || user?.name || 'Usuário'}</h1><div className="flex flex-wrap justify-center gap-2 md:gap-3"><span className="bg-zinc-900 border border-zinc-800 px-4 md:px-5 py-1.5 md:py-2 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase text-zinc-400 tracking-widest">Aluno VIP</span><span className="bg-lime-400/10 border border-lime-400/30 px-4 md:px-5 py-1.5 md:py-2 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase text-lime-400 tracking-widest">Nível 28</span></div></div>
      </header>
      <div className="grid grid-cols-1 gap-6 md:gap-8">
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-8 lg:p-10 shadow-2xl space-y-6 md:space-y-10">
           <div className="flex items-center justify-between"><h4 className="text-lg md:text-xl font-black italic uppercase tracking-tighter flex items-center gap-2 md:gap-3"><User size={18} className="md:size-5 text-lime-400"/> Biometria</h4>{!isEditing ? (<button onClick={() => setIsEditing(true)} className="text-[9px] md:text-[10px] font-black uppercase text-lime-400 active:underline">Editar</button>) : (<div className="flex gap-3 md:gap-4"><button onClick={handleCancel} disabled={isSaving} className="text-[9px] md:text-[10px] font-black uppercase text-zinc-500 active:text-white disabled:opacity-50">Cancelar</button><button onClick={handleSave} disabled={isSaving} className="text-[9px] md:text-[10px] font-black uppercase text-lime-400 flex items-center gap-1 disabled:opacity-50">{isSaving ? <Loader2 size={10} className="md:size-3 animate-spin"/> : <Save size={10} className="md:size-3"/>} {isSaving ? 'Salvando...' : 'Salvar'}</button></div>)}</div>
           <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="bg-zinc-950 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-800/50"><p className="text-[9px] md:text-[10px] font-black uppercase text-zinc-600 mb-1">Altura</p>{isEditing ? (<input type="number" step="0.01" value={tempBiometrics.height} onChange={(e) => setTempBiometrics({...tempBiometrics, height: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 w-full text-white font-black italic text-sm" />) : (<p className="text-xl md:text-2xl font-black italic text-white">{biometrics.height}m</p>)}</div>
              <div className="bg-zinc-950 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-800/50"><p className="text-[9px] md:text-[10px] font-black uppercase text-zinc-600 mb-1">Peso</p>{isEditing ? (<input type="number" step="0.1" value={tempBiometrics.weight} onChange={(e) => setTempBiometrics({...tempBiometrics, weight: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 w-full text-white font-black italic text-sm" />) : (<p className="text-xl md:text-2xl font-black italic text-white">{biometrics.weight}kg</p>)}</div>
              <div className="bg-zinc-950 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-800/50"><p className="text-[9px] md:text-[10px] font-black uppercase text-zinc-600 mb-1">Idade</p>{isEditing ? (<input type="number" value={tempBiometrics.age} onChange={(e) => setTempBiometrics({...tempBiometrics, age: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 w-full text-white font-black italic text-sm" />) : (<p className="text-xl md:text-2xl font-black italic text-white">{biometrics.age} anos</p>)}</div>
              <div className="bg-zinc-950 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-800/50"><p className="text-[9px] md:text-[10px] font-black uppercase text-zinc-600 mb-1">Meta</p>{isEditing ? (<select value={tempBiometrics.goal} onChange={(e) => setTempBiometrics({...tempBiometrics, goal: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 w-full text-white font-black italic outline-none appearance-none text-sm"><option value="Hipertrofia">Hipertrofia</option><option value="Cutting">Cutting</option><option value="Bulking">Bulking</option></select>) : (<p className="text-base md:text-xl font-black italic text-lime-400 uppercase tracking-tighter break-words">{biometrics.goal}</p>)}</div>
           </div>
        </section>
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-8 lg:p-10 shadow-2xl space-y-6 md:space-y-8"><h4 className="text-lg md:text-xl font-black italic uppercase tracking-tighter flex items-center gap-2 md:gap-3"><ShieldCheck size={18} className="md:size-5 text-blue-400"/> Assinatura</h4><div className="bg-zinc-950 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden"><div className="absolute top-0 right-0 p-8 md:p-10 opacity-5"><Trophy size={100} className="md:size-[140px] text-lime-400" /></div><div className="relative z-10"><p className="text-[9px] md:text-[10px] font-black uppercase text-lime-400 tracking-widest mb-2">PLANO ATUAL</p><h5 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-4">BLACK VIP</h5><div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8"><div className="size-9 md:size-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500"><CardIcon size={18} className="md:size-5"/></div><div><p className="text-[9px] md:text-[10px] font-black uppercase text-zinc-300">Pagamento</p><p className="text-[10px] md:text-xs font-bold text-zinc-500">Mastercard **** 8291</p></div></div><div className="pt-4 md:pt-6 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4"><div><p className="text-[9px] font-black uppercase text-zinc-600">Próxima Cobrança</p><p className="text-xs md:text-sm font-black italic text-white">15 de Nov, 2024</p></div><button onClick={() => alert('Gerenciar Assinatura\n\nPlano Atual: BLACK VIP\nPróxima cobrança: 15 de Nov, 2024\n\nOpções:\n• Alterar plano\n• Alterar forma de pagamento\n• Cancelar assinatura')} className="text-[9px] md:text-[10px] font-black uppercase bg-zinc-900 border border-zinc-800 px-5 md:px-6 py-2 md:py-2.5 rounded-xl active:text-red-400 transition-all w-full sm:w-auto">Gerenciar</button></div></div></div></section>
      </div>
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-8 lg:p-10 shadow-2xl">
         <h4 className="text-lg md:text-xl font-black italic uppercase tracking-tighter mb-6 md:mb-10 flex items-center gap-2 md:gap-3"><Settings size={18} className="md:size-5 text-orange-400"/> Configurações</h4>
         <div className="grid grid-cols-1 gap-4 md:gap-6">
            <div className="flex items-center justify-between py-4 md:py-6 border-b border-zinc-800/50">
               <div className="flex items-center gap-3 md:gap-4"><div className="size-10 md:size-12 bg-zinc-950 rounded-xl md:rounded-2xl flex items-center justify-center text-zinc-500"><Bell size={18} className="md:size-5"/></div><div><p className="text-xs md:text-sm font-black uppercase italic text-zinc-200">Notificações</p><p className="text-[9px] md:text-[10px] font-bold text-zinc-600">Lembretes diários</p></div></div>
               <button onClick={() => setNotif(!notif)} className={`w-12 md:w-14 h-7 md:h-8 rounded-full transition-all relative p-1 ${notif ? 'bg-lime-400' : 'bg-zinc-950 border border-zinc-800'}`}><div className={`size-5 md:size-6 rounded-full transition-all ${notif ? 'bg-black translate-x-5 md:translate-x-6' : 'bg-zinc-700'}`} /></button>
            </div>
            <div className="flex items-center justify-between py-4 md:py-6 border-b border-zinc-800/50">
               <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1"><div className="size-10 md:size-12 bg-zinc-950 rounded-xl md:rounded-2xl flex items-center justify-center text-zinc-500 shrink-0"><Smartphone size={18} className="md:size-5"/></div><div className="min-w-0"><p className="text-xs md:text-sm font-black uppercase italic text-zinc-200">Dispositivos</p><p className="text-[9px] md:text-[10px] font-bold text-zinc-600 truncate">Apple Health / Watch</p></div></div>
               <button onClick={handleDevicePairing} disabled={isPairing} className={`px-4 md:px-6 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all flex items-center gap-1.5 md:gap-2 shrink-0 ${watchConnected ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-zinc-950 border border-zinc-800 active:text-white'}`}>
                  {isPairing ? <Loader2 size={12} className="animate-spin"/> : watchConnected ? <Watch size={12} className="md:size-[14px]"/> : <Plus size={12} className="md:size-[14px]"/>}
                  <span className="hidden sm:inline">{isPairing ? 'Buscando...' : watchConnected ? `Conectado${deviceName ? `: ${deviceName}` : ''}` : 'Conectar'}</span>
                  <span className="sm:hidden">{isPairing ? '...' : watchConnected ? 'Ok' : '+'}</span>
               </button>
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
      <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-4 md:gap-6">
        <div><h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">Marketplace</h2><p className="text-zinc-500 font-medium">Equipamentos de elite.</p></div>
        <div className="flex items-center gap-2 md:gap-4">
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
        {filtered.length > 0 ? (
          filtered.map((product: Product) => (
            <div key={product.id} className="group bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-lime-400/40 transition-all shadow-xl hover:translate-y-[-8px]">
              <div className="aspect-square relative overflow-hidden bg-zinc-950"><img src={product.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/><div className="absolute top-4 left-4 bg-zinc-900/80 border border-zinc-800 px-3 py-1 rounded-full"><span className="text-[10px] font-black text-lime-400 uppercase tracking-widest">{product.brand}</span></div></div>
              <div className="p-8">
                <h4 className="text-lg font-black italic uppercase tracking-tight mb-2 truncate">{product.name}</h4>
                <div className="flex items-center justify-between mb-8"><p className="text-2xl font-black text-white italic">R$ {product.price.toFixed(2)}</p><span className="text-[10px] font-bold text-zinc-500 uppercase">{product.stock} un</span></div>
                <button onClick={() => addToCart(product)} className="w-full bg-zinc-950 hover:bg-lime-400 text-zinc-400 hover:text-black border border-zinc-800 hover:border-lime-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-95"><Plus size={16} /> Adicionar</button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center">
            <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={40} className="text-zinc-600"/>
            </div>
            <h3 className="text-3xl font-black italic uppercase mb-4">Loja em Breve!</h3>
            <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
              Estamos preparando uma seleção incrível de produtos para você. 
              Em breve teremos suplementos, equipamentos e muito mais!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-2xl">
                <span className="text-lime-400 font-black text-sm uppercase">🏋️ Equipamentos Premium</span>
              </div>
              <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-2xl">
                <span className="text-lime-400 font-black text-sm uppercase">💊 Suplementos</span>
              </div>
              <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-2xl">
                <span className="text-lime-400 font-black text-sm uppercase">👕 Vestuário</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <button onClick={openCart} className="fixed bottom-32 md:bottom-12 right-6 md:right-12 size-16 md:size-20 bg-lime-400 text-black rounded-[2rem] flex items-center justify-center shadow-2xl shadow-lime-400/30 hover:scale-110 active:scale-95 transition-all z-[60] cursor-pointer">
        <div className="relative"><ShoppingBag size={32} />{cartCount > 0 && <div className="absolute -top-3 -right-3 size-7 bg-black text-lime-400 text-xs font-black rounded-full flex items-center justify-center border-4 border-lime-400">{cartCount}</div>}</div>
      </button>
    </div>
  );
};

// --- NUTRI EXTENSIONS: SUBSTITUTIONS & VISUAL DIARY ---

const NutritionView = ({ diet, dayIdx, onGenerateDiet, user, onReloadDietas }: { diet: any, dayIdx: number, onGenerateDiet: (d: any) => void, user?: any, onReloadDietas?: () => void }) => {
  const [completedMeals, setCompletedMeals] = useState<number[]>([]);
  const [substitutionModal, setSubstitutionModal] = useState<{ isOpen: boolean, original: string, options: string[] }>({ isOpen: false, original: '', options: [] });

  // Garantir que diet sempre tenha a estrutura correta
  const safeDiet = {
    meals: Array.isArray(diet?.meals) ? diet.meals : [],
    totalCalories: diet?.totalCalories || 0,
    macros: diet?.macros || { protein: 0, carbs: 0, fat: 0 }
  };

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

  const progress = safeDiet.meals.length > 0 ? (completedMeals.length / safeDiet.meals.length) * 100 : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div className="flex-1">
            <h2 className="text-3xl md:text-5xl font-black italic uppercase mb-2">Nutrição</h2>
            <p className="text-sm md:text-base text-zinc-500 font-medium">Combustível para o corpo.</p>
         </div>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] shadow-xl">
        <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3"><div className="size-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center"><Utensils size={20} /></div><div><p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Adesão Diária</p><h4 className="text-lg font-black italic uppercase">{completedMeals.length} de {safeDiet.meals.length} refeições</h4></div></div>
        <span className="text-xl font-black italic text-lime-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5"><div className="h-full bg-lime-400 rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
           {safeDiet.meals.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[3rem] p-12 text-center">
                 <div className="size-20 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Apple size={32} className="text-zinc-600" />
                 </div>
                 <h3 className="text-2xl font-black italic uppercase text-zinc-400 mb-3">Nenhuma dieta prescrita</h3>
                 <p className="text-sm text-zinc-500 max-w-md mx-auto">
                    Seu nutricionista ainda não criou um plano alimentar para você. Entre em contato para receber sua dieta personalizada.
                 </p>
              </div>
           ) : (
              <>
                 <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 mb-4">
                    <p className="text-xs text-zinc-400 flex items-center gap-2">
                      <Check size={14} className="text-lime-400" />
                      <span>Clique em qualquer refeição para marcar como concluída</span>
                    </p>
                 </div>
                 {safeDiet.meals.map((meal: any, idx: number) => {
             const isDone = completedMeals.includes(idx);
             
             // Extrair informações da refeição
             const mealIcon = meal?.icon || <Utensils size={24} />;
             const mealName = meal?.n || meal?.name || meal?.nome || meal?.refeicao || 'Refeição';
             const mealTime = meal?.t || meal?.time || meal?.horario || meal?.hora || '00:00';
             const mealKcal = meal?.kcal || meal?.calorias || meal?.calories || 0;
             
             // Verificar se alimentos é string (texto) ou array
             const alimentosTexto = meal?.alimentos;
             const isAlimentosString = typeof alimentosTexto === 'string';
             
             // Se for array, usar como está; se for string, não processar como items
             const mealItems = Array.isArray(meal?.items) ? meal.items 
                             : Array.isArray(meal?.alimentos) ? meal.alimentos
                             : Array.isArray(meal?.foods) ? meal.foods
                             : Array.isArray(meal?.ingredientes) ? meal.ingredientes
                             : Array.isArray(meal?.itens) ? meal.itens
                             : [];
             
             return (
               <div key={idx} onClick={() => toggleMeal(idx)} className={`group relative bg-zinc-900 border cursor-pointer rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 flex flex-col md:flex-row gap-4 md:gap-6 transition-all duration-300 active:scale-[0.98] ${isDone ? 'border-lime-400/30 bg-lime-400/5' : 'border-zinc-800 hover:border-zinc-700 hover:shadow-lg hover:shadow-lime-400/10'}`}>
                  <div className={`size-16 rounded-3xl flex items-center justify-center shrink-0 shadow-lg border transition-all duration-500 ${isDone ? 'bg-lime-400 border-lime-400 text-black rotate-12' : 'bg-zinc-950 border-zinc-800 text-blue-400 group-hover:border-lime-400/30 group-hover:text-lime-400'}`}>{isDone ? <Check size={28} strokeWidth={4} /> : mealIcon}</div>
                  <div className="flex-1">
                     <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-2">
                       <h4 className={`text-lg md:text-xl font-black italic uppercase tracking-tight ${isDone ? 'text-zinc-500 line-through' : 'text-white group-hover:text-lime-400 transition-colors'}`}>
                         {mealName} {!isDone && <span className="text-[9px] text-zinc-600 group-hover:text-lime-400/50 font-normal ml-2">· Clique para marcar</span>}
                       </h4>
                       <div className="flex gap-3">
                         <span className="text-[10px] bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg font-black">{mealTime}</span>
                         <span className={`text-[10px] px-3 py-1 rounded-lg font-black ${isDone ? 'bg-lime-400 text-black' : 'bg-blue-500/20 text-blue-400'}`}>{mealKcal}</span>
                       </div>
                     </div>
                     
                     {/* Exibir alimentos: se for string, mostrar texto; se for array, mostrar lista */}
                     {isAlimentosString ? (
                       <div className={`p-4 rounded-2xl border ${isDone ? 'bg-zinc-950/30 border-zinc-800/50 opacity-60' : 'bg-zinc-950 border-zinc-800'}`}>
                         <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{alimentosTexto}</p>
                       </div>
                     ) : mealItems.length > 0 ? (
                       <div className="grid grid-cols-1 gap-3">
                         {mealItems.map((item: any, i: number) => {
                           const itemName = item?.name || item?.nome || item || 'Alimento';
                           const itemKcal = item?.kcal || item?.calorias || 0;
                           
                           return (
                             <div key={i} onClick={(e) => handleFoodClick(e, typeof itemName === 'string' ? itemName : 'Alimento')} className={`p-4 rounded-2xl flex justify-between items-center border hover:border-lime-400/50 transition-colors ${isDone ? 'bg-zinc-950/30 border-zinc-800/50 opacity-60' : 'bg-zinc-950 border-zinc-800'}`}>
                               <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">{itemName} {Object.keys(FOOD_SUBSTITUTIONS).some(k => typeof itemName === 'string' && itemName.includes(k)) && <RefreshCw size={10} className="text-lime-400"/>}</span>
                               <span className="text-[9px] font-black uppercase text-zinc-600">{itemKcal} kcal</span>
                             </div>
                           );
                         })}
                       </div>
                     ) : null}
                  </div>
               </div>
             );
           })}
              </>
           )}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem] shadow-xl h-fit">
          <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-8">Macros</h4>
          {(() => {
            const macros = safeDiet.macros ? [
              { name: 'Proteínas', value: safeDiet.macros.protein || 30, fill: '#D9FF00' },
              { name: 'Carboidratos', value: safeDiet.macros.carbs || 50, fill: '#3b82f6' },
              { name: 'Gorduras', value: safeDiet.macros.fat || 20, fill: '#f97316' }
            ] : [
              { name: 'Proteínas', value: 30, fill: '#D9FF00' },
              { name: 'Carboidratos', value: 50, fill: '#3b82f6' },
              { name: 'Gorduras', value: 20, fill: '#f97316' }
            ];
            
            return (
              <>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
                      <Pie data={macros} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                        {macros.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full mt-6 space-y-4">
                  {macros.map((macro, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="size-3 rounded-full" style={{ backgroundColor: macro.fill }} />
                        <span className="text-xs font-black uppercase text-zinc-300">{macro.name}</span>
                      </div>
                      <span className="text-xs font-black italic text-white">{macro.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
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
    </div>
  );
};

// --- MODULES ---

const StudentModule = ({ user, view, setView, products, addToCart, cartCount, setIsCartOpen, profileImage, onImageChange, biometrics, onBiometricsChange, dietPlans, setDietPlans, watchConnected, toggleWatch, deviceName, activeSession, setActiveSession, activeSessionTime, sessionFinished, setSessionFinished, setActiveSessionTime }: any) => {
  console.log('🔍 StudentModule - user recebido:', user);
  const [selectedDayWorkout, setSelectedDayWorkout] = useState(new Date().getDay());
  const [selectedDayDiet, setSelectedDayDiet] = useState(new Date().getDay());
  
  // Estados para geração de treino/dieta com IA
  const [showIAModal, setShowIAModal] = useState(false);
  const [iaType, setIaType] = useState<'treino' | 'dieta'>('treino');
  const [iaConfig, setIaConfig] = useState({ objetivo: '', restricoes: '', diasTreino: 3 });
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);
  
  // Estados para dados do banco
  const [historicoTreinos, setHistoricoTreinos] = useState<any[]>([]);
  const [historicoDietas, setHistoricoDietas] = useState<any[]>([]);
  const [medicoes, setMedicoes] = useState<any[]>([]);
  const [fotosProgresso, setFotosProgresso] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  
  // Carregar dados do aluno quando componente montar
  useEffect(() => {
    const carregarDadosAluno = async () => {
      const token = localStorage.getItem('fitness_token');
      if (!token) return;
      
      try {
        console.log('🔄 Carregando dados do aluno...');
        const [treinos, dietas, medicoesData, fotos, metasData, gruposData, notifs] = await Promise.all([
          carregarHistoricoTreinos(token),
          carregarHistoricoDietas(token), 
          carregarMedicoes(token),
          carregarFotosProgresso(token),
          carregarMetas(token),
          carregarGrupos(token),
          carregarNotificacoes(token)
        ]);
        
        console.log('📥 Treinos recebidos para o aluno:', treinos);
        console.log('📥 Quantidade de treinos:', Array.isArray(treinos) ? treinos.length : 'N/A');
        
        // Formatar treinos para o formato esperado pelo frontend
        const treinosFormatados = Array.isArray(treinos) ? treinos.map((treino: any) => {
          console.log('🔧 Processando treino:', {
            id: treino.id,
            titulo: treino.tituloTreino,
            exercicios_raw: treino.exercicios,
            tipo_exercicios: typeof treino.exercicios
          });
          
          // Garantir que exercicios seja um objeto
          let planoExercicios = {};
          if (typeof treino.exercicios === 'string') {
            try {
              planoExercicios = JSON.parse(treino.exercicios);
              console.log('✅ Parsed de string para objeto:', planoExercicios);
            } catch (e) {
              console.error('❌ Erro ao fazer parse:', e);
            }
          } else if (typeof treino.exercicios === 'object' && treino.exercicios !== null) {
            planoExercicios = treino.exercicios;
            console.log('✅ Já é objeto:', planoExercicios);
          }
          
          return {
            id: treino.id,
            titulo: treino.tituloTreino || treino.titulo || 'Treino',
            alunoId: treino.usuarioId,
            alunoNome: 'Aluno',
            data: new Date(treino.data).toLocaleDateString('pt-BR'),
            plano: planoExercicios,
            tipo: treino.origem === 'IA' ? 'ia' : 'manual'
          };
        }) : [];
        
        // Log detalhado de cada treino formatado
        if (treinosFormatados.length > 0) {
          treinosFormatados.forEach((t, index) => {
            console.log(`📋 Treino ${index + 1} formatado:`, {
              id: t.id,
              titulo: t.titulo,
              plano: t.plano,
              diasComExercicios: Object.keys(t.plano || {})
            });
          });
        }
        
        // Formatar dietas para o formato esperado pelo frontend
        console.log('📥 Dietas recebidas para o aluno:', dietas);
        const dietasFormatadas = Array.isArray(dietas) ? dietas.map((dieta: any) => {
          console.log('🥗 Processando dieta:', dieta);
          // As dietas vêm da tabela Relatorio com estrutura: dados: { titulo, refeicoes, ... }
          const plano = dieta.dados?.refeicoes || dieta.conteudo?.refeicoes || {};
          console.log('🥗 Plano extraído:', plano);
          return {
            id: dieta.id,
            titulo: dieta.dados?.titulo || dieta.titulo || 'Dieta',
            alunoId: dieta.usuarioId,
            alunoNome: 'Aluno',
            data: new Date(dieta.criadoEm).toLocaleDateString('pt-BR'),
            plano: plano,
            tipo: (dieta.dados?.origem || dieta.conteudo?.origem) === 'IA' ? 'ia' : 'manual'
          };
        }) : [];
        
        console.log('✅ Dietas formatadas:', dietasFormatadas);
        
        setHistoricoTreinos(treinosFormatados);
        setHistoricoDietas(dietasFormatadas);
        setMedicoes(medicoesData);
        setFotosProgresso(fotos);
        setMetas(metasData);
        setGrupos(gruposData);
        setNotificacoes(notifs);
        
        console.log('✅ Dados do aluno carregados com sucesso');
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados do aluno:', error);
      }
    };
    
    carregarDadosAluno();
  }, []);
  
  // Função para recarregar apenas as dietas
  const recarregarDietas = async () => {
    const token = localStorage.getItem('fitness_token');
    if (!token) return;
    
    try {
      const dietas = await carregarHistoricoDietas(token);
      const dietasFormatadas = Array.isArray(dietas) ? dietas.map((dieta: any) => {
        const plano = dieta.dados?.refeicoes || dieta.conteudo?.refeicoes || {};
        return {
          id: dieta.id,
          titulo: dieta.dados?.titulo || dieta.titulo || 'Dieta',
          alunoId: dieta.usuarioId,
          alunoNome: 'Aluno',
          data: new Date(dieta.criadoEm).toLocaleDateString('pt-BR'),
          plano: plano,
          tipo: (dieta.dados?.origem || dieta.conteudo?.origem) === 'IA' ? 'ia' : 'manual'
        };
      }) : [];
      
      setHistoricoDietas(dietasFormatadas);
      console.log('✅ Dietas recarregadas:', dietasFormatadas.length);
    } catch (error) {
      console.error('❌ Erro ao recarregar dietas:', error);
    }
  };
  
  // Função para recarregar treinos
  const recarregarTreinos = async () => {
    const token = localStorage.getItem('fitness_token');
    if (!token) return;
    
    try {
      const treinos = await carregarHistoricoTreinos(token);
      const treinosFormatados = Array.isArray(treinos) ? treinos.map((treino: any) => {
        let planoExercicios = {};
        if (typeof treino.exercicios === 'string') {
          try {
            planoExercicios = JSON.parse(treino.exercicios);
          } catch (e) {
            console.error('❌ Erro ao fazer parse:', e);
          }
        } else if (typeof treino.exercicios === 'object' && treino.exercicios !== null) {
          planoExercicios = treino.exercicios;
        }
        
        return {
          id: treino.id,
          titulo: treino.tituloTreino || treino.titulo || 'Treino',
          alunoId: treino.usuarioId,
          alunoNome: 'Aluno',
          data: new Date(treino.data).toLocaleDateString('pt-BR'),
          plano: planoExercicios,
          tipo: treino.origem === 'IA' ? 'ia' : 'manual'
        };
      }) : [];
      
      setHistoricoTreinos(treinosFormatados);
      console.log('✅ Treinos recarregados:', treinosFormatados.length);
    } catch (error) {
      console.error('❌ Erro ao recarregar treinos:', error);
    }
  };
  
  // Função para gerar treino com IA
  const gerarTreinoComIA = async () => {
    if (!iaConfig.objetivo) {
      alert('Preencha o objetivo do treino');
      return;
    }
    
    setIsGeneratingIA(true);
    try {
      const prompt = `Você é um personal trainer expert. Crie um plano de treino semanal completo.

Objetivo: ${iaConfig.objetivo}
Restrições: ${iaConfig.restricoes || 'Nenhuma'}
Dias de treino: ${iaConfig.diasTreino}

Retorne APENAS um JSON válido no formato:
{
  "titulo": "Plano de Treino - [Objetivo]",
  "segunda": [{"nome": "Exercício", "series": "3", "repeticoes": "12", "carga": "Moderada", "descanso": "90s"}],
  "terca": [],
  "quarta": [],
  "quinta": [],
  "sexta": [],
  "sabado": [],
  "domingo": []
}

Distribua exercícios em ${iaConfig.diasTreino} dias. Seja específico e profissional.`;

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Formato inválido');
      
      const planoGerado = JSON.parse(jsonMatch[0]);
      
      // Salvar no banco
      const token = localStorage.getItem('fitness_token');
      if (token && user?.id) {
        const dadosTreino = {
          usuarioId: user.id,
          titulo: planoGerado.titulo || `Treino IA - ${iaConfig.objetivo}`,
          tipoTreino: 'Treino Personalizado IA',
          duracao: 60,
          exercicios: planoGerado,
          observacoes: `Gerado pela IA - Objetivo: ${iaConfig.objetivo}`,
          origem: 'IA'
        };
        
        await salvarTreino(token, dadosTreino);
        alert('✅ Treino gerado e salvo com sucesso!');
        
        // Recarregar lista de treinos
        await recarregarTreinos();
      }
      
      setShowIAModal(false);
      setIaConfig({ objetivo: '', restricoes: '', diasTreino: 3 });
    } catch (error) {
      console.error('Erro ao gerar treino:', error);
      alert('Erro ao gerar treino. Tente novamente.');
    } finally {
      setIsGeneratingIA(false);
    }
  };
  
  // Função para gerar dieta com IA
  const gerarDietaComIA = async () => {
    if (!iaConfig.objetivo) {
      alert('Preencha o objetivo da dieta');
      return;
    }
    
    setIsGeneratingIA(true);
    try {
      const prompt = `Você é um nutricionista expert. Crie um plano alimentar completo para a semana.

Objetivo: ${iaConfig.objetivo}
Restrições: ${iaConfig.restricoes || 'Nenhuma'}

Retorne APENAS um JSON válido no formato:
{
  "titulo": "Plano Alimentar Semanal - [Objetivo]",
  "objetivoCalorico": "2500 kcal",
  "segunda": [{"nome": "Café da Manhã", "horario": "07:00", "alimentos": "Lista detalhada", "calorias": "500 kcal"}],
  "terca": [],
  "quarta": [],
  "quinta": [],
  "sexta": [],
  "sabado": [],
  "domingo": []
}

Crie 5-6 refeições balanceadas por dia. Seja específico nas quantidades.`;

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Formato inválido');
      
      const planoGerado = JSON.parse(jsonMatch[0]);
      
      // Salvar no banco
      const token = localStorage.getItem('fitness_token');
      if (token && user?.id) {
        const dadosDieta = {
          usuarioId: user.id,
          titulo: planoGerado.titulo || `Dieta IA - ${iaConfig.objetivo}`,
          objetivo: planoGerado.objetivoCalorico,
          refeicoes: planoGerado,
          observacoes: `Gerada pela IA - Objetivo: ${iaConfig.objetivo}`,
          origem: 'IA'
        };
        
        await salvarDieta(token, dadosDieta);
        alert('✅ Dieta gerada e salva com sucesso!');
        
        // Recarregar lista de dietas
        await recarregarDietas();
      }
      
      setShowIAModal(false);
      setIaConfig({ objetivo: '', restricoes: '', diasTreino: 3 });
    } catch (error) {
      console.error('Erro ao gerar dieta:', error);
      alert('Erro ao gerar dieta. Tente novamente.');
    } finally {
      setIsGeneratingIA(false);
    }
  };

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
        <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-6 md:right-auto z-[100] animate-in slide-in-from-bottom duration-500">
          <button 
            onClick={() => setView('active-workout')} 
            className="bg-lime-400 text-black px-5 py-3.5 md:px-6 md:py-4 rounded-2xl shadow-2xl shadow-lime-400/30 flex items-center gap-3 active:scale-95 transition-all border-4 border-zinc-950 w-full md:w-auto justify-center"
          >
            <div className="size-2 bg-red-500 rounded-full animate-pulse" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-black uppercase tracking-widest">Treino Ativo</span>
              <span className="text-base md:text-lg font-black italic">{Math.floor(activeSessionTime / 60)}:{String(activeSessionTime % 60).padStart(2, '0')}</span>
            </div>
            <Play size={18} fill="currentColor" />
          </button>
        </div>
      )}

      <div className="w-full min-h-screen">
        {(() => {
          switch (view) {
    case 'dashboard':
      // Pegar treino prescrito para o dia da semana atual
      const hoje = new Date();
      const diasSemanaArray = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const diaAtualNome = diasSemanaArray[hoje.getDay()];
      
      // Buscar o treino mais recente que tenha exercícios para hoje
      const treinoHoje = historicoTreinos.find(t => {
         return t.plano && t.plano[diaAtualNome] && t.plano[diaAtualNome].length > 0;
      });
      
      const todayWorkout = treinoHoje ? {
         title: treinoHoje.titulo || 'Treino do Dia',
         category: treinoHoje.tipo === 'ia' ? 'IA' : 'Manual',
         duration: '60 min',
         exercises: (treinoHoje.plano[diaAtualNome] || []).map((ex: any) => ({
            id: ex.id || `ex-${Date.now()}-${Math.random()}`, // Adicionar ID único se não existir
            nome: ex.nome || ex.exercicio,
            n: ex.nome || ex.exercicio,
            s: ex.series,
            r: ex.repeticoes,
            w: ex.carga,
            rest: ex.descanso || '90s',
            group: ex.grupo || 'Geral', // Adicionar grupo padrão
            orientations: ex.orientacoes || ['Execute o movimento com boa técnica', 'Mantenha a respiração controlada'], // Orientações padrão
            video: ex.video || null // URL do vídeo se existir
         }))
      } : {
         title: 'Treino não definido',
         duration: '45 min',
         exercises: [],
         category: 'Padrão'
      };
      
      return (
        <div className="space-y-8 animate-in fade-in duration-700">
           <header><h1 className="text-3xl md:text-4xl lg:text-6xl font-black italic uppercase tracking-tighter leading-none mb-1">Olá, {user?.nome?.split(' ')[0] || 'Atleta'}</h1><p className="text-xs md:text-sm text-zinc-500 font-medium">Vamos destruir hoje?</p></header>
           
           {/* Banner de treino ativo */}
           {activeSession && (
             <div className="bg-gradient-to-r from-lime-400/20 to-lime-500/10 border-2 border-lime-400/50 p-4 md:p-6 rounded-2xl shadow-xl shadow-lime-400/10 animate-in slide-in-from-top duration-500">
               <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-4">
                   <div className="size-12 bg-lime-400 rounded-xl flex items-center justify-center text-black animate-pulse shrink-0">
                     <Timer size={24} strokeWidth={3} />
                   </div>
                   <div className="min-w-0">
                     <div className="flex items-center gap-2 mb-1">
                       <div className="size-2 bg-red-500 rounded-full animate-pulse" />
                       <h3 className="text-base md:text-xl font-black italic uppercase tracking-tight text-lime-400">Treino em Andamento</h3>
                     </div>
                     <p className="text-zinc-400 font-bold text-sm truncate">{activeSession.title}</p>
                   </div>
                 </div>
                 <div className="flex items-center justify-between gap-4">
                   <div className="text-center">
                     <p className="text-[9px] font-black uppercase text-zinc-500 mb-0.5">Tempo Decorrido</p>
                     <p className="text-2xl md:text-3xl font-black italic text-lime-400 tracking-tighter">{Math.floor(activeSessionTime / 60)}:{String(activeSessionTime % 60).padStart(2, '0')}</p>
                   </div>
                   <button 
                     onClick={() => setView('active-workout')} 
                     className="bg-lime-400 active:bg-lime-300 text-black px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl active:scale-95 transition-all"
                   >
                     <Play size={16} fill="currentColor" />
                     Retornar
                   </button>
                 </div>
               </div>
             </div>
           )}

           <div className="grid grid-cols-3 gap-3">
             <StatCard label="Treinos" value={historicoTreinos.length || "0"} trend={historicoTreinos.length > 0 ? `+${historicoTreinos.length} essa semana` : "Sem dados"} color="text-lime-400" icon={Dumbbell} />
             <StatCard label="Calorias" value={historicoDietas.length > 0 ? "2450" : "0"} trend={historicoDietas.length > 0 ? "Na meta" : "Sem dados"} color="text-orange-400" icon={Flame} />
             <StatCard label="Peso" value={medicoes.length > 0 ? biometrics.weight : "0"} trend={medicoes.length > 0 ? "-1.2kg" : "Sem dados"} color="text-blue-400" icon={Scale} />
           </div>
           <section>
              <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
                 <h3 className="text-xl md:text-2xl lg:text-3xl font-black italic uppercase tracking-tighter">Treino de Hoje</h3>
                 <button 
                    onClick={() => setView('workouts')} 
                    className="text-lime-400 active:text-lime-300 font-black uppercase text-[9px] md:text-[10px] flex items-center gap-1"
                 >
                    Ver Todos <ChevronRight size={14}/>
                 </button>
              </div>
              {todayWorkout ? (
                 <WorkoutDetailCard workout={todayWorkout} onStart={() => handleStartWorkout(todayWorkout)} />
              ) : (
                 <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-12 text-center">
                    <div className="size-16 md:size-24 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-700">
                       <RotateCcw size={32} className="md:size-12" />
                    </div>
                    <h3 className="text-xl md:text-3xl font-black italic uppercase mb-2">Dia de Descanso</h3>
                    <p className="text-zinc-500 text-xs md:text-sm font-bold uppercase tracking-widest mb-6">Foque na recuperação</p>
                    <button 
                       onClick={() => setView('workouts')} 
                       className="bg-lime-400 active:bg-lime-300 text-black px-6 py-3 rounded-xl font-black uppercase text-[10px] active:scale-95 transition-all"
                    >
                       Ver Outros Treinos
                    </button>
                 </div>
              )}
           </section>
        </div>
      );
    case 'workouts':
       // Pegar treino do dia selecionado do histórico real
       const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
       const diaSelecionado = diasSemana[selectedDayWorkout];
       
       console.log('🔍 Buscando treino para:', diaSelecionado);
       console.log('📋 Histórico de treinos disponível:', historicoTreinos);
       console.log('📋 Quantidade de treinos:', historicoTreinos.length);
       
       if (historicoTreinos.length > 0) {
         console.log('📋 Primeiro treino:', historicoTreinos[0]);
         console.log('📋 Plano do primeiro treino:', historicoTreinos[0]?.plano);
         console.log('📋 Dias disponíveis:', historicoTreinos[0]?.plano ? Object.keys(historicoTreinos[0].plano) : 'nenhum');
       }
       
       const treinoDodia = historicoTreinos.find(t => {
          const temPlano = t && t.plano && t.plano[diaSelecionado] && t.plano[diaSelecionado].length > 0;
          console.log(`🔎 Verificando treino ${t?.id}: tem plano para ${diaSelecionado}?`, temPlano);
          return temPlano;
       });
       
       console.log('✅ Treino encontrado:', treinoDodia);
       
       const currentWorkout = (treinoDodia && treinoDodia.plano && treinoDodia.plano[diaSelecionado] && treinoDodia.plano[diaSelecionado].length > 0) ? {
         title: treinoDodia.titulo || 'Treino',
         category: treinoDodia.tipo === 'ia' ? 'IA' : 'Manual',
         duration: '60 min',
         exercises: (treinoDodia.plano[diaSelecionado] || []).map((ex: any) => ({
           id: ex.id || `ex-${Date.now()}-${Math.random()}`, // Adicionar ID único se não existir
           nome: ex.nome || ex.exercicio,
           n: ex.nome || ex.exercicio,
           s: ex.series,
           r: ex.repeticoes,
           w: ex.carga,
           rest: ex.descanso || '90s',
           group: ex.grupo || 'Geral', // Adicionar grupo padrão
           orientations: ex.orientacoes || ['Execute o movimento com boa técnica', 'Mantenha a respiração controlada'], // Orientações padrão
           video: ex.video || null // URL do vídeo se existir
         }))
       } : null;
       
       console.log('💪 Workout atual:', currentWorkout);
       
       return (
         <>
           {/* Banner de treino ativo */}
           {activeSession && (
             <div className="bg-gradient-to-r from-lime-400/20 to-lime-500/10 border-2 border-lime-400/50 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-xl shadow-lime-400/10 mb-8 animate-in slide-in-from-top duration-500">
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
             headerButton={
               <button
                 onClick={() => { setIaType('treino'); setShowIAModal(true); }}
                 className="w-full bg-lime-400 active:bg-lime-300 text-black px-4 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all"
               >
                 <Sparkles size={16} />
                 Gerar Treino IA
               </button>
             }
           >
             <WorkoutDetailCard 
               workout={currentWorkout} 
               onStart={() => handleStartWorkout(currentWorkout)}
             />
           </CalendarBase>
         </>
       );
    case 'diet':
       // Pegar dieta do dia selecionado do histórico real
       const diasSemanaDieta = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
       const diaSelecionadoDieta = diasSemanaDieta[selectedDayDiet];
       
       console.log('🍎 DEBUG DIETA - Dia selecionado:', diaSelecionadoDieta);
       console.log('🍎 DEBUG DIETA - Histórico completo:', historicoDietas);
       
       const dietaDoDia = historicoDietas.find(d => {
          console.log('🍎 Verificando dieta:', d);
          console.log('🍎 Plano da dieta:', d?.plano);
          console.log('🍎 Dia específico:', d?.plano?.[diaSelecionadoDieta]);
          return d && d.plano && d.plano[diaSelecionadoDieta] && Array.isArray(d.plano[diaSelecionadoDieta]) && d.plano[diaSelecionadoDieta].length > 0;
       });
       
       console.log('🍎 Dieta encontrada:', dietaDoDia);
       
       console.log('📊 ESTRUTURA ESPERADA:');
       console.log('dietaDoDia.plano[diaSelecionado] deve ser um ARRAY como:');
       console.log('[{ n: "Café da Manhã", t: "08:00", kcal: 500, items: [{ name: "Pão", kcal: 100 }] }]');
       console.log('📊 ESTRUTURA RECEBIDA:');
       console.log('Tipo:', typeof dietaDoDia?.plano?.[diaSelecionadoDieta]);
       console.log('É Array?:', Array.isArray(dietaDoDia?.plano?.[diaSelecionadoDieta]));
       console.log('Conteúdo:', dietaDoDia?.plano?.[diaSelecionadoDieta]);
       
       const currentDiet = (dietaDoDia && dietaDoDia.plano && dietaDoDia.plano[diaSelecionadoDieta]) ? {
          meals: Array.isArray(dietaDoDia.plano[diaSelecionadoDieta]) ? dietaDoDia.plano[diaSelecionadoDieta] : [],
          totalCalories: dietaDoDia.plano[diaSelecionadoDieta].reduce?.((acc: number, meal: any) => acc + (meal.kcal || 0), 0) || 0,
          macros: dietaDoDia.plano.macros || { protein: 0, carbs: 0, fat: 0 }
       } : {
          meals: [],
          totalCalories: 0,
          macros: { protein: 0, carbs: 0, fat: 0 }
       };
       
       console.log('🍎 CurrentDiet final:', currentDiet);
       
       return (
         <CalendarBase 
           title="Nutrição" 
           sub="Seu plano alimentar semanal" 
           selectedDay={selectedDayDiet} 
           setSelectedDay={setSelectedDayDiet} 
           days={DAYS_SHORT}
           headerButton={
             <button
               onClick={() => { setIaType('dieta'); setShowIAModal(true); }}
               className="w-full bg-lime-400 active:bg-lime-300 text-black px-4 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all"
             >
               <Sparkles size={16} />
               Gerar Dieta IA
             </button>
           }
         >
           <NutritionView 
             diet={currentDiet} 
             dayIdx={selectedDayDiet} 
             onGenerateDiet={(newDiet: any) => setDietPlans({...dietPlans, [`${1}_${selectedDayDiet}`]: newDiet})}
             user={user}
             onReloadDietas={recarregarDietas}
           />
         </CalendarBase>
       );
    case 'store':
       return <StoreView products={products} addToCart={addToCart} cartCount={cartCount} openCart={() => setIsCartOpen(true)} />;
    case 'evolution': return <EvolutionView />;
    case 'cardio': return <CardioView />;
    case 'goals': return <GoalsView />;
    case 'groups': return <GroupsView />;
    case 'profile': return <ProfileView user={user} profileImage={profileImage} onImageChange={onImageChange} biometrics={biometrics} onBiometricsChange={onBiometricsChange} watchConnected={watchConnected} toggleWatch={toggleWatch} deviceName={deviceName} />;
    default: return null;
          }
        })()}
        
        {/* Modal de Geração IA */}
        {showIAModal && (
          <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setShowIAModal(false)}>
            <div className="bg-zinc-900 border-t-2 border-lime-400 sm:border sm:border-zinc-800 w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6 sm:mb-8">
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl font-black italic uppercase leading-tight text-white mb-1">
                    {iaType === 'treino' ? '🏋️ Treino com IA' : '🥗 Dieta com IA'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">Personalizado para você</p>
                </div>
                <button onClick={() => setShowIAModal(false)} className="size-10 sm:size-11 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 active:bg-zinc-800 active:text-white transition-all shrink-0 ml-4">
                  <X size={18} className="sm:size-5"/>
                </button>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-zinc-300 block">🎯 Qual seu objetivo?</label>
                  <input 
                    type="text" 
                    placeholder={iaType === 'treino' ? "Ex: Hipertrofia, Emagrecimento" : "Ex: Ganho de massa, Perda de peso"}
                    value={iaConfig.objetivo} 
                    onChange={e => setIaConfig({...iaConfig, objetivo: e.target.value})} 
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-base text-white outline-none focus:border-lime-400 active:border-lime-400 placeholder:text-zinc-600 transition-colors" 
                  />
                </div>
                
                {iaType === 'treino' && (
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-zinc-300 block">📅 Quantos dias por semana?</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 4, 5, 6].map(dias => (
                        <button
                          key={dias}
                          type="button"
                          onClick={() => setIaConfig({...iaConfig, diasTreino: dias})}
                          className={`py-4 rounded-xl font-black text-base transition-all ${
                            iaConfig.diasTreino === dias
                              ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/20'
                              : 'bg-zinc-950 border-2 border-zinc-800 text-zinc-400 active:bg-zinc-900'
                          }`}
                        >
                          {dias}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-zinc-300 block">⚠️ Restrições <span className="text-zinc-600 font-normal">(opcional)</span></label>
                  <textarea 
                    rows={3}
                    placeholder={iaType === 'treino' ? "Ex: Sem agachamento, lesão no joelho direito" : "Ex: Sem glúten, vegetariano"}
                    value={iaConfig.restricoes} 
                    onChange={e => setIaConfig({...iaConfig, restricoes: e.target.value})} 
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-5 py-4 text-base text-white outline-none focus:border-lime-400 active:border-lime-400 placeholder:text-zinc-600 transition-colors resize-none" 
                  />
                </div>
                
                <button 
                  onClick={iaType === 'treino' ? gerarTreinoComIA : gerarDietaComIA} 
                  disabled={isGeneratingIA || !iaConfig.objetivo} 
                  className="w-full bg-lime-400 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm sm:text-base shadow-2xl shadow-lime-400/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6"
                >
                  {isGeneratingIA ? (
                    <>
                      <Loader2 size={20} className="animate-spin"/> 
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} className="animate-pulse"/> 
                      <span>Gerar {iaType === 'treino' ? 'Treino' : 'Dieta'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const ProfessorModule = ({ view, students, setView, templates, onAddTemplate, onRemoveTemplate, user, academia }: any) => {
   const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
   const [subView, setSubView] = useState<string>('overview'); // overview, workouts, assessments, performance, schedule, chat
   const [showCreateWorkout, setShowCreateWorkout] = useState(false);
   const [showAssessment, setShowAssessment] = useState(false);
   const [showNewStudent, setShowNewStudent] = useState(false);
   
   // Form states
   const [newStudentForm, setNewStudentForm] = useState({ name: '', email: '', phone: '', plan: 'Básico Semanal', goal: 'Hipertrofia' });
   const [newTemplateForm, setNewTemplateForm] = useState({ title: '', category: '' });
   const [newScheduleForm, setNewScheduleForm] = useState({ studentId: '', type: 'Personal Training', date: '', time: '', notes: '' });
   const [newAssessmentForm, setNewAssessmentForm] = useState({ weight: '', bodyFat: '', muscle: '', water: '', chest: '', waist: '', arm: '', leg: '' });
   const [showNewTemplate, setShowNewTemplate] = useState(false);
   const [showNewSchedule, setShowNewSchedule] = useState(false);
   const [selectedDate, setSelectedDate] = useState(new Date());
   
   // Mock data para demonstração
   const [assessments, setAssessments] = useState<any[]>([
      { id: 1, studentId: 1, date: '2024-01-15', weight: 88.5, bodyFat: 18.2, muscle: 38.1, water: 58.3, chest: 105, waist: 88, arm: 38, leg: 62 },
      { id: 2, studentId: 1, date: '2024-02-01', weight: 87.2, bodyFat: 17.1, muscle: 39.2, water: 59.1, chest: 106, waist: 86, arm: 39, leg: 63 },
   ]);
   
   const [schedules, setSchedules] = useState<any[]>([]);
   const [loadingSchedules, setLoadingSchedules] = useState(false);

   const [chatMessages, setChatMessages] = useState<any[]>([
      { id: 1, from: 'teacher', text: 'Como foi o treino de hoje?', time: '10:30' },
      { id: 2, from: 'student', text: 'Muito bom! Consegui aumentar a carga no supino 💪', time: '10:35' },
   ]);

   // Carregar agendamentos ao montar o componente
   useEffect(() => {
      loadSchedules();
   }, []);

   const loadSchedules = async () => {
      try {
         setLoadingSchedules(true);
         const { scheduleAPI } = await import('./src/api');
         const data = await scheduleAPI.getAll();
         setSchedules(data);
      } catch (err) {
         console.error('Erro ao carregar agendamentos:', err);
      } finally {
         setLoadingSchedules(false);
      }
   };

   const handleCreateSchedule = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!newScheduleForm.studentId || !newScheduleForm.date || !newScheduleForm.time) {
         alert('Preencha todos os campos obrigatórios');
         return;
      }

      try {
         const { scheduleAPI } = await import('./src/api');
         await scheduleAPI.create({
            alunoId: newScheduleForm.studentId,
            data: newScheduleForm.date,
            hora: newScheduleForm.time,
            tipo: newScheduleForm.type,
            observacoes: newScheduleForm.notes
         });
         
         alert('Agendamento criado com sucesso!');
         setNewScheduleForm({ studentId: '', type: 'Personal Training', date: '', time: '', notes: '' });
         setShowNewSchedule(false);
         loadSchedules();
      } catch (err: any) {
         console.error('Erro ao criar agendamento:', err);
         alert('Erro ao criar agendamento: ' + (err.message || 'Erro desconhecido'));
      }
   };

   const handleUpdateScheduleStatus = async (scheduleId: string, newStatus: string) => {
      try {
         const { scheduleAPI } = await import('./src/api');
         await scheduleAPI.update(scheduleId, { status: newStatus });
         loadSchedules();
      } catch (err) {
         console.error('Erro ao atualizar status:', err);
         alert('Erro ao atualizar status do agendamento');
      }
   };

   const handleDeleteSchedule = async (scheduleId: string) => {
      if (!confirm('Tem certeza que deseja deletar este agendamento?')) return;
      
      try {
         const { scheduleAPI } = await import('./src/api');
         await scheduleAPI.delete(scheduleId);
         loadSchedules();
      } catch (err) {
         console.error('Erro ao deletar agendamento:', err);
         alert('Erro ao deletar agendamento');
      }
   };

   if (selectedStudent) {
      return (<>
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
                  { id: 'historico', label: 'Histórico', icon: <History size={16}/> },
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
                     <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
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

                     <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
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
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                     <h3 className="text-2xl font-black italic uppercase mb-6">Treinos Prescritos</h3>
                     <div className="grid gap-4">
                        {DAYS_SHORT.map((day, idx) => {
                           const diasSemanaTreino = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
                           const diaNome = diasSemanaTreino[idx];
                           
                           // Pegar treino mais recente para este dia
                           const treinoMaisRecente = historicoTreinos.find(t => 
                              t && t.plano && t.plano[diaNome] && t.plano[diaNome].length > 0
                           );
                           
                           const workout = (treinoMaisRecente && treinoMaisRecente.plano && treinoMaisRecente.plano[diaNome]) ? {
                              title: treinoMaisRecente.plano[diaNome]?.[0]?.nome || 'Treino',
                              exercises: treinoMaisRecente.plano[diaNome] || [],
                              duration: '45-60min'
                           } : {
                              title: 'Sem treino',
                              exercises: [],
                              duration: '0min'
                           };
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
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-black italic uppercase">Histórico de Avaliações</h3>
                        <button onClick={() => setShowAssessment(true)} className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2">
                           <ClipboardList size={16}/> Nova Avaliação
                        </button>
                     </div>
                     {assessments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                           <div className="size-24 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center mb-6">
                              <ClipboardList size={48} />
                           </div>
                           <h2 className="text-3xl font-black italic text-white mb-3">
                              Nenhuma Avaliação Física
                           </h2>
                           <p className="text-zinc-400 max-w-md mb-8">
                              Ainda não há avaliações físicas cadastradas para este aluno. Registre a primeira avaliação para acompanhar a evolução.
                           </p>
                           <button onClick={() => setShowAssessment(true)} className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-black uppercase text-sm tracking-wider transition-all">
                              Registrar Avaliação
                           </button>
                        </div>
                     ) : (
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
                     )}
                  </div>
               </div>
            )}

            {subView === 'historico' && (
               <div className="space-y-6">
                  {/* Histórico de Treinos */}
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                     <h3 className="text-2xl font-black italic uppercase mb-6">💪 Histórico de Treinos</h3>
                     {historicoTreinos.filter(t => t.alunoId === selectedStudent?.id).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                           <Dumbbell className="w-16 h-16 text-zinc-700 mb-4" />
                           <h4 className="text-lg font-black text-zinc-400 mb-2">Nenhum treino prescrito</h4>
                           <p className="text-sm text-zinc-500 max-w-sm">
                              Este aluno ainda não possui histórico de treinos.
                           </p>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           {historicoTreinos
                              .filter(t => t.alunoId === selectedStudent?.id)
                              .slice(0, 3)
                              .map((treino) => (
                                 <div key={treino.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                                    <div className="flex justify-between items-start mb-4">
                                       <div>
                                          <h4 className="font-black italic uppercase text-lg text-lime-400">{treino.titulo}</h4>
                                          <div className="flex items-center gap-4 mt-2">
                                             <p className="text-xs text-zinc-500 font-bold uppercase">📅 {treino.data}</p>
                                             <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                treino.tipo === 'ia' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                             }`}>
                                                {treino.tipo === 'ia' ? '🤖 IA' : '✋ Manual'}
                                             </span>
                                          </div>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[10px] text-zinc-600 uppercase font-bold">Total Exercícios</p>
                                          <p className="text-xl font-black text-white">
                                             {Object.values(treino.plano)
                                                .filter((dia: any) => Array.isArray(dia))
                                                .reduce((total: number, dia: any) => total + dia.length, 0)}
                                          </p>
                                       </div>
                                    </div>
                                 </div>
                              ))
                           }
                           {historicoTreinos.filter(t => t.alunoId === selectedStudent?.id).length > 3 && (
                              <div className="text-center">
                                 <button className="text-lime-400 hover:text-lime-300 text-sm font-bold uppercase">
                                    Ver todos os {historicoTreinos.filter(t => t.alunoId === selectedStudent?.id).length} treinos
                                 </button>
                              </div>
                           )}
                        </div>
                     )}
                  </div>

                  {/* Histórico de Dietas */}
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                     <h3 className="text-2xl font-black italic uppercase mb-6">🥗 Histórico de Dietas</h3>
                     {historicoDietas.filter(d => d.alunoId === selectedStudent?.id).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                           <Apple className="w-16 h-16 text-zinc-700 mb-4" />
                           <h4 className="text-lg font-black text-zinc-400 mb-2">Nenhuma dieta prescrita</h4>
                           <p className="text-sm text-zinc-500 max-w-sm">
                              Este aluno ainda não possui histórico de dietas.
                           </p>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           {historicoDietas
                              .filter(d => d.alunoId === selectedStudent?.id)
                              .slice(0, 3)
                              .map((dieta) => (
                                 <div key={dieta.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                       <div className="flex-1">
                                          <h4 className="font-black italic uppercase text-lg text-green-400">{dieta.titulo}</h4>
                                          <div className="flex items-center gap-4 mt-2">
                                             <p className="text-xs text-zinc-500 font-bold uppercase">📅 {dieta.data}</p>
                                             <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                dieta.tipo === 'ia' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'
                                             }`}>
                                                {dieta.tipo === 'ia' ? '🤖 IA' : '✋ Manual'}
                                             </span>
                                          </div>
                                       </div>
                                       
                                       <div className="flex items-center gap-4">
                                          <div className="text-right">
                                             <p className="text-[10px] text-zinc-600 uppercase font-bold">Objetivo Calórico</p>
                                             <p className="text-xl font-black text-white">
                                                {dieta.plano.objetivoCalorico || 'N/D'}
                                             </p>
                                          </div>
                                          <button
                                             onClick={() => abrirModalEdicaoDieta(dieta)}
                                             className="bg-green-500 hover:bg-green-600 p-3 rounded-xl transition-colors"
                                             title="Editar Dieta"
                                          >
                                             <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                             </svg>
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                              ))
                           }
                           {historicoDietas.filter(d => d.alunoId === selectedStudent?.id).length > 3 && (
                              <div className="text-center">
                                 <button className="text-green-400 hover:text-green-300 text-sm font-bold uppercase">
                                    Ver todas as {historicoDietas.filter(d => d.alunoId === selectedStudent?.id).length} dietas
                                 </button>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            )}

            {subView === 'performance' && (
               <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6">Evolução de Peso</h3>
                        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={assessments.map(a => ({ date: new Date(a.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}), peso: a.weight }))}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Line type="monotone" dataKey="peso" stroke="#D9FF00" strokeWidth={3} dot={{ fill: '#D9FF00', r: 5 }} /></LineChart></ResponsiveContainer></div>
                     </div>
                     <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6">Composição Corporal</h3>
                        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={assessments.map(a => ({ date: new Date(a.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}), gordura: a.bodyFat, musculo: a.muscle }))}><defs><linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient><linearGradient id="colorMuscle" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D9FF00" stopOpacity={0.3}/><stop offset="95%" stopColor="#D9FF00" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Area type="monotone" dataKey="gordura" stroke="#f97316" strokeWidth={2} fill="url(#colorFat)" /><Area type="monotone" dataKey="musculo" stroke="#D9FF00" strokeWidth={2} fill="url(#colorMuscle)" /></AreaChart></ResponsiveContainer></div>
                     </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Progressão de Carga (Supino Reto)</h3>
                     <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={LIFT_PROGRESS}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} /><XAxis dataKey="week" stroke="#52525b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Bar dataKey="load" fill="#3b82f6" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div>
                  </div>
               </div>
            )}

            {subView === 'schedule' && (
               <div className="space-y-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
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
                  <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
                  <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-3xl font-black italic uppercase">Nova Avaliação Física</h3>
                        <button onClick={() => setShowAssessment(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                     </div>
                     <form onSubmit={(e) => { e.preventDefault(); alert('Avaliação salva com sucesso!\n\nPeso: ' + newAssessmentForm.weight + 'kg\n% Gordura: ' + newAssessmentForm.bodyFat + '%'); setNewAssessmentForm({ weight: '', bodyFat: '', muscle: '', water: '', chest: '', waist: '', arm: '', leg: '' }); setShowAssessment(false); }} className="grid grid-cols-1 gap-4 md:gap-6">
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
                  <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
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
         {renderProfessorModals()}
         </>
      );
   }

   // Modais globais do módulo professor (não dependem de aluno selecionado)
   const renderProfessorModals = () => (
      <>
         {/* Modal Novo Aluno */}
         {showNewStudent && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowNewStudent(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
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

         {/* Modal Novo Agendamento */}
         {showNewSchedule && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowNewSchedule(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-black italic uppercase">Novo Agendamento</h3>
                     <button onClick={() => setShowNewSchedule(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleCreateSchedule} className="space-y-6">
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Aluno</label><select required value={newScheduleForm.studentId} onChange={(e) => setNewScheduleForm({...newScheduleForm, studentId: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"><option value="">Selecione um aluno</option>{students.map((s: Student) => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Tipo de Atendimento</label><select required value={newScheduleForm.type} onChange={(e) => setNewScheduleForm({...newScheduleForm, type: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"><option>Personal Training</option><option>Avaliação Física</option><option>Consultoria</option><option>Aula Experimental</option></select></div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Data</label><input required type="date" value={newScheduleForm.date} onChange={(e) => setNewScheduleForm({...newScheduleForm, date: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Horário</label><input required type="time" value={newScheduleForm.time} onChange={(e) => setNewScheduleForm({...newScheduleForm, time: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     </div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Observações</label><textarea value={newScheduleForm.notes} onChange={(e) => setNewScheduleForm({...newScheduleForm, notes: e.target.value})} rows={3} placeholder="Informações adicionais sobre o atendimento..." className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none resize-none"/></div>
                     <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Criar Agendamento</button>
                  </form>
               </div>
            </div>
         )}

         {/* Modal Nova Avaliação */}
         {showAssessment && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowAssessment(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-3xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-black italic uppercase">Nova Avaliação Física</h3>
                     <button onClick={() => setShowAssessment(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); alert('Avaliação registrada com sucesso!\n\nPeso: ' + newAssessmentForm.weight + ' kg\nPercentual de Gordura: ' + newAssessmentForm.bodyFat + '%'); setNewAssessmentForm({ weight: '', bodyFat: '', muscle: '', water: '', chest: '', waist: '', arm: '', leg: '' }); setShowAssessment(false); }} className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Peso (kg)</label><input required type="number" step="0.1" value={newAssessmentForm.weight} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, weight: e.target.value})} placeholder="Ex: 84.2" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Gordura Corporal (%)</label><input required type="number" step="0.1" value={newAssessmentForm.bodyFat} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, bodyFat: e.target.value})} placeholder="Ex: 18.5" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Massa Muscular (%)</label><input type="number" step="0.1" value={newAssessmentForm.muscle} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, muscle: e.target.value})} placeholder="Ex: 42.0" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Água Corporal (%)</label><input type="number" step="0.1" value={newAssessmentForm.water} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, water: e.target.value})} placeholder="Ex: 58.0" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     </div>
                     <div className="border-t border-zinc-800 pt-6">
                        <h4 className="text-sm font-black uppercase text-zinc-500 mb-4">Medidas Corporais (cm)</h4>
                        <div className="grid grid-cols-2 gap-4">
                           <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Peitoral</label><input type="number" step="0.1" value={newAssessmentForm.chest} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, chest: e.target.value})} placeholder="Ex: 105" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                           <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Cintura</label><input type="number" step="0.1" value={newAssessmentForm.waist} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, waist: e.target.value})} placeholder="Ex: 85" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                           <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Braço</label><input type="number" step="0.1" value={newAssessmentForm.arm} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, arm: e.target.value})} placeholder="Ex: 38" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                           <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Coxa</label><input type="number" step="0.1" value={newAssessmentForm.leg} onChange={(e) => setNewAssessmentForm({...newAssessmentForm, leg: e.target.value})} placeholder="Ex: 58" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        </div>
                     </div>
                     <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Salvar Avaliação</button>
                  </form>
               </div>
            </div>
         )}

         {/* Modal Novo Modelo */}
         {showNewTemplate && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowNewTemplate(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
               <header><h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Painel do Treinador</h1><p className="text-zinc-500 font-medium">Gerencie seus alunos e treinos</p></header>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard label="Total Alunos" value={students.length} color="text-white" icon={Users} />
                  <StatCard label="Em Risco" value={students.filter((s: Student) => s.risk).length} color="text-red-500" icon={AlertTriangle} />
                  <StatCard label="Treinos Hoje" value="18" color="text-lime-400" icon={Dumbbell} />
                  <StatCard label="Avaliações Mês" value="12" color="text-blue-400" icon={ClipboardList} />
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
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
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
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
               <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div><h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Meus Alunos</h2><p className="text-sm md:text-base text-zinc-500 font-medium">{students.length} alunos ativos</p></div>
                  <button onClick={() => setShowNewStudent(true)} className="bg-lime-400 text-black px-4 md:px-6 py-2.5 md:py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 whitespace-nowrap"><UserPlus size={16}/> Novo Aluno</button>
               </header>
               {students.length > 0 ? (
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
               ) : (
                  <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center">
                     <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <UserPlus size={40} className="text-zinc-600"/>
                     </div>
                     <h3 className="text-3xl font-black italic uppercase mb-4">Nenhum Aluno</h3>
                     <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                        Cadastre seu primeiro aluno para começar a gerenciar treinos e acompanhar o progresso.
                     </p>
                     <button 
                        onClick={() => setShowNewStudent(true)}
                        className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                     >
                        Cadastrar Primeiro Aluno
                     </button>
                  </div>
               )}
            </div>
            {renderProfessorModals()}
            </>
         );
      case 'templates':
         return (
            <>
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div><h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Modelos de Treino</h2><p className="text-sm md:text-base text-zinc-500 font-medium">Templates reutilizáveis</p></div>
                  <button onClick={() => setShowNewTemplate(true)} className="bg-lime-400 text-black px-4 md:px-6 py-2.5 md:py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 whitespace-nowrap"><Plus size={16}/> Novo Modelo</button>
               </header>
               {templates.length > 0 ? (
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
               ) : (
                  <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center">
                     <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Dumbbell size={40} className="text-zinc-600"/>
                     </div>
                     <h3 className="text-3xl font-black italic uppercase mb-4">Nenhum Template</h3>
                     <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                        Crie templates de treino para reutilizar com seus alunos e economizar tempo.
                     </p>
                     <button 
                        onClick={() => setShowNewTemplate(true)}
                        className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                     >
                        Criar Primeiro Template
                     </button>
                  </div>
               )}
            </div>
            {renderProfessorModals()}
            </>
         );
      case 'schedule':
         return (
            <>
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div><h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Agenda de Atendimentos</h2><p className="text-sm md:text-base text-zinc-500 font-medium">{schedules.length} agendamentos</p></div>
                  <button onClick={() => setShowNewSchedule(true)} className="bg-lime-400 text-black px-4 md:px-6 py-2.5 md:py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 whitespace-nowrap"><Plus size={16}/> Novo Agendamento</button>
               </header>
               {loadingSchedules ? (
                  <div className="text-center py-12 text-zinc-500">Carregando agendamentos...</div>
               ) : schedules.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {schedules.map(schedule => {
                        const student = students.find(s => s.id === schedule.alunoId);
                        const scheduleDate = new Date(schedule.data);
                        const formattedDate = scheduleDate.toLocaleDateString('pt-BR');
                        
                        return (
                        <div key={schedule.id} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem] hover:border-lime-400/30 transition-all">
                           <div className="flex items-start gap-6 mb-6">
                              <div className="size-20 bg-lime-400/10 text-lime-400 rounded-3xl flex items-center justify-center shrink-0">
                                 <Calendar size={32}/>
                              </div>
                              <div className="flex-1">
                                 <div className="flex items-start justify-between mb-3">
                                    <div>
                                       <h4 className="font-black text-2xl mb-1">{schedule.tipo}</h4>
                                       <p className="text-sm text-zinc-500 font-bold">{formattedDate} às {schedule.hora}</p>
                                       {schedule.observacoes && (
                                          <p className="text-xs text-zinc-600 mt-2">{schedule.observacoes}</p>
                                       )}
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase shrink-0 ${
                                       schedule.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 
                                       schedule.status === 'completed' ? 'bg-blue-500/20 text-blue-500' :
                                       schedule.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                                       'bg-orange-500/20 text-orange-500'
                                    }`}>
                                       {schedule.status === 'confirmed' ? 'Confirmado' : 
                                        schedule.status === 'completed' ? 'Concluído' :
                                        schedule.status === 'cancelled' ? 'Cancelado' :
                                        'Pendente'}
                                    </span>
                                 </div>
                              {student && (
                                 <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                                    <img src={student.avatar} className="size-12 rounded-xl object-cover"/>
                                    <div>
                                       <p className="font-black text-sm">{student.name}</p>
                                       <p className="text-[10px] text-zinc-500 font-bold">{student.plan}</p>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                        <div className="flex gap-3">
                           {schedule.status === 'pending' && (
                              <button onClick={() => handleUpdateScheduleStatus(schedule.id, 'confirmed')} className="flex-1 bg-green-500/20 text-green-500 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-green-500/30 transition-all flex items-center justify-center gap-2">
                                 <Check size={16}/> Confirmar
                              </button>
                           )}
                           {(schedule.status === 'pending' || schedule.status === 'confirmed') && (
                              <button onClick={() => handleUpdateScheduleStatus(schedule.id, 'completed')} className="flex-1 bg-blue-500/20 text-blue-500 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2">
                                 <Check size={16}/> Concluir
                              </button>
                           )}
                           {schedule.status !== 'cancelled' && schedule.status !== 'completed' && (
                              <button onClick={() => handleUpdateScheduleStatus(schedule.id, 'cancelled')} className="flex-1 bg-red-500/20 text-red-500 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500/30 transition-all flex items-center justify-center gap-2">
                                 <X size={16}/> Cancelar
                              </button>
                           )}
                           <button onClick={() => handleDeleteSchedule(schedule.id)} className="bg-zinc-950 text-zinc-600 py-3 px-5 rounded-2xl hover:text-red-500 transition-all flex items-center justify-center">
                              <Trash2 size={16}/>
                           </button>
                        </div>
                     </div>
                     );
                     })}
                  </div>
               ) : (
                  <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center">
                     <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Calendar size={40} className="text-zinc-600"/>
                     </div>
                     <h3 className="text-3xl font-black italic uppercase mb-4">Nenhum Agendamento</h3>
                     <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                        Crie seu primeiro agendamento para organizar suas sessões com os alunos.
                     </p>
                     <button 
                        onClick={() => setShowNewSchedule(true)}
                        className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                     >
                        Criar Primeiro Agendamento
                     </button>
                  </div>
               )}
            </div>
            {renderProfessorModals()}
            </>
         );
      case 'assessments':
         return (
            <>
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div><h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Avaliações Físicas</h2><p className="text-sm md:text-base text-zinc-500 font-medium">Histórico completo de avaliações</p></div>
                  <button onClick={() => setShowAssessment(true)} className="bg-blue-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 whitespace-nowrap"><ClipboardList size={16}/> Nova Avaliação</button>
               </header>
               {students.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center">
                     <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ClipboardList size={40} className="text-zinc-600"/>
                     </div>
                     <h3 className="text-3xl font-black italic uppercase mb-4">Nenhuma Avaliação</h3>
                     <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                        Você ainda não possui alunos cadastrados. Adicione seu primeiro aluno para começar a registrar avaliações físicas.
                     </p>
                     <button 
                        onClick={() => setShowNewStudent(true)}
                        className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                     >
                        Cadastrar Primeiro Aluno
                     </button>
                  </div>
               ) : (
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
               )}
            </div>
            {renderProfessorModals()}
            </>
         );
      default: return null;
   }
}

const NutriModule = ({ view, students, setView, user, academia }: any) => {
   const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
   const [subView, setSubView] = useState<string>('overview');
   const [showCreateDiet, setShowCreateDiet] = useState(false);
   const [showCompositionAnalysis, setShowCompositionAnalysis] = useState(false);
   const [showNewPatient, setShowNewPatient] = useState(false);
   const [showNewContent, setShowNewContent] = useState(false);
   const [newPatientForm, setNewPatientForm] = useState({ name: '', email: '', phone: '', goal: 'Emagrecimento', restrictions: '' });
   const [newContentForm, setNewContentForm] = useState({ title: '', category: 'Artigo', duration: '' });
   
   // Form states
   const [dietForm, setDietForm] = useState({ calories: '', type: 'Equilibrada', restrictions: '' });
   const [compositionForm, setCompositionForm] = useState({ weight: '', bodyFat: '', muscle: '', water: '' });
   
   // Estados para dados do banco
   const [mealDiary, setMealDiary] = useState<any[]>([]);
   const [compositionHistory, setCompositionHistory] = useState<any[]>([]);
   const [educationalContent, setEducationalContent] = useState<any[]>([]);
   const [historicoDietas, setHistoricoDietas] = useState<any[]>([]);
   
   // Estados para estatísticas do dashboard
   const [totalDietas, setTotalDietas] = useState(0);
   const [refeicoesHoje, setRefeicoesHoje] = useState(0);
   const [refeicoesPendentes, setRefeicoesPendentes] = useState<any[]>([]);
   
   // Carregar dados do módulo nutricionista
   useEffect(() => {
      const carregarDadosNutri = async () => {
         const token = localStorage.getItem('fitness_token');
         if (!token) return;
         
         try {
            const [conteudos] = await Promise.all([
               carregarConteudosEducacionais(token)
            ]);
            
            setEducationalContent(conteudos.map((c: any) => ({
               id: c.id,
               title: c.titulo,
               category: c.categoria,
               duration: c.duracao,
               icon: c.tipo === 'Vídeo' ? <Zap /> : <BookOpen />
            })));
            
            // Carregar estatísticas do dashboard
            const todasRefeicoes = await carregarRefeicoesDisario(token);
            const hoje = new Date().toDateString();
            const refeicoesDeHoje = todasRefeicoes.filter((r: any) => 
               new Date(r.data).toDateString() === hoje
            );
            const pendentes = todasRefeicoes.filter((r: any) => r.status === 'pending');
            
            setRefeicoesHoje(refeicoesDeHoje.length);
            setRefeicoesPendentes(pendentes.slice(0, 5).map((r: any) => ({
               id: r.id,
               studentId: r.usuarioId,
               meal: r.tipoRefeicao,
               time: r.horario,
               img: r.urlImagem,
               status: r.status
            })));
            
         } catch (error) {
            console.error('Erro ao carregar dados nutricionista:', error);
         }
      };
      
      carregarDadosNutri();
   }, []);
   
   // Carregar dados do aluno selecionado
   useEffect(() => {
      const carregarDadosAluno = async () => {
         if (!selectedStudent?.id) return;
         
         const token = localStorage.getItem('fitness_token');
         if (!token) return;
         
         try {
            const [refeicoes, analises, dietas] = await Promise.all([
               carregarRefeicoesDisario(token, selectedStudent.id),
               carregarAnalisesComposicao(token, selectedStudent.id),
               carregarHistoricoDietas(token, selectedStudent.id)
            ]);
            
            // Formatar refeições do diário
            setMealDiary(refeicoes.map((r: any) => ({
               id: r.id,
               studentId: selectedStudent.id,
               meal: r.tipoRefeicao,
               time: r.horario,
               img: r.urlImagem,
               status: r.status,
               feedback: r.feedback || ''
            })));
            
            // Formatar histórico de composição
            setCompositionHistory(analises.map((a: any) => ({
               date: new Date(a.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
               weight: a.peso,
               bodyFat: a.percentualGordura || 0,
               muscleMass: a.massaMuscular || 0,
               water: a.aguaCorporal || 0
            })));
            
            // Formatar dietas
            console.log('📥 Dietas recebidas do aluno (nutricionista):', dietas);
            const dietasFormatadas = dietas.map((dieta: any) => {
               console.log('🥗 Processando dieta:', dieta);
               // As dietas vêm da tabela Relatorio com estrutura: dados: { titulo, refeicoes, ... }
               const plano = dieta.dados?.refeicoes || dieta.conteudo?.refeicoes || {};
               console.log('🥗 Plano extraído:', plano);
               return {
                  id: dieta.id,
                  titulo: dieta.dados?.titulo || dieta.titulo || 'Dieta',
                  alunoId: selectedStudent.id,
                  plano: plano
               };
            });
            console.log('✅ Dietas formatadas (nutricionista):', dietasFormatadas);
            setHistoricoDietas(dietasFormatadas);
            
         } catch (error) {
            console.error('Erro ao carregar dados do aluno:', error);
         }
      };
      
      carregarDadosAluno();
   }, [selectedStudent]);
   
   // Função para atualizar feedback de refeição
   const handleFeedback = async (refeicaoId: string, status: string, feedback: string) => {
      const token = localStorage.getItem('fitness_token');
      if (!token) return;
      
      const resultado = await atualizarFeedbackRefeicao(token, refeicaoId, status, feedback);
      if (resultado) {
         setMealDiary(prev => prev.map(m => 
            m.id === refeicaoId ? { ...m, status, feedback } : m
         ));
         alert('Feedback salvo com sucesso!');
      }
   };
   
   // Função para salvar nova análise de composição
   const handleSaveComposition = async () => {
      if (!selectedStudent?.id || !compositionForm.weight) {
         alert('Preencha ao menos o peso');
         return;
      }
      
      const token = localStorage.getItem('fitness_token');
      if (!token) return;
      
      const dadosAnalise = {
         usuarioId: selectedStudent.id,
         peso: compositionForm.weight,
         percentualGordura: compositionForm.bodyFat,
         massaMuscular: compositionForm.muscle,
         aguaCorporal: compositionForm.water
      };
      
      const resultado = await salvarAnaliseComposicao(token, dadosAnalise);
      if (resultado) {
         // Adicionar ao histórico
         const novaAnalise = {
            date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            weight: parseFloat(compositionForm.weight),
            bodyFat: compositionForm.bodyFat ? parseFloat(compositionForm.bodyFat) : 0,
            muscleMass: compositionForm.muscle ? parseFloat(compositionForm.muscle) : 0,
            water: compositionForm.water ? parseFloat(compositionForm.water) : 0
         };
         setCompositionHistory(prev => [novaAnalise, ...prev]);
         setCompositionForm({ weight: '', bodyFat: '', muscle: '', water: '' });
         setShowCompositionAnalysis(false);
         alert('Análise salva com sucesso!');
      }
   };
   
   // Função para criar novo conteúdo educacional
   const handleCreateContent = async () => {
      if (!newContentForm.title) {
         alert('Preencha o título do conteúdo');
         return;
      }
      
      const token = localStorage.getItem('fitness_token');
      if (!token) return;
      
      const dadosConteudo = {
         titulo: newContentForm.title,
         categoria: newContentForm.category,
         tipo: newContentForm.category,
         duracao: newContentForm.duration,
         publicado: true
      };
      
      const resultado = await salvarConteudoEducacional(token, dadosConteudo);
      if (resultado) {
         const novoConteudo = {
            id: resultado.id,
            title: resultado.titulo,
            category: resultado.categoria,
            duration: resultado.duracao,
            icon: resultado.tipo === 'Vídeo' ? <Zap /> : <BookOpen />
         };
         setEducationalContent(prev => [novoConteudo, ...prev]);
         setNewContentForm({ title: '', category: 'Artigo', duration: '' });
         setShowNewContent(false);
         alert('Conteúdo criado com sucesso!');
      }
   };

   if (selectedStudent) {
      return (
         <>
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
                     <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3"><TrendingUp size={20} className="text-lime-400"/> Evolução de Peso</h3>
                        {compositionHistory.length > 0 ? (
                           <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={compositionHistory}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Line type="monotone" dataKey="weight" stroke="#D9FF00" strokeWidth={3} dot={{ fill: '#D9FF00', r: 5 }} /></LineChart></ResponsiveContainer></div>
                        ) : (
                           <div className="h-64 flex flex-col items-center justify-center">
                              <Scale size={32} className="text-zinc-700 mb-3"/>
                              <p className="text-sm text-zinc-500 font-medium">Sem dados de peso</p>
                           </div>
                        )}
                     </div>
                     <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3"><Camera size={20} className="text-blue-400"/> Refeições Recentes</h3>
                        {mealDiary.length > 0 ? (
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
                        ) : (
                           <div className="text-center py-8">
                              <div className="size-16 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                                 <Camera size={24} className="text-zinc-600"/>
                              </div>
                              <p className="text-sm text-zinc-500 font-medium">Nenhuma refeição registrada ainda</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {subView === 'diet' && (
               <div className="space-y-6">
                  {historicoDietas.length === 0 ? (
                     <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center">
                        <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                           <Utensils size={40} className="text-zinc-600"/>
                        </div>
                        <h3 className="text-3xl font-black italic uppercase mb-4">Nenhum Plano Alimentar</h3>
                        <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                           Crie um plano alimentar personalizado para acompanhar a evolução nutricional do paciente.
                        </p>
                        <button 
                           onClick={() => setShowCreateDiet(true)}
                           className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                        >
                           Criar Primeiro Plano
                        </button>
                     </div>
                  ) : (
                     <>
                  {DAYS_SHORT.map((day, idx) => {
                     const diasSemanaDieta = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
                     const diaNome = diasSemanaDieta[idx];
                     
                     // Pegar dieta mais recente para este dia
                     const dietaMaisRecente = historicoDietas.find(d => 
                        d && d.plano && d.plano[diaNome] && Array.isArray(d.plano[diaNome]) && d.plano[diaNome].length > 0
                     );
                     
                     const diet = (dietaMaisRecente && dietaMaisRecente.plano) ? {
                        title: dietaMaisRecente.titulo || 'Plano Nutricional',
                        kcal: dietaMaisRecente.plano.objetivoCalorico || '2000',
                        meals: dietaMaisRecente.plano[diaNome] || []
                     } : {
                        title: 'Sem dieta',
                        kcal: '0',
                        meals: []
                     };
                     return (
                        <div key={idx} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
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
                  </>
                  )}
               </div>
            )}

            {subView === 'diary' && (
               <div className="bg-zinc-900 border border-zinc-800 p-4 md:p-8 rounded-2xl md:rounded-[3rem]">
                  <h3 className="text-xl md:text-2xl font-black italic uppercase mb-6">Diário Alimentar Visual</h3>
                  {mealDiary.length > 0 ? (
                     <div className="grid grid-cols-1 gap-6">
                        {mealDiary.map(meal => (
                           <div key={meal.id} className={`bg-zinc-950 border-2 rounded-2xl overflow-hidden transition-all ${meal.status === 'approved' ? 'border-green-500/30' : meal.status === 'warning' ? 'border-orange-500/30' : 'border-zinc-800'}`}>
                              <img src={meal.img} className="w-full aspect-video object-cover"/>
                              <div className="p-4 md:p-6">
                                 <div className="flex flex-col md:flex-row justify-between md:items-start mb-3 gap-3">
                                    <div>
                                       <h4 className="font-black text-lg">{meal.meal}</h4>
                                       <p className="text-[10px] text-zinc-500 font-bold">{meal.time}</p>
                                    </div>
                                    <div className="flex gap-2">
                                       <button 
                                          onClick={() => handleFeedback(meal.id, 'approved', 'Ótima escolha! Continue assim.')}
                                          className="size-10 bg-green-500/20 text-green-500 rounded-xl hover:bg-green-500/30"
                                       >
                                          <Check size={16}/>
                                       </button>
                                       <button 
                                          onClick={() => handleFeedback(meal.id, 'warning', 'Atenção à porção de vegetais.')}
                                          className="size-10 bg-orange-500/20 text-orange-500 rounded-xl hover:bg-orange-500/30"
                                       >
                                          <AlertTriangle size={16}/>
                                       </button>
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
                  ) : (
                     <div className="text-center py-16">
                        <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                           <Camera size={40} className="text-zinc-600"/>
                        </div>
                        <h4 className="text-2xl font-black italic uppercase mb-4">Diário Vazio</h4>
                        <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                           Registre suas refeições com fotos para acompanhamento nutricional personalizado.
                        </p>
                        <button className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95">
                           Adicionar Refeição
                        </button>
                     </div>
                  )}
               </div>
            )}

            {subView === 'composition' && (
               <div className="space-y-6">
                  {compositionHistory.length === 0 ? (
                     <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center">
                        <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                           <Scale size={40} className="text-zinc-600"/>
                        </div>
                        <h3 className="text-3xl font-black italic uppercase mb-4">Nenhuma Análise</h3>
                        <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                           Realize a primeira análise de composição corporal para acompanhar a evolução do paciente.
                        </p>
                        <button 
                           onClick={() => setShowCompositionAnalysis(true)}
                           className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                        >
                           Registrar Primeira Análise
                        </button>
                     </div>
                  ) : (
                  <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6">% Gordura Corporal</h3>
                        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={compositionHistory}><defs><linearGradient id="colorFat2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Area type="monotone" dataKey="bodyFat" stroke="#f97316" strokeWidth={3} fill="url(#colorFat2)" /></AreaChart></ResponsiveContainer></div>
                     </div>
                     <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                        <h3 className="text-xl font-black italic uppercase mb-6">Massa Magra</h3>
                        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={compositionHistory}><defs><linearGradient id="colorMuscle2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D9FF00" stopOpacity={0.3}/><stop offset="95%" stopColor="#D9FF00" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="bold" /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Area type="monotone" dataKey="muscleMass" stroke="#D9FF00" strokeWidth={3} fill="url(#colorMuscle2)" /></AreaChart></ResponsiveContainer></div>
                     </div>
                  </div>
                  {compositionHistory.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Última Análise</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-zinc-950 p-6 rounded-2xl text-center"><p className="text-[10px] text-zinc-600 font-black uppercase mb-2">Peso</p><p className="text-3xl font-black italic text-white">{compositionHistory[compositionHistory.length - 1].weight}kg</p></div>
                        <div className="bg-zinc-950 p-6 rounded-2xl text-center"><p className="text-[10px] text-zinc-600 font-black uppercase mb-2">% Gordura</p><p className="text-3xl font-black italic text-orange-400">{compositionHistory[compositionHistory.length - 1].bodyFat}%</p></div>
                        <div className="bg-zinc-950 p-6 rounded-2xl text-center"><p className="text-[10px] text-zinc-600 font-black uppercase mb-2">Massa Magra</p><p className="text-3xl font-black italic text-lime-400">{compositionHistory[compositionHistory.length - 1].muscleMass}kg</p></div>
                        <div className="bg-zinc-950 p-6 rounded-2xl text-center"><p className="text-[10px] text-zinc-600 font-black uppercase mb-2">Hidratação</p><p className="text-3xl font-black italic text-blue-400">{compositionHistory[compositionHistory.length - 1].water}%</p></div>
                     </div>
                  </div>
                  )}
                  </>
                  )}
               </div>
            )}

            {subView === 'education' && (
               <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                  <h3 className="text-2xl font-black italic uppercase mb-6">Conteúdos Educacionais</h3>
                  {educationalContent.length > 0 ? (
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
                  ) : (
                     <div className="text-center py-16">
                        <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                           <BookOpen size={40} className="text-zinc-600"/>
                        </div>
                        <h4 className="text-2xl font-black italic uppercase mb-4">Nenhum Conteúdo</h4>
                        <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                           Crie materiais educacionais sobre nutrição para compartilhar conhecimento com seus pacientes.
                        </p>
                        <button 
                           onClick={() => setShowNewContent(true)}
                           className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                        >
                           Criar Primeiro Conteúdo
                        </button>
                     </div>
                  )}
               </div>
            )}

            {/* Modal Criar Dieta */}
            {showCreateDiet && (
               <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowCreateDiet(false)}>
                  <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
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
                  <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
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
                     <button onClick={handleSaveComposition} className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all mt-8">Salvar Análise</button>
                  </div>
               </div>
            )}
         </div>
         
         {/* Modais do NutriModule quando aluno selecionado */}
         {showCreateDiet && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowCreateDiet(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
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

         {showCompositionAnalysis && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowCompositionAnalysis(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-black italic uppercase">Nova Análise de Composição</h3>
                     <button onClick={() => setShowCompositionAnalysis(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); alert('Análise registrada com sucesso!\n\nPeso: ' + compositionForm.weight + ' kg\nGordura: ' + compositionForm.bodyFat + '%'); setCompositionForm({ weight: '', bodyFat: '', muscle: '', water: '' }); setShowCompositionAnalysis(false); }} className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Peso (kg)</label><input required type="number" step="0.1" value={compositionForm.weight} onChange={(e) => setCompositionForm({...compositionForm, weight: e.target.value})} placeholder="Ex: 87.2" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Gordura Corporal (%)</label><input required type="number" step="0.1" value={compositionForm.bodyFat} onChange={(e) => setCompositionForm({...compositionForm, bodyFat: e.target.value})} placeholder="Ex: 17.1" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Massa Muscular (kg)</label><input type="number" step="0.1" value={compositionForm.muscle} onChange={(e) => setCompositionForm({...compositionForm, muscle: e.target.value})} placeholder="Ex: 39.2" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Água Corporal (%)</label><input type="number" step="0.1" value={compositionForm.water} onChange={(e) => setCompositionForm({...compositionForm, water: e.target.value})} placeholder="Ex: 59.1" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     </div>
                     <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Registrar Análise</button>
                  </form>
               </div>
            </div>
         )}

         {showNewPatient && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowNewPatient(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-black italic uppercase">Novo Paciente</h3>
                     <button onClick={() => setShowNewPatient(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); alert('Paciente cadastrado com sucesso!\n\nNome: ' + newPatientForm.name + '\nEmail: ' + newPatientForm.email + '\nObjetivo: ' + newPatientForm.goal); setNewPatientForm({ name: '', email: '', phone: '', goal: 'Emagrecimento', restrictions: '' }); setShowNewPatient(false); }} className="space-y-6">
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Nome Completo</label><input required value={newPatientForm.name} onChange={(e) => setNewPatientForm({...newPatientForm, name: e.target.value})} placeholder="Ex: Maria Silva" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Email</label><input required type="email" value={newPatientForm.email} onChange={(e) => setNewPatientForm({...newPatientForm, email: e.target.value})} placeholder="maria@email.com" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Telefone</label><input value={newPatientForm.phone} onChange={(e) => setNewPatientForm({...newPatientForm, phone: e.target.value})} placeholder="(11) 99999-9999" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     </div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Objetivo Nutricional</label><select value={newPatientForm.goal} onChange={(e) => setNewPatientForm({...newPatientForm, goal: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"><option>Emagrecimento</option><option>Ganho de Massa</option><option>Performance Esportiva</option><option>Saúde e Bem-estar</option><option>Reeducação Alimentar</option></select></div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Restrições Alimentares</label><input value={newPatientForm.restrictions} onChange={(e) => setNewPatientForm({...newPatientForm, restrictions: e.target.value})} placeholder="Ex: Lactose, glúten, frutos do mar..." className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Cadastrar Paciente</button>
                  </form>
               </div>
            </div>
         )}

         {showNewContent && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowNewContent(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-black italic uppercase">Novo Conteúdo Educacional</h3>
                     <button onClick={() => setShowNewContent(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); handleCreateContent(); }} className="space-y-6">
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Título do Conteúdo</label><input required value={newContentForm.title} onChange={(e) => setNewContentForm({...newContentForm, title: e.target.value})} placeholder="Ex: Como montar um prato equilibrado" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Categoria</label><select value={newContentForm.category} onChange={(e) => setNewContentForm({...newContentForm, category: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"><option>Artigo</option><option>Vídeo</option><option>Infográfico</option><option>Receita</option><option>Guia</option></select></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Duração/Tempo</label><input value={newContentForm.duration} onChange={(e) => setNewContentForm({...newContentForm, duration: e.target.value})} placeholder="Ex: 5 min, 10 páginas" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     </div>
                     <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Publicar Conteúdo</button>
                  </form>
               </div>
            </div>
         )}
         </>
      );
   }

   switch(view) {
      case 'dashboard':
         return (
            <div className="space-y-10 animate-in fade-in duration-700">
               <header><h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Painel Nutricional</h1><p className="text-zinc-500 font-medium">Gestão completa de nutrição</p></header>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard label="Pacientes Ativos" value={students.length} color="text-white" icon={Users} />
                  <StatCard label="Dietas Criadas" value={totalDietas} color="text-lime-400" icon={Utensils} />
                  <StatCard label="Conteúdos" value={educationalContent.length} color="text-blue-400" icon={BookOpen} />
                  <StatCard label="Refeições Hoje" value={refeicoesHoje} color="text-orange-400" icon={Camera} />
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
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
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Refeições Pendentes</h3>
                     <div className="space-y-3">
                        {refeicoesPendentes.length > 0 ? refeicoesPendentes.map(meal => (
                           <div key={meal.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex gap-4">
                              <img src={meal.img} className="size-16 rounded-xl object-cover"/>
                              <div className="flex-1">
                                 <h4 className="font-bold text-sm">{students.find((s: any) => s.id === meal.studentId)?.name || 'Aluno'}</h4>
                                 <p className="text-[9px] text-zinc-500 font-bold">{meal.meal} • {meal.time}</p>
                              </div>
                              <button 
                                 onClick={() => {
                                    const student = students.find((s: any) => s.id === meal.studentId);
                                    if (student) setSelectedStudent(student);
                                 }}
                                 className="text-lime-400 hover:text-lime-300"
                              >
                                 <Eye size={16}/>
                              </button>
                           </div>
                        )) : (
                           <p className="text-zinc-500 text-sm text-center py-4">Nenhuma refeição pendente</p>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         );
      case 'students':
         return (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div><h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Meus Pacientes</h2><p className="text-sm md:text-base text-zinc-500 font-medium">{students.length} pacientes ativos</p></div>
                  <button onClick={() => setShowNewPatient(true)} className="bg-lime-400 text-black px-4 md:px-6 py-2.5 md:py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 whitespace-nowrap"><UserPlus size={16}/> Novo Paciente</button>
               </header>
               {students.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center">
                     <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Users size={40} className="text-zinc-600"/>
                     </div>
                     <h3 className="text-3xl font-black italic uppercase mb-4">Nenhum Paciente</h3>
                     <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                        Cadastre seu primeiro paciente para começar a gerenciar planos nutricionais e acompanhar o progresso.
                     </p>
                     <button 
                        onClick={() => setShowNewPatient(true)}
                        className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                     >
                        Cadastrar Primeiro Paciente
                     </button>
                  </div>
               ) : (
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
               )}
            </div>
         );
      case 'diets':
         return (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div><h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Planos Alimentares</h2><p className="text-sm md:text-base text-zinc-500 font-medium">Gerencie dietas personalizadas</p></div>
                  <button className="bg-lime-400 text-black px-4 md:px-6 py-2.5 md:py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 whitespace-nowrap"><Plus size={16}/> Nova Dieta</button>
               </header>
               {students.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center">
                     <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Utensils size={40} className="text-zinc-600"/>
                     </div>
                     <h3 className="text-3xl font-black italic uppercase mb-4">Nenhum Plano Alimentar</h3>
                     <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                        Cadastre pacientes primeiro para poder criar e gerenciar planos alimentares personalizados.
                     </p>
                     <button 
                        onClick={() => setView('students')}
                        className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                     >
                        Ver Pacientes
                     </button>
                  </div>
               ) : (
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
               )}
            </div>
         );
      case 'diary':
         return (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Diário Visual de Refeições</h2><p className="text-zinc-500 font-medium">Avalie fotos das refeições dos pacientes</p></header>
               {mealDiary.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center">
                     <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Camera size={40} className="text-zinc-600"/>
                     </div>
                     <h3 className="text-3xl font-black italic uppercase mb-4">Nenhuma Refeição</h3>
                     <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                        Os pacientes ainda não registraram refeições no diário visual. As fotos aparecerão aqui para avaliação.
                     </p>
                     <button 
                        onClick={() => setView('students')}
                        className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                     >
                        Ver Pacientes
                     </button>
                  </div>
               ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
               )}
            </div>
         );
      case 'composition':
         return (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Análise de Composição Corporal</h2><p className="text-zinc-500 font-medium">Acompanhe a evolução dos pacientes</p></header>
               {students.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center">
                     <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Scale size={40} className="text-zinc-600"/>
                     </div>
                     <h3 className="text-3xl font-black italic uppercase mb-4">Nenhuma Análise</h3>
                     <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                        Cadastre pacientes primeiro para poder realizar análises de composição corporal e acompanhar a evolução.
                     </p>
                     <button 
                        onClick={() => setView('students')}
                        className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                     >
                        Ver Pacientes
                     </button>
                  </div>
               ) : (
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
               )}
            </div>
         );
      case 'education':
         return (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                  <div><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Conteúdos Educacionais</h2><p className="text-zinc-500 font-medium">Biblioteca de materiais para pacientes</p></div>
                  <button onClick={() => setShowNewContent(true)} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 whitespace-nowrap"><Plus size={16}/> Novo Conteúdo</button>
               </header>
               {educationalContent.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-2xl md:rounded-[3rem] text-center">
                     <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <BookOpen size={40} className="text-zinc-600"/>
                     </div>
                     <h3 className="text-3xl font-black italic uppercase mb-4">Nenhum Conteúdo</h3>
                     <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                        Crie materiais educacionais sobre nutrição para compartilhar conhecimento com seus pacientes.
                     </p>
                     <button 
                        onClick={() => setShowNewContent(true)}
                        className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                     >
                        Criar Primeiro Conteúdo
                     </button>
                  </div>
               ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {educationalContent.map(content => (
                     <div key={content.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-lime-400/30 transition-all cursor-pointer group">
                        <div className="size-16 bg-lime-400/10 text-lime-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">{content.icon}</div>
                        <h4 className="font-black text-lg mb-2 group-hover:text-lime-400 transition-colors">{content.title}</h4>
                        <div className="flex gap-2 mb-4">
                           <span className="text-[9px] bg-zinc-950 px-3 py-1 rounded-lg font-black uppercase text-zinc-500">{content.category}</span>
                           <span className="text-[9px] bg-zinc-950 px-3 py-1 rounded-lg font-black uppercase text-zinc-500">{content.duration}</span>
                        </div>
                        <button onClick={() => alert('Visualizando conteúdo: ' + content.title + '\n\nCategoria: ' + content.category + '\nDuração: ' + content.duration)} className="w-full bg-zinc-950 hover:bg-lime-400 hover:text-black py-3 rounded-xl font-black uppercase text-[10px] transition-all">Visualizar</button>
                     </div>
                  ))}
               </div>
               )}
            </div>
         );
      default: return (
         <>
            {/* Modal Novo Paciente */}
            {showNewPatient && (
               <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowNewPatient(false)}>
                  <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-3xl font-black italic uppercase">Novo Paciente</h3>
                        <button onClick={() => setShowNewPatient(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                     </div>
                     <form onSubmit={(e) => { e.preventDefault(); alert('Paciente cadastrado com sucesso!\n\nNome: ' + newPatientForm.name + '\nEmail: ' + newPatientForm.email + '\nObjetivo: ' + newPatientForm.goal); setNewPatientForm({ name: '', email: '', phone: '', goal: 'Emagrecimento', restrictions: '' }); setShowNewPatient(false); }} className="space-y-6">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Nome Completo</label><input required value={newPatientForm.name} onChange={(e) => setNewPatientForm({...newPatientForm, name: e.target.value})} placeholder="Ex: Maria Silva" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div className="grid grid-cols-2 gap-4">
                           <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Email</label><input required type="email" value={newPatientForm.email} onChange={(e) => setNewPatientForm({...newPatientForm, email: e.target.value})} placeholder="maria@email.com" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                           <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Telefone</label><input value={newPatientForm.phone} onChange={(e) => setNewPatientForm({...newPatientForm, phone: e.target.value})} placeholder="(11) 99999-9999" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        </div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Objetivo Nutricional</label><select value={newPatientForm.goal} onChange={(e) => setNewPatientForm({...newPatientForm, goal: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"><option>Emagrecimento</option><option>Ganho de Massa</option><option>Performance Esportiva</option><option>Saúde e Bem-estar</option><option>Reeducação Alimentar</option></select></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Restrições Alimentares</label><input value={newPatientForm.restrictions} onChange={(e) => setNewPatientForm({...newPatientForm, restrictions: e.target.value})} placeholder="Ex: Lactose, glúten, frutos do mar..." className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Cadastrar Paciente</button>
                     </form>
                  </div>
               </div>
            )}

            {/* Modal Novo Conteúdo */}
            {showNewContent && (
               <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowNewContent(false)}>
                  <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-3xl font-black italic uppercase">Novo Conteúdo Educacional</h3>
                        <button onClick={() => setShowNewContent(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                     </div>
                     <form onSubmit={(e) => { e.preventDefault(); alert('Conteúdo criado com sucesso!\n\nTítulo: ' + newContentForm.title + '\nCategoria: ' + newContentForm.category + '\nDuração: ' + newContentForm.duration); setNewContentForm({ title: '', category: 'Artigo', duration: '' }); setShowNewContent(false); }} className="space-y-6">
                        <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Título do Conteúdo</label><input required value={newContentForm.title} onChange={(e) => setNewContentForm({...newContentForm, title: e.target.value})} placeholder="Ex: Como montar um prato equilibrado" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        <div className="grid grid-cols-2 gap-4">
                           <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Categoria</label><select value={newContentForm.category} onChange={(e) => setNewContentForm({...newContentForm, category: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"><option>Artigo</option><option>Vídeo</option><option>Infográfico</option><option>Receita</option><option>Guia</option></select></div>
                           <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Duração/Tempo</label><input value={newContentForm.duration} onChange={(e) => setNewContentForm({...newContentForm, duration: e.target.value})} placeholder="Ex: 5 min, 10 páginas" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                        </div>
                        <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Publicar Conteúdo</button>
                     </form>
                  </div>
               </div>
            )}
         </>
      );
   }
};

const AdminModule = ({ view, user, academia }: any) => {
   const tab = view || 'dashboard';
   const [showAddLead, setShowAddLead] = useState(false);
   const [showAddTicket, setShowAddTicket] = useState(false);
   const [showAddEmployee, setShowAddEmployee] = useState(false);
   const [draggedLead, setDraggedLead] = useState<any>(null);
   const [crmLeads, setCrmLeads] = useState<any[]>([]);
   const [maintenanceTickets, setMaintenanceTickets] = useState<any[]>([]);
   const [adminProducts, setAdminProducts] = useState<any[]>([]);
   const [funcionarios, setFuncionarios] = useState<any[]>([]);
   const [relatoriosFinanceiros, setRelatoriosFinanceiros] = useState<any[]>([]);
   const [registrosAcesso, setRegistrosAcesso] = useState<any[]>([]);
   const [estatisticas, setEstatisticas] = useState<any>({ alunosAtivos: 0, taxaRetencao: 0 });
   const [funcionariosData, setFuncionariosData] = useState<any[]>([]);
   const [showAddFuncionario, setShowAddFuncionario] = useState(false);
   const [funcionarioForm, setFuncionarioForm] = useState({ nome: '', email: '', senha: '', funcao: 'PROFESSOR', telefone: '', cpf: '' });
   const [leadForm, setLeadForm] = useState({ name: '', contact: '', origin: 'Instagram', value: '', notes: '' });
   const [ticketForm, setTicketForm] = useState({ equipment: '', issue: '', priority: 'Média' });
   const [employeeForm, setEmployeeForm] = useState({ name: '', role: 'Professor', salary: '' });
   const [selectedStudent, setSelectedStudent] = useState<any>(null);
   const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
   const [prescriptionType, setPrescriptionType] = useState<'treino' | 'dieta' | null>(null);
   const [alunos, setAlunos] = useState<any[]>([]);
   const [historicoTreinos, setHistoricoTreinos] = useState<any[]>([]);
   const [historicoDietas, setHistoricoDietas] = useState<any[]>([]);
   const [showAddAlunoModal, setShowAddAlunoModal] = useState(false);
   const [alunoForm, setAlunoForm] = useState({ nome: '', email: '', senha: '', telefone: '', cpf: '' });
   const [selectedDay, setSelectedDay] = useState('segunda');
   const [selectedDays, setSelectedDays] = useState<string[]>(['segunda']);
   const [planoTreino, setPlanoTreino] = useState<any>({
      titulo: '',
      segunda: [],
      terca: [],
      quarta: [],
      quinta: [],
      sexta: [],
      sabado: [],
      domingo: []
   });
   const [planoDieta, setPlanoDieta] = useState<any>({
      titulo: '',
      objetivoCalorico: '',
      segunda: [],
      terca: [],
      quarta: [],
      quinta: [],
      sexta: [],
      sabado: [],
      domingo: []
   });
   const [gerandoComIA, setGerandoComIA] = useState(false);
   const [showIAConfigModal, setShowIAConfigModal] = useState(false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [selectedTreinoEdit, setSelectedTreinoEdit] = useState(null);
   const [activeDayEdit, setActiveDayEdit] = useState('segunda');
   const [editingPlano, setEditingPlano] = useState({
      segunda: [],
      terca: [],
      quarta: [],
      quinta: [],
      sexta: [],
      sabado: [],
      domingo: []
   });
   
   // Estados para edição de dieta
   const [showEditDietaModal, setShowEditDietaModal] = useState(false);
   const [selectedDietaEdit, setSelectedDietaEdit] = useState(null);
   const [activeMealEdit, setActiveMealEdit] = useState('cafeDaManha');
   const [editingDietaPlano, setEditingDietaPlano] = useState({
      cafeDaManha: [],
      lancheManha: [],
      almoco: [],
      lancheTarde: [],
      jantar: [],
      ceia: [],
      objetivoCalorico: ''
   });
   const [iaConfig, setIaConfig] = useState({
      objetivo: '',
      nivel: '',
      restricoes: '',
      diasTreino: 3,
      selectedDays: [] as string[]
   });
   const [historicoAbaAtiva, setHistoricoAbaAtiva] = useState<'treinos' | 'dietas'>('treinos');
   const [showEvolucaoModal, setShowEvolucaoModal] = useState(false);
   const [showFotosModal, setShowFotosModal] = useState(false);
   const [medicoesAluno, setMedicoesAluno] = useState<any[]>([]);
   const [fotosAluno, setFotosAluno] = useState<any[]>([]);
   const [pagamentos, setPagamentos] = useState<any[]>([]);
   const [showAddPagamentoModal, setShowAddPagamentoModal] = useState(false);
   const [showGerarMensalidadesModal, setShowGerarMensalidadesModal] = useState(false);
   const [pagamentoForm, setPagamentoForm] = useState({
      usuarioId: '',
      valor: '',
      mesReferencia: '',
      dataVencimento: '',
      observacoes: ''
   });
   const [mensalidadeForm, setMensalidadeForm] = useState({
      mesReferencia: '',
      valor: '',
      diaVencimento: '10'
   });
   const [produtos, setProdutos] = useState<any[]>([]);
   const [showAddProdutoModal, setShowAddProdutoModal] = useState(false);
   const [showEditProdutoModal, setShowEditProdutoModal] = useState(false);
   const [selectedProduto, setSelectedProduto] = useState<any>(null);
   const [produtoForm, setProdutoForm] = useState({
      nome: '',
      categoria: 'suplementos',
      preco: '',
      estoque: '0',
      estoqueMinimo: '10',
      descricao: '',
      urlImagem: ''
   });
   const [financialData, setFinancialData] = useState({
      revenue: 0,
      expenses: 0,
      profit: 0
   });
   
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

   // Carregar dados das APIs quando o componente montar
   useEffect(() => {
      const carregarDadosAdmin = async () => {
         const token = localStorage.getItem('fitness_token');
         if (!token) return;

         try {
            // Carregar todos os dados em paralelo
            const [
               leads,
               tickets,
               produtos,
               funcionariosData,
               relatorios,
               registros
            ] = await Promise.all([
               carregarLeads(token),
               carregarTicketsManutencao(token),
               carregarProdutos(token),
               carregarFuncionarios(token),
               carregarRelatoriosFinanceiros(token),
               carregarRegistrosAcesso(token)
            ]);

            console.log('📊 Dados carregados:', { 
               leads: Array.isArray(leads) ? leads.length : 'não é array',
               tickets: Array.isArray(tickets) ? tickets.length : 'não é array',
               produtos: Array.isArray(produtos) ? produtos.length : 'não é array',
               funcionariosData: Array.isArray(funcionariosData) ? funcionariosData.length : 'não é array'
            });

            // Adaptar dados para o formato esperado pelo frontend - COM VALIDAÇÃO
            setCrmLeads(Array.isArray(leads) ? leads.map((lead: any) => ({
               id: lead.id,
               name: lead.nome,
               status: lead.status,
               contact: lead.telefone,
               origin: lead.origem,
               value: lead.valorEstimado,
               notes: lead.observacoes || ''
            })) : []);

            setMaintenanceTickets(Array.isArray(tickets) ? tickets.map((ticket: any) => ({
               id: ticket.id,
               equipment: ticket.equipamento,
               issue: ticket.descricao,
               status: ticket.status,
               date: new Date(ticket.criadoEm).toLocaleDateString(),
               priority: ticket.prioridade
            })) : []);

            setAdminProducts(Array.isArray(produtos) ? produtos.map((produto: any) => ({
               id: produto.id,
               name: produto.nome,
               quantity: produto.estoque,
               minStock: produto.estoqueMinimo,
               status: produto.estoque <= produto.estoqueMinimo ? 
                  (produto.estoque <= produto.estoqueMinimo * 0.5 ? 'critical' : 'low') : 'ok',
               price: produto.preco,
               category: produto.categoria
            })) : []);

            setFuncionarios(Array.isArray(funcionariosData) ? funcionariosData.map((func: any) => ({
               id: func.id,
               name: func.nome,
               role: func.cargo,
               salary: func.salario,
               performance: Math.floor(Math.random() * 20) + 80 // Dados mockados temporários
            })) : []);

            setRelatoriosFinanceiros(Array.isArray(relatorios) ? relatorios : []);
            setRegistrosAcesso(Array.isArray(registros) ? registros : []);

         } catch (error) {
            console.error('❌ Erro ao carregar dados do admin:', error);
            // Garantir que todos os estados sejam arrays vazios em caso de erro
            setCrmLeads([]);
            setMaintenanceTickets([]);
            setAdminProducts([]);
            setFuncionarios([]);
            setRelatoriosFinanceiros([]);
            setRegistrosAcesso([]);
         }
      };

      carregarDadosAdmin();
   }, []);

   const handleDrop = (newStatus: string) => {
      if (draggedLead) {
         setCrmLeads(prev => prev.map(lead => 
            lead.id === draggedLead.id ? { ...lead, status: newStatus } : lead
         ));
         setDraggedLead(null);
      }
   };
   
   useEffect(() => {
      if (tab === 'alunos') {
         carregarAlunos();
      }
   }, [tab]);

   // Carregar históricos quando selecionar aluno
   useEffect(() => {
      if (selectedStudent && selectedStudent.id) {
         carregarHistoricos();
      }
   }, [selectedStudent]);

   const carregarEvolucaoAluno = async () => {
      const token = localStorage.getItem('fitness_token');
      if (!token || !selectedStudent) return;

      try {
         const medicoes = await carregarMedicoes(token, selectedStudent.id);
         setMedicoesAluno(medicoes);
         setShowEvolucaoModal(true);
      } catch (error) {
         console.error('Erro ao carregar evolução:', error);
         alert('Erro ao carregar dados de evolução');
      }
   };

   const carregarFotosProgressoAluno = async () => {
      const token = localStorage.getItem('fitness_token');
      if (!token || !selectedStudent) return;

      try {
         const fotos = await carregarFotosProgresso(token, selectedStudent.id);
         setFotosAluno(fotos);
         setShowFotosModal(true);
      } catch (error) {
         console.error('Erro ao carregar fotos:', error);
         alert('Erro ao carregar fotos de progresso');
      }
   };

   const calcularEstatisticas = () => {
      if (!selectedStudent || !historicoTreinos) {
         return { totalTreinos: 0, frequencia: 0, evolucaoPeso: '-' };
      }

      // Total de treinos no último mês
      const hoje = new Date();
      const umMesAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
      const treinosUltimoMes = historicoTreinos.filter((t: any) => 
         new Date(t.data) >= umMesAtras
      ).length;

      // Frequência (treinos por semana)
      const frequencia = treinosUltimoMes > 0 
         ? Math.round((treinosUltimoMes / 4) * 10) / 10 
         : 0;

      // Evolução de peso (se houver medições)
      let evolucaoPeso = '-';
      if (medicoesAluno.length >= 2) {
         const medicoesOrdenadas = [...medicoesAluno].sort((a, b) => 
            new Date(a.data).getTime() - new Date(b.data).getTime()
         );
         const primeira = medicoesOrdenadas[0];
         const ultima = medicoesOrdenadas[medicoesOrdenadas.length - 1];
         
         if (primeira.peso && ultima.peso) {
            const diff = ultima.peso - primeira.peso;
            evolucaoPeso = diff > 0 ? `+${diff.toFixed(1)}kg` : `${diff.toFixed(1)}kg`;
         }
      }

      return { 
         totalTreinos: treinosUltimoMes, 
         frequencia: `${frequencia}x/sem`,
         evolucaoPeso 
      };
   };

   const carregarPagamentos = async (filtros?: { usuarioId?: string; mesReferencia?: string; status?: string }) => {
      const token = localStorage.getItem('fitness_token');
      if (!token) return;

      try {
         const params = new URLSearchParams();
         if (filtros?.usuarioId) params.append('usuarioId', filtros.usuarioId);
         if (filtros?.mesReferencia) params.append('mesReferencia', filtros.mesReferencia);
         if (filtros?.status) params.append('status', filtros.status);
         
         const response = await fetch(`/api/pagamentos?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         
         if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
               const dados = await response.json();
               setPagamentos(dados);
            } else {
               console.error('Servidor não retornou JSON. Verifique se o backend está rodando.');
               setPagamentos([]);
            }
         } else {
            console.error('Erro ao carregar pagamentos:', response.status);
            setPagamentos([]);
         }
      } catch (error) {
         console.error('Erro ao carregar pagamentos:', error);
         setPagamentos([]);
      }
   };

   const criarPagamento = async () => {
      const token = localStorage.getItem('fitness_token');
      if (!token) return;

      try {
         const response = await fetch('/api/pagamentos', {
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify(pagamentoForm)
         });

         if (response.ok) {
            alert('Pagamento criado com sucesso!');
            setShowAddPagamentoModal(false);
            setPagamentoForm({ usuarioId: '', valor: '', mesReferencia: '', dataVencimento: '', observacoes: '' });
            await carregarPagamentos();
         } else {
            alert('Erro ao criar pagamento');
         }
      } catch (error) {
         console.error('Erro ao criar pagamento:', error);
         alert('Erro ao criar pagamento');
      }
   };

   const atualizarStatusPagamento = async (pagamentoId: string, novoStatus: string) => {
      const token = localStorage.getItem('fitness_token');
      if (!token) return;

      try {
         const data: any = { status: novoStatus };
         if (novoStatus === 'PAGO') {
            data.dataPagamento = new Date().toISOString();
         }

         const response = await fetch(`/api/pagamentos/${pagamentoId}`, {
            method: 'PUT',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
         });

         if (response.ok) {
            alert('Status atualizado com sucesso!');
            await carregarPagamentos();
         } else {
            alert('Erro ao atualizar status');
         }
      } catch (error) {
         console.error('Erro ao atualizar status:', error);
         alert('Erro ao atualizar status');
      }
   };

   const gerarMensalidadesAutomaticas = async () => {
      const token = localStorage.getItem('fitness_token');
      if (!token) return;

      try {
         const response = await fetch('/api/pagamentos/gerar-mensalidades', {
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify(mensalidadeForm)
         });

         if (response.ok) {
            const data = await response.json();
            alert(data.mensagem);
            setShowGerarMensalidadesModal(false);
            setMensalidadeForm({ mesReferencia: '', valor: '', diaVencimento: '10' });
            await carregarPagamentos();
         } else {
            alert('Erro ao gerar mensalidades');
         }
      } catch (error) {
         console.error('Erro ao gerar mensalidades:', error);
         alert('Erro ao gerar mensalidades');
      }
   };

   const carregarProdutos = async () => {
      const token = localStorage.getItem('fitness_token');
      if (!token) return;

      try {
         const response = await fetch('/api/produtos', {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         
         if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
               const dados = await response.json();
               setProdutos(dados);
            } else {
               console.error('Servidor não retornou JSON. Verifique se o backend está rodando.');
               setProdutos([]);
            }
         } else {
            console.error('Erro ao carregar produtos:', response.status);
            setProdutos([]);
         }
      } catch (error) {
         console.error('Erro ao carregar produtos:', error);
         setProdutos([]);
      }
   };

   const criarProduto = async () => {
      const token = localStorage.getItem('fitness_token');
      if (!token) return;

      try {
         const response = await fetch('/api/produtos', {
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify(produtoForm)
         });

         if (response.ok) {
            alert('Produto criado com sucesso!');
            setShowAddProdutoModal(false);
            setProdutoForm({ nome: '', categoria: 'suplementos', preco: '', estoque: '0', estoqueMinimo: '10', descricao: '', urlImagem: '' });
            await carregarProdutos();
         } else {
            alert('Erro ao criar produto');
         }
      } catch (error) {
         console.error('Erro ao criar produto:', error);
         alert('Erro ao criar produto');
      }
   };

   const atualizarProduto = async () => {
      const token = localStorage.getItem('fitness_token');
      if (!token || !selectedProduto) return;

      try {
         const response = await fetch(`/api/produtos/${selectedProduto.id}`, {
            method: 'PUT',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify(produtoForm)
         });

         if (response.ok) {
            alert('Produto atualizado com sucesso!');
            setShowEditProdutoModal(false);
            setSelectedProduto(null);
            setProdutoForm({ nome: '', categoria: 'suplementos', preco: '', estoque: '0', estoqueMinimo: '10', descricao: '', urlImagem: '' });
            await carregarProdutos();
         } else {
            alert('Erro ao atualizar produto');
         }
      } catch (error) {
         console.error('Erro ao atualizar produto:', error);
         alert('Erro ao atualizar produto');
      }
   };

   const deletarProduto = async (produtoId: string) => {
      if (!confirm('Deseja realmente deletar este produto?')) return;

      const token = localStorage.getItem('fitness_token');
      if (!token) return;

      try {
         const response = await fetch(`/api/produtos/${produtoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
         });

         if (response.ok) {
            alert('Produto deletado com sucesso!');
            await carregarProdutos();
         } else {
            alert('Erro ao deletar produto');
         }
      } catch (error) {
         console.error('Erro ao deletar produto:', error);
         alert('Erro ao deletar produto');
      }
   };

   const ajustarEstoque = async (produtoId: string, quantidade: number, operacao: 'adicionar' | 'remover') => {
      const token = localStorage.getItem('fitness_token');
      if (!token) return;

      try {
         const response = await fetch(`/api/produtos/${produtoId}/ajustar-estoque`, {
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantidade, operacao })
         });

         if (response.ok) {
            await carregarProdutos();
         } else {
            alert('Erro ao ajustar estoque');
         }
      } catch (error) {
         console.error('Erro ao ajustar estoque:', error);
         alert('Erro ao ajustar estoque');
      }
   };

   const carregarHistoricos = async () => {
      const token = localStorage.getItem('fitness_token');
      if (!token || !selectedStudent) return;

      try {
         console.log('🔄 Iniciando carregamento de históricos para:', selectedStudent.nome, selectedStudent.id);
         
         const [treinos, dietas] = await Promise.all([
            carregarHistoricoTreinos(token, selectedStudent.id),
            carregarHistoricoDietas(token, selectedStudent.id)
         ]);

         console.log('📥 Treinos recebidos:', treinos);
         console.log('📥 Tipo de treinos:', Array.isArray(treinos) ? 'Array' : typeof treinos);
         console.log('📥 Quantidade de treinos:', Array.isArray(treinos) ? treinos.length : 'N/A');

         // Adaptar treinos para o formato esperado - com verificação
         const treinosFormatados = Array.isArray(treinos) ? treinos.map((treino: any) => ({
            id: treino.id,
            titulo: treino.tituloTreino || treino.titulo || 'Treino',
            alunoId: selectedStudent.id,
            alunoNome: selectedStudent.nome,
            data: new Date(treino.data).toLocaleDateString('pt-BR'),
            plano: typeof treino.exercicios === 'object' ? treino.exercicios : JSON.parse(treino.exercicios || '{}'),
            tipo: treino.origem === 'IA' ? 'ia' : 'manual'
         })) : [];

         console.log('✅ Treinos formatados:', treinosFormatados);

         // Adaptar dietas para o formato esperado - com verificação
         console.log('📥 Dietas recebidas:', dietas);
         const dietasFormatadas = Array.isArray(dietas) ? dietas.map((dieta: any) => {
            console.log('🍎 Processando dieta:', dieta);
            const plano = dieta.dados?.refeicoes || dieta.conteudo?.refeicoes || {};
            console.log('🍎 Plano extraído:', plano);
            return {
               id: dieta.id,
               titulo: dieta.dados?.titulo || dieta.titulo || 'Dieta',
               alunoId: selectedStudent.id,
               alunoNome: selectedStudent.nome,
               data: new Date(dieta.criadoEm).toLocaleDateString('pt-BR'),
               plano: plano,
               tipo: (dieta.dados?.origem || dieta.conteudo?.origem) === 'IA' ? 'ia' : 'manual'
            };
         }) : [];

         console.log('✅ Dietas formatadas:', dietasFormatadas);

         setHistoricoTreinos(treinosFormatados);
         setHistoricoDietas(dietasFormatadas);
         
         console.log('✅ Estados atualizados - Treinos:', treinosFormatados.length, 'Dietas:', dietasFormatadas.length);

      } catch (error) {
         console.error('❌ Erro ao carregar históricos:', error);
         setHistoricoTreinos([]);
         setHistoricoDietas([]);
      }
   };

   const carregarAlunos = async () => {
      try {
         const token = localStorage.getItem('fitness_token');
         console.log('🔑 Token sendo usado:', token ? 'Token presente' : 'Token ausente');
         
         const response = await fetch(`${API_URL}/api/admin/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         
         console.log('📞 Response status:', response.status);
         console.log('📞 Response headers:', response.headers);
         
         if (response.ok) {
            const data = await response.json();
            console.log('📊 Usuários recebidos:', data);
            console.log('📊 Total de usuários:', data.length);
            
            const alunosFiltrados = data.filter((u: any) => u.funcao === 'ALUNO');
            console.log('👥 Alunos filtrados:', alunosFiltrados);
            console.log('👥 Total de alunos:', alunosFiltrados.length);
            
            setAlunos(alunosFiltrados);
         } else {
            console.error('❌ Erro na resposta:', response.status);
            const errorText = await response.text();
            console.error('❌ Detalhes do erro:', errorText);
         }
      } catch (error) {
         console.error('❌ Erro ao carregar alunos:', error);
      }
   };

   const carregarEstatisticas = async () => {
      try {
         const token = localStorage.getItem('fitness_token');
         const response = await fetch(`${API_URL}/api/admin/estatisticas`, {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         
         if (response.ok) {
            const data = await response.json();
            setEstatisticas(data);
         }
      } catch (error) {
         console.error('Erro ao carregar estatísticas:', error);
      }
   };

   const carregarFuncionarios = async () => {
      try {
         const token = localStorage.getItem('fitness_token');
         const response = await fetch(`${API_URL}/api/admin/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         
         if (response.ok) {
            const data = await response.json();
            const funcionarios = data.filter((u: any) => u.funcao === 'PROFESSOR' || u.funcao === 'NUTRI');
            setFuncionariosData(funcionarios);
         }
      } catch (error) {
         console.error('Erro ao carregar funcionários:', error);
      }
   };

   const carregarDadosFinanceiros = async () => {
      try {
         const token = localStorage.getItem('fitness_token');
         const alunosResponse = await fetch(`${API_URL}/api/admin/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         
         if (alunosResponse.ok) {
            const usuarios = await alunosResponse.json();
            const alunosAtivos = usuarios.filter((u: any) => u.funcao === 'ALUNO' && u.ativo);
            
            // Calcular receita baseada em alunos ativos (assumindo mensalidade de R$ 150)
            const mensalidadeMedia = 150;
            const receitaMensal = alunosAtivos.length * mensalidadeMedia;
            
            // Despesas estimadas (pode ser ajustado conforme necessário)
            const despesasMensais = Math.round(receitaMensal * 0.6); // 60% da receita
            const lucroMensal = receitaMensal - despesasMensais;
            
            setFinancialData({
               revenue: receitaMensal,
               expenses: despesasMensais,
               profit: lucroMensal
            });
         }
      } catch (error) {
         console.error('Erro ao carregar dados financeiros:', error);
      }
   };

   const aprovarFuncionario = async (funcionarioId: string, aprovar: boolean) => {
      try {
         const token = localStorage.getItem('fitness_token');
         const response = await fetch(`${API_URL}/api/admin/usuarios/${funcionarioId}/status`, {
            method: 'PATCH',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ativo: aprovar })
         });
         
         if (response.ok) {
            carregarFuncionarios();
         }
      } catch (error) {
         console.error('Erro ao alterar status do funcionário:', error);
      }
   };

   const cadastrarFuncionario = async () => {
      try {
         const token = localStorage.getItem('fitness_token');
         const response = await fetch(`${API_URL}/api/auth/registrar`, {
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({
               ...funcionarioForm,
               academiaId: academia.id
            })
         });

         if (response.ok) {
            setShowAddFuncionario(false);
            setFuncionarioForm({ nome: '', email: '', senha: '', funcao: 'PROFESSOR', telefone: '', cpf: '' });
            carregarFuncionarios();
            alert('Funcionário cadastrado com sucesso!');
         } else {
            const error = await response.json();
            alert(`Erro: ${error.erro || 'Não foi possível cadastrar o funcionário'}`);
         }
      } catch (error) {
         console.error('Erro ao cadastrar funcionário:', error);
         alert('Erro ao cadastrar funcionário');
      }
   };

   const prescrever = (aluno: any, tipo: 'treino' | 'dieta') => {
      setSelectedStudent(aluno);
      setPrescriptionType(tipo);
      setShowPrescriptionModal(true);
   };

   const cadastrarAluno = async () => {
      try {
         const token = localStorage.getItem('fitness_token');
         const response = await fetch(`${API_URL}/api/auth/registrar`, {
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({
               ...alunoForm,
               funcao: 'ALUNO',
               academiaId: academia.id
            })
         });

         if (response.ok) {
            setShowAddAlunoModal(false);
            setAlunoForm({ nome: '', email: '', senha: '', telefone: '', cpf: '' });
            carregarAlunos();
            alert('Aluno cadastrado com sucesso!');
         } else {
            const error = await response.json();
            alert(`Erro: ${error.erro || 'Não foi possível cadastrar o aluno'}`);
         }
      } catch (error) {
         console.error('❌ Erro ao cadastrar aluno:', error);
         alert('Erro ao cadastrar aluno');
      }
   };

   const abrirModalEdicaoTreino = (treino: any) => {
      console.log('🎯 Abrindo modal de edição - Treino completo:', treino);
      console.log('🎯 Plano do treino:', treino.plano);
      console.log('🎯 Segunda-feira:', treino.plano?.segunda);
      console.log('🎯 Tipo de plano:', typeof treino.plano);
      console.log('🎯 Exercícios como JSON:', JSON.stringify(treino.plano, null, 2));
      
      setSelectedTreinoEdit(treino);
      
      // Verificar se plano existe e tem a estrutura correta
      const planoAtual = treino.plano || treino.exercicios || {};
      console.log('🎯 Plano a ser usado:', planoAtual);
      
      const planoFormatado = {
         segunda: Array.isArray(planoAtual.segunda) ? planoAtual.segunda : [],
         terca: Array.isArray(planoAtual.terca) ? planoAtual.terca : [],
         quarta: Array.isArray(planoAtual.quarta) ? planoAtual.quarta : [],
         quinta: Array.isArray(planoAtual.quinta) ? planoAtual.quinta : [],
         sexta: Array.isArray(planoAtual.sexta) ? planoAtual.sexta : [],
         sabado: Array.isArray(planoAtual.sabado) ? planoAtual.sabado : [],
         domingo: Array.isArray(planoAtual.domingo) ? planoAtual.domingo : []
      };
      
      console.log('🎯 Plano formatado:', planoFormatado);
      console.log('🎯 Total de exercícios na segunda:', planoFormatado.segunda.length);
      
      setEditingPlano(planoFormatado);
      setActiveDayEdit('segunda');
      setShowEditModal(true);
   };

   const salvarEdicaoTreino = async () => {
      if (!selectedTreinoEdit) {
         alert('Nenhum treino selecionado para edição');
         return;
      }

      const token = localStorage.getItem('fitness_token');
      if (!token) {
         alert('Token não encontrado');
         return;
      }

      try {
         const dadosAtualizacao = {
            plano: editingPlano
         };

         const resultado = await atualizarTreino(token, selectedTreinoEdit.id, dadosAtualizacao);
         
         if (resultado) {
            // Atualizar a lista local de treinos
            setHistoricoTreinos(prev => prev.map(treino => 
               treino.id === selectedTreinoEdit.id 
                  ? { ...treino, plano: editingPlano }
                  : treino
            ));

            // Fechar modal
            setShowEditModal(false);
            setSelectedTreinoEdit(null);
            setEditingPlano({
               segunda: [],
               terca: [],
               quarta: [],
               quinta: [],
               sexta: [],
               sabado: [],
               domingo: []
            });

            alert('Treino atualizado com sucesso!');
         } else {
            alert('Erro ao salvar alterações do treino');
         }
      } catch (error) {
         console.error('Erro ao salvar edição do treino:', error);
         alert('Erro ao salvar alterações do treino');
      }
   };

   const abrirModalEdicaoDieta = (dieta: any) => {
      setSelectedDietaEdit(dieta);
      // Carregar os dados do plano atual
      setEditingDietaPlano({
         cafeDaManha: dieta.plano.cafeDaManha || [],
         lancheManha: dieta.plano.lancheManha || [],
         almoco: dieta.plano.almoco || [],
         lancheTarde: dieta.plano.lancheTarde || [],
         jantar: dieta.plano.jantar || [],
         ceia: dieta.plano.ceia || [],
         objetivoCalorico: dieta.plano.objetivoCalorico || ''
      });
      setActiveMealEdit('cafeDaManha');
      setShowEditDietaModal(true);
   };

   const salvarEdicaoDieta = async () => {
      if (!selectedDietaEdit) {
         alert('Nenhuma dieta selecionada para edição');
         return;
      }

      const token = localStorage.getItem('fitness_token');
      if (!token) {
         alert('Token não encontrado');
         return;
      }

      try {
         const dadosAtualizacao = {
            plano: editingDietaPlano
         };

         const resultado = await atualizarDieta(token, selectedDietaEdit.id, dadosAtualizacao);
         
         if (resultado) {
            // Atualizar a lista local de dietas
            setHistoricoDietas(prev => prev.map(dieta => 
               dieta.id === selectedDietaEdit.id 
                  ? { ...dieta, plano: editingDietaPlano }
                  : dieta
            ));

            // Fechar modal
            setShowEditDietaModal(false);
            setSelectedDietaEdit(null);
            setEditingDietaPlano({
               cafeDaManha: [],
               lancheManha: [],
               almoco: [],
               lancheTarde: [],
               jantar: [],
               ceia: [],
               objetivoCalorico: ''
            });

            alert('Dieta atualizada com sucesso!');
         } else {
            alert('Erro ao salvar alterações da dieta');
         }
      } catch (error) {
         console.error('Erro ao salvar edição da dieta:', error);
         alert('Erro ao salvar alterações da dieta');
      }
   };

   const gerarTreinoComIA = async () => {
      if (!iaConfig.objetivo || !iaConfig.nivel) {
         alert('Preencha o objetivo e nível do aluno');
         return;
      }

      setGerandoComIA(true);
      try {
         console.log('🤖 Gerando treino para', iaConfig.diasTreino, 'dias da semana');
         console.log('📋 Configurações da IA:', iaConfig);
         
         const prompt = `Você é um personal trainer expert. Crie um plano de treino completo para ${iaConfig.diasTreino} dias da semana.

Perfil do Aluno:
- Nome: ${selectedStudent.nome}
- Objetivo: ${iaConfig.objetivo}
- Nível: ${iaConfig.nivel}
- Restrições: ${iaConfig.restricoes || 'Nenhuma'}
${iaConfig.selectedDays.length > 0 ? `- Dias de treino: ${iaConfig.selectedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}` : ''}

IMPORTANTE: 
${iaConfig.diasTreino === 7 ? 
  `- Distribua exercícios em TODOS os 7 dias (segunda, terça, quarta, quinta, sexta, sábado, domingo)
- Para fins de semana (sábado/domingo), inclua treinos mais leves ou diferentes grupos musculares` :
  iaConfig.selectedDays.length > 0 ?
  `- Crie exercícios APENAS para os dias especificados: ${iaConfig.selectedDays.join(', ')}
- Deixe os outros dias com arrays vazios []` :
  `- Distribua os exercícios estrategicamente em ${iaConfig.diasTreino} dos 7 dias da semana
- Deixe os outros dias com arrays vazios [] para descanso`
}

- Para CADA exercício, adicione uma URL de vídeo do YouTube mostrando a execução correta (procure por canais confiáveis de educação física)

Retorne APENAS um JSON válido no formato:
{
  "titulo": "Nome do plano (${iaConfig.diasTreino} dias)",
  "segunda": [{"nome": "Exercício", "series": "3", "repeticoes": "12", "carga": "Moderada", "descanso": "90s", "videoUrl": "https://youtube.com/watch?v=..."}],
  "terca": [],
  "quarta": [],
  "quinta": [],
  "sexta": [],
  "sabado": [],
  "domingo": []
}

${iaConfig.diasTreino === 7 ? 
  'CERTIFIQUE-SE de incluir exercícios em TODOS os 7 dias! Sábado e domingo NÃO devem ficar vazios!' :
  iaConfig.selectedDays.length > 0 ?
  `Distribua os exercícios APENAS nos dias: ${iaConfig.selectedDays.join(', ')}.` :
  `Distribua os exercícios nos ${iaConfig.diasTreino} dias solicitados, deixando os outros dias vazios [].`
}

OBRIGATÓRIO: Todos os exercícios devem incluir videoUrl com links válidos do YouTube para demonstração da técnica correta.
Seja específico e profissional. ${iaConfig.diasTreino >= 6 ? 'Inclua treinos para fins de semana!' : ''}`;

         const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
         const result = await model.generateContent(prompt);
         const response = await result.response;
         const text = response.text();
         
         // Extrair JSON do texto
         const jsonMatch = text.match(/\{[\s\S]*\}/);
         if (jsonMatch) {
            const planoGerado = JSON.parse(jsonMatch[0]);
            setPlanoTreino(planoGerado);
            
            // Salvar no banco de dados usando a API
            const token = localStorage.getItem('fitness_token');
            if (token) {
               // Garantir que o titulo existe
               const tituloFinal = planoGerado.titulo || planoTreino.titulo || `Treino IA - ${new Date().toLocaleDateString()}`;
               
               const dadosTreino = {
                  usuarioId: selectedStudent.id,
                  titulo: tituloFinal,
                  tipoTreino: 'Treino Personalizado IA',
                  duracao: 60,
                  exercicios: planoGerado,
                  observacoes: `Gerado pela IA - Objetivo: ${iaConfig.objetivo}, Nível: ${iaConfig.nivel}`,
                  origem: 'IA'
               };
               
               const treinoSalvo = await salvarTreino(token, dadosTreino);
               
               if (treinoSalvo) {
                  // Atualizar estado local com o treino salvo
                  const novoTreino = {
                     id: treinoSalvo.id,
                     titulo: treinoSalvo.titulo,
                     alunoId: selectedStudent.id,
                     alunoNome: selectedStudent.nome,
                     data: new Date(treinoSalvo.data).toLocaleDateString('pt-BR'),
                     plano: treinoSalvo.exercicios,
                     tipo: 'ia'
                  };
                  setHistoricoTreinos(prev => [novoTreino, ...prev]);
               }
            }
            
            setShowIAConfigModal(false);
            setIaConfig({ objetivo: '', nivel: '', restricoes: '', diasTreino: 3, selectedDays: [] });
            alert('Treino gerado com sucesso pela IA!');
         } else {
            throw new Error('Formato de resposta inválido');
         }
      } catch (error) {
         console.error('Erro ao gerar treino com IA:', error);
         alert('Erro ao gerar treino com IA. Verifique sua chave de API.');
      } finally {
         setGerandoComIA(false);
      }
   };

   const gerarDietaComIA = async () => {
      if (!iaConfig.objetivo) {
         alert('Preencha o objetivo do aluno');
         return;
      }

      setGerandoComIA(true);
      try {
         const prompt = `Você é um nutricionista expert. Crie um plano alimentar completo para a semana.

Perfil do Aluno:
- Nome: ${selectedStudent.nome}
- Objetivo: ${iaConfig.objetivo}
- Restrições Alimentares: ${iaConfig.restricoes || 'Nenhuma'}

Retorne APENAS um JSON válido no formato:
{
  "titulo": "Nome do plano",
  "objetivoCalorico": "2500 kcal",
  "segunda": [{"nome": "Café da Manhã", "horario": "07:00", "alimentos": "Lista de alimentos", "calorias": "500 kcal"}],
  "terca": [],
  "quarta": [],
  "quinta": [],
  "sexta": [],
  "sabado": [],
  "domingo": []
}

Crie refeições balanceadas (café, lanche, almoço, lanche, jantar, ceia) para cada dia. Seja específico nas quantidades e nutrientes.`;

         const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
         const result = await model.generateContent(prompt);
         const response = await result.response;
         const text = response.text();
         
         // Extrair JSON do texto
         const jsonMatch = text.match(/\{[\s\S]*\}/);
         if (jsonMatch) {
            const planoGerado = JSON.parse(jsonMatch[0]);
            setPlanoDieta(planoGerado);
            
            // Salvar no banco de dados usando a API
            const token = localStorage.getItem('fitness_token');
            if (token) {
               const dadosDieta = {
                  usuarioId: selectedStudent.id,
                  titulo: planoGerado.titulo,
                  objetivo: planoGerado.objetivoCalorico,
                  refeicoes: planoGerado,
                  observacoes: `Gerada pela IA - Objetivo: ${iaConfig.objetivo}, Nível: ${iaConfig.nivel}`,
                  origem: 'IA'
               };
               
               const dietaSalva = await salvarDieta(token, dadosDieta);
               
               if (dietaSalva) {
                  // Atualizar estado local com a dieta salva
                  const novaDieta = {
                     id: dietaSalva.id,
                     titulo: dietaSalva.dados?.titulo || planoGerado.titulo,
                     alunoId: selectedStudent.id,
                     alunoNome: selectedStudent.nome,
                     data: new Date(dietaSalva.criadoEm).toLocaleDateString('pt-BR'),
                     plano: dietaSalva.dados?.refeicoes || planoGerado,
                     tipo: 'ia'
                  };
                  setHistoricoDietas(prev => [novaDieta, ...prev]);
               }
            }
            
            setShowIAConfigModal(false);
            setIaConfig({ objetivo: '', nivel: '', restricoes: '', diasTreino: 3 });
            alert('Dieta gerada com sucesso pela IA!');
         } else {
            throw new Error('Formato de resposta inválido');
         }
      } catch (error) {
         console.error('Erro ao gerar dieta com IA:', error);
         alert('Erro ao gerar dieta com IA. Verifique sua chave de API.');
      } finally {
         setGerandoComIA(false);
      }
   };

   useEffect(() => {
      if (tab === 'dashboard') {
         carregarEstatisticas();
         carregarAlunos();
         carregarPagamentos();
         carregarProdutos();
      }
      if (tab === 'alunos') {
         carregarAlunos();
      }
      if (tab === 'financeiro' || tab === 'financial') {
         carregarPagamentos();
      }
      if (tab === 'estoque' || tab === 'stock') {
         carregarProdutos();
      }
      if (tab === 'equipe') {
         carregarFuncionarios();
      }
      if (tab === 'financial') {
         carregarDadosFinanceiros();
      }
   }, [tab]);

   return (
      <div className="space-y-10 animate-in fade-in duration-700">
         <header className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div><h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2">Administração</h1><p className="text-zinc-500 font-medium">Gestão completa da academia</p></div>

         </header>

         {tab === 'users' && <UserManagement />}

         {tab === 'equipe' && (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                  <div>
                     <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">
                        Gerenciar Equipe
                     </h2>
                     <p className="text-zinc-500 font-medium text-sm md:text-base">
                        Administre professores e nutricionistas da academia
                     </p>
                  </div>
                  <button
                     onClick={() => setShowAddFuncionario(true)}
                     className="bg-lime-400 text-black px-4 md:px-6 py-2.5 md:py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-lime-300 transition-all whitespace-nowrap"
                  >
                     <UserPlus size={16} />
                     Adicionar Funcionário
                  </button>
               </header>

               {/* Estatísticas */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-6 rounded-3xl border border-blue-500/30">
                     <Dumbbell size={32} className="text-blue-400 mb-2" />
                     <p className="text-3xl font-black">{funcionariosData.filter(f => f.funcao === 'PROFESSOR').length}</p>
                     <p className="text-sm text-zinc-400">{funcionariosData.filter(f => f.funcao === 'PROFESSOR').length === 1 ? 'Professor' : 'Professores'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 p-6 rounded-3xl border border-green-500/30">
                     <Apple size={32} className="text-green-400 mb-2" />
                     <p className="text-3xl font-black">{funcionariosData.filter(f => f.funcao === 'NUTRI').length}</p>
                     <p className="text-sm text-zinc-400">{funcionariosData.filter(f => f.funcao === 'NUTRI').length === 1 ? 'Nutricionista' : 'Nutricionistas'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-lime-500/20 to-lime-600/10 p-6 rounded-3xl border border-lime-500/30">
                     <Users size={32} className="text-lime-400 mb-2" />
                     <p className="text-3xl font-black">{funcionariosData.filter(f => f.ativo).length}</p>
                     <p className="text-sm text-zinc-400">{funcionariosData.filter(f => f.ativo).length === 1 ? 'Ativo' : 'Ativos'}</p>
                  </div>
               </div>

               {/* Lista de Funcionários */}
               {funcionariosData.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center">
                     <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Users size={40} className="text-zinc-600"/>
                     </div>
                     <h3 className="text-3xl font-black italic uppercase mb-4">Nenhum Funcionário</h3>
                     <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                        Cadastre professores e nutricionistas para começar a gerenciar sua equipe.
                     </p>
                     <button 
                        onClick={() => setShowAddFuncionario(true)}
                        className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                     >
                        Adicionar Primeiro Funcionário
                     </button>
                  </div>
               ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-x-auto">
                     <table className="w-full min-w-[800px]">
                           <thead className="bg-zinc-800/50">
                              <tr>
                                 <th className="text-left p-3 md:p-4 font-black uppercase text-[10px] md:text-xs tracking-wider">Nome</th>
                                 <th className="text-left p-3 md:p-4 font-black uppercase text-[10px] md:text-xs tracking-wider">Email</th>
                                 <th className="text-left p-3 md:p-4 font-black uppercase text-[10px] md:text-xs tracking-wider">Função</th>
                                 <th className="text-left p-3 md:p-4 font-black uppercase text-[10px] md:text-xs tracking-wider">Telefone</th>
                                 <th className="text-left p-3 md:p-4 font-black uppercase text-[10px] md:text-xs tracking-wider">Status</th>
                                 <th className="text-left p-3 md:p-4 font-black uppercase text-[10px] md:text-xs tracking-wider">Ações</th>
                              </tr>
                           </thead>
                           <tbody>
                              {funcionariosData.map((funcionario) => (
                                 <tr key={funcionario.id} className="border-t border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                    <td className="p-3 md:p-4">
                                       <div className="flex items-center gap-2 md:gap-3">
                                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-black font-black text-sm md:text-base ${
                                             funcionario.funcao === 'PROFESSOR' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-green-400 to-green-600'
                                          }`}>
                                             {funcionario.nome.charAt(0).toUpperCase()}
                                          </div>
                                          <span className="font-semibold text-sm md:text-base">{funcionario.nome}</span>
                                       </div>
                                    </td>
                                    <td className="p-3 md:p-4 text-zinc-400 text-xs md:text-sm">{funcionario.email}</td>
                                    <td className="p-3 md:p-4">
                                       <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase whitespace-nowrap ${
                                          funcionario.funcao === 'PROFESSOR' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                                       }`}>
                                          {funcionario.funcao === 'PROFESSOR' ? 'Professor' : 'Nutricionista'}
                                       </span>
                                    </td>
                                    <td className="p-3 md:p-4 text-zinc-400 text-xs md:text-sm whitespace-nowrap">{funcionario.telefone || '-'}</td>
                                    <td className="p-3 md:p-4">
                                       <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap ${
                                          funcionario.ativo ? 'bg-lime-500/20 text-lime-400' : 'bg-red-500/20 text-red-400'
                                       }`}>
                                          {funcionario.ativo ? 'ATIVO' : 'INATIVO'}
                                       </span>
                                    </td>
                                    <td className="p-3 md:p-4">
                                       <button
                                          onClick={() => aprovarFuncionario(funcionario.id, !funcionario.ativo)}
                                          className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-black uppercase text-[10px] transition-all whitespace-nowrap ${
                                             funcionario.ativo 
                                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                                                : 'bg-lime-400 text-black hover:bg-lime-300'
                                          }`}
                                       >
                                          {funcionario.ativo ? 'Desativar' : 'Ativar'}
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                  </div>
               )}

               {/* Modal Adicionar Funcionário */}
               {showAddFuncionario && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={() => setShowAddFuncionario(false)}>
                     <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-2xl w-full animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <h3 className="text-2xl font-black italic uppercase mb-1">Adicionar Funcionário</h3>
                              <p className="text-zinc-500 text-sm font-medium">Cadastre um novo professor ou nutricionista</p>
                           </div>
                           <button onClick={() => setShowAddFuncionario(false)} className="text-zinc-500 hover:text-white transition-colors">
                              <X size={24}/>
                           </button>
                        </div>
                        <form onSubmit={(e) => {
                           e.preventDefault();
                           cadastrarFuncionario();
                        }} className="space-y-4">
                           <div>
                              <label className="block text-sm font-bold mb-2 uppercase text-zinc-400">Função</label>
                              <select
                                 value={funcionarioForm.funcao}
                                 onChange={(e) => setFuncionarioForm({...funcionarioForm, funcao: e.target.value})}
                                 className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
                                 required
                              >
                                 <option value="PROFESSOR">Professor</option>
                                 <option value="NUTRI">Nutricionista</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-sm font-bold mb-2 uppercase text-zinc-400">Nome Completo</label>
                              <input
                                 type="text"
                                 value={funcionarioForm.nome}
                                 onChange={(e) => setFuncionarioForm({...funcionarioForm, nome: e.target.value})}
                                 className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
                                 placeholder="Ex: João Silva"
                                 required
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-bold mb-2 uppercase text-zinc-400">Email</label>
                              <input
                                 type="email"
                                 value={funcionarioForm.email}
                                 onChange={(e) => setFuncionarioForm({...funcionarioForm, email: e.target.value})}
                                 className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
                                 placeholder="professor@academia.com"
                                 required
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-bold mb-2 uppercase text-zinc-400">Senha</label>
                              <input
                                 type="password"
                                 value={funcionarioForm.senha}
                                 onChange={(e) => setFuncionarioForm({...funcionarioForm, senha: e.target.value})}
                                 className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
                                 placeholder="Mínimo 6 caracteres"
                                 required
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-sm font-bold mb-2 uppercase text-zinc-400">Telefone</label>
                                 <input
                                    type="text"
                                    value={funcionarioForm.telefone}
                                    onChange={(e) => setFuncionarioForm({...funcionarioForm, telefone: e.target.value})}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
                                    placeholder="(11) 98765-4321"
                                 />
                              </div>
                              <div>
                                 <label className="block text-sm font-bold mb-2 uppercase text-zinc-400">CPF</label>
                                 <input
                                    type="text"
                                    value={funcionarioForm.cpf}
                                    onChange={(e) => setFuncionarioForm({...funcionarioForm, cpf: e.target.value})}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
                                    placeholder="123.456.789-00"
                                 />
                              </div>
                           </div>
                           <div className="flex gap-3 pt-4">
                              <button
                                 type="button"
                                 onClick={() => setShowAddFuncionario(false)}
                                 className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-black uppercase text-sm hover:bg-zinc-700 transition-all"
                              >
                                 Cancelar
                              </button>
                              <button
                                 type="submit"
                                 className="flex-1 bg-lime-400 text-black py-3 rounded-xl font-black uppercase text-sm hover:bg-lime-300 transition-all"
                              >
                                 Cadastrar
                              </button>
                           </div>
                        </form>
                     </div>
                  </div>
               )}
            </div>
         )}

         {tab === 'alunos' && (
            <div className="space-y-8 animate-in fade-in duration-700">
               {!selectedStudent ? (
                  <>
                     <header className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                        <div>
                           <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">
                              Gerenciar Alunos
                           </h2>
                           <p className="text-zinc-500 font-medium text-sm md:text-base">
                              Visualize perfis, prescreva treinos e dietas, e acompanhe a evolução
                           </p>
                        </div>
                        <button
                           onClick={() => setShowAddAlunoModal(true)}
                           className="bg-lime-400 text-black px-4 md:px-6 py-2.5 md:py-3 rounded-2xl font-black uppercase text-xs md:text-sm hover:bg-lime-300 transition-all flex items-center gap-2 shadow-lg shadow-lime-400/20 whitespace-nowrap"
                        >
                           <UserPlus size={20} />
                           Cadastrar Aluno
                        </button>
                     </header>

                     {alunos.length === 0 ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
                           <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                           <h3 className="text-xl font-black text-zinc-400 mb-2">Nenhum aluno encontrado</h3>
                           <p className="text-zinc-500">Aguarde enquanto carregamos os dados...</p>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                           {alunos.map((aluno) => (
                              <div 
                                 key={aluno.id}
                                 className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-lime-400/30 transition-all cursor-pointer group"
                                 onClick={() => setSelectedStudent(aluno)}
                              >
                                 <div className="flex items-center gap-4 mb-6">
                                    {aluno.imagemPerfil ? (
                                       <img 
                                          src={aluno.imagemPerfil} 
                                          alt={aluno.nome}
                                          className="w-16 h-16 rounded-full object-cover border-2 border-lime-400/30"
                                       />
                                    ) : (
                                       <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-black font-black text-2xl">
                                          {aluno.nome.charAt(0).toUpperCase()}
                                       </div>
                                    )}
                                    <div className="flex-1">
                                       <h3 className="font-black text-lg group-hover:text-lime-400 transition-colors">
                                          {aluno.nome}
                                       </h3>
                                       <p className="text-sm text-zinc-400">{aluno.email}</p>
                                    </div>
                                    <ChevronRight className="text-zinc-600 group-hover:text-lime-400 transition-colors" size={24} />
                                 </div>

                                 <div className="grid grid-cols-2 gap-3">
                                    <button
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          prescrever(aluno, 'treino');
                                       }}
                                       className="bg-blue-500/20 text-blue-400 py-2 rounded-xl text-xs font-black uppercase hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
                                    >
                                       <Dumbbell size={14} />
                                       Treino
                                    </button>
                                    <button
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          prescrever(aluno, 'dieta');
                                       }}
                                       className="bg-green-500/20 text-green-400 py-2 rounded-xl text-xs font-black uppercase hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                                    >
                                       <Apple size={14} />
                                       Dieta
                                    </button>
                                 </div>

                                 <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
                                    <span className={`px-3 py-1 rounded-full font-bold ${
                                       aluno.ativo ? 'bg-lime-500/20 text-lime-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                       {aluno.ativo ? 'ATIVO' : 'INATIVO'}
                                    </span>
                                    <span className="text-zinc-500">
                                       Desde {new Date(aluno.criadoEm).toLocaleDateString('pt-BR')}
                                    </span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </>
               ) : (
                  <>
                     {/* Perfil Detalhado do Aluno */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-4">
                           <button
                              onClick={() => setSelectedStudent(null)}
                              className="size-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center hover:border-lime-400 transition-colors"
                           >
                              <ChevronLeft size={24} />
                           </button>
                           <div className="flex-1">
                              <h2 className="text-4xl font-black italic uppercase tracking-tighter">
                                 {selectedStudent.nome}
                              </h2>
                              <p className="text-zinc-500 font-medium">{selectedStudent.email}</p>
                           </div>
                        </div>

                        {/* Tabs de Informações */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                           {/* Card: Informações Pessoais */}
                           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                              <h3 className="text-xl font-black italic uppercase mb-4 flex items-center gap-2">
                                 <User size={20} className="text-lime-400" />
                                 Dados Pessoais
                              </h3>
                              
                              {/* Foto do Aluno */}
                              <div className="mb-6 flex flex-col items-center">
                                 <div className="relative group">
                                    {selectedStudent.imagemPerfil ? (
                                       <img 
                                          src={selectedStudent.imagemPerfil} 
                                          alt={selectedStudent.nome}
                                          className="size-32 rounded-2xl object-cover border-2 border-lime-400/30"
                                       />
                                    ) : (
                                       <div className="size-32 rounded-2xl bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center border-2 border-lime-400/30">
                                          <span className="text-5xl font-black text-black">
                                             {selectedStudent.nome.charAt(0).toUpperCase()}
                                          </span>
                                       </div>
                                    )}
                                    <label 
                                       htmlFor="upload-foto-aluno"
                                       className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                       <Camera className="text-white" size={24} />
                                    </label>
                                    <input 
                                       id="upload-foto-aluno"
                                       type="file"
                                       accept="image/*"
                                       className="hidden"
                                       onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                             // Validar tamanho (máx 5MB)
                                             if (file.size > 5 * 1024 * 1024) {
                                                alert('Imagem muito grande! Máximo 5MB');
                                                return;
                                             }
                                             
                                             // Converter para base64
                                             const reader = new FileReader();
                                             reader.onloadend = async () => {
                                                try {
                                                   const base64 = reader.result as string;
                                                   const token = localStorage.getItem('fitness_token');
                                                   
                                                   const response = await fetch('/api/usuarios/foto', {
                                                      method: 'POST',
                                                      headers: { 
                                                         'Authorization': `Bearer ${token}`,
                                                         'Content-Type': 'application/json'
                                                      },
                                                      body: JSON.stringify({
                                                         usuarioId: selectedStudent.id,
                                                         foto: base64
                                                      })
                                                   });
                                                   
                                                   if (response.ok) {
                                                      const data = await response.json();
                                                      setSelectedStudent({ ...selectedStudent, imagemPerfil: data.imagemPerfil });
                                                      await carregarAlunos();
                                                      alert('Foto atualizada com sucesso!');
                                                   } else {
                                                      alert('Erro ao fazer upload da foto');
                                                   }
                                                } catch (error) {
                                                   console.error('Erro no upload:', error);
                                                   alert('Erro ao fazer upload da foto');
                                                }
                                             };
                                             reader.readAsDataURL(file);
                                          }
                                       }}
                                    />
                                 </div>
                                 <p className="text-xs text-zinc-500 mt-2 text-center">Clique na foto para alterar</p>
                              </div>

                              <div className="space-y-3">
                                 <div>
                                    <p className="text-xs text-zinc-500 font-bold uppercase">Email</p>
                                    <p className="text-sm font-semibold">{selectedStudent.email}</p>
                                 </div>
                                 {selectedStudent.telefone && (
                                    <div>
                                       <p className="text-xs text-zinc-500 font-bold uppercase">Telefone</p>
                                       <p className="text-sm font-semibold">{selectedStudent.telefone}</p>
                                    </div>
                                 )}
                                 {selectedStudent.cpf && (
                                    <div>
                                       <p className="text-xs text-zinc-500 font-bold uppercase">CPF</p>
                                       <p className="text-sm font-semibold">{selectedStudent.cpf}</p>
                                    </div>
                                 )}
                                 <div>
                                    <p className="text-xs text-zinc-500 font-bold uppercase">Status</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                                       selectedStudent.ativo ? 'bg-lime-500/20 text-lime-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                       {selectedStudent.ativo ? 'ATIVO' : 'INATIVO'}
                                    </span>
                                 </div>
                                 <div>
                                    <p className="text-xs text-zinc-500 font-bold uppercase">Cadastro</p>
                                    <p className="text-sm font-semibold">
                                       {new Date(selectedStudent.criadoEm).toLocaleDateString('pt-BR')}
                                    </p>
                                 </div>
                              </div>
                           </div>

                           {/* Card: Ações Rápidas */}
                           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                              <h3 className="text-xl font-black italic uppercase mb-4 flex items-center gap-2">
                                 <Zap size={20} className="text-lime-400" />
                                 Ações Rápidas
                              </h3>
                              <div className="space-y-3">
                                 <button
                                    onClick={() => prescrever(selectedStudent, 'treino')}
                                    className="w-full bg-blue-500/20 text-blue-400 py-3 rounded-xl text-sm font-black uppercase hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
                                 >
                                    <Dumbbell size={16} />
                                    Prescrever Treino
                                 </button>
                                 <button
                                    onClick={() => prescrever(selectedStudent, 'dieta')}
                                    className="w-full bg-green-500/20 text-green-400 py-3 rounded-xl text-sm font-black uppercase hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                                 >
                                    <Apple size={16} />
                                    Prescrever Dieta
                                 </button>
                                 <button
                                    onClick={carregarEvolucaoAluno}
                                    className="w-full bg-purple-500/20 text-purple-400 py-3 rounded-xl text-sm font-black uppercase hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2"
                                 >
                                    <TrendingUp size={16} />
                                    Ver Evolução
                                 </button>
                                 <button
                                    onClick={carregarFotosProgressoAluno}
                                    className="w-full bg-orange-500/20 text-orange-400 py-3 rounded-xl text-sm font-black uppercase hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-2"
                                 >
                                    <Camera size={16} />
                                    Fotos de Progresso
                                 </button>
                              </div>
                           </div>

                           {/* Card: Estatísticas */}
                           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                              <h3 className="text-xl font-black italic uppercase mb-4 flex items-center gap-2">
                                 <BarChart3 size={20} className="text-lime-400" />
                                 Estatísticas
                              </h3>
                              <div className="space-y-4">
                                 <div>
                                    <div className="flex justify-between items-baseline mb-1">
                                       <p className="text-xs text-zinc-500 font-bold uppercase">Treinos</p>
                                       <p className="text-2xl font-black text-lime-400">{calcularEstatisticas().totalTreinos}</p>
                                    </div>
                                    <p className="text-[10px] text-zinc-600">Último mês</p>
                                 </div>
                                 <div>
                                    <div className="flex justify-between items-baseline mb-1">
                                       <p className="text-xs text-zinc-500 font-bold uppercase">Frequência</p>
                                       <p className="text-2xl font-black text-blue-400">{calcularEstatisticas().frequencia}</p>
                                    </div>
                                    <p className="text-[10px] text-zinc-600">Treinos por semana</p>
                                 </div>
                                 <div>
                                    <div className="flex justify-between items-baseline mb-1">
                                       <p className="text-xs text-zinc-500 font-bold uppercase">Evolução Peso</p>
                                       <p className={`text-2xl font-black ${
                                          calcularEstatisticas().evolucaoPeso.startsWith('+') ? 'text-orange-400' : 
                                          calcularEstatisticas().evolucaoPeso.startsWith('-') ? 'text-green-400' : 'text-zinc-400'
                                       }`}>
                                          {calcularEstatisticas().evolucaoPeso}
                                       </p>
                                    </div>
                                    <p className="text-[10px] text-zinc-600">
                                       {medicoesAluno.length >= 2 ? 'Desde primeira medição' : 'Sem dados ainda'}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Histórico com Abas: Treinos / Dietas */}
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
                           {/* Abas */}
                           <div className="flex items-center gap-4 mb-8">
                              <button
                                 onClick={() => setHistoricoAbaAtiva('treinos')}
                                 className={`flex items-center gap-3 px-6 py-4 rounded-xl font-black uppercase text-sm transition-all ${
                                    historicoAbaAtiva === 'treinos'
                                       ? 'bg-gradient-to-br from-lime-400 to-lime-500 text-black shadow-lg shadow-lime-400/20'
                                       : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                                 }`}
                              >
                                 <Dumbbell className="w-5 h-5" />
                                 <span>Treinos ({historicoTreinos.filter(t => t.alunoId === selectedStudent?.id).length})</span>
                              </button>
                              <button
                                 onClick={() => setHistoricoAbaAtiva('dietas')}
                                 className={`flex items-center gap-3 px-6 py-4 rounded-xl font-black uppercase text-sm transition-all ${
                                    historicoAbaAtiva === 'dietas'
                                       ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-black shadow-lg shadow-orange-400/20'
                                       : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                                 }`}
                              >
                                 <Apple className="w-5 h-5" />
                                 <span>Dietas ({historicoDietas.filter(d => d.alunoId === selectedStudent?.id).length})</span>
                              </button>
                           </div>

                           {/* Conteúdo baseado na aba ativa */}
                           {historicoAbaAtiva === 'treinos' ? (
                              <>
                                 <div className="flex items-center justify-between mb-6">
                                    <div>
                                       <h3 className="text-2xl font-black italic uppercase tracking-tight">Histórico de Treinos</h3>
                                       <p className="text-sm text-zinc-500 font-bold">
                                          {historicoTreinos.filter(t => t.alunoId === selectedStudent?.id).length} treino(s) prescrito(s)
                                       </p>
                                    </div>
                                    <button
                                       onClick={() => prescrever(selectedStudent, 'treino')}
                                       className="bg-lime-400 hover:bg-lime-500 text-black px-6 py-3 rounded-xl font-black uppercase text-sm transition-all flex items-center gap-2 shadow-lg shadow-lime-400/20 hover:scale-105"
                                    >
                                       <Plus size={18} />
                                       Novo Treino
                                    </button>
                                 </div>
                           
                                 {historicoTreinos.filter(t => t.alunoId === selectedStudent?.id).length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-800">
                                 <div className="bg-zinc-800/50 p-6 rounded-full mb-6">
                                    <Dumbbell className="w-16 h-16 text-zinc-600" />
                                 </div>
                                 <h4 className="text-xl font-black text-zinc-400 mb-2">Nenhum treino prescrito ainda</h4>
                                 <p className="text-sm text-zinc-500 max-w-md mb-6">
                                    Comece a jornada deste aluno criando o primeiro plano de treino personalizado.
                                 </p>
                                 <button
                                    onClick={() => prescrever(selectedStudent, 'treino')}
                                    className="bg-lime-400 hover:bg-lime-500 text-black px-8 py-4 rounded-xl font-black uppercase transition-all flex items-center gap-2 shadow-xl shadow-lime-400/20 hover:scale-105"
                                 >
                                    <Plus size={20} />
                                    Prescrever Primeiro Treino
                                 </button>
                              </div>
                           ) : (
                              <div className="space-y-6">
                                 {historicoTreinos
                                    .filter(t => t.alunoId === selectedStudent?.id)
                                    .map((treino) => {
                                       return (
                                          <div key={treino.id} className="bg-zinc-900/50 border-2 border-zinc-800 rounded-2xl overflow-hidden hover:border-lime-400/30 transition-all">
                                             {/* Header */}
                                             <div className="bg-gradient-to-r from-lime-400/10 to-lime-500/10 border-b border-zinc-800 p-6">
                                                <div className="flex justify-between items-start">
                                                   <div>
                                                      <div className="flex items-center gap-3 mb-2">
                                                         <h4 className="font-black italic uppercase text-2xl text-lime-400">
                                                            {treino.titulo}
                                                         </h4>
                                                         <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            treino.tipo === 'ia' 
                                                               ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                                                               : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                                         }`}>
                                                            {treino.tipo === 'ia' ? '✨ IA' : '✋ Manual'}
                                                         </span>
                                                      </div>
                                                      <p className="text-sm text-zinc-500">
                                                         Criado em {treino.data}
                                                      </p>
                                                   </div>
                                                   <div className="flex items-center gap-2">
                                                      <button
                                                         onClick={() => abrirModalEdicaoTreino(treino)}
                                                         className="bg-blue-500 hover:bg-blue-600 p-3 rounded-xl transition-all hover:scale-105"
                                                         title="Editar Treino"
                                                      >
                                                         <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                         </svg>
                                                      </button>
                                                      <button
                                                         onClick={async () => {
                                                            if (confirm('Tem certeza que deseja remover este treino?')) {
                                                               const token = localStorage.getItem('fitness_token');
                                                               if (token) {
                                                                  const sucesso = await removerTreino(token, treino.id);
                                                                  if (sucesso) {
                                                                     setHistoricoTreinos(prev => prev.filter(t => t.id !== treino.id));
                                                                     alert('Treino removido com sucesso!');
                                                                  } else {
                                                                     alert('Erro ao remover treino. Tente novamente.');
                                                                  }
                                                               }
                                                            }
                                                         }}
                                                         className="bg-red-500 hover:bg-red-600 p-3 rounded-xl transition-all hover:scale-105"
                                                         title="Remover Treino"
                                                      >
                                                         <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                         </svg>
                                                      </button>
                                                   </div>
                                                </div>
                                             </div>

                                             {/* Dias da Semana com Exercícios */}
                                             <div className="p-6 space-y-4">
                                                {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].map((dia) => {
                                                   const exercicios = treino.plano[dia] || [];
                                                   const diasNomes = {
                                                      segunda: 'Segunda-feira',
                                                      terca: 'Terça-feira',
                                                      quarta: 'Quarta-feira',
                                                      quinta: 'Quinta-feira',
                                                      sexta: 'Sexta-feira',
                                                      sabado: 'Sábado',
                                                      domingo: 'Domingo'
                                                   };

                                                   if (exercicios.length === 0) return null;

                                                   return (
                                                      <div key={dia} className="bg-zinc-950/50 rounded-xl p-5 border border-zinc-800">
                                                         <div className="flex items-center gap-3 mb-4">
                                                            <div className="bg-lime-400 p-2 rounded-lg">
                                                               <Dumbbell className="w-4 h-4 text-black" />
                                                            </div>
                                                            <h5 className="font-black uppercase text-lg text-white">
                                                               {diasNomes[dia]}
                                                            </h5>
                                                            <span className="ml-auto text-xs text-zinc-500 font-bold">
                                                               {exercicios.length} exercício{exercicios.length !== 1 ? 's' : ''}
                                                            </span>
                                                         </div>
                                                         
                                                         <div className="space-y-3">
                                                            {exercicios.map((ex: any, idx: number) => (
                                                               <div key={idx} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 hover:border-lime-400/30 transition-all">
                                                                  <div className="flex items-start gap-3">
                                                                     <div className="bg-lime-400/10 text-lime-400 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0">
                                                                        {idx + 1}
                                                                     </div>
                                                                     <div className="flex-1">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                           <h6 className="font-bold text-white">
                                                                              {ex.nome || ex.exercicio || ex.n || 'Exercício'}
                                                                           </h6>
                                                                           {ex.videoUrl && (
                                                                              <a
                                                                                 href={ex.videoUrl}
                                                                                 target="_blank"
                                                                                 rel="noopener noreferrer"
                                                                                 className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-xs font-bold text-red-400 transition-colors"
                                                                              >
                                                                                 <PlayCircle size={14} />
                                                                                 Vídeo
                                                                              </a>
                                                                           )}
                                                                        </div>
                                                                        <div className="grid grid-cols-3 gap-3 text-xs">
                                                                           {ex.series && (
                                                                              <div className="bg-zinc-800/50 px-3 py-2 rounded">
                                                                                 <p className="text-zinc-500 mb-1">Séries</p>
                                                                                 <p className="text-lime-400 font-bold">{ex.series}</p>
                                                                              </div>
                                                                           )}
                                                                           {ex.repeticoes && (
                                                                              <div className="bg-zinc-800/50 px-3 py-2 rounded">
                                                                                 <p className="text-zinc-500 mb-1">Reps</p>
                                                                                 <p className="text-lime-400 font-bold">{ex.repeticoes}</p>
                                                                              </div>
                                                                           )}
                                                                           {ex.descanso && (
                                                                              <div className="bg-zinc-800/50 px-3 py-2 rounded">
                                                                                 <p className="text-zinc-500 mb-1">Descanso</p>
                                                                                 <p className="text-lime-400 font-bold">{ex.descanso}</p>
                                                                              </div>
                                                                           )}
                                                                        </div>
                                                                        {ex.observacoes && (
                                                                           <p className="text-xs text-zinc-400 mt-2 italic">
                                                                              💡 {ex.observacoes}
                                                                           </p>
                                                                        )}
                                                                     </div>
                                                                  </div>
                                                               </div>
                                                            ))}
                                                         </div>
                                                      </div>
                                                   );
                                                })}
                                             </div>
                                          </div>
                                       );
                                    })
                                 }
                              </div>
                           )}
                              </>
                           ) : (
                              <>
                                 <div className="flex items-center justify-between mb-6">
                                    <div>
                                       <h3 className="text-2xl font-black italic uppercase tracking-tight">Histórico de Dietas</h3>
                                       <p className="text-sm text-zinc-500 font-bold">
                                          {historicoDietas.filter(d => d.alunoId === selectedStudent?.id).length} dieta(s) prescrita(s)
                                       </p>
                                    </div>
                                    <button
                                       onClick={() => prescrever(selectedStudent, 'dieta')}
                                       className="bg-orange-400 hover:bg-orange-500 text-black px-6 py-3 rounded-xl font-black uppercase text-sm transition-all flex items-center gap-2 shadow-lg shadow-orange-400/20 hover:scale-105"
                                    >
                                       <Plus size={18} />
                                       Nova Dieta
                                    </button>
                                 </div>
                           
                                 {historicoDietas.filter(d => d.alunoId === selectedStudent?.id).length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-800">
                                 <div className="bg-zinc-800/50 p-6 rounded-full mb-6">
                                    <Apple className="w-16 h-16 text-zinc-600" />
                                 </div>
                                 <h4 className="text-xl font-black text-zinc-400 mb-2">Nenhuma dieta prescrita ainda</h4>
                                 <p className="text-sm text-zinc-500 max-w-md mb-6">
                                    Comece o acompanhamento nutricional criando o primeiro plano alimentar personalizado.
                                 </p>
                                 <button
                                    onClick={() => prescrever(selectedStudent, 'dieta')}
                                    className="bg-orange-400 hover:bg-orange-500 text-black px-8 py-4 rounded-xl font-black uppercase transition-all flex items-center gap-2 shadow-xl shadow-orange-400/20 hover:scale-105"
                                 >
                                    <Plus size={20} />
                                    Prescrever Primeira Dieta
                                 </button>
                              </div>
                           ) : (
                              <div className="space-y-6">
                                 {historicoDietas
                                    .filter(d => d.alunoId === selectedStudent?.id)
                                    .map((dieta) => {
                                       const plano = dieta.plano || {};
                                       
                                       return (
                                          <div key={dieta.id} className="bg-zinc-900/50 border-2 border-zinc-800 rounded-2xl overflow-hidden hover:border-orange-400/30 transition-all">
                                             {/* Header */}
                                             <div className="bg-gradient-to-r from-orange-400/10 to-orange-500/10 border-b border-zinc-800 p-6">
                                                <div className="flex justify-between items-start">
                                                   <div>
                                                      <div className="flex items-center gap-3 mb-2">
                                                         <h4 className="font-black italic uppercase text-2xl text-orange-400">
                                                            {dieta.titulo}
                                                         </h4>
                                                         <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            dieta.tipo === 'ia' 
                                                               ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                                                               : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                                                         }`}>
                                                            {dieta.tipo === 'ia' ? '✨ IA' : '✋ Manual'}
                                                         </span>
                                                      </div>
                                                      <p className="text-sm text-zinc-500">
                                                         Criada em {dieta.data}
                                                      </p>
                                                   </div>
                                                   <div className="flex items-center gap-2">
                                                      <button
                                                         onClick={() => abrirModalEdicaoDieta(dieta)}
                                                         className="bg-orange-500 hover:bg-orange-600 p-3 rounded-xl transition-all hover:scale-105"
                                                         title="Editar Dieta"
                                                      >
                                                         <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                         </svg>
                                                      </button>
                                                      <button
                                                         onClick={async () => {
                                                            if (confirm('Tem certeza que deseja remover esta dieta?')) {
                                                               const token = localStorage.getItem('fitness_token');
                                                               if (token) {
                                                                  const sucesso = await removerDieta(token, dieta.id);
                                                                  if (sucesso) {
                                                                     setHistoricoDietas(prev => prev.filter(d => d.id !== dieta.id));
                                                                     alert('Dieta removida com sucesso!');
                                                                  } else {
                                                                     alert('Erro ao remover dieta. Tente novamente.');
                                                                  }
                                                               }
                                                            }
                                                         }}
                                                         className="bg-red-500 hover:bg-red-600 p-3 rounded-xl transition-all hover:scale-105"
                                                         title="Remover Dieta"
                                                      >
                                                         <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                         </svg>
                                                      </button>
                                                   </div>
                                                </div>
                                             </div>

                                             {/* Dias da Semana com Refeições */}
                                             <div className="p-6 space-y-4">
                                                {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].map((dia) => {
                                                   const refeicoes = plano[dia] || [];
                                                   const diasNomes = {
                                                      segunda: 'Segunda-feira',
                                                      terca: 'Terça-feira',
                                                      quarta: 'Quarta-feira',
                                                      quinta: 'Quinta-feira',
                                                      sexta: 'Sexta-feira',
                                                      sabado: 'Sábado',
                                                      domingo: 'Domingo'
                                                   };

                                                   if (refeicoes.length === 0) return null;

                                                   return (
                                                      <div key={dia} className="bg-zinc-950/50 rounded-xl p-5 border border-zinc-800">
                                                         <div className="flex items-center gap-3 mb-4">
                                                            <div className="bg-orange-400 p-2 rounded-lg">
                                                               <Apple className="w-4 h-4 text-black" />
                                                            </div>
                                                            <h5 className="font-black uppercase text-lg text-white">
                                                               {diasNomes[dia]}
                                                            </h5>
                                                            <span className="ml-auto text-xs text-zinc-500 font-bold">
                                                               {refeicoes.length} refeição{refeicoes.length !== 1 ? 'ões' : ''}
                                                            </span>
                                                         </div>
                                                         
                                                         <div className="space-y-3">
                                                            {refeicoes.map((ref: any, idx: number) => (
                                                               <div key={idx} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 hover:border-orange-400/30 transition-all">
                                                                  <div className="flex items-start gap-3">
                                                                     <div className="bg-orange-400/10 text-orange-400 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0">
                                                                        {idx + 1}
                                                                     </div>
                                                                     <div className="flex-1">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                           <h6 className="font-bold text-white">
                                                                              {ref.nome || 'Refeição'}
                                                                           </h6>
                                                                           {ref.horario && (
                                                                              <span className="text-xs text-zinc-400 font-bold">
                                                                                 🕐 {ref.horario}
                                                                              </span>
                                                                           )}
                                                                        </div>
                                                                        {ref.alimentos && (
                                                                           <p className="text-sm text-zinc-300 mb-2">
                                                                              {ref.alimentos}
                                                                           </p>
                                                                        )}
                                                                        {ref.calorias && (
                                                                           <div className="bg-zinc-800/50 px-3 py-2 rounded inline-block">
                                                                              <span className="text-xs text-zinc-500">Calorias: </span>
                                                                              <span className="text-orange-400 font-bold text-sm">{ref.calorias}</span>
                                                                           </div>
                                                                        )}
                                                                     </div>
                                                                  </div>
                                                               </div>
                                                            ))}
                                                         </div>
                                                      </div>
                                                   );
                                                })}
                                             </div>
                                          </div>
                                       );
                                    })
                                 }
                              </div>
                           )}
                              </>
                           )}
                        </div>
                     </div>
                  </>
               )}
            </div>
         )}

         {/* Modal de Prescrição */}
         {showPrescriptionModal && selectedStudent && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                     <div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                           {prescriptionType === 'treino' ? '💪 Prescrever Treino' : '🥗 Prescrever Dieta'}
                        </h2>
                        <p className="text-zinc-500 mt-1">Para: {selectedStudent.nome}</p>
                     </div>
                     <div className="flex gap-3">
                        <button
                           onClick={() => setShowIAConfigModal(true)}
                           className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-black uppercase hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
                        >
                           <Sparkles size={20} />
                           Gerar com IA
                        </button>
                        <button
                           onClick={() => {
                              setShowPrescriptionModal(false);
                              setPrescriptionType(null);
                              setSelectedDay('segunda');
                              setPlanoTreino({ titulo: '', segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: [] });
                              setPlanoDieta({ titulo: '', objetivoCalorico: '', segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: [] });
                           }}
                           className="size-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-colors"
                        >
                           <X size={20} />
                        </button>
                     </div>
                  </div>

                  {prescriptionType === 'treino' ? (
                     <div className="space-y-6">
                        {/* Título do Plano */}
                        <div>
                           <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                              Nome do Plano de Treino *
                           </label>
                           <input
                              type="text"
                              placeholder="Ex: Hipertrofia - ABC"
                              value={planoTreino.titulo}
                              onChange={(e) => setPlanoTreino({ ...planoTreino, titulo: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-lime-400"
                           />
                        </div>

                        {/* Seletor de Dias */}
                        <div>
                           <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                              Dias da Semana (Clique para selecionar múltiplos)
                           </label>
                           <p className="text-xs text-zinc-500 mb-3">Dia atual para editar: <span className="text-lime-400 font-bold">{selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}</span></p>
                           <div className="grid grid-cols-7 gap-2">
                              {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].map((dia) => (
                                 <button
                                    key={dia}
                                    onClick={() => {
                                       setSelectedDay(dia);
                                       setSelectedDays(prev => {
                                          if (prev.includes(dia)) {
                                             return prev.filter(d => d !== dia);
                                          } else {
                                             return [...prev, dia];
                                          }
                                       });
                                    }}
                                    className={`py-3 rounded-xl font-black text-xs uppercase transition-all relative ${
                                       selectedDays.includes(dia)
                                          ? 'bg-lime-400 text-black'
                                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    } ${
                                       selectedDay === dia
                                          ? 'ring-2 ring-lime-400 ring-offset-2 ring-offset-zinc-900'
                                          : ''
                                    }`}
                                 >
                                    {dia.substring(0, 3)}
                                    {selectedDays.includes(dia) && (
                                       <span className="absolute -top-1 -right-1 bg-lime-400 text-black rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span>
                                    )}
                                 </button>
                              ))}
                           </div>
                           {selectedDays.length > 1 && (
                              <div className="mt-3 p-3 bg-lime-400/10 border border-lime-400/30 rounded-xl">
                                 <p className="text-xs text-lime-400 font-bold">
                                    ⚡ {selectedDays.length} dias selecionados: {selectedDays.map(d => d.substring(0, 3).toUpperCase()).join(', ')}
                                 </p>
                              </div>
                           )}
                        </div>

                        {/* Lista de Exercícios do Dia Selecionado */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                           <div className="flex justify-between items-center mb-4">
                              <h3 className="font-black uppercase text-lime-400">
                                 Exercícios - {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}
                              </h3>
                              <button
                                 onClick={() => {
                                    const novoExercicio = {
                                       nome: '',
                                       series: '',
                                       repeticoes: '',
                                       carga: '',
                                       descanso: '90s',
                                       videoUrl: ''
                                    };
                                    setPlanoTreino({
                                       ...planoTreino,
                                       [selectedDay]: [...planoTreino[selectedDay], novoExercicio]
                                    });
                                 }}
                                 className="bg-lime-400 text-black px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-lime-300 transition-colors flex items-center gap-2"
                              >
                                 <Plus size={16} />
                                 Adicionar
                              </button>
                           </div>

                           {planoTreino[selectedDay].length === 0 ? (
                              <div className="text-center py-8 text-zinc-600">
                                 <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                 <p className="text-sm">Nenhum exercício para este dia</p>
                              </div>
                           ) : (
                              <div className="space-y-3">
                                 {planoTreino[selectedDay].map((ex: any, idx: number) => (
                                    <div key={idx} className="bg-zinc-900 p-4 rounded-xl space-y-3">
                                       <div className="flex justify-between items-start gap-4">
                                          <div className="flex-1 space-y-3">
                                             <input
                                                type="text"
                                                placeholder="Nome do exercício (ex: Supino Reto)"
                                                value={ex.nome}
                                                onChange={(e) => {
                                                   const updated = [...planoTreino[selectedDay]];
                                                   updated[idx].nome = e.target.value;
                                                   setPlanoTreino({ ...planoTreino, [selectedDay]: updated });
                                                }}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-lime-400"
                                             />
                                             <div className="flex items-center gap-2">
                                                <PlayCircle size={16} className="text-zinc-500" />
                                                <input
                                                   type="text"
                                                   placeholder="URL do vídeo (YouTube, etc)"
                                                   value={ex.videoUrl || ''}
                                                   onChange={(e) => {
                                                      const updated = [...planoTreino[selectedDay]];
                                                      updated[idx].videoUrl = e.target.value;
                                                      setPlanoTreino({ ...planoTreino, [selectedDay]: updated });
                                                   }}
                                                   className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:border-lime-400"
                                                />
                                             </div>
                                          </div>
                                          <button
                                             onClick={() => {
                                                const updated = planoTreino[selectedDay].filter((_: any, i: number) => i !== idx);
                                                setPlanoTreino({ ...planoTreino, [selectedDay]: updated });
                                             }}
                                             className="text-red-400 hover:text-red-300 transition-colors"
                                          >
                                             <Trash2 size={18} />
                                          </button>
                                       </div>
                                       <div className="grid grid-cols-4 gap-3">
                                          <input
                                             type="text"
                                             placeholder="Séries"
                                             value={ex.series}
                                             onChange={(e) => {
                                                const updated = [...planoTreino[selectedDay]];
                                                updated[idx].series = e.target.value;
                                                setPlanoTreino({ ...planoTreino, [selectedDay]: updated });
                                             }}
                                             className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-lime-400"
                                          />
                                          <input
                                             type="text"
                                             placeholder="Reps"
                                             value={ex.repeticoes}
                                             onChange={(e) => {
                                                const updated = [...planoTreino[selectedDay]];
                                                updated[idx].repeticoes = e.target.value;
                                                setPlanoTreino({ ...planoTreino, [selectedDay]: updated });
                                             }}
                                             className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-lime-400"
                                          />
                                          <input
                                             type="text"
                                             placeholder="Carga"
                                             value={ex.carga}
                                             onChange={(e) => {
                                                const updated = [...planoTreino[selectedDay]];
                                                updated[idx].carga = e.target.value;
                                                setPlanoTreino({ ...planoTreino, [selectedDay]: updated });
                                             }}
                                             className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-lime-400"
                                          />
                                          <input
                                             type="text"
                                             placeholder="Descanso (ex: 90s)"
                                             value={ex.descanso}
                                             onChange={(e) => {
                                                const updated = [...planoTreino[selectedDay]];
                                                updated[idx].descanso = e.target.value;
                                                setPlanoTreino({ ...planoTreino, [selectedDay]: updated });
                                             }}
                                             className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-lime-400"
                                          />
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>

                        {/* Resumo Semanal */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                           <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-zinc-500">Resumo Semanal</h4>
                           <div className="grid grid-cols-7 gap-2">
                              {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].map((dia) => (
                                 <div key={dia} className="text-center">
                                    <div className="text-[10px] uppercase font-bold text-zinc-600 mb-1">
                                       {dia.substring(0, 3)}
                                    </div>
                                    <div className={`text-lg font-black ${planoTreino[dia].length > 0 ? 'text-lime-400' : 'text-zinc-700'}`}>
                                       {planoTreino[dia].length}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <button
                           onClick={async () => {
                              console.log('🎯 ===== INICIANDO SALVAMENTO DO TREINO =====');
                              console.log('👤 Aluno selecionado:', selectedStudent);
                              console.log('📋 Estado COMPLETO do planoTreino:', JSON.stringify(planoTreino, null, 2));
                              console.log('📋 planoTreino.titulo:', planoTreino.titulo);
                              console.log('📋 Tipo do titulo:', typeof planoTreino.titulo);
                              console.log('📋 Titulo está vazio?', planoTreino.titulo === '');
                              console.log('📋 Titulo após trim:', planoTreino.titulo?.trim());
                              
                              // Copiar exercícios do dia atual para todos os dias selecionados
                              const planoAtualizado = { ...planoTreino };
                              selectedDays.forEach(dia => {
                                 if (dia !== selectedDay && planoTreino[selectedDay].length > 0) {
                                    planoAtualizado[dia] = [...planoTreino[selectedDay]];
                                 }
                              });
                              
                              console.log('📋 Plano atualizado:', planoAtualizado);
                              
                              try {
                                 // Salvar no banco de dados usando a API
                                 const token = localStorage.getItem('fitness_token');
                                 console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');
                                 
                                 if (!token) {
                                    alert('Erro: Token de autenticação não encontrado. Faça login novamente.');
                                    return;
                                 }
                                 
                                 if (!selectedStudent || !selectedStudent.id) {
                                    alert('Erro: Aluno não selecionado corretamente.');
                                    return;
                                 }
                                 
                                 // Validação extra do titulo
                                 const tituloTreino = planoTreino?.titulo?.trim() || '';
                                 console.log('🔍 Validando titulo:', { 
                                    original: planoTreino.titulo, 
                                    trimmed: tituloTreino,
                                    isEmpty: tituloTreino === ''
                                 });
                                 
                                 if (!tituloTreino || tituloTreino === '') {
                                    alert('Erro: Preencha o nome do plano de treino antes de salvar.');
                                    console.error('❌ Tentativa de salvar sem titulo');
                                    return;
                                 }
                                 
                                 const dadosTreino = {
                                    usuarioId: selectedStudent.id,
                                    titulo: tituloTreino,
                                    tipoTreino: 'Treino Personalizado Manual',
                                    duracao: 60,
                                    exercicios: planoAtualizado,
                                    observacoes: `Treino prescrito manualmente pelo instrutor`,
                                    origem: 'Manual'
                                 };
                                 
                                 console.log('📤 Enviando dados do treino:', {
                                    ...dadosTreino,
                                    exercicios: 'Ver abaixo'
                                 });
                                 console.log('📤 Exercícios:', dadosTreino.exercicios);
                                 
                                 const treinoSalvo = await salvarTreino(token, dadosTreino);
                                 
                                 if (treinoSalvo) {
                                    console.log('✅ Treino salvo com sucesso:', treinoSalvo);
                                    // Atualizar estado local com o treino salvo
                                    const novoTreino = {
                                       id: treinoSalvo.id,
                                       titulo: treinoSalvo.tituloTreino || treinoSalvo.titulo,
                                       alunoId: selectedStudent.id,
                                       alunoNome: selectedStudent.nome,
                                       data: new Date(treinoSalvo.data).toLocaleDateString('pt-BR'),
                                       plano: treinoSalvo.exercicios || planoAtualizado,
                                       tipo: 'manual'
                                    };
                                    setHistoricoTreinos(prev => [novoTreino, ...prev]);
                                    console.log('✅ Treino salvo no banco:', treinoSalvo);
                                    alert('Treino prescrito e salvo com sucesso!');
                                 } else {
                                    throw new Error('Erro ao salvar treino');
                                 }
                              } catch (error) {
                                 console.error('❌ Erro ao salvar treino:', error);
                                 alert('Erro ao salvar treino no banco de dados');
                                 return;
                              }
                              
                              setShowPrescriptionModal(false);
                              setSelectedDays(['segunda']);
                              setSelectedDay('segunda');
                              // Resetar formulário
                              setPlanoTreino({
                                 titulo: '',
                                 segunda: [],
                                 terca: [],
                                 quarta: [],
                                 quinta: [],
                                 sexta: [],
                                 sabado: [],
                                 domingo: []
                              });
                           }}
                           disabled={!planoTreino.titulo}
                           className="w-full bg-lime-400 text-black py-4 rounded-xl font-black uppercase hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           Salvar Plano de Treino
                        </button>
                     </div>
                  ) : (
                     <div className="space-y-6">
                        {/* Título e Meta */}
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                                 Nome do Plano de Dieta *
                              </label>
                              <input
                                 type="text"
                                 placeholder="Ex: Dieta Hipertrofia"
                                 value={planoDieta.titulo}
                                 onChange={(e) => setPlanoDieta({ ...planoDieta, titulo: e.target.value })}
                                 className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-green-400"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                                 Meta Calórica
                              </label>
                              <input
                                 type="text"
                                 placeholder="Ex: 3000 kcal"
                                 value={planoDieta.objetivoCalorico}
                                 onChange={(e) => setPlanoDieta({ ...planoDieta, objetivoCalorico: e.target.value })}
                                 className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-green-400"
                              />
                           </div>
                        </div>

                        {/* Seletor de Dias */}
                        <div>
                           <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                              Dias da Semana (Clique para selecionar múltiplos)
                           </label>
                           <p className="text-xs text-zinc-500 mb-3">Dia atual para editar: <span className="text-green-400 font-bold">{selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}</span></p>
                           <div className="grid grid-cols-7 gap-2">
                              {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].map((dia) => (
                                 <button
                                    key={dia}
                                    onClick={() => {
                                       setSelectedDay(dia);
                                       setSelectedDays(prev => {
                                          if (prev.includes(dia)) {
                                             return prev.filter(d => d !== dia);
                                          } else {
                                             return [...prev, dia];
                                          }
                                       });
                                    }}
                                    className={`py-3 rounded-xl font-black text-xs uppercase transition-all relative ${
                                       selectedDays.includes(dia)
                                          ? 'bg-green-400 text-black'
                                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    } ${
                                       selectedDay === dia
                                          ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-zinc-900'
                                          : ''
                                    }`}
                                 >
                                    {dia.substring(0, 3)}
                                    {selectedDays.includes(dia) && (
                                       <span className="absolute -top-1 -right-1 bg-green-400 text-black rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✓</span>
                                    )}
                                 </button>
                              ))}
                           </div>
                           {selectedDays.length > 1 && (
                              <div className="mt-3 p-3 bg-green-400/10 border border-green-400/30 rounded-xl">
                                 <p className="text-xs text-green-400 font-bold">
                                    ⚡ {selectedDays.length} dias selecionados: {selectedDays.map(d => d.substring(0, 3).toUpperCase()).join(', ')}
                                 </p>
                              </div>
                           )}
                        </div>

                        {/* Lista de Refeições */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                           <div className="flex justify-between items-center mb-4">
                              <h3 className="font-black uppercase text-green-400">
                                 Refeições - {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}
                              </h3>
                              <button
                                 onClick={() => {
                                    const novaRefeicao = {
                                       nome: '',
                                       horario: '',
                                       alimentos: '',
                                       calorias: ''
                                    };
                                    setPlanoDieta({
                                       ...planoDieta,
                                       [selectedDay]: [...planoDieta[selectedDay], novaRefeicao]
                                    });
                                 }}
                                 className="bg-green-400 text-black px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-green-300 transition-colors flex items-center gap-2"
                              >
                                 <Plus size={16} />
                                 Adicionar
                              </button>
                           </div>

                           {planoDieta[selectedDay].length === 0 ? (
                              <div className="text-center py-8 text-zinc-600">
                                 <Apple className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                 <p className="text-sm">Nenhuma refeição para este dia</p>
                              </div>
                           ) : (
                              <div className="space-y-3">
                                 {planoDieta[selectedDay].map((ref: any, idx: number) => (
                                    <div key={idx} className="bg-zinc-900 p-4 rounded-xl space-y-3">
                                       <div className="flex justify-between items-start gap-4">
                                          <div className="grid grid-cols-2 gap-3 flex-1">
                                             <input
                                                type="text"
                                                placeholder="Nome (ex: Café da Manhã)"
                                                value={ref.nome}
                                                onChange={(e) => {
                                                   const updated = [...planoDieta[selectedDay]];
                                                   updated[idx].nome = e.target.value;
                                                   setPlanoDieta({ ...planoDieta, [selectedDay]: updated });
                                                }}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-green-400"
                                             />
                                             <input
                                                type="text"
                                                placeholder="Horário (ex: 07:00)"
                                                value={ref.horario}
                                                onChange={(e) => {
                                                   const updated = [...planoDieta[selectedDay]];
                                                   updated[idx].horario = e.target.value;
                                                   setPlanoDieta({ ...planoDieta, [selectedDay]: updated });
                                                }}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-green-400"
                                             />
                                          </div>
                                          <button
                                             onClick={() => {
                                                const updated = planoDieta[selectedDay].filter((_: any, i: number) => i !== idx);
                                                setPlanoDieta({ ...planoDieta, [selectedDay]: updated });
                                             }}
                                             className="text-red-400 hover:text-red-300 transition-colors"
                                          >
                                             <Trash2 size={18} />
                                          </button>
                                       </div>
                                       <textarea
                                          placeholder="Alimentos (ex: 3 ovos, 2 fatias de pão integral)"
                                          value={ref.alimentos}
                                          onChange={(e) => {
                                             const updated = [...planoDieta[selectedDay]];
                                             updated[idx].alimentos = e.target.value;
                                             setPlanoDieta({ ...planoDieta, [selectedDay]: updated });
                                          }}
                                          rows={2}
                                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-green-400"
                                       />
                                       <input
                                          type="text"
                                          placeholder="Calorias (ex: 450 kcal)"
                                          value={ref.calorias}
                                          onChange={(e) => {
                                             const updated = [...planoDieta[selectedDay]];
                                             updated[idx].calorias = e.target.value;
                                             setPlanoDieta({ ...planoDieta, [selectedDay]: updated });
                                          }}
                                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-green-400"
                                       />
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>

                        {/* Resumo Semanal */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                           <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-zinc-500">Resumo Semanal</h4>
                           <div className="grid grid-cols-7 gap-2">
                              {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].map((dia) => (
                                 <div key={dia} className="text-center">
                                    <div className="text-[10px] uppercase font-bold text-zinc-600 mb-1">
                                       {dia.substring(0, 3)}
                                    </div>
                                    <div className={`text-lg font-black ${planoDieta[dia].length > 0 ? 'text-green-400' : 'text-zinc-700'}`}>
                                       {planoDieta[dia].length}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <button
                           onClick={async () => {
                              console.log('🎯 Iniciando salvamento da dieta...');
                              console.log('👤 Aluno selecionado:', selectedStudent);
                              
                              // Copiar refeições do dia atual para todos os dias selecionados
                              const planoAtualizado = { ...planoDieta };
                              selectedDays.forEach(dia => {
                                 if (dia !== selectedDay && planoDieta[selectedDay].length > 0) {
                                    planoAtualizado[dia] = [...planoDieta[selectedDay]];
                                 }
                              });
                              
                              console.log('📋 Plano atualizado:', planoAtualizado);
                              
                              try {
                                 // Salvar no banco de dados usando a API
                                 const token = localStorage.getItem('fitness_token');
                                 console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');
                                 
                                 if (!token) {
                                    alert('Erro: Token de autenticação não encontrado. Faça login novamente.');
                                    return;
                                 }
                                 
                                 if (!selectedStudent || !selectedStudent.id) {
                                    alert('Erro: Aluno não selecionado corretamente.');
                                    return;
                                 }
                                 
                                 if (!planoDieta.titulo || planoDieta.titulo.trim() === '') {
                                    alert('Erro: Preencha o nome do plano de dieta.');
                                    return;
                                 }
                                 
                                 const dadosDieta = {
                                    usuarioId: selectedStudent.id,
                                    titulo: planoDieta.titulo.trim(),
                                    objetivo: planoDieta.objetivoCalorico,
                                    refeicoes: planoAtualizado,
                                    observacoes: `Dieta prescrita manualmente pelo nutricionista`,
                                    origem: 'Manual'
                                 };
                                 
                                 console.log('📤 Enviando dados da dieta:', {
                                    ...dadosDieta,
                                    refeicoes: 'Ver abaixo'
                                 });
                                 console.log('📤 Refeições:', dadosDieta.refeicoes);
                                 
                                 const dietaSalva = await salvarDieta(token, dadosDieta);
                                 
                                 if (dietaSalva) {
                                    console.log('✅ Dieta salva com sucesso:', dietaSalva);
                                    // Atualizar estado local com a dieta salva
                                    const novaDieta = {
                                       id: dietaSalva.id,
                                       titulo: planoDieta.titulo,
                                       alunoId: selectedStudent.id,
                                       alunoNome: selectedStudent.nome,
                                       data: new Date().toLocaleDateString('pt-BR'),
                                       plano: planoAtualizado,
                                       tipo: 'manual'
                                    };
                                    setHistoricoDietas(prev => [novaDieta, ...prev]);
                                    console.log('✅ Dieta adicionada ao histórico:', novaDieta);
                                    alert('Dieta prescrita e salva com sucesso!');
                                 } else {
                                    throw new Error('Erro ao salvar dieta');
                                 }
                              } catch (error) {
                                 console.error('❌ Erro ao salvar dieta:', error);
                                 alert('Erro ao salvar dieta no banco de dados');
                                 return;
                              }
                              
                              setShowPrescriptionModal(false);
                              setSelectedDays(['segunda']);
                              setSelectedDay('segunda');
                              // Resetar formulário
                              setPlanoDieta({
                                 titulo: '',
                                 objetivoCalorico: '',
                                 segunda: [],
                                 terca: [],
                                 quarta: [],
                                 quinta: [],
                                 sexta: [],
                                 sabado: [],
                                 domingo: []
                              });
                           }}
                           disabled={!planoDieta.titulo}
                           className="w-full bg-green-400 text-black py-4 rounded-xl font-black uppercase hover:bg-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           Salvar Plano de Dieta
                        </button>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* Modal de Cadastro de Aluno */}
         {showAddAlunoModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-8">
                     <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                        Cadastrar Novo Aluno
                     </h2>
                     <button
                        onClick={() => {
                           setShowAddAlunoModal(false);
                           setAlunoForm({ nome: '', email: '', senha: '', telefone: '', cpf: '' });
                        }}
                        className="text-zinc-400 hover:text-white transition-colors"
                     >
                        <X size={24} />
                     </button>
                  </div>

                  <div className="space-y-6">
                     <div>
                        <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                           Nome Completo *
                        </label>
                        <input
                           type="text"
                           placeholder="Ex: João Silva"
                           value={alunoForm.nome}
                           onChange={(e) => setAlunoForm({ ...alunoForm, nome: e.target.value })}
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-lime-400"
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                           E-mail *
                        </label>
                        <input
                           type="email"
                           placeholder="joao@email.com"
                           value={alunoForm.email}
                           onChange={(e) => setAlunoForm({ ...alunoForm, email: e.target.value })}
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-lime-400"
                        />
                     </div>

                     <div>
                        <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                           Senha *
                        </label>
                        <input
                           type="password"
                           placeholder="Mínimo 6 caracteres"
                           value={alunoForm.senha}
                           onChange={(e) => setAlunoForm({ ...alunoForm, senha: e.target.value })}
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-lime-400"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                              Telefone
                           </label>
                           <input
                              type="text"
                              placeholder="(11) 98888-8888"
                              value={alunoForm.telefone}
                              onChange={(e) => setAlunoForm({ ...alunoForm, telefone: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-lime-400"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                              CPF
                           </label>
                           <input
                              type="text"
                              placeholder="000.000.000-00"
                              value={alunoForm.cpf}
                              onChange={(e) => setAlunoForm({ ...alunoForm, cpf: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-lime-400"
                           />
                        </div>
                     </div>

                     <div className="flex gap-4 pt-4">
                        <button
                           onClick={() => {
                              setShowAddAlunoModal(false);
                              setAlunoForm({ nome: '', email: '', senha: '', telefone: '', cpf: '' });
                           }}
                           className="flex-1 bg-zinc-800 text-white py-4 rounded-xl font-black uppercase hover:bg-zinc-700 transition-colors"
                        >
                           Cancelar
                        </button>
                        <button
                           onClick={cadastrarAluno}
                           disabled={!alunoForm.nome || !alunoForm.email || !alunoForm.senha}
                           className="flex-1 bg-lime-400 text-black py-4 rounded-xl font-black uppercase hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           Cadastrar
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {tab === 'dashboard' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard 
                     label="Receita Mensal" 
                     value={`R$ ${(pagamentos.filter(p => p.status === 'PAGO' && new Date(p.dataPagamento).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.valor, 0) / 1000).toFixed(1)}k`} 
                     color="text-lime-400" 
                     icon={DollarSign} 
                     trend={`${pagamentos.filter(p => p.status === 'PAGO').length} pagos`} 
                  />
                  <StatCard 
                     label="Pendente" 
                     value={`R$ ${(pagamentos.filter(p => p.status === 'PENDENTE').reduce((sum, p) => sum + p.valor, 0) / 1000).toFixed(1)}k`} 
                     color="text-yellow-400" 
                     icon={Clock} 
                     trend={`${pagamentos.filter(p => p.status === 'PENDENTE').length} pendentes`} 
                  />
                  <StatCard 
                     label="Alunos Ativos" 
                     value={(alunos.filter(a => a.ativo).length).toString()} 
                     color="text-blue-400" 
                     icon={Users} 
                     trend={`${alunos.length} total`} 
                  />
                  <StatCard 
                     label="Produtos" 
                     value={produtos.length.toString()} 
                     color="text-purple-400" 
                     icon={Package} 
                     trend={`${produtos.filter(p => p.estoque < p.estoqueMinimo).length} baixo estoque`} 
                  />
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Acessos de Hoje</h3>
                     <div className="space-y-3">
                        {registrosAcesso.map((registro, index) => (
                           <div key={index} className="flex justify-between items-center p-3 bg-zinc-800 rounded-2xl">
                              <span className="font-bold text-sm">{registro.nomeAluno}</span>
                              <span className="text-lime-400 font-black text-xs">{registro.hora}</span>
                           </div>
                        ))}
                        {registrosAcesso.length === 0 && (
                           <p className="text-zinc-500 text-center py-8">Nenhum acesso registrado hoje</p>
                        )}
                     </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Estoque Crítico</h3>
                     <div className="space-y-3">
                        {produtos.filter(p => p.estoque < p.estoqueMinimo).length === 0 ? (
                           <p className="text-zinc-500 text-center py-8">Nenhum produto com estoque baixo</p>
                        ) : (
                           produtos.filter(p => p.estoque < p.estoqueMinimo).map(produto => (
                              <div key={produto.id} className={`p-4 rounded-2xl border-2 ${produto.estoque === 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                                 <div className="flex justify-between items-center">
                                    <div>
                                       <h4 className="font-black text-sm">{produto.nome}</h4>
                                       <p className="text-[10px] text-zinc-500 font-bold">Estoque: {produto.estoque} un (Mín: {produto.estoqueMinimo})</p>
                                    </div>
                                    <AlertTriangle size={20} className={produto.estoque === 0 ? 'text-red-500' : 'text-orange-500'}/>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {tab === 'financial' && (
            <div className="space-y-6 animate-in fade-in duration-700">
               <header className="mb-8">
                  <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">
                     Financeiro
                  </h2>
                  <p className="text-zinc-500 font-medium text-sm md:text-base">
                     Controle de receitas, despesas e pagamentos
                  </p>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard label="Receita Total" value={`R$ ${(financialData.revenue / 1000).toFixed(1)}k`} color="text-lime-400" icon={DollarSign} />
                  <StatCard label="Despesas" value={`R$ ${(financialData.expenses / 1000).toFixed(1)}k`} color="text-red-400" icon={Flame} />
                  <StatCard label="Lucro" value={`R$ ${(financialData.profit / 1000).toFixed(1)}k`} color="text-green-500" icon={TrendingUp} />
               </div>
               <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                  <h3 className="text-2xl font-black italic uppercase mb-6">Pagamentos Pendentes</h3>
                  <div className="space-y-3">
                     {alunos.filter(s => s.financialStatus === 'LATE').map(student => (
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
               {crmLeads.length > 0 ? (
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
               ) : (
                  <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] text-center">
                     <div className="size-24 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Users size={40} className="text-zinc-600"/>
                     </div>
                     <h3 className="text-3xl font-black italic uppercase mb-4">Pipeline Vazio</h3>
                     <p className="text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                        Comece a capturar leads e transformá-los em alunos. 
                        Organize seu funil de vendas e aumente suas conversões!
                     </p>
                     <button 
                        onClick={() => setShowAddLead(true)}
                        className="bg-lime-400 hover:bg-lime-300 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                     >
                        Adicionar Primeiro Lead
                     </button>
                  </div>
               )}

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
                        <form onSubmit={async (e) => {
                           e.preventDefault();
                           if (leadForm.name && leadForm.contact) {
                              try {
                                 const token = localStorage.getItem('fitness_token');
                                 const response = await fetch('/api/admin/leads', {
                                    method: 'POST',
                                    headers: {
                                       'Content-Type': 'application/json',
                                       'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                       nome: leadForm.name,
                                       telefone: leadForm.contact,
                                       origem: leadForm.origin,
                                       valorEstimado: leadForm.value || 'R$ 150/mês',
                                       observacoes: leadForm.notes
                                    })
                                 });

                                 if (response.ok) {
                                    const novoLead = await response.json();
                                    const leadFormatado = {
                                       id: novoLead.id,
                                       name: novoLead.nome,
                                       status: novoLead.status,
                                       contact: novoLead.telefone,
                                       origin: novoLead.origem,
                                       value: novoLead.valorEstimado,
                                       notes: novoLead.observacoes || ''
                                    };
                                    setCrmLeads([...crmLeads, leadFormatado]);
                                    setLeadForm({ name: '', contact: '', origin: 'Instagram', value: '', notes: '' });
                                    setShowAddLead(false);
                                    alert(`Lead "${novoLead.nome}" adicionado com sucesso!`);
                                 } else {
                                    alert('Erro ao criar lead. Tente novamente.');
                                 }
                              } catch (error) {
                                 console.error('Erro ao criar lead:', error);
                                 alert('Erro ao criar lead. Tente novamente.');
                              }
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
                  <button onClick={() => alert('Adicionar Novo Produto\n\nFuncionalidade em desenvolvimento.\nEm breve você poderá cadastrar novos produtos no estoque.')} className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2"><Plus size={16}/> Novo Produto</button>
               </div>
               <div className="grid gap-4">
                  {adminProducts.length > 0 ? (
                     adminProducts.map(item => (
                        <div key={item.id} className={`bg-zinc-900 border-2 p-6 rounded-3xl flex justify-between items-center ${item.status === 'critical' ? 'border-red-500/30' : item.status === 'low' ? 'border-orange-500/30' : 'border-zinc-800'}`}>
                           <div className="flex items-center gap-6">
                              <div className={`size-16 rounded-2xl flex items-center justify-center ${item.status === 'critical' ? 'bg-red-500/20 text-red-500' : item.status === 'low' ? 'bg-orange-500/20 text-orange-500' : 'bg-lime-400/20 text-lime-400'}`}><Package size={24}/></div>
                              <div>
                                 <h4 className="font-black text-lg">{item.name}</h4>
                                 <p className="text-[10px] text-zinc-500 font-bold">Quantidade: {item.quantity} un • Mínimo: {item.minStock} un</p>
                              </div>
                           </div>
                           <button onClick={() => alert('Reposição de estoque solicitada para: ' + item.name)} className="px-6 py-3 bg-lime-400 text-black rounded-xl font-black uppercase text-[10px]">Repor</button>
                        </div>
                     ))
                  ) : (
                     <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-3xl text-center">
                        <div className="size-20 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                           <Package size={32} className="text-zinc-600"/>
                        </div>
                        <h3 className="text-xl font-black italic uppercase mb-2">Nenhum Produto Cadastrado</h3>
                        <p className="text-zinc-500 font-medium mb-6">Adicione produtos ao estoque para começar o controle</p>
                        <button onClick={() => alert('Adicionar Novo Produto\n\nFuncionalidade em desenvolvimento.\nEm breve você poderá cadastrar novos produtos no estoque.')} className="bg-lime-400 text-black px-6 py-3 rounded-xl font-black uppercase text-[10px]">Cadastrar Primeiro Produto</button>
                     </div>
                  )}
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
                  {funcionarios.length > 0 ? (
                     funcionarios.map(emp => (
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
                     ))
                  ) : (
                     <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-3xl text-center">
                        <div className="size-20 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                           <Users size={32} className="text-zinc-600"/>
                        </div>
                        <h3 className="text-xl font-black italic uppercase mb-2">Nenhum Funcionário Cadastrado</h3>
                        <p className="text-zinc-500 font-medium mb-6">Adicione funcionários para gerenciar sua equipe</p>
                        <button onClick={() => setShowAddEmployee(true)} className="bg-lime-400 text-black px-6 py-3 rounded-xl font-black uppercase text-[10px]">Cadastrar Primeiro Funcionário</button>
                     </div>
                  )}
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
                  {maintenanceTickets.length > 0 ? (
                     maintenanceTickets.map((ticket: any) => (
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
                     ))
                  ) : (
                     <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-3xl text-center">
                        <div className="size-20 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                           <Wrench size={32} className="text-zinc-600"/>
                        </div>
                        <h3 className="text-xl font-black italic uppercase mb-2">Nenhum Chamado Aberto</h3>
                        <p className="text-zinc-500 font-medium mb-6">Todos os equipamentos estão funcionando perfeitamente!</p>
                        <button onClick={() => setShowAddTicket(true)} className="bg-lime-400 text-black px-6 py-3 rounded-xl font-black uppercase text-[10px]">Abrir Novo Chamado</button>
                     </div>
                  )}
               </div>
            </div>
         )}

         {tab === 'analytics' && (
            <div className="space-y-6">
               <h2 className="text-3xl font-black italic uppercase">Relatórios e Analytics</h2>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Taxa de Retenção</h3>
                     <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={[{month: 'Jan', rate: 88}, {month: 'Fev', rate: 91}, {month: 'Mar', rate: 89}, {month: 'Abr', rate: 93}, {month: 'Mai', rate: 94}]}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis dataKey="month" stroke="#52525b" fontSize={10} fontWeight="bold" /><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Line type="monotone" dataKey="rate" stroke="#D9FF00" strokeWidth={3} dot={{ fill: '#D9FF00', r: 5 }} /></LineChart></ResponsiveContainer></div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl md:rounded-[3rem]">
                     <h3 className="text-xl font-black italic uppercase mb-6">Origem de Novos Alunos</h3>
                     <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem' }} /><Pie data={[{name: 'Instagram', value: 45, fill: '#D9FF00'}, {name: 'Google', value: 25, fill: '#3b82f6'}, {name: 'Indicação', value: 20, fill: '#f97316'}, {name: 'Walk-in', value: 10, fill: '#8b5cf6'}]} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none" /></PieChart></ResponsiveContainer></div>
                  </div>
               </div>
            </div>
         )}

         {/* Modals */}
         {showAddLead && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowAddLead(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
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
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-black italic uppercase">Novo Chamado</h3>
                     <button onClick={() => setShowAddTicket(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); alert('Chamado criado com sucesso!\n\nEquipamento: ' + ticketForm.equipment + '\nProblema: ' + ticketForm.issue + '\nPrioridade: ' + ticketForm.priority); setTicketForm({ equipment: '', issue: '', priority: 'Média' }); setShowAddTicket(false); }} className="space-y-6">
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Equipamento</label><input required value={ticketForm.equipment} onChange={(e) => setTicketForm({...ticketForm, equipment: e.target.value})} placeholder="Ex: Esteira 04" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Problema</label><input required value={ticketForm.issue} onChange={(e) => setTicketForm({...ticketForm, issue: e.target.value})} placeholder="Ex: Motor fazendo barulho" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Prioridade</label><select value={ticketForm.priority} onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none appearance-none"><option>Baixa</option><option>Média</option><option>Alta</option></select></div>
                     <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Criar Chamado</button>
                  </form>
               </div>
            </div>
         )}

         {showAddEmployee && (
            <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowAddEmployee(false)}>
               <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-3xl font-black italic uppercase">Novo Funcionário</h3>
                     <button onClick={() => setShowAddEmployee(false)} className="size-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-zinc-500"><X size={24}/></button>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); alert('Funcionário contratado com sucesso!\n\nNome: ' + employeeForm.name + '\nCargo: ' + employeeForm.role + '\nSalário: R$ ' + employeeForm.salary); setEmployeeForm({ name: '', role: 'Professor', salary: '' }); setShowAddEmployee(false); }} className="space-y-6">
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Nome Completo</label><input required value={employeeForm.name} onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})} placeholder="Ex: Carlos Silva" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Cargo</label><select value={employeeForm.role} onChange={(e) => setEmployeeForm({...employeeForm, role: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none appearance-none"><option>Professor</option><option>Nutricionista</option><option>Recepção</option><option>Gerente</option></select></div>
                     <div><label className="text-[10px] font-black uppercase text-zinc-600 ml-4 block mb-2">Salário Mensal</label><input required type="number" value={employeeForm.salary} onChange={(e) => setEmployeeForm({...employeeForm, salary: e.target.value})} placeholder="Ex: 4500" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm outline-none"/></div>
                     <button type="submit" className="w-full bg-lime-400 text-black py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Contratar</button>
                  </form>
               </div>
            </div>
         )}

         {/* Modal de Configuração IA */}
         {showIAConfigModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
               <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-purple-500/30 rounded-3xl p-8 max-w-2xl w-full shadow-2xl shadow-purple-500/20">
                  <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                           <Sparkles className="text-white" size={24} />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black">IA Fitness Assistant</h2>
                           <p className="text-sm text-zinc-400">
                              {prescriptionType === 'treino' ? 'Criação automática de treino' : 'Criação automática de dieta'}
                           </p>
                        </div>
                     </div>
                     <button
                        onClick={() => {
                           setShowIAConfigModal(false);
                           setIaConfig({ objetivo: '', nivel: '', restricoes: '', diasTreino: 3, selectedDays: [] });
                        }}
                        className="size-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-colors"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  <div className="space-y-5">
                     <div>
                        <label className="block text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                           <Target size={16} className="text-purple-400" />
                           Objetivo Principal *
                        </label>
                        <select
                           value={iaConfig.objetivo}
                           onChange={(e) => setIaConfig({ ...iaConfig, objetivo: e.target.value })}
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-purple-400 transition-colors"
                        >
                           <option value="">Selecione...</option>
                           <option value="Hipertrofia Muscular">💪 Hipertrofia Muscular</option>
                           <option value="Emagrecimento">🔥 Emagrecimento / Definição</option>
                           <option value="Condicionamento">⚡ Condicionamento Físico</option>
                           <option value="Força">🏋️ Ganho de Força</option>
                           <option value="Saúde Geral">❤️ Saúde e Bem-estar</option>
                        </select>
                     </div>

                     {prescriptionType === 'treino' && (
                        <>
                           <div>
                              <label className="block text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                 <TrendingUp size={16} className="text-purple-400" />
                                 Nível de Experiência *
                              </label>
                              <select
                                 value={iaConfig.nivel}
                                 onChange={(e) => setIaConfig({ ...iaConfig, nivel: e.target.value })}
                                 className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-purple-400 transition-colors"
                              >
                                 <option value="">Selecione...</option>
                                 <option value="Iniciante">🌱 Iniciante (0-6 meses)</option>
                                 <option value="Intermediário">📈 Intermediário (6-24 meses)</option>
                                 <option value="Avançado">🏆 Avançado (2+ anos)</option>
                              </select>
                           </div>

                           <div>
                              <label className="block text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                 <Calendar size={16} className="text-purple-400" />
                                 Dias de Treino por Semana
                              </label>
                              <div className="grid grid-cols-5 gap-2">
                                 {[3, 4, 5, 6, 7].map((dias) => (
                                    <button
                                       key={dias}
                                       onClick={() => setIaConfig({ ...iaConfig, diasTreino: dias })}
                                       className={`py-3 rounded-xl font-black transition-all ${
                                          iaConfig.diasTreino === dias
                                             ? 'bg-purple-500 text-white'
                                             : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                       }`}
                                    >
                                       {dias}x
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <div>
                              <label className="block text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                 <CalendarCheck size={16} className="text-purple-400" />
                                 Selecione os Dias Específicos
                              </label>
                              <div className="grid grid-cols-4 gap-2">
                                 {[
                                    { key: 'segunda', label: 'SEG' },
                                    { key: 'terca', label: 'TER' },
                                    { key: 'quarta', label: 'QUA' },
                                    { key: 'quinta', label: 'QUI' },
                                    { key: 'sexta', label: 'SEX' },
                                    { key: 'sabado', label: 'SÁB' },
                                    { key: 'domingo', label: 'DOM' }
                                 ].map((dia) => {
                                    const isSelected = iaConfig.selectedDays.includes(dia.key);
                                    return (
                                       <button
                                          key={dia.key}
                                          onClick={() => {
                                             const newDays = isSelected
                                                ? iaConfig.selectedDays.filter(d => d !== dia.key)
                                                : [...iaConfig.selectedDays, dia.key];
                                             setIaConfig({ ...iaConfig, selectedDays: newDays, diasTreino: newDays.length });
                                          }}
                                          className={`py-3 px-2 rounded-xl font-black text-xs transition-all ${
                                             isSelected
                                                ? 'bg-purple-500 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-zinc-900'
                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                          }`}
                                       >
                                          {dia.label}
                                       </button>
                                    );
                                 })}
                              </div>
                              <p className="text-xs text-zinc-500 mt-2">
                                 {iaConfig.selectedDays.length === 0 
                                    ? 'Selecione os dias em que o aluno irá treinar' 
                                    : `${iaConfig.selectedDays.length} dia(s) selecionado(s)`}
                              </p>
                           </div>
                        </>
                     )}

                     <div>
                        <label className="block text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                           <AlertTriangle size={16} className="text-purple-400" />
                           {prescriptionType === 'treino' ? 'Restrições / Lesões' : 'Restrições Alimentares'}
                        </label>
                        <textarea
                           value={iaConfig.restricoes}
                           onChange={(e) => setIaConfig({ ...iaConfig, restricoes: e.target.value })}
                           placeholder={prescriptionType === 'treino' 
                              ? "Ex: Dor no ombro direito, evitar agachamento profundo..." 
                              : "Ex: Intolerância à lactose, vegetariano, alergia a frutos do mar..."}
                           rows={3}
                           className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-purple-400 transition-colors text-sm"
                        />
                     </div>

                     <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 flex items-start gap-3">
                        <Bot className="text-purple-400 mt-1" size={20} />
                        <div className="flex-1">
                           <p className="text-sm font-bold text-purple-400 mb-1">Como funciona?</p>
                           <p className="text-xs text-zinc-400">
                              Nossa IA analisa o perfil do aluno e cria um {prescriptionType === 'treino' ? 'plano de treino personalizado' : 'plano alimentar balanceado'} baseado em milhares de dados científicos. Você pode editar tudo depois!
                           </p>
                        </div>
                     </div>

                     <div className="flex gap-3 pt-2">
                        <button
                           onClick={() => {
                              setShowIAConfigModal(false);
                              setIaConfig({ objetivo: '', nivel: '', restricoes: '', diasTreino: 3, selectedDays: [] });
                           }}
                           className="flex-1 bg-zinc-800 text-white py-4 rounded-xl font-black uppercase hover:bg-zinc-700 transition-colors"
                        >
                           Cancelar
                        </button>
                        <button
                           onClick={prescriptionType === 'treino' ? gerarTreinoComIA : gerarDietaComIA}
                           disabled={gerandoComIA || !iaConfig.objetivo || (prescriptionType === 'treino' && !iaConfig.nivel)}
                           className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-black uppercase hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                           {gerandoComIA ? (
                              <>
                                 <Loader2 size={20} className="animate-spin" />
                                 Gerando...
                              </>
                           ) : (
                              <>
                                 <Sparkles size={20} />
                                 Gerar {prescriptionType === 'treino' ? 'Treino' : 'Dieta'}
                              </>
                           )}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Modal de Edição de Treino */}
         {showEditModal && selectedTreinoEdit && (
            <div key={selectedTreinoEdit.id} className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
               <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-lime-400/30 rounded-3xl max-w-7xl w-full h-[90vh] shadow-2xl shadow-lime-400/20 flex flex-col">
                  <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                     <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center">
                           <Edit3 className="text-black" size={24} />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black">Editar Treino</h2>
                           <p className="text-sm text-zinc-400">{selectedTreinoEdit.titulo} - {selectedTreinoEdit.data}</p>
                        </div>
                     </div>
                     <button
                        onClick={() => {
                           setShowEditModal(false);
                           setSelectedTreinoEdit(null);
                           setEditingPlano({
                              segunda: [],
                              terca: [],
                              quarta: [],
                              quinta: [],
                              sexta: [],
                              sabado: [],
                              domingo: []
                           });
                        }}
                        className="size-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-colors"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-hidden flex">
                     {/* Sidebar - Dias da Semana */}
                     <div className="w-48 bg-zinc-950/50 border-r border-zinc-800 p-4">
                        <h3 className="font-black uppercase text-xs text-zinc-500 mb-4">Dias da Semana</h3>
                        <div className="space-y-2">
                           {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].map((dia) => {
                              const exerciciosDia = selectedTreinoEdit?.plano?.[dia] || [];
                              const isActive = activeDayEdit === dia;
                              
                              return (
                                 <button
                                    key={dia}
                                    onClick={() => setActiveDayEdit(dia)}
                                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                                       isActive
                                          ? 'bg-lime-400 text-black font-black'
                                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                                 >
                                    <div className="flex justify-between items-center">
                                       <span className="capitalize text-sm font-bold">
                                          {dia === 'terca' ? 'Terça' : dia === 'quarta' ? 'Quarta' : dia}
                                       </span>
                                       <span className={`text-xs font-black ${isActive ? 'text-black' : 'text-zinc-600'}`}>
                                          {exerciciosDia.length}
                                       </span>
                                    </div>
                                 </button>
                              );
                           })}
                        </div>
                     </div>

                     {/* Conteúdo Principal - Exercícios */}
                     <div className="flex-1 overflow-auto p-6">
                        {activeDayEdit && (
                           <div>
                              <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-xl font-black uppercase">
                                    Exercícios de {activeDayEdit === 'terca' ? 'Terça-feira' : 
                                    activeDayEdit === 'quarta' ? 'Quarta-feira' : 
                                    activeDayEdit.charAt(0).toUpperCase() + activeDayEdit.slice(1)}
                                 </h3>
                                 <button
                                    onClick={() => {
                                       const novoExercicio = {
                                          exercicio: '',
                                          nome: '',
                                          series: '',
                                          repeticoes: '',
                                          carga: '',
                                          descanso: '90s',
                                          observacoes: '',
                                          videoUrl: ''
                                       };
                                       setSelectedTreinoEdit(prev => ({
                                          ...prev,
                                          plano: {
                                             ...prev.plano,
                                             [activeDayEdit]: [...(prev.plano[activeDayEdit] || []), novoExercicio]
                                          }
                                       }));
                                    }}
                                    className="bg-lime-400 hover:bg-lime-500 text-black px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                                 >
                                    <Plus size={16} />
                                    Adicionar Exercício
                                 </button>
                              </div>

                              <div className="space-y-4">
                                 {(selectedTreinoEdit?.plano?.[activeDayEdit] || []).map((exercicio: any, index: number) => (
                                    <div key={index} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                                       <div className="flex justify-between items-start mb-4">
                                          <h4 className="font-bold text-lg">Exercício {index + 1}</h4>
                                          <button
                                             onClick={() => {
                                                const novosExercicios = selectedTreinoEdit.plano[activeDayEdit].filter((_, i) => i !== index);
                                                setSelectedTreinoEdit(prev => ({
                                                   ...prev,
                                                   plano: {
                                                      ...prev.plano,
                                                      [activeDayEdit]: novosExercicios
                                                   }
                                                }));
                                             }}
                                             className="text-red-400 hover:text-red-300 p-1"
                                          >
                                             <Trash2 size={16} />
                                          </button>
                                       </div>

                                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                          <div className="lg:col-span-2">
                                             <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nome do Exercício</label>
                                             <input
                                                type="text"
                                                value={exercicio.exercicio || exercicio.nome || ''}
                                                onChange={(e) => {
                                                   const novosExercicios = [...(selectedTreinoEdit.plano[activeDayEdit] || [])];
                                                   novosExercicios[index] = { ...novosExercicios[index], exercicio: e.target.value, nome: e.target.value };
                                                   setSelectedTreinoEdit(prev => ({
                                                      ...prev,
                                                      plano: {
                                                         ...prev.plano,
                                                         [activeDayEdit]: novosExercicios
                                                      }
                                                   }));
                                                   setEditingPlano(prev => ({
                                                      ...prev,
                                                      [activeDayEdit]: novosExercicios
                                                   }));
                                                }}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                                                placeholder="Ex: Supino reto com halter"
                                             />
                                          </div>

                                          <div>
                                             <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Observações</label>
                                             <input
                                                type="text"
                                                value={exercicio.observacoes || ''}
                                                onChange={(e) => {
                                                   const novosExercicios = [...(editingPlano[activeDayEdit] || selectedTreinoEdit.plano[activeDayEdit] || [])];
                                                   novosExercicios[index] = { ...novosExercicios[index], observacoes: e.target.value };
                                                   setEditingPlano(prev => ({
                                                      ...prev,
                                                      [activeDayEdit]: novosExercicios
                                                   }));
                                                }}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                                                placeholder="Ex: Movimento controlado"
                                             />
                                          </div>
                                       </div>

                                       <div>
                                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-2">
                                             <PlayCircle size={14} />
                                             URL do Vídeo (YouTube, etc)
                                          </label>
                                          <input
                                             type="text"
                                             value={exercicio.videoUrl || ''}
                                             onChange={(e) => {
                                                const novosExercicios = [...(editingPlano[activeDayEdit] || selectedTreinoEdit.plano[activeDayEdit] || [])];
                                                novosExercicios[index] = { ...novosExercicios[index], videoUrl: e.target.value };
                                                setEditingPlano(prev => ({
                                                   ...prev,
                                                   [activeDayEdit]: novosExercicios
                                                }));
                                             }}
                                             className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                                             placeholder="https://youtube.com/watch?v=..."
                                          />
                                       </div>

                                       <div className="grid grid-cols-2 gap-3">
                                             <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Séries</label>
                                                <input
                                                   type="text"
                                                   value={exercicio.series || ''}
                                                   onChange={(e) => {
                                                      const novosExercicios = [...(editingPlano[activeDayEdit] || selectedTreinoEdit.plano[activeDayEdit] || [])];
                                                      novosExercicios[index] = { ...novosExercicios[index], series: e.target.value };
                                                      setEditingPlano(prev => ({
                                                         ...prev,
                                                         [activeDayEdit]: novosExercicios
                                                      }));
                                                   }}
                                                   className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                                                   placeholder="3"
                                                />
                                             </div>

                                             <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Repetições</label>
                                                <input
                                                   type="text"
                                                   value={exercicio.repeticoes || ''}
                                                   onChange={(e) => {
                                                      const novosExercicios = [...(editingPlano[activeDayEdit] || selectedTreinoEdit.plano[activeDayEdit] || [])];
                                                      novosExercicios[index] = { ...novosExercicios[index], repeticoes: e.target.value };
                                                      setEditingPlano(prev => ({
                                                         ...prev,
                                                         [activeDayEdit]: novosExercicios
                                                      }));
                                                   }}
                                                   className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                                                   placeholder="10-12"
                                                />
                                             </div>

                                             <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Carga</label>
                                                <input
                                                   type="text"
                                                   value={exercicio.carga || ''}
                                                   onChange={(e) => {
                                                      const novosExercicios = [...(editingPlano[activeDayEdit] || selectedTreinoEdit.plano[activeDayEdit] || [])];
                                                      novosExercicios[index] = { ...novosExercicios[index], carga: e.target.value };
                                                      setEditingPlano(prev => ({
                                                         ...prev,
                                                         [activeDayEdit]: novosExercicios
                                                      }));
                                                   }}
                                                   className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                                                   placeholder="15kg"
                                                />
                                             </div>

                                             <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Descanso</label>
                                                <input
                                                   type="text"
                                                   value={exercicio.descanso || ''}
                                                   onChange={(e) => {
                                                      const novosExercicios = [...(editingPlano[activeDayEdit] || selectedTreinoEdit.plano[activeDayEdit] || [])];
                                                      novosExercicios[index] = { ...novosExercicios[index], descanso: e.target.value };
                                                      setEditingPlano(prev => ({
                                                         ...prev,
                                                         [activeDayEdit]: novosExercicios
                                                      }));
                                                   }}
                                                   className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                                                   placeholder="60s"
                                                />
                                             </div>
                                          </div>
                                    </div>
                                 ))}

                                 {(selectedTreinoEdit?.plano?.[activeDayEdit] || []).length === 0 && (
                                    <div className="text-center py-12">
                                       <div className="text-zinc-600 mb-4">
                                          <Dumbbell size={48} className="mx-auto mb-2" />
                                          <p className="text-lg font-bold">Nenhum exercício para {activeDayEdit}</p>
                                          <p className="text-sm">Clique em "Adicionar Exercício" para começar</p>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </div>
                        )}

                        {!activeDayEdit && (
                           <div className="text-center py-12">
                              <div className="text-zinc-600 mb-4">
                                 <Calendar size={48} className="mx-auto mb-2" />
                                 <p className="text-lg font-bold">Selecione um dia da semana</p>
                                 <p className="text-sm">Escolha um dia no menu lateral para editar os exercícios</p>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Footer com botões de ação */}
                  <div className="border-t border-zinc-800 p-6">
                     <div className="flex gap-3">
                        <button
                           onClick={() => {
                              setShowEditModal(false);
                              setSelectedTreinoEdit(null);
                              setEditingPlano({
                                 segunda: [],
                                 terca: [],
                                 quarta: [],
                                 quinta: [],
                                 sexta: [],
                                 sabado: [],
                                 domingo: []
                              });
                           }}
                           className="flex-1 bg-zinc-800 text-white py-4 rounded-xl font-black uppercase hover:bg-zinc-700 transition-colors"
                        >
                           Cancelar
                        </button>
                        <button
                           onClick={() => {
                              salvarEdicaoTreino();
                           }}
                           className="flex-2 bg-gradient-to-r from-lime-400 to-lime-500 text-black py-4 px-8 rounded-xl font-black uppercase hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                           <Save size={20} />
                           Salvar Alterações
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Modal de Edição de Dieta */}
         {showEditDietaModal && selectedDietaEdit && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
               <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-green-400/30 rounded-3xl max-w-7xl w-full h-[90vh] shadow-2xl shadow-green-400/20 flex flex-col">
                  <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                     <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                           <Edit3 className="text-black" size={24} />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black">Editar Dieta</h2>
                           <p className="text-sm text-zinc-400">{selectedDietaEdit.titulo} - {selectedDietaEdit.data}</p>
                        </div>
                     </div>
                     <button
                        onClick={() => {
                           setShowEditDietaModal(false);
                           setSelectedDietaEdit(null);
                           setEditingDietaPlano({
                              cafeDaManha: [],
                              lancheManha: [],
                              almoco: [],
                              lancheTarde: [],
                              jantar: [],
                              ceia: [],
                              objetivoCalorico: ''
                           });
                        }}
                        className="size-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-colors"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-hidden flex">
                     {/* Sidebar - Refeições */}
                     <div className="w-56 bg-zinc-950/50 border-r border-zinc-800 p-4">
                        <h3 className="font-black uppercase text-xs text-zinc-500 mb-4">Refeições</h3>
                        
                        {/* Objetivo Calórico */}
                        <div className="mb-6 p-3 bg-zinc-900 rounded-xl">
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Objetivo Calórico</label>
                           <input
                              type="text"
                              value={editingDietaPlano.objetivoCalorico || ''}
                              onChange={(e) => setEditingDietaPlano(prev => ({ ...prev, objetivoCalorico: e.target.value }))}
                              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm focus:outline-none focus:border-green-400 transition-colors"
                              placeholder="2500 kcal"
                           />
                        </div>

                        <div className="space-y-2">
                           {[
                              { id: 'cafeDaManha', label: 'Café da Manhã', emoji: '☕' },
                              { id: 'lancheManha', label: 'Lanche Manhã', emoji: '🍎' },
                              { id: 'almoco', label: 'Almoço', emoji: '🍽️' },
                              { id: 'lancheTarde', label: 'Lanche Tarde', emoji: '🥪' },
                              { id: 'jantar', label: 'Jantar', emoji: '🍲' },
                              { id: 'ceia', label: 'Ceia', emoji: '🥛' }
                           ].map((refeicao) => {
                              const alimentos = editingDietaPlano[refeicao.id] || [];
                              const isActive = activeMealEdit === refeicao.id;
                              
                              return (
                                 <button
                                    key={refeicao.id}
                                    onClick={() => setActiveMealEdit(refeicao.id)}
                                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                                       isActive
                                          ? 'bg-green-400 text-black font-black'
                                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                                 >
                                    <div className="flex justify-between items-center">
                                       <span className="text-sm font-bold flex items-center gap-2">
                                          <span>{refeicao.emoji}</span>
                                          {refeicao.label}
                                       </span>
                                       <span className={`text-xs font-black ${isActive ? 'text-black' : 'text-zinc-600'}`}>
                                          {alimentos.length}
                                       </span>
                                    </div>
                                 </button>
                              );
                           })}
                        </div>
                     </div>

                     {/* Conteúdo Principal - Alimentos */}
                     <div className="flex-1 overflow-auto p-6">
                        {activeMealEdit && (
                           <div>
                              <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-xl font-black uppercase">
                                    {activeMealEdit === 'cafeDaManha' ? '☕ Café da Manhã' :
                                     activeMealEdit === 'lancheManha' ? '🍎 Lanche da Manhã' :
                                     activeMealEdit === 'almoco' ? '🍽️ Almoço' :
                                     activeMealEdit === 'lancheTarde' ? '🥪 Lanche da Tarde' :
                                     activeMealEdit === 'jantar' ? '🍲 Jantar' : '🥛 Ceia'}
                                 </h3>
                                 <button
                                    onClick={() => {
                                       const novoAlimento = {
                                          alimento: '',
                                          quantidade: '',
                                          calorias: '',
                                          proteinas: '',
                                          carboidratos: '',
                                          gorduras: ''
                                       };
                                       setEditingDietaPlano(prev => ({
                                          ...prev,
                                          [activeMealEdit]: [...(prev[activeMealEdit] || []), novoAlimento]
                                       }));
                                    }}
                                    className="bg-green-400 hover:bg-green-500 text-black px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                                 >
                                    <Plus size={16} />
                                    Adicionar Alimento
                                 </button>
                              </div>

                              <div className="space-y-4">
                                 {(editingDietaPlano[activeMealEdit] || []).map((alimento: any, index: number) => (
                                    <div key={index} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                                       <div className="flex justify-between items-start mb-4">
                                          <h4 className="font-bold text-lg">Alimento {index + 1}</h4>
                                          <button
                                             onClick={() => {
                                                const novosAlimentos = (editingDietaPlano[activeMealEdit] || []).filter((_, i) => i !== index);
                                                setEditingDietaPlano(prev => ({
                                                   ...prev,
                                                   [activeMealEdit]: novosAlimentos
                                                }));
                                             }}
                                             className="text-red-400 hover:text-red-300 p-1"
                                          >
                                             <Trash2 size={16} />
                                          </button>
                                       </div>

                                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                          <div>
                                             <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nome do Alimento</label>
                                             <input
                                                type="text"
                                                value={alimento.alimento || ''}
                                                onChange={(e) => {
                                                   const novosAlimentos = [...(editingDietaPlano[activeMealEdit] || [])];
                                                   novosAlimentos[index] = { ...novosAlimentos[index], alimento: e.target.value };
                                                   setEditingDietaPlano(prev => ({
                                                      ...prev,
                                                      [activeMealEdit]: novosAlimentos
                                                   }));
                                                }}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-green-400 transition-colors"
                                                placeholder="Ex: Peito de frango grelhado"
                                             />
                                          </div>

                                          <div>
                                             <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Quantidade</label>
                                             <input
                                                type="text"
                                                value={alimento.quantidade || ''}
                                                onChange={(e) => {
                                                   const novosAlimentos = [...(editingDietaPlano[activeMealEdit] || [])];
                                                   novosAlimentos[index] = { ...novosAlimentos[index], quantidade: e.target.value };
                                                   setEditingDietaPlano(prev => ({
                                                      ...prev,
                                                      [activeMealEdit]: novosAlimentos
                                                   }));
                                                }}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-green-400 transition-colors"
                                                placeholder="Ex: 150g"
                                             />
                                          </div>

                                          <div className="grid grid-cols-2 gap-3">
                                             <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Calorias</label>
                                                <input
                                                   type="text"
                                                   value={alimento.calorias || ''}
                                                   onChange={(e) => {
                                                      const novosAlimentos = [...(editingDietaPlano[activeMealEdit] || [])];
                                                      novosAlimentos[index] = { ...novosAlimentos[index], calorias: e.target.value };
                                                      setEditingDietaPlano(prev => ({
                                                         ...prev,
                                                         [activeMealEdit]: novosAlimentos
                                                      }));
                                                   }}
                                                   className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-green-400 transition-colors"
                                                   placeholder="250"
                                                />
                                             </div>

                                             <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Proteínas (g)</label>
                                                <input
                                                   type="text"
                                                   value={alimento.proteinas || ''}
                                                   onChange={(e) => {
                                                      const novosAlimentos = [...(editingDietaPlano[activeMealEdit] || [])];
                                                      novosAlimentos[index] = { ...novosAlimentos[index], proteinas: e.target.value };
                                                      setEditingDietaPlano(prev => ({
                                                         ...prev,
                                                         [activeMealEdit]: novosAlimentos
                                                      }));
                                                   }}
                                                   className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-green-400 transition-colors"
                                                   placeholder="30"
                                                />
                                             </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-3">
                                             <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Carboidratos (g)</label>
                                                <input
                                                   type="text"
                                                   value={alimento.carboidratos || ''}
                                                   onChange={(e) => {
                                                      const novosAlimentos = [...(editingDietaPlano[activeMealEdit] || [])];
                                                      novosAlimentos[index] = { ...novosAlimentos[index], carboidratos: e.target.value };
                                                      setEditingDietaPlano(prev => ({
                                                         ...prev,
                                                         [activeMealEdit]: novosAlimentos
                                                      }));
                                                   }}
                                                   className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-green-400 transition-colors"
                                                   placeholder="0"
                                                />
                                             </div>

                                             <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Gorduras (g)</label>
                                                <input
                                                   type="text"
                                                   value={alimento.gorduras || ''}
                                                   onChange={(e) => {
                                                      const novosAlimentos = [...(editingDietaPlano[activeMealEdit] || [])];
                                                      novosAlimentos[index] = { ...novosAlimentos[index], gorduras: e.target.value };
                                                      setEditingDietaPlano(prev => ({
                                                         ...prev,
                                                         [activeMealEdit]: novosAlimentos
                                                      }));
                                                   }}
                                                   className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-green-400 transition-colors"
                                                   placeholder="5"
                                                />
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 ))}

                                 {(editingDietaPlano[activeMealEdit] || []).length === 0 && (
                                    <div className="text-center py-12">
                                       <div className="text-zinc-600 mb-4">
                                          <Apple size={48} className="mx-auto mb-2" />
                                          <p className="text-lg font-bold">Nenhum alimento nesta refeição</p>
                                          <p className="text-sm">Clique em "Adicionar Alimento" para começar</p>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Footer com botões de ação */}
                  <div className="border-t border-zinc-800 p-6">
                     <div className="flex gap-3">
                        <button
                           onClick={() => {
                              setShowEditDietaModal(false);
                              setSelectedDietaEdit(null);
                              setEditingDietaPlano({
                                 cafeDaManha: [],
                                 lancheManha: [],
                                 almoco: [],
                                 lancheTarde: [],
                                 jantar: [],
                                 ceia: [],
                                 objetivoCalorico: ''
                              });
                           }}
                           className="flex-1 bg-zinc-800 text-white py-4 rounded-xl font-black uppercase hover:bg-zinc-700 transition-colors"
                        >
                           Cancelar
                        </button>
                        <button
                           onClick={() => {
                              salvarEdicaoDieta();
                           }}
                           className="flex-2 bg-gradient-to-r from-green-400 to-green-500 text-black py-4 px-8 rounded-xl font-black uppercase hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                           <Save size={20} />
                           Salvar Alterações
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Seção Financeiro / Cobranças */}
         {(tab === 'financeiro' || tab === 'financial') && (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                  <div>
                     <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">
                        Financeiro
                     </h2>
                     <p className="text-zinc-500 font-medium">Gerenciamento de mensalidades e pagamentos</p>
                  </div>
                  <div className="flex gap-3">
                     <button
                        onClick={() => setShowGerarMensalidadesModal(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-sm transition-all flex items-center gap-2"
                     >
                        <Calendar size={20} />
                        Gerar Mensalidades
                     </button>
                     <button
                        onClick={() => setShowAddPagamentoModal(true)}
                        className="bg-lime-400 hover:bg-lime-500 text-black px-6 py-3 rounded-2xl font-black uppercase text-sm transition-all flex items-center gap-2 shadow-lg shadow-lime-400/20"
                     >
                        <Plus size={20} />
                        Novo Pagamento
                     </button>
                  </div>
               </header>

               {/* Resumo Financeiro */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-3xl p-6">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="size-12 rounded-2xl bg-green-500/30 flex items-center justify-center">
                           <DollarSign className="text-green-400" size={24} />
                        </div>
                        <div>
                           <p className="text-xs text-green-400 font-bold uppercase">Recebido</p>
                           <p className="text-2xl font-black text-green-400">
                              R$ {pagamentos.filter(p => p.status === 'PAGO').reduce((sum, p) => sum + p.valor, 0).toFixed(2)}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-3xl p-6">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="size-12 rounded-2xl bg-yellow-500/30 flex items-center justify-center">
                           <Clock className="text-yellow-400" size={24} />
                        </div>
                        <div>
                           <p className="text-xs text-yellow-400 font-bold uppercase">Pendente</p>
                           <p className="text-2xl font-black text-yellow-400">
                              R$ {pagamentos.filter(p => p.status === 'PENDENTE').reduce((sum, p) => sum + p.valor, 0).toFixed(2)}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-3xl p-6">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="size-12 rounded-2xl bg-red-500/30 flex items-center justify-center">
                           <AlertTriangle className="text-red-400" size={24} />
                        </div>
                        <div>
                           <p className="text-xs text-red-400 font-bold uppercase">Atrasado</p>
                           <p className="text-2xl font-black text-red-400">
                              R$ {pagamentos.filter(p => p.status === 'ATRASADO').reduce((sum, p) => sum + p.valor, 0).toFixed(2)}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gradient-to-br from-lime-500/20 to-lime-600/20 border border-lime-500/30 rounded-3xl p-6">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="size-12 rounded-2xl bg-lime-500/30 flex items-center justify-center">
                           <TrendingUp className="text-lime-400" size={24} />
                        </div>
                        <div>
                           <p className="text-xs text-lime-400 font-bold uppercase">Total</p>
                           <p className="text-2xl font-black text-lime-400">
                              {pagamentos.length}
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Lista de Pagamentos */}
               <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                     <h3 className="text-xl font-black italic uppercase">Pagamentos</h3>
                     {pagamentos.length === 0 && (
                        <div className="text-xs text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 flex items-center gap-2">
                           <AlertTriangle size={14} />
                           Verifique se o servidor está rodando
                        </div>
                     )}
                  </div>
                  
                  <div className="overflow-x-auto">
                     <table className="w-full">
                        <thead className="bg-zinc-950/50">
                           <tr>
                              <th className="text-left p-4 text-xs font-black uppercase text-zinc-500">Aluno</th>
                              <th className="text-left p-4 text-xs font-black uppercase text-zinc-500">Mês Ref.</th>
                              <th className="text-left p-4 text-xs font-black uppercase text-zinc-500">Valor</th>
                              <th className="text-left p-4 text-xs font-black uppercase text-zinc-500">Vencimento</th>
                              <th className="text-left p-4 text-xs font-black uppercase text-zinc-500">Status</th>
                              <th className="text-left p-4 text-xs font-black uppercase text-zinc-500">Ações</th>
                           </tr>
                        </thead>
                        <tbody>
                           {pagamentos.length === 0 ? (
                              <tr>
                                 <td colSpan={6} className="text-center p-12">
                                    <DollarSign className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                                    <p className="text-zinc-400 font-bold">Nenhum pagamento registrado</p>
                                 </td>
                              </tr>
                           ) : (
                              pagamentos.map((pagamento) => {
                                 const aluno = alunos.find(a => a.id === pagamento.usuarioId);
                                 const vencido = new Date(pagamento.dataVencimento) < new Date() && pagamento.status === 'PENDENTE';
                                 
                                 return (
                                    <tr key={pagamento.id} className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                       <td className="p-4">
                                          <div className="flex items-center gap-3">
                                             {aluno?.imagemPerfil ? (
                                                <img src={aluno.imagemPerfil} alt={aluno.nome} className="size-10 rounded-full object-cover" />
                                             ) : (
                                                <div className="size-10 rounded-full bg-lime-400/20 flex items-center justify-center">
                                                   <span className="text-lime-400 font-black">
                                                      {aluno?.nome?.charAt(0).toUpperCase() || '?'}
                                                   </span>
                                                </div>
                                             )}
                                             <span className="font-semibold">{aluno?.nome || 'Aluno não encontrado'}</span>
                                          </div>
                                       </td>
                                       <td className="p-4 font-semibold">{pagamento.mesReferencia}</td>
                                       <td className="p-4 font-black text-lime-400">R$ {pagamento.valor.toFixed(2)}</td>
                                       <td className="p-4">
                                          <span className={vencido ? 'text-red-400 font-bold' : 'text-zinc-400'}>
                                             {new Date(pagamento.dataVencimento).toLocaleDateString('pt-BR')}
                                          </span>
                                       </td>
                                       <td className="p-4">
                                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                             pagamento.status === 'PAGO' ? 'bg-green-500/20 text-green-400' :
                                             pagamento.status === 'PENDENTE' ? 'bg-yellow-500/20 text-yellow-400' :
                                             pagamento.status === 'ATRASADO' ? 'bg-red-500/20 text-red-400' :
                                             'bg-zinc-500/20 text-zinc-400'
                                          }`}>
                                             {pagamento.status}
                                          </span>
                                       </td>
                                       <td className="p-4">
                                          <select
                                             value={pagamento.status}
                                             onChange={(e) => atualizarStatusPagamento(pagamento.id, e.target.value)}
                                             className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-semibold hover:border-lime-400 transition-colors focus:outline-none focus:border-lime-400"
                                          >
                                             <option value="PENDENTE">Pendente</option>
                                             <option value="PAGO">Pago</option>
                                             <option value="ATRASADO">Atrasado</option>
                                             <option value="CANCELADO">Cancelado</option>
                                          </select>
                                       </td>
                                    </tr>
                                 );
                              })
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {/* Seção Estoque / Produtos */}
         {(tab === 'estoque' || tab === 'stock') && (
            <div className="space-y-8 animate-in fade-in duration-700">
               <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                  <div>
                     <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-2 leading-none">
                        Estoque
                     </h2>
                     <p className="text-zinc-500 font-medium">Gerenciamento de produtos e inventário</p>
                     {produtos.length === 0 && (
                        <div className="mt-2 text-xs text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 inline-flex items-center gap-2">
                           <AlertTriangle size={14} />
                           Servidor offline ou nenhum produto cadastrado
                        </div>
                     )}
                  </div>
                  <button
                     onClick={() => setShowAddProdutoModal(true)}
                     className="bg-lime-400 hover:bg-lime-500 text-black px-6 py-3 rounded-2xl font-black uppercase text-sm transition-all flex items-center gap-2 shadow-lg shadow-lime-400/20"
                  >
                     <Plus size={20} />
                     Novo Produto
                  </button>
               </header>

               {/* Resumo de Estoque */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-lime-500/20 to-lime-600/20 border border-lime-500/30 rounded-3xl p-6">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="size-12 rounded-2xl bg-lime-500/30 flex items-center justify-center">
                           <Package className="text-lime-400" size={24} />
                        </div>
                        <div>
                           <p className="text-xs text-lime-400 font-bold uppercase">Total Produtos</p>
                           <p className="text-2xl font-black text-lime-400">{produtos.length}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-3xl p-6">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="size-12 rounded-2xl bg-blue-500/30 flex items-center justify-center">
                           <TrendingUp className="text-blue-400" size={24} />
                        </div>
                        <div>
                           <p className="text-xs text-blue-400 font-bold uppercase">Valor Total</p>
                           <p className="text-2xl font-black text-blue-400">
                              R$ {produtos.reduce((sum, p) => sum + (p.preco * p.estoque), 0).toFixed(2)}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-3xl p-6">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="size-12 rounded-2xl bg-yellow-500/30 flex items-center justify-center">
                           <AlertTriangle className="text-yellow-400" size={24} />
                        </div>
                        <div>
                           <p className="text-xs text-yellow-400 font-bold uppercase">Estoque Baixo</p>
                           <p className="text-2xl font-black text-yellow-400">
                              {produtos.filter(p => p.estoque < p.estoqueMinimo).length}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-3xl p-6">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="size-12 rounded-2xl bg-red-500/30 flex items-center justify-center">
                           <XCircle className="text-red-400" size={24} />
                        </div>
                        <div>
                           <p className="text-xs text-red-400 font-bold uppercase">Sem Estoque</p>
                           <p className="text-2xl font-black text-red-400">
                              {produtos.filter(p => p.estoque === 0).length}
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Lista de Produtos */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {produtos.length === 0 ? (
                     <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
                        <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-zinc-400 mb-2">Nenhum produto cadastrado</h3>
                        <p className="text-zinc-500">Adicione produtos ao estoque para começar</p>
                     </div>
                  ) : (
                     produtos.map((produto) => (
                        <div key={produto.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-lime-400/30 transition-all group">
                           {/* Imagem do Produto */}
                           <div className="aspect-video bg-zinc-950 flex items-center justify-center relative">
                              {produto.urlImagem ? (
                                 <img src={produto.urlImagem} alt={produto.nome} className="w-full h-full object-cover" />
                              ) : (
                                 <Package className="text-zinc-700" size={48} />
                              )}
                              {produto.estoque < produto.estoqueMinimo && produto.estoque > 0 && (
                                 <div className="absolute top-2 right-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-black">
                                    ESTOQUE BAIXO
                                 </div>
                              )}
                              {produto.estoque === 0 && (
                                 <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black">
                                    SEM ESTOQUE
                                 </div>
                              )}
                           </div>

                           <div className="p-6">
                              <div className="mb-4">
                                 <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-black text-lg group-hover:text-lime-400 transition-colors">
                                       {produto.nome}
                                    </h3>
                                    <span className="text-xs bg-lime-500/20 text-lime-400 px-2 py-1 rounded-full font-bold uppercase">
                                       {produto.categoria}
                                    </span>
                                 </div>
                                 {produto.descricao && (
                                    <p className="text-sm text-zinc-400 line-clamp-2">{produto.descricao}</p>
                                 )}
                              </div>

                              <div className="grid grid-cols-2 gap-3 mb-4">
                                 <div className="bg-zinc-950 rounded-xl p-3">
                                    <p className="text-xs text-zinc-500 uppercase mb-1">Preço</p>
                                    <p className="text-lg font-black text-lime-400">R$ {produto.preco.toFixed(2)}</p>
                                 </div>
                                 <div className="bg-zinc-950 rounded-xl p-3">
                                    <p className="text-xs text-zinc-500 uppercase mb-1">Estoque</p>
                                    <p className={`text-lg font-black ${
                                       produto.estoque === 0 ? 'text-red-400' :
                                       produto.estoque < produto.estoqueMinimo ? 'text-yellow-400' :
                                       'text-lime-400'
                                    }`}>
                                       {produto.estoque} un
                                    </p>
                                 </div>
                              </div>

                              {/* Ajuste Rápido de Estoque */}
                              <div className="flex items-center gap-2 mb-4 p-3 bg-zinc-950 rounded-xl">
                                 <button
                                    onClick={() => ajustarEstoque(produto.id, 1, 'remover')}
                                    className="size-8 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-500/30 transition-colors"
                                 >
                                    <Minus size={16} />
                                 </button>
                                 <div className="flex-1 text-center">
                                    <p className="text-xs text-zinc-500 uppercase">Ajuste Rápido</p>
                                 </div>
                                 <button
                                    onClick={() => ajustarEstoque(produto.id, 1, 'adicionar')}
                                    className="size-8 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center hover:bg-green-500/30 transition-colors"
                                 >
                                    <Plus size={16} />
                                 </button>
                              </div>

                              <div className="flex gap-2">
                                 <button
                                    onClick={() => {
                                       setSelectedProduto(produto);
                                       setProdutoForm({
                                          nome: produto.nome,
                                          categoria: produto.categoria,
                                          preco: produto.preco.toString(),
                                          estoque: produto.estoque.toString(),
                                          estoqueMinimo: produto.estoqueMinimo.toString(),
                                          descricao: produto.descricao || '',
                                          urlImagem: produto.urlImagem || ''
                                       });
                                       setShowEditProdutoModal(true);
                                    }}
                                    className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded-xl text-xs font-black uppercase hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
                                 >
                                    <Edit3 size={14} />
                                    Editar
                                 </button>
                                 <button
                                    onClick={() => deletarProduto(produto.id)}
                                    className="flex-1 bg-red-500/20 text-red-400 py-2 rounded-xl text-xs font-black uppercase hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                                 >
                                    <Trash2 size={14} />
                                    Deletar
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>
         )}

         {/* Modal: Adicionar Produto */}
         {showAddProdutoModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-lime-400/30 rounded-3xl max-w-2xl w-full shadow-2xl shadow-lime-400/20 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900/95 backdrop-blur-sm">
                     <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center">
                           <Package className="text-black" size={24} />
                        </div>
                        <h2 className="text-2xl font-black">Novo Produto</h2>
                     </div>
                     <button
                        onClick={() => setShowAddProdutoModal(false)}
                        className="size-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-colors"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  <div className="p-6 space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nome do Produto</label>
                        <input
                           type="text"
                           value={produtoForm.nome}
                           onChange={(e) => setProdutoForm({ ...produtoForm, nome: e.target.value })}
                           className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                           placeholder="Ex: Whey Protein 1kg"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Categoria</label>
                           <select
                              value={produtoForm.categoria}
                              onChange={(e) => setProdutoForm({ ...produtoForm, categoria: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                           >
                              <option value="suplementos">Suplementos</option>
                              <option value="equipamentos">Equipamentos</option>
                              <option value="acessorios">Acessórios</option>
                              <option value="vestuario">Vestuário</option>
                              <option value="outros">Outros</option>
                           </select>
                        </div>

                        <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Preço (R$)</label>
                           <input
                              type="number"
                              step="0.01"
                              value={produtoForm.preco}
                              onChange={(e) => setProdutoForm({ ...produtoForm, preco: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                              placeholder="0.00"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Estoque Inicial</label>
                           <input
                              type="number"
                              value={produtoForm.estoque}
                              onChange={(e) => setProdutoForm({ ...produtoForm, estoque: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                              placeholder="0"
                           />
                        </div>

                        <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Estoque Mínimo</label>
                           <input
                              type="number"
                              value={produtoForm.estoqueMinimo}
                              onChange={(e) => setProdutoForm({ ...produtoForm, estoqueMinimo: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                              placeholder="10"
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">URL da Imagem (Opcional)</label>
                        <input
                           type="url"
                           value={produtoForm.urlImagem}
                           onChange={(e) => setProdutoForm({ ...produtoForm, urlImagem: e.target.value })}
                           className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                           placeholder="https://exemplo.com/imagem.jpg"
                        />
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Descrição (Opcional)</label>
                        <textarea
                           value={produtoForm.descricao}
                           onChange={(e) => setProdutoForm({ ...produtoForm, descricao: e.target.value })}
                           className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                           rows={3}
                           placeholder="Descrição do produto..."
                        />
                     </div>
                  </div>

                  <div className="border-t border-zinc-800 p-6 flex gap-3">
                     <button
                        onClick={() => setShowAddProdutoModal(false)}
                        className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-black uppercase hover:bg-zinc-700 transition-colors"
                     >
                        Cancelar
                     </button>
                     <button
                        onClick={criarProduto}
                        className="flex-1 bg-gradient-to-r from-lime-400 to-lime-500 text-black py-3 rounded-xl font-black uppercase hover:opacity-90 transition-all"
                     >
                        Criar Produto
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Modal: Editar Produto */}
         {showEditProdutoModal && selectedProduto && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-blue-400/30 rounded-3xl max-w-2xl w-full shadow-2xl shadow-blue-400/20 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900/95 backdrop-blur-sm">
                     <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                           <Edit3 className="text-black" size={24} />
                        </div>
                        <h2 className="text-2xl font-black">Editar Produto</h2>
                     </div>
                     <button
                        onClick={() => {
                           setShowEditProdutoModal(false);
                           setSelectedProduto(null);
                        }}
                        className="size-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-colors"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  <div className="p-6 space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nome do Produto</label>
                        <input
                           type="text"
                           value={produtoForm.nome}
                           onChange={(e) => setProdutoForm({ ...produtoForm, nome: e.target.value })}
                           className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-blue-400 transition-colors"
                           placeholder="Ex: Whey Protein 1kg"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Categoria</label>
                           <select
                              value={produtoForm.categoria}
                              onChange={(e) => setProdutoForm({ ...produtoForm, categoria: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-blue-400 transition-colors"
                           >
                              <option value="suplementos">Suplementos</option>
                              <option value="equipamentos">Equipamentos</option>
                              <option value="acessorios">Acessórios</option>
                              <option value="vestuario">Vestuário</option>
                              <option value="outros">Outros</option>
                           </select>
                        </div>

                        <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Preço (R$)</label>
                           <input
                              type="number"
                              step="0.01"
                              value={produtoForm.preco}
                              onChange={(e) => setProdutoForm({ ...produtoForm, preco: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-blue-400 transition-colors"
                              placeholder="0.00"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Estoque Atual</label>
                           <input
                              type="number"
                              value={produtoForm.estoque}
                              onChange={(e) => setProdutoForm({ ...produtoForm, estoque: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-blue-400 transition-colors"
                              placeholder="0"
                           />
                        </div>

                        <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Estoque Mínimo</label>
                           <input
                              type="number"
                              value={produtoForm.estoqueMinimo}
                              onChange={(e) => setProdutoForm({ ...produtoForm, estoqueMinimo: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-blue-400 transition-colors"
                              placeholder="10"
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">URL da Imagem (Opcional)</label>
                        <input
                           type="url"
                           value={produtoForm.urlImagem}
                           onChange={(e) => setProdutoForm({ ...produtoForm, urlImagem: e.target.value })}
                           className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-blue-400 transition-colors"
                           placeholder="https://exemplo.com/imagem.jpg"
                        />
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Descrição (Opcional)</label>
                        <textarea
                           value={produtoForm.descricao}
                           onChange={(e) => setProdutoForm({ ...produtoForm, descricao: e.target.value })}
                           className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-blue-400 transition-colors"
                           rows={3}
                           placeholder="Descrição do produto..."
                        />
                     </div>
                  </div>

                  <div className="border-t border-zinc-800 p-6 flex gap-3">
                     <button
                        onClick={() => {
                           setShowEditProdutoModal(false);
                           setSelectedProduto(null);
                        }}
                        className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-black uppercase hover:bg-zinc-700 transition-colors"
                     >
                        Cancelar
                     </button>
                     <button
                        onClick={atualizarProduto}
                        className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 text-black py-3 rounded-xl font-black uppercase hover:opacity-90 transition-all"
                     >
                        Salvar Alterações
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Modal: Adicionar Pagamento */}
         {showAddPagamentoModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-lime-400/30 rounded-3xl max-w-2xl w-full shadow-2xl shadow-lime-400/20">
                  <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                     <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center">
                           <DollarSign className="text-black" size={24} />
                        </div>
                        <h2 className="text-2xl font-black">Novo Pagamento</h2>
                     </div>
                     <button
                        onClick={() => setShowAddPagamentoModal(false)}
                        className="size-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-colors"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  <div className="p-6 space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Aluno</label>
                        <select
                           value={pagamentoForm.usuarioId}
                           onChange={(e) => setPagamentoForm({ ...pagamentoForm, usuarioId: e.target.value })}
                           className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                        >
                           <option value="">Selecione um aluno</option>
                           {alunos.map(aluno => (
                              <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
                           ))}
                        </select>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Valor (R$)</label>
                           <input
                              type="number"
                              step="0.01"
                              value={pagamentoForm.valor}
                              onChange={(e) => setPagamentoForm({ ...pagamentoForm, valor: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                              placeholder="150.00"
                           />
                        </div>

                        <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Mês Referência</label>
                           <input
                              type="month"
                              value={pagamentoForm.mesReferencia}
                              onChange={(e) => setPagamentoForm({ ...pagamentoForm, mesReferencia: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Data Vencimento</label>
                        <input
                           type="date"
                           value={pagamentoForm.dataVencimento}
                           onChange={(e) => setPagamentoForm({ ...pagamentoForm, dataVencimento: e.target.value })}
                           className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                        />
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Observações (Opcional)</label>
                        <textarea
                           value={pagamentoForm.observacoes}
                           onChange={(e) => setPagamentoForm({ ...pagamentoForm, observacoes: e.target.value })}
                           className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-lime-400 transition-colors"
                           rows={3}
                           placeholder="Observações adicionais..."
                        />
                     </div>
                  </div>

                  <div className="border-t border-zinc-800 p-6 flex gap-3">
                     <button
                        onClick={() => setShowAddPagamentoModal(false)}
                        className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-black uppercase hover:bg-zinc-700 transition-colors"
                     >
                        Cancelar
                     </button>
                     <button
                        onClick={criarPagamento}
                        className="flex-1 bg-gradient-to-r from-lime-400 to-lime-500 text-black py-3 rounded-xl font-black uppercase hover:opacity-90 transition-all"
                     >
                        Criar Pagamento
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Modal: Gerar Mensalidades */}
         {showGerarMensalidadesModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-blue-400/30 rounded-3xl max-w-2xl w-full shadow-2xl shadow-blue-400/20">
                  <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                     <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                           <Calendar className="text-black" size={24} />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black">Gerar Mensalidades</h2>
                           <p className="text-sm text-zinc-400">Criar pagamentos para todos os alunos ativos</p>
                        </div>
                     </div>
                     <button
                        onClick={() => setShowGerarMensalidadesModal(false)}
                        className="size-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-colors"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  <div className="p-6 space-y-4">
                     <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <p className="text-sm text-blue-400">
                           <AlertTriangle className="inline mr-2" size={16} />
                           Isso irá criar um pagamento para cada aluno ativo da academia.
                        </p>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Mês Referência</label>
                           <input
                              type="month"
                              value={mensalidadeForm.mesReferencia}
                              onChange={(e) => setMensalidadeForm({ ...mensalidadeForm, mesReferencia: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-blue-400 transition-colors"
                           />
                        </div>

                        <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Valor (R$)</label>
                           <input
                              type="number"
                              step="0.01"
                              value={mensalidadeForm.valor}
                              onChange={(e) => setMensalidadeForm({ ...mensalidadeForm, valor: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-blue-400 transition-colors"
                              placeholder="150.00"
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Dia do Vencimento</label>
                        <select
                           value={mensalidadeForm.diaVencimento}
                           onChange={(e) => setMensalidadeForm({ ...mensalidadeForm, diaVencimento: e.target.value })}
                           className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 focus:outline-none focus:border-blue-400 transition-colors"
                        >
                           {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                              <option key={dia} value={dia}>{dia}</option>
                           ))}
                        </select>
                     </div>

                     <div className="bg-zinc-950 rounded-xl p-4">
                        <p className="text-sm text-zinc-400">
                           Serão criadas <span className="text-lime-400 font-black">{alunos.filter(a => a.ativo).length}</span> mensalidades para alunos ativos.
                        </p>
                     </div>
                  </div>

                  <div className="border-t border-zinc-800 p-6 flex gap-3">
                     <button
                        onClick={() => setShowGerarMensalidadesModal(false)}
                        className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-black uppercase hover:bg-zinc-700 transition-colors"
                     >
                        Cancelar
                     </button>
                     <button
                        onClick={gerarMensalidadesAutomaticas}
                        className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 text-black py-3 rounded-xl font-black uppercase hover:opacity-90 transition-all"
                     >
                        Gerar Mensalidades
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Modal de Evolução */}
         {showEvolucaoModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
               <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-purple-400/30 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-purple-400/20">
                  <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900/95 backdrop-blur-sm">
                     <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center">
                           <TrendingUp className="text-black" size={24} />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black">Evolução - {selectedStudent?.nome}</h2>
                           <p className="text-sm text-zinc-400">Histórico de medições</p>
                        </div>
                     </div>
                     <button
                        onClick={() => setShowEvolucaoModal(false)}
                        className="size-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-colors"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  <div className="p-6 space-y-4">
                     {medicoesAluno.length > 0 ? (
                        medicoesAluno.map((medicao: any, index: number) => (
                           <div key={medicao.id || index} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                       <TrendingUp className="text-purple-400" size={20} />
                                    </div>
                                    <div>
                                       <h3 className="font-black text-lg">{new Date(medicao.data).toLocaleDateString('pt-BR')}</h3>
                                       <p className="text-sm text-zinc-500">Medição #{medicoesAluno.length - index}</p>
                                    </div>
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 {medicao.peso && (
                                    <div className="bg-zinc-950 rounded-xl p-4">
                                       <p className="text-xs text-zinc-500 uppercase mb-1">Peso</p>
                                       <p className="text-2xl font-black text-purple-400">{medicao.peso} kg</p>
                                    </div>
                                 )}
                                 {medicao.altura && (
                                    <div className="bg-zinc-950 rounded-xl p-4">
                                       <p className="text-xs text-zinc-500 uppercase mb-1">Altura</p>
                                       <p className="text-2xl font-black text-purple-400">{medicao.altura} cm</p>
                                    </div>
                                 )}
                                 {medicao.gorduraCorporal && (
                                    <div className="bg-zinc-950 rounded-xl p-4">
                                       <p className="text-xs text-zinc-500 uppercase mb-1">Gordura</p>
                                       <p className="text-2xl font-black text-purple-400">{medicao.gorduraCorporal}%</p>
                                    </div>
                                 )}
                                 {medicao.massaMuscular && (
                                    <div className="bg-zinc-950 rounded-xl p-4">
                                       <p className="text-xs text-zinc-500 uppercase mb-1">Massa Muscular</p>
                                       <p className="text-2xl font-black text-purple-400">{medicao.massaMuscular} kg</p>
                                    </div>
                                 )}
                              </div>

                              {medicao.observacoes && (
                                 <div className="mt-4 pt-4 border-t border-zinc-800">
                                    <p className="text-xs text-zinc-500 uppercase mb-2">Observações</p>
                                    <p className="text-sm text-zinc-300">{medicao.observacoes}</p>
                                 </div>
                              )}
                           </div>
                        ))
                     ) : (
                        <div className="text-center py-12">
                           <div className="size-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                              <TrendingUp className="text-purple-400" size={32} />
                           </div>
                           <p className="text-lg font-bold text-zinc-400 mb-2">Nenhuma medição registrada</p>
                           <p className="text-sm text-zinc-600">As medições de evolução aparecerão aqui</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* Modal de Fotos de Progresso */}
         {showFotosModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
               <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-orange-400/30 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-orange-400/20">
                  <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900/95 backdrop-blur-sm">
                     <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                           <Camera className="text-black" size={24} />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black">Fotos de Progresso - {selectedStudent?.nome}</h2>
                           <p className="text-sm text-zinc-400">Registro fotográfico da evolução</p>
                        </div>
                     </div>
                     <button
                        onClick={() => setShowFotosModal(false)}
                        className="size-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-colors"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  <div className="p-6">
                     {fotosAluno.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {fotosAluno.map((foto: any, index: number) => (
                              <div key={foto.id || index} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                 <div className="aspect-square bg-zinc-950 flex items-center justify-center">
                                    {foto.url ? (
                                       <img 
                                          src={foto.url} 
                                          alt={`Progresso ${new Date(foto.data).toLocaleDateString('pt-BR')}`}
                                          className="w-full h-full object-cover"
                                       />
                                    ) : (
                                       <Camera className="text-zinc-700" size={48} />
                                    )}
                                 </div>
                                 <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                       <span className="text-sm font-black text-orange-400">
                                          {new Date(foto.data).toLocaleDateString('pt-BR')}
                                       </span>
                                       {foto.tipo && (
                                          <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-bold uppercase">
                                             {foto.tipo}
                                          </span>
                                       )}
                                    </div>
                                    {foto.observacoes && (
                                       <p className="text-sm text-zinc-400 mt-2">{foto.observacoes}</p>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="text-center py-12">
                           <div className="size-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                              <Camera className="text-orange-400" size={32} />
                           </div>
                           <p className="text-lg font-bold text-zinc-400 mb-2">Nenhuma foto registrada</p>
                           <p className="text-sm text-zinc-600">As fotos de progresso aparecerão aqui</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

const AppContent: React.FC = () => {
  const { user, academia, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Carregar produtos quando entrar na loja
  useEffect(() => {
    if (activeView === 'store' && products.length === 0) {
      const carregarProdutosLoja = async () => {
        const token = localStorage.getItem('fitness_token');
        if (!token) return;
        
        try {
          const produtosCarregados = await carregarProdutos(token);
          const produtosFormatados = produtosCarregados.map((p: any) => ({
            id: p.id,
            name: p.nome,
            price: p.preco,
            category: p.categoria,
            image: p.urlImagem || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
            rating: 4.5,
            reviews: Math.floor(Math.random() * 100) + 10
          }));
          setProducts(produtosFormatados);
        } catch (error) {
          console.error('Erro ao carregar produtos:', error);
        }
      };
      
      carregarProdutosLoja();
    }
  }, [activeView, products.length]);
  
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
  
  const [biometrics, setBiometrics] = useState<Biometrics>({ height: '1.82', weight: '84.2', age: '26', goal: 'Hipertrofia' });
  
  // Carregar dados de perfil do banco ao montar
  useEffect(() => {
    const carregarDadosPerfil = async () => {
      try {
        const response = await fetch(`${API_URL}/api/usuario/perfil`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('fitness_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const dados = await response.json();
          console.log('📊 Dados do perfil carregados:', dados);
          
          // Atualizar biometria se existir no banco
          if (dados.altura || dados.peso || dados.idade || dados.objetivo) {
            setBiometrics({
              height: dados.altura || '1.82',
              weight: dados.peso || '84.2',
              age: dados.idade || '26',
              goal: dados.objetivo || 'Hipertrofia'
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    };
    
    if (user) {
      carregarDadosPerfil();
    }
  }, [user]);
  
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [dietPlans, setDietPlans] = useState<Record<number, any>>({});
  
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

  // Verificar autenticação após todos os hooks
  if (!user || !academia) {
    return <LoginForm setActiveView={setActiveView} />;
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans overflow-x-hidden">
      {/* Header Mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-zinc-900 rounded-xl transition-colors"
        >
          <Menu size={24} className="text-lime-400" />
        </button>
        <div className="flex items-center gap-2 text-lime-400 font-black text-sm italic uppercase">
          <div className="size-8 bg-lime-400 text-black rounded-xl flex items-center justify-center rotate-3">
            <Dumbbell size={18} strokeWidth={3} />
          </div>
          <span>{academia.name}</span>
        </div>
        <div className="w-10" /> {/* Spacer para centralizar */}
      </header>

      {/* Overlay para mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/70 z-[100] animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop e Mobile Drawer */}
      <aside className={`
        fixed md:sticky top-0 h-screen bg-zinc-950 border-r border-zinc-900 z-[110] transition-all duration-300
        flex flex-col p-8 overflow-x-hidden
        ${mobileMenuOpen ? 'left-0' : '-left-full md:left-0'}
        ${sidebarOpen ? 'w-80' : 'w-28 md:w-28'}
        md:transition-all md:duration-500
      `}>
        <div className="flex items-center justify-between gap-5 shrink-0 mb-8">
          <div className="flex items-center gap-5 text-lime-400 font-black text-xl italic uppercase">
            <div className="size-14 bg-lime-400 text-black rounded-[1.5rem] flex items-center justify-center rotate-3 border-[4px] border-zinc-950 shadow-xl">
              <Dumbbell size={32} strokeWidth={3} />
            </div>
            {sidebarOpen && (
              <div>
                <span className="block leading-none">{academia.name}</span>
                <span className="text-xs text-zinc-500 font-normal normal-case">{user.nome || user.name}</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-2 hover:bg-zinc-900 rounded-xl transition-colors"
          >
            <X size={24} className="text-zinc-500" />
          </button>
        </div>
        <nav className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden min-h-0 mb-8">
          <NavItem icon={<LayoutDashboard size={24}/>} label="Painel" active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
          {console.log('🔍 DEBUG Menu - user.role:', user?.role, 'user completo:', user)}
          {user.role === 'ALUNO' && (
            <>
              <NavItem icon={<Dumbbell size={24}/>} label="Treinos" active={activeView === 'workouts'} onClick={() => { setActiveView('workouts'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<Activity size={24}/>} label="Cardio" active={activeView === 'cardio'} onClick={() => { setActiveView('cardio'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<Apple size={24}/>} label="Nutrição" active={activeView === 'diet'} onClick={() => { setActiveView('diet'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<Trophy size={24}/>} label="Metas" active={activeView === 'goals'} onClick={() => { setActiveView('goals'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<Users size={24}/>} label="Grupos" active={activeView === 'groups'} onClick={() => { setActiveView('groups'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<ShoppingBag size={24}/>} label="Loja" active={activeView === 'store'} onClick={() => { setActiveView('store'); if(activeView === 'store') setIsCartOpen(true); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} badge={cart.length} />
              <NavItem icon={<TrendingUp size={24}/>} label="Evolução" active={activeView === 'evolution'} onClick={() => { setActiveView('evolution'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<User size={24}/>} label="Perfil" active={activeView === 'profile'} onClick={() => { setActiveView('profile'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
            </>
          )}
          {user.role === 'PROFESSOR' && (
            <>
              <NavItem icon={<Users size={24}/>} label="Alunos" active={activeView === 'students'} onClick={() => { setActiveView('students'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<BookMarked size={24}/>} label="Modelos" active={activeView === 'templates'} onClick={() => { setActiveView('templates'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<Calendar size={24}/>} label="Agenda" active={activeView === 'schedule'} onClick={() => { setActiveView('schedule'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<ClipboardList size={24}/>} label="Avaliações" active={activeView === 'assessments'} onClick={() => { setActiveView('assessments'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
            </>
          )}
          {user.role === 'NUTRI' && (
            <>
              <NavItem icon={<Users size={24}/>} label="Pacientes" active={activeView === 'students'} onClick={() => { setActiveView('students'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<Utensils size={24}/>} label="Dietas" active={activeView === 'diets'} onClick={() => { setActiveView('diets'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<Camera size={24}/>} label="Diário Visual" active={activeView === 'diary'} onClick={() => { setActiveView('diary'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<Scale size={24}/>} label="Composição" active={activeView === 'composition'} onClick={() => { setActiveView('composition'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<BookOpen size={24}/>} label="Educação" active={activeView === 'education'} onClick={() => { setActiveView('education'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
            </>
          )}
          {user.role === 'ADMIN' && (
            <>
              <NavItem icon={<Users size={24}/>} label="Usuários" active={activeView === 'users'} onClick={() => { setActiveView('users'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<Dumbbell size={24}/>} label="Alunos" active={activeView === 'alunos'} onClick={() => { setActiveView('alunos'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<Briefcase size={24}/>} label="Equipe" active={activeView === 'equipe'} onClick={() => { setActiveView('equipe'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<DollarSign size={24}/>} label="Financeiro" active={activeView === 'financial'} onClick={() => { setActiveView('financial'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<Users size={24}/>} label="CRM" active={activeView === 'crm'} onClick={() => { setActiveView('crm'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<Package size={24}/>} label="Estoque" active={activeView === 'stock'} onClick={() => { setActiveView('stock'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<Wrench size={24}/>} label="Manutenção" active={activeView === 'maintenance'} onClick={() => { setActiveView('maintenance'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
              <NavItem icon={<BarChart3 size={24}/>} label="Analytics" active={activeView === 'analytics'} onClick={() => { setActiveView('analytics'); setMobileMenuOpen(false); }} collapsed={!sidebarOpen} />
            </>
          )}
        </nav>
        <div className="space-y-3 shrink-0">
          <button
            onClick={logout}
            className="w-full p-4 bg-red-900/20 border border-red-800/30 rounded-3xl flex items-center justify-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-all font-bold text-xs uppercase"
          >
            <LogOut size={20}/>
            {sidebarOpen && 'Sair'}
          </button>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="hidden md:flex w-full p-4 bg-zinc-900 border border-zinc-800 rounded-3xl justify-center text-zinc-400 hover:text-white transition-all"
          >
            {sidebarOpen ? <ArrowLeft size={24}/> : <ArrowRight size={24}/>}
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-4 md:p-6 lg:p-12 lg:px-20 max-w-8xl mx-auto w-full pt-20 md:pt-6 pb-20 md:pb-32">
        {user.role === 'ALUNO' && (
          <StudentModule 
            user={user}
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
        {user.role === 'PROFESSOR' && (
          <ProfessorModule 
            view={activeView} setView={setActiveView} students={students} 
            onAddStudent={()=>{}} templates={workoutTemplates} 
            onAddTemplate={(d:any)=>setWorkoutTemplates([d, ...workoutTemplates])} 
            onRemoveTemplate={(id:any)=>setWorkoutTemplates(workoutTemplates.filter(t=>t.id!==id))} 
            dietPlans={dietPlans} setDietPlans={setDietPlans}
            user={user} academia={academia}
          />
        )}
        {user.role === 'NUTRI' && (
          <NutriModule 
            view={activeView} setView={setActiveView} students={students}
            user={user} academia={academia}
          />
        )}
        {user.role === 'ADMIN' && <AdminModule view={activeView} user={user} academia={academia} />}
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
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
