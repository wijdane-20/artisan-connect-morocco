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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      artisans: {
        Row: {
          approved: boolean
          available: boolean
          bio: string | null
          category_id: string | null
          city: string | null
          completed_jobs: number
          created_at: string
          description: string | null
          experience_years: number | null
          hourly_rate: number | null
          id: string
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          phone: string | null
          price_max: number | null
          price_min: number | null
          profession: string | null
          profile_photo_url: string | null
          rating_avg: number
          rating_count: number
          skills: string[] | null
          suspended: boolean
          updated_at: string
          verification_status: string
        }
        Insert: {
          approved?: boolean
          available?: boolean
          bio?: string | null
          category_id?: string | null
          city?: string | null
          completed_jobs?: number
          created_at?: string
          description?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id: string
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          price_max?: number | null
          price_min?: number | null
          profession?: string | null
          profile_photo_url?: string | null
          rating_avg?: number
          rating_count?: number
          skills?: string[] | null
          suspended?: boolean
          updated_at?: string
          verification_status?: string
        }
        Update: {
          approved?: boolean
          available?: boolean
          bio?: string | null
          category_id?: string | null
          city?: string | null
          completed_jobs?: number
          created_at?: string
          description?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          price_max?: number | null
          price_min?: number | null
          profession?: string | null
          profile_photo_url?: string | null
          rating_avg?: number
          rating_count?: number
          skills?: string[] | null
          suspended?: boolean
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "artisans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          request_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          request_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          request_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          provider: string
          reference: string | null
          request_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          provider?: string
          reference?: string | null
          request_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          provider?: string
          reference?: string | null
          request_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          artisan_id: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          title: string | null
        }
        Insert: {
          artisan_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          title?: string | null
        }
        Update: {
          artisan_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string
          id: string
          is_suspended: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string
          id: string
          is_suspended?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_suspended?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          artisan_id: string
          client_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          request_id: string | null
        }
        Insert: {
          artisan_id: string
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          request_id?: string | null
        }
        Update: {
          artisan_id?: string
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          address: string | null
          artisan_id: string
          category_id: string | null
          city: string | null
          client_id: string
          created_at: string
          description: string
          id: string
          payment_amount: number | null
          payment_date: string | null
          payment_provider: string | null
          payment_reference: string | null
          payment_status: string
          preferred_date: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          artisan_id: string
          category_id?: string | null
          city?: string | null
          client_id: string
          created_at?: string
          description: string
          id?: string
          payment_amount?: number | null
          payment_date?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: string
          preferred_date?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          artisan_id?: string
          category_id?: string | null
          city?: string | null
          client_id?: string
          created_at?: string
          description?: string
          id?: string
          payment_amount?: number | null
          payment_date?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: string
          preferred_date?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          artisan_id: string
          cin_url: string | null
          created_at: string
          doc_url: string | null
          id: string
          photo_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          artisan_id: string
          cin_url?: string | null
          created_at?: string
          doc_url?: string | null
          id?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          artisan_id?: string
          cin_url?: string | null
          created_at?: string
          doc_url?: string | null
          id?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "artisan" | "admin"
      request_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "in_progress"
        | "completed"
        | "cancelled"
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
    Enums: {
      app_role: ["client", "artisan", "admin"],
      request_status: [
        "pending",
        "accepted",
        "rejected",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
