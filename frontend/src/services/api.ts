// API service for communicating with the Flask backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  data?: any[];
  sql_used?: string;
  sql_executed?: boolean;
  confidence?: number;
  execution_time?: number;
  cached?: boolean;
  insights?: {
    key_finding: string;
    supporting_metrics: string[];
    recommendations: string[];
    related_questions: string[];
  };
}

export interface ChatSession {
  session_id: string;
  user_email: string;
  created_at: string;
  last_activity: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Health check
  async healthCheck(): Promise<{ status: string; chatbot_ready: boolean }> {
    return this.fetchApi('/api/health');
  }

  // Start a new chat session
  async startChatSession(userEmail: string): Promise<{
    success: boolean;
    session_id: string;
    welcome_message: string;
    suggested_questions: string[];
  }> {
    return this.fetchApi('/api/chat/start', {
      method: 'POST',
      body: JSON.stringify({ userEmail }),
    });
  }

  // Send a chat message
  async sendMessage(sessionId: string, message: string): Promise<{
    success: boolean;
    response: {
      text: string;
      data: any[];
      sql_used: string;
      sql_executed: boolean;
      confidence: number;
      execution_time: number;
      cached: boolean;
      insights: {
        key_finding: string;
        supporting_metrics: string[];
        recommendations: string[];
        related_questions: string[];
      };
      suggested_questions: string[];
      session_id: string;
    };
  }> {
    return this.fetchApi('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        message,
      }),
    });
  }

  // Get chat history
  async getChatHistory(sessionId: string): Promise<{
    success: boolean;
    history: Array<{
      question: string;
      answer: string;
      sql_used: string;
      timestamp: string;
    }>;
    session_info: ChatSession;
  }> {
    return this.fetchApi(`/api/chat/history/${sessionId}`);
  }

  // Get suggested questions based on conversation context
  async getSuggestedQuestions(sessionId: string): Promise<{
    success: boolean;
    questions: string[];
    question_type: 'initial' | 'follow_up';
    based_on_last_question?: string;
  }> {
    return this.fetchApi('/api/chat/suggested-questions', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });
  }

  // Get analytics
  async getAnalytics(): Promise<{
    success: boolean;
    analytics: {
      cache: {
        total_cached_queries: number;
        total_cache_hits: number;
        cache_hit_rate: number;
      };
      sessions: {
        active_sessions: number;
        total_conversation_turns: number;
        avg_turns_per_session: number;
      };
    };
  }> {
    return this.fetchApi('/api/analytics/sessions');
  }

  // Get data summary
  async getDataSummary(): Promise<{
    success: boolean;
    data_summary: {
      tables: string[];
      columns: Record<string, string>;
      sample_data: Record<string, Record<string, any[]>>;
      stats: Record<string, Record<string, any>>;
    };
  }> {
    return this.fetchApi('/api/data/summary');
  }

  // Get revenue data by region
  async getRevenueByRegion(): Promise<{
    success: boolean;
    data: Array<{
      name: string;
      value: number;
      percentage: number;
      visitantes: number;
      conversiones: number;
      pdv_count: number;
      conversion_rate: number;
    }>;
    total_revenue: number;
    summary: {
      total_regions: number;
      total_pdvs: number;
      period_covered: string[];
    };
  }> {
    return this.fetchApi('/api/analytics/revenue-by-region');
  }

  // Get revenue data by city
  async getRevenueByCity(): Promise<{
    success: boolean;
    data: Array<{
      name: string;
      value: number;
      percentage: number;
      region: string;
      visitantes: number;
      conversiones: number;
      pdv_count: number;
      conversion_rate: number;
    }>;
    total_revenue: number;
  }> {
    return this.fetchApi('/api/analytics/revenue-by-city');
  }

  // Get dashboard filter options
  async getDashboardFilterOptions(): Promise<{
    success: boolean;
    options: {
      tipologia: string[];
      palanca: string[];
      kpi: string[];
      fuente_datos: string[];
      unidad_medida: string[];
      categoria: string[];
    };
  }> {
    return this.fetchApi('/api/dashboard/filter-options');
  }

  // Get palancas filtered by tipologia
  async getPalancasByTipologia(tipologia: string): Promise<{
    success: boolean;
    palancas: string[];
    tipologia: string;
  }> {
    const params = new URLSearchParams();
    params.append('tipologia', tipologia);
    return this.fetchApi(`/api/dashboard/palancas-by-tipologia?${params.toString()}`);
  }

  // Get fuentes filtered by tipologia
  async getFuentesByTipologia(tipologia: string): Promise<{
    success: boolean;
    fuentes: string[];
    tipologia: string;
  }> {
    const params = new URLSearchParams();
    params.append('tipologia', tipologia);
    return this.fetchApi(`/api/dashboard/fuentes-by-tipologia?${params.toString()}`);
  }

  // Get categorias filtered by tipologia
  async getCategoriasByTipologia(tipologia: string): Promise<{
    success: boolean;
    categorias: string[];
    tipologia: string;
  }> {
    const params = new URLSearchParams();
    params.append('tipologia', tipologia);
    return this.fetchApi(`/api/dashboard/categorias-by-tipologia?${params.toString()}`);
  }

  // Get dashboard results data
  async getDashboardResults(
    tipologia?: string,
    fuente?: string,
    unidad?: string,
    categoria?: string
  ): Promise<{
    success: boolean;
    data: Array<{
      source: string;
      category: string;
      unit: string;
      palanca: string;
      variacion_promedio: number;
      diferencia_vs_control: number;
    }>;
    palancas: string[];
    sources: string[];
    categories: string[];
    units: string[];
    filtered_by: {
      tipologia: string | null;
      fuente: string | null;
      unidad: string | null;
      categoria: string | null;
    };
  }> {
    const params = new URLSearchParams();
    if (tipologia) params.append('tipologia', tipologia);
    if (fuente) params.append('fuente', fuente);
    if (unidad) params.append('unidad', unidad);
    if (categoria) params.append('categoria', categoria);

    const queryString = params.toString();
    return this.fetchApi(`/api/dashboard/results${queryString ? '?' + queryString : ''}`);
  }

  // Get competition results data (Electrolit, Powerade, Otros)
  async getCompetitionResults(
    tipologia?: string,
    fuente?: string,
    unidad?: string
  ): Promise<{
    success: boolean;
    data: Array<{
      source: string;
      category: string;
      unit: string;
      palanca: string;
      variacion_promedio: number;
      diferencia_vs_control: number;
    }>;
    palancas: string[];
    sources: string[];
    categories: string[];
    units: string[];
    filtered_by: {
      tipologia: string | null;
      fuente: string | null;
      unidad: string | null;
    };
  }> {
    const params = new URLSearchParams();
    if (tipologia) params.append('tipologia', tipologia);
    if (fuente) params.append('fuente', fuente);
    if (unidad) params.append('unidad', unidad);

    const queryString = params.toString();
    return this.fetchApi(`/api/dashboard/competition-results${queryString ? '?' + queryString : ''}`);
  }

  // Get dashboard data summary
  async getDashboardDataSummary(): Promise<{
    success: boolean;
    summary: {
      sell_in_rows: number;
      sell_out_rows: number;
      sell_in_columns: string[];
      sell_out_columns: string[];
      tipologia_options: number;
      palanca_options: number;
      kpi_options: number;
    };
  }> {
    return this.fetchApi('/api/dashboard/data-summary');
  }

  // Get evolution data for timeline chart (palanca vs control)
  async getEvolutionData(
    tipologia?: string,
    fuente?: string,
    unidad?: string,
    categoria?: string,
    palanca?: string
  ): Promise<{
    success: boolean;
    data: Array<{
      period: string;
      period_label: string;
      start_date: string | null;
      date_formatted: string;
      palanca_value: number | null;
      control_value: number | null;
    }>;
    palanca_name?: string;
    tipologia?: string;
    project_start_date?: string | null;
    project_start_formatted?: string | null;
    message?: string;
    missing_filters?: string[];
    filtered_by?: {
      tipologia: string | null;
      fuente: string | null;
      unidad: string | null;
      categoria: string | null;
      palanca: string | null;
    };
    error?: string;
  }> {
    const params = new URLSearchParams();
    if (tipologia) params.append('tipologia', tipologia);
    if (fuente) params.append('fuente', fuente);
    if (unidad) params.append('unidad', unidad);
    if (categoria) params.append('categoria', categoria);
    if (palanca) params.append('palanca', palanca);

    const queryString = params.toString();
    return this.fetchApi(`/api/dashboard/evolution-data${queryString ? '?' + queryString : ''}`);
  }

  // Get maestro mappings (name to ID and vice versa)
  async getMaestroMappings(): Promise<{
    success: boolean;
    mappings: {
      tipologia_name_to_id: Record<string, number>;
      palanca_name_to_id: Record<string, number>;
      kpi_name_to_id: Record<string, number>;
      tipologia_id_to_name: Record<number, string>;
      palanca_id_to_name: Record<number, string>;
      kpi_id_to_name: Record<number, string>;
    };
  }> {
    return this.fetchApi('/api/dashboard/maestro-mappings');
  }

  // Get radar chart data
  async getRadarData(
    tipologia?: string,
    fuente?: string,
    unidad?: string,
    categoria?: string
  ): Promise<{
    success: boolean;
    data: Array<{
      tipologia: string;
      palanca: string;
      avg_score: number;
    }>;
    tipologias: string[];
    palancas: string[];
    filtered_by: {
      tipologia: string | null;
      fuente: string | null;
      unidad: string | null;
      categoria: string | null;
    };
    error?: string;
  }> {
    const params = new URLSearchParams();
    if (tipologia) params.append('tipologia', tipologia);
    if (fuente) params.append('fuente', fuente);
    if (unidad) params.append('unidad', unidad);
    if (categoria) params.append('categoria', categoria);

    const queryString = params.toString();
    return this.fetchApi(`/api/dashboard/radar-data${queryString ? '?' + queryString : ''}`);
  }
}

export const apiService = new ApiService();