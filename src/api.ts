// API Service para FitnessTech
// Gerencia todas as chamadas ao backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// Helper para headers com autenticação
const getHeaders = (includeAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = localStorage.getItem('fitness_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Helper para tratamento de erros
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || 'Erro na requisição');
  }
  return response.json();
};

// ===== AUTENTICAÇÃO =====

export const authAPI = {
  register: async (data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    plan?: string;
    phone?: string;
    cpf?: string;
  }) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    
    // Salvar token no localStorage
    if (data.token) {
      localStorage.setItem('fitness_auth_token', data.token);
      localStorage.setItem('fitness_current_user', JSON.stringify(data.user));
    }
    
    return data;
  },

  logout: () => {
    localStorage.removeItem('fitness_auth_token');
    localStorage.removeItem('fitness_current_user');
  },
};

// ===== PERFIL =====

export const userAPI = {
  getProfile: async () => {
    const response = await fetch(`${API_URL}/user/profile`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateProfile: async (data: {
    name?: string;
    phone?: string;
    cpf?: string;
    profileImage?: string;
    altura?: string;
    peso?: string;
    idade?: string;
    objetivo?: string;
  }) => {
    const response = await fetch(`${API_URL}/usuario/perfil`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ===== TREINOS =====

export const workoutAPI = {
  getHistory: async () => {
    const response = await fetch(`${API_URL}/workouts/history`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  saveWorkout: async (data: {
    workoutTitle: string;
    exercises: any[];
    duration: number;
    calories: number;
    notes?: string;
  }) => {
    const response = await fetch(`${API_URL}/workouts/history`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getNotes: async () => {
    const response = await fetch(`${API_URL}/workouts/notes`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  saveNote: async (data: {
    workoutTitle: string;
    exerciseTitle: string;
    note: string;
  }) => {
    const response = await fetch(`${API_URL}/workouts/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ===== PROGRESSO =====

export const progressAPI = {
  getPhotos: async () => {
    const response = await fetch(`${API_URL}/progress/photos`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  savePhoto: async (data: {
    imageUrl: string;
    weight?: number;
    notes?: string;
  }) => {
    const response = await fetch(`${API_URL}/progress/photos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deletePhoto: async (id: string) => {
    const response = await fetch(`${API_URL}/progress/photos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getMeasurements: async () => {
    const response = await fetch(`${API_URL}/progress/measurements`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  saveMeasurement: async (data: {
    weight: number;
    height?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
    bodyFat?: number;
  }) => {
    const response = await fetch(`${API_URL}/progress/measurements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ===== METAS =====

export const goalsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/goals`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data: {
    title: string;
    target: number;
    deadline: string;
  }) => {
    const response = await fetch(`${API_URL}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id: string, data: { current?: number; completed?: boolean }) => {
    const response = await fetch(`${API_URL}/goals/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ===== BADGES =====

export const badgesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/badges`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data: {
    title: string;
    description: string;
    icon: string;
  }) => {
    const response = await fetch(`${API_URL}/badges`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ===== DESAFIOS =====

export const challengesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/challenges`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data: {
    title: string;
    description: string;
    target: number;
    reward: string;
    expiresAt: string;
  }) => {
    const response = await fetch(`${API_URL}/challenges`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id: string, data: { progress?: number; completed?: boolean }) => {
    const response = await fetch(`${API_URL}/challenges/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ===== SOCIAL =====

export const socialAPI = {
  getPosts: async () => {
    const response = await fetch(`${API_URL}/social/posts`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createPost: async (data: {
    content: string;
    image?: string;
  }) => {
    const response = await fetch(`${API_URL}/social/posts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  likePost: async (id: string) => {
    const response = await fetch(`${API_URL}/social/posts/${id}/like`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getGroups: async () => {
    const response = await fetch(`${API_URL}/social/groups`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  joinGroup: async (id: string) => {
    const response = await fetch(`${API_URL}/social/groups/${id}/join`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getRanking: async (category = 'mensal', period?: string) => {
    const params = new URLSearchParams({ category });
    if (period) params.append('period', period);
    
    const response = await fetch(`${API_URL}/social/ranking?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateRanking: async (data: {
    points: number;
    category: string;
    period: string;
  }) => {
    const response = await fetch(`${API_URL}/social/ranking`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ===== NOTIFICAÇÕES =====

export const notificationsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/notifications`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data: {
    title: string;
    message: string;
    type: string;
  }) => {
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  markAsRead: async (id: string) => {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ===== CARRINHO =====

export const cartAPI = {
  getItems: async () => {
    const response = await fetch(`${API_URL}/cart`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  addItem: async (data: {
    productName: string;
    productImage: string;
    price: number;
    quantity: number;
  }) => {
    const response = await fetch(`${API_URL}/cart`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  removeItem: async (id: string) => {
    const response = await fetch(`${API_URL}/cart/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ===== AGENDAMENTOS =====

export const scheduleAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/schedules`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getByStudent: async (studentId: string) => {
    const response = await fetch(`${API_URL}/schedules/student/${studentId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data: {
    alunoId: string;
    data: string;
    hora: string;
    tipo: string;
    observacoes?: string;
  }) => {
    const response = await fetch(`${API_URL}/schedules`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id: string, data: {
    data?: string;
    hora?: string;
    tipo?: string;
    status?: string;
    observacoes?: string;
  }) => {
    const response = await fetch(`${API_URL}/schedules/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/schedules/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ===== METAS =====

export const metaAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/metas`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data: {
    titulo: string;
    descricao?: string;
    valorAlvo: number;
    valorAtual?: number;
    unidade: string;
    prazo?: string;
  }) => {
    const response = await fetch(`${API_URL}/metas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id: string, data: {
    titulo?: string;
    descricao?: string;
    valorAlvo?: number;
    valorAtual?: number;
    prazo?: string;
    completada?: boolean;
  }) => {
    const response = await fetch(`${API_URL}/metas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/metas/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ===== HEALTH CHECK =====

export const checkHealth = async () => {
  const response = await fetch(`${API_URL}/health`);
  return handleResponse(response);
};
