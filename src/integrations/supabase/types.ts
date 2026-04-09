export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      body_weight_logs: {
        Row: {
          created_at: string
          data: string
          horario: string | null
          id: string
          observacao: string | null
          peso: number
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          horario?: string | null
          id?: string
          observacao?: string | null
          peso: number
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          horario?: string | null
          id?: string
          observacao?: string | null
          peso?: number
          user_id?: string
        }
        Relationships: []
      }
      breakeven_goals: {
        Row: {
          created_at: string
          id: string
          meta_mensal: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta_mensal?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meta_mensal?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checklist: {
        Row: {
          created_at: string
          data: string
          dieta_seguida: boolean
          id: string
          tarefa_feita: boolean
          treino_feito: boolean
          uber_batida: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          dieta_seguida?: boolean
          id?: string
          tarefa_feita?: boolean
          treino_feito?: boolean
          uber_batida?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          dieta_seguida?: boolean
          id?: string
          tarefa_feita?: boolean
          treino_feito?: boolean
          uber_batida?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debt_payments: {
        Row: {
          created_at: string
          data_pagamento: string
          debt_id: string
          forma_pagamento: string | null
          id: string
          observacao: string | null
          user_id: string
          valor_pago: number
        }
        Insert: {
          created_at?: string
          data_pagamento?: string
          debt_id: string
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          user_id: string
          valor_pago: number
        }
        Update: {
          created_at?: string
          data_pagamento?: string
          debt_id?: string
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          user_id?: string
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string
          credor: string
          data_inicio: string | null
          frequencia: string | null
          id: string
          observacao: string | null
          parcelas_pagas: number
          parcelas_total: number
          status: string
          tipo: string | null
          updated_at: string
          user_id: string
          valor_atual: number
          valor_original: number
          valor_parcela: number | null
        }
        Insert: {
          created_at?: string
          credor: string
          data_inicio?: string | null
          frequencia?: string | null
          id?: string
          observacao?: string | null
          parcelas_pagas?: number
          parcelas_total?: number
          status?: string
          tipo?: string | null
          updated_at?: string
          user_id: string
          valor_atual: number
          valor_original: number
          valor_parcela?: number | null
        }
        Update: {
          created_at?: string
          credor?: string
          data_inicio?: string | null
          frequencia?: string | null
          id?: string
          observacao?: string | null
          parcelas_pagas?: number
          parcelas_total?: number
          status?: string
          tipo?: string | null
          updated_at?: string
          user_id?: string
          valor_atual?: number
          valor_original?: number
          valor_parcela?: number | null
        }
        Relationships: []
      }
      exercise_sessions: {
        Row: {
          created_at: string
          data: string
          exercise_id: string
          id: string
          sets_data: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          exercise_id: string
          id?: string
          sets_data?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          exercise_id?: string
          id?: string
          sets_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sessions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          categoria: string | null
          created_at: string
          data: string
          id: string
          nome: string
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data?: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      food_library: {
        Row: {
          calorias_por_100g: number | null
          carboidrato_por_100g: number | null
          created_at: string
          gordura_por_100g: number | null
          id: string
          nome: string
          preco_aproximado: number | null
          proteina_por_100g: number | null
          unidade_padrao: string | null
          user_id: string
        }
        Insert: {
          calorias_por_100g?: number | null
          carboidrato_por_100g?: number | null
          created_at?: string
          gordura_por_100g?: number | null
          id?: string
          nome: string
          preco_aproximado?: number | null
          proteina_por_100g?: number | null
          unidade_padrao?: string | null
          user_id: string
        }
        Update: {
          calorias_por_100g?: number | null
          carboidrato_por_100g?: number | null
          created_at?: string
          gordura_por_100g?: number | null
          id?: string
          nome?: string
          preco_aproximado?: number | null
          proteina_por_100g?: number | null
          unidade_padrao?: string | null
          user_id?: string
        }
        Relationships: []
      }
      income: {
        Row: {
          categoria: string
          created_at: string
          data: string
          id: string
          nome: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data?: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      meal_ingredients: {
        Row: {
          created_at: string
          food_id: string
          id: string
          meal_id: string
          quantidade: number
          unidade: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_id: string
          id?: string
          meal_id: string
          quantidade: number
          unidade?: string
          user_id: string
        }
        Update: {
          created_at?: string
          food_id?: string
          id?: string
          meal_id?: string
          quantidade?: number
          unidade?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_ingredients_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_ingredients_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          concluida: boolean
          created_at: string
          data: string
          id: string
          observacao: string | null
          refeicao: string
          user_id: string
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          data?: string
          id?: string
          observacao?: string | null
          refeicao: string
          user_id: string
        }
        Update: {
          concluida?: boolean
          created_at?: string
          data?: string
          id?: string
          observacao?: string | null
          refeicao?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          ativo: boolean | null
          created_at: string
          descricao: string
          id: string
          nome: string | null
          refeicao: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao: string
          id?: string
          nome?: string | null
          refeicao: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string
          id?: string
          nome?: string | null
          refeicao?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          created_at: string
          horario: string | null
          id: string
          nome: string
          ordem: number | null
          plan_id: string
          repete_igual_refeicao_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          horario?: string | null
          id?: string
          nome: string
          ordem?: number | null
          plan_id: string
          repete_igual_refeicao_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          horario?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          plan_id?: string
          repete_igual_refeicao_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meals_repete_igual_refeicao_id_fkey"
            columns: ["repete_igual_refeicao_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          concluido: boolean
          created_at: string
          id: string
          nome: string
          project_id: string
          user_id: string
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          id?: string
          nome: string
          project_id: string
          user_id: string
        }
        Update: {
          concluido?: boolean
          created_at?: string
          id?: string
          nome?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nome: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          nome?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          prazo: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          prazo?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          prazo?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          data_limite: string | null
          id: string
          prioridade: string
          project_id: string | null
          status: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_limite?: string | null
          id?: string
          prioridade?: string
          project_id?: string | null
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_limite?: string | null
          id?: string
          prioridade?: string
          project_id?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          categoria: string | null
          created_at: string
          credor: string | null
          data: string
          debt_id: string | null
          descricao: string
          frequencia: string | null
          id: string
          observacao: string | null
          parcela_atual: number | null
          parcelas_total: number | null
          recorrente: boolean
          status: string
          type: string
          updated_at: string
          user_id: string
          valor: number
          vencimento: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          credor?: string | null
          data?: string
          debt_id?: string | null
          descricao: string
          frequencia?: string | null
          id?: string
          observacao?: string | null
          parcela_atual?: number | null
          parcelas_total?: number | null
          recorrente?: boolean
          status?: string
          type: string
          updated_at?: string
          user_id: string
          valor: number
          vencimento?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          credor?: string | null
          data?: string
          debt_id?: string | null
          descricao?: string
          frequencia?: string | null
          id?: string
          observacao?: string | null
          parcela_atual?: number | null
          parcelas_total?: number | null
          recorrente?: boolean
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          valor?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      uber_daily_log: {
        Row: {
          created_at: string
          data: string
          id: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          user_id: string
          valor?: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      uber_goals: {
        Row: {
          created_at: string
          id: string
          meta_semanal: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta_semanal?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meta_semanal?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_stock: {
        Row: {
          created_at: string
          food_id: string
          id: string
          quantidade_disponivel: number
          semana_referencia: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_id: string
          id?: string
          quantidade_disponivel?: number
          semana_referencia?: string
          user_id: string
        }
        Update: {
          created_at?: string
          food_id?: string
          id?: string
          quantidade_disponivel?: number
          semana_referencia?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_stock_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_library"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          carga_kg: number | null
          created_at: string
          descanso_segundos: number | null
          distancia_km: number | null
          duracao_minutos: number | null
          id: string
          intensidade: string | null
          modalidade_cardio: string | null
          nome: string
          ordem: number
          plan_id: string
          repeticoes: number
          series: number
          tipo: string | null
          user_id: string
        }
        Insert: {
          carga_kg?: number | null
          created_at?: string
          descanso_segundos?: number | null
          distancia_km?: number | null
          duracao_minutos?: number | null
          id?: string
          intensidade?: string | null
          modalidade_cardio?: string | null
          nome: string
          ordem?: number
          plan_id: string
          repeticoes?: number
          series?: number
          tipo?: string | null
          user_id: string
        }
        Update: {
          carga_kg?: number | null
          created_at?: string
          descanso_segundos?: number | null
          distancia_km?: number | null
          duracao_minutos?: number | null
          id?: string
          intensidade?: string | null
          modalidade_cardio?: string | null
          nome?: string
          ordem?: number
          plan_id?: string
          repeticoes?: number
          series?: number
          tipo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          created_at: string
          data: string
          exercicios_concluidos: Json
          id: string
          plan_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          exercicios_concluidos?: Json
          id?: string
          plan_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          exercicios_concluidos?: Json
          id?: string
          plan_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          ativo: boolean | null
          created_at: string
          dias_semana: string[]
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          dias_semana?: string[]
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          dias_semana?: string[]
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
