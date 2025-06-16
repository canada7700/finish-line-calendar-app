export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      daily_notes: {
        Row: {
          created_at: string
          date: string
          id: string
          note: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      holidays: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      project_assignments: {
        Row: {
          actual_hours: number | null
          assigned_hours: number
          created_at: string
          end_date: string | null
          id: string
          phase: string
          project_id: string
          start_date: string | null
          team_member_id: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_hours?: number
          created_at?: string
          end_date?: string | null
          id?: string
          phase: string
          project_id: string
          start_date?: string | null
          team_member_id: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_hours?: number
          created_at?: string
          end_date?: string | null
          id?: string
          phase?: string
          project_id?: string
          start_date?: string | null
          team_member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          created_at: string
          date: string
          id: string
          note: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          note?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phase_exceptions: {
        Row: {
          created_at: string
          date: string
          id: string
          phase: string
          project_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          phase: string
          project_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          phase?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phase_exceptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          box_construction_hrs: number
          box_construction_start_date: string | null
          box_toekick_assembly_date: string | null
          created_at: string
          id: string
          install_date: string
          install_hrs: number
          job_description: string
          job_name: string
          material_order_date: string | null
          milling_fillers_date: string | null
          millwork_hrs: number
          millwork_start_date: string | null
          stain_hrs: number
          stain_lacquer_date: string | null
          stain_start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          box_construction_hrs?: number
          box_construction_start_date?: string | null
          box_toekick_assembly_date?: string | null
          created_at?: string
          id?: string
          install_date: string
          install_hrs?: number
          job_description: string
          job_name: string
          material_order_date?: string | null
          milling_fillers_date?: string | null
          millwork_hrs?: number
          millwork_start_date?: string | null
          stain_hrs?: number
          stain_lacquer_date?: string | null
          stain_start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          box_construction_hrs?: number
          box_construction_start_date?: string | null
          box_toekick_assembly_date?: string | null
          created_at?: string
          id?: string
          install_date?: string
          install_hrs?: number
          job_description?: string
          job_name?: string
          material_order_date?: string | null
          milling_fillers_date?: string | null
          millwork_hrs?: number
          millwork_start_date?: string | null
          stain_hrs?: number
          stain_lacquer_date?: string | null
          stain_start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      team_members: {
        Row: {
          can_do_boxes: boolean
          can_do_install: boolean
          can_do_millwork: boolean
          can_do_stain: boolean
          created_at: string
          email: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          weekly_hours: number
        }
        Insert: {
          can_do_boxes?: boolean
          can_do_install?: boolean
          can_do_millwork?: boolean
          can_do_stain?: boolean
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          weekly_hours?: number
        }
        Update: {
          can_do_boxes?: boolean
          can_do_install?: boolean
          can_do_millwork?: boolean
          can_do_stain?: boolean
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          weekly_hours?: number
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
