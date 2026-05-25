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
      blocks: {
        Row: {
          block_type: string
          created_at: string
          h: number | null
          id: string
          page_id: string
          position: number
          props: Json
          rotation: number
          section_styles: Json
          updated_at: string
          user_id: string
          w: number | null
          x: number | null
          y: number | null
          z_index: number
        }
        Insert: {
          block_type: string
          created_at?: string
          h?: number | null
          id?: string
          page_id: string
          position?: number
          props?: Json
          rotation?: number
          section_styles?: Json
          updated_at?: string
          user_id: string
          w?: number | null
          x?: number | null
          y?: number | null
          z_index?: number
        }
        Update: {
          block_type?: string
          created_at?: string
          h?: number | null
          id?: string
          page_id?: string
          position?: number
          props?: Json
          rotation?: number
          section_styles?: Json
          updated_at?: string
          user_id?: string
          w?: number | null
          x?: number | null
          y?: number | null
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          created_at: string
          field_key: string
          field_type: string
          id: string
          is_qualifier: boolean
          label: string
          options: Json | null
          placeholder: string | null
          position: number
          required: boolean
          show_if: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          field_key: string
          field_type?: string
          id?: string
          is_qualifier?: boolean
          label: string
          options?: Json | null
          placeholder?: string | null
          position?: number
          required?: boolean
          show_if?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          field_key?: string
          field_type?: string
          id?: string
          is_qualifier?: boolean
          label?: string
          options?: Json | null
          placeholder?: string | null
          position?: number
          required?: boolean
          show_if?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      lead_comments: {
        Row: {
          author_name: string | null
          body: string
          created_at: string
          id: string
          lead_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          lead_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          custom_data: Json | null
          email: string | null
          faixa_investimento: string | null
          genero: string | null
          id: string
          idade: number | null
          nome: string | null
          notes: string | null
          pipeline: string
          scheduled_at: string | null
          status: string | null
          tags: string[] | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          custom_data?: Json | null
          email?: string | null
          faixa_investimento?: string | null
          genero?: string | null
          id?: string
          idade?: number | null
          nome?: string | null
          notes?: string | null
          pipeline?: string
          scheduled_at?: string | null
          status?: string | null
          tags?: string[] | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          custom_data?: Json | null
          email?: string | null
          faixa_investimento?: string | null
          genero?: string | null
          id?: string
          idade?: number | null
          nome?: string | null
          notes?: string | null
          pipeline?: string
          scheduled_at?: string | null
          status?: string | null
          tags?: string[] | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          canvas_height: number
          created_at: string
          freeform: boolean
          id: string
          is_home: boolean
          position: number
          seo_description: string | null
          seo_title: string | null
          site_id: string
          slug: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canvas_height?: number
          created_at?: string
          freeform?: boolean
          id?: string
          is_home?: boolean
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          site_id: string
          slug?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canvas_height?: number
          created_at?: string
          freeform?: boolean
          id?: string
          is_home?: boolean
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          site_id?: string
          slug?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_columns: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          position: number
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          position?: number
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accent_color: string
          background_color: string
          brand_name: string
          calendly_url: string | null
          community_message: string | null
          community_url: string | null
          created_at: string
          cta_calendly_label: string
          cta_qualified_label: string
          cta_unqualified_label: string
          form_border_radius: number
          form_submit_label: string
          form_subtitle: string
          form_title: string
          id: string
          logo_url: string | null
          primary_color: string
          slug: string
          thanks_qualified_text: string
          thanks_qualified_title: string
          thanks_unqualified_text: string
          thanks_unqualified_title: string
          updated_at: string
          user_id: string
          welcome_cta_label: string
          welcome_enabled: boolean
          welcome_text: string
          welcome_title: string
          whatsapp_group_url: string | null
        }
        Insert: {
          accent_color?: string
          background_color?: string
          brand_name?: string
          calendly_url?: string | null
          community_message?: string | null
          community_url?: string | null
          created_at?: string
          cta_calendly_label?: string
          cta_qualified_label?: string
          cta_unqualified_label?: string
          form_border_radius?: number
          form_submit_label?: string
          form_subtitle?: string
          form_title?: string
          id: string
          logo_url?: string | null
          primary_color?: string
          slug: string
          thanks_qualified_text?: string
          thanks_qualified_title?: string
          thanks_unqualified_text?: string
          thanks_unqualified_title?: string
          updated_at?: string
          user_id: string
          welcome_cta_label?: string
          welcome_enabled?: boolean
          welcome_text?: string
          welcome_title?: string
          whatsapp_group_url?: string | null
        }
        Update: {
          accent_color?: string
          background_color?: string
          brand_name?: string
          calendly_url?: string | null
          community_message?: string | null
          community_url?: string | null
          created_at?: string
          cta_calendly_label?: string
          cta_qualified_label?: string
          cta_unqualified_label?: string
          form_border_radius?: number
          form_submit_label?: string
          form_subtitle?: string
          form_title?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          slug?: string
          thanks_qualified_text?: string
          thanks_qualified_title?: string
          thanks_unqualified_text?: string
          thanks_unqualified_title?: string
          updated_at?: string
          user_id?: string
          welcome_cta_label?: string
          welcome_enabled?: boolean
          welcome_text?: string
          welcome_title?: string
          whatsapp_group_url?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          calendly_url: string | null
          cancellation_min_hours: number
          cancellation_policy: string
          created_at: string
          id: string
          schedule_cancellation_message: string
          schedule_confirmation_message: string
          user_id: string
          wa_msg_nao_qualificado: string | null
          wa_msg_qualificado: string | null
          whatsapp_confirmation_message: string
        }
        Insert: {
          calendly_url?: string | null
          cancellation_min_hours?: number
          cancellation_policy?: string
          created_at?: string
          id?: string
          schedule_cancellation_message?: string
          schedule_confirmation_message?: string
          user_id: string
          wa_msg_nao_qualificado?: string | null
          wa_msg_qualificado?: string | null
          whatsapp_confirmation_message?: string
        }
        Update: {
          calendly_url?: string | null
          cancellation_min_hours?: number
          cancellation_policy?: string
          created_at?: string
          id?: string
          schedule_cancellation_message?: string
          schedule_confirmation_message?: string
          user_id?: string
          wa_msg_nao_qualificado?: string | null
          wa_msg_qualificado?: string | null
          whatsapp_confirmation_message?: string
        }
        Relationships: []
      }
      site_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          pages: Json
          theme: Json
          thumbnail_url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          pages?: Json
          theme?: Json
          thumbnail_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          pages?: Json
          theme?: Json
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      sites: {
        Row: {
          background_color: string
          created_at: string
          custom_css: string | null
          custom_domain: string | null
          custom_head: string | null
          facebook_pixel_id: string | null
          favicon_url: string | null
          font_family: string
          google_analytics_id: string | null
          gtm_id: string | null
          header_style: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string
          published: boolean
          secondary_color: string
          seo_description: string | null
          seo_title: string | null
          show_header: boolean
          slug: string
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_tiktok: string | null
          social_twitter: string | null
          social_whatsapp: string | null
          social_youtube: string | null
          sticky_header: boolean
          text_color: string
          theme_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          background_color?: string
          created_at?: string
          custom_css?: string | null
          custom_domain?: string | null
          custom_head?: string | null
          facebook_pixel_id?: string | null
          favicon_url?: string | null
          font_family?: string
          google_analytics_id?: string | null
          gtm_id?: string | null
          header_style?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string
          published?: boolean
          secondary_color?: string
          seo_description?: string | null
          seo_title?: string | null
          show_header?: boolean
          slug: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
          social_whatsapp?: string | null
          social_youtube?: string | null
          sticky_header?: boolean
          text_color?: string
          theme_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          background_color?: string
          created_at?: string
          custom_css?: string | null
          custom_domain?: string | null
          custom_head?: string | null
          facebook_pixel_id?: string | null
          favicon_url?: string | null
          font_family?: string
          google_analytics_id?: string | null
          gtm_id?: string | null
          header_style?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string
          published?: boolean
          secondary_color?: string
          seo_description?: string | null
          seo_title?: string | null
          show_header?: boolean
          slug?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          social_twitter?: string | null
          social_whatsapp?: string | null
          social_youtube?: string | null
          sticky_header?: boolean
          text_color?: string
          theme_mode?: string
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
      get_public_profile_by_slug: {
        Args: { _slug: string }
        Returns: {
          accent_color: string
          background_color: string
          brand_name: string
          calendly_url: string
          community_url: string
          cta_calendly_label: string
          cta_qualified_label: string
          cta_unqualified_label: string
          form_border_radius: number
          form_submit_label: string
          form_subtitle: string
          form_title: string
          logo_url: string
          primary_color: string
          slug: string
          thanks_qualified_text: string
          thanks_qualified_title: string
          thanks_unqualified_text: string
          thanks_unqualified_title: string
          user_id: string
          welcome_cta_label: string
          welcome_enabled: boolean
          welcome_text: string
          welcome_title: string
          whatsapp_group_url: string
        }[]
      }
      get_public_site_by_slug: {
        Args: { _slug: string }
        Returns: {
          background_color: string
          created_at: string
          custom_css: string | null
          custom_domain: string | null
          custom_head: string | null
          facebook_pixel_id: string | null
          favicon_url: string | null
          font_family: string
          google_analytics_id: string | null
          gtm_id: string | null
          header_style: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string
          published: boolean
          secondary_color: string
          seo_description: string | null
          seo_title: string | null
          show_header: boolean
          slug: string
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_tiktok: string | null
          social_twitter: string | null
          social_whatsapp: string | null
          social_youtube: string | null
          sticky_header: boolean
          text_color: string
          theme_mode: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "sites"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      profile_user_exists: { Args: { _user_id: string }; Returns: boolean }
      slugify: { Args: { _input: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
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
