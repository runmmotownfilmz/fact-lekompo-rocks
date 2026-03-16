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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          genre: string | null
          id: string
          is_published: boolean | null
          release_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          release_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          release_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          billboard_image_url: string | null
          created_at: string
          description: string | null
          event_date: string
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          ticket_price: number | null
          ticket_url: string | null
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          billboard_image_url?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          ticket_price?: number | null
          ticket_url?: string | null
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          billboard_image_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          ticket_price?: number | null
          ticket_url?: string | null
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          upload_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          upload_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          upload_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      play_history: {
        Row: {
          id: string
          played_at: string
          upload_id: string
          user_id: string | null
        }
        Insert: {
          id?: string
          played_at?: string
          upload_id: string
          user_id?: string | null
        }
        Update: {
          id?: string
          played_at?: string
          upload_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "play_history_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_songs: {
        Row: {
          added_at: string
          added_by: string | null
          id: string
          playlist_id: string
          position: number
          upload_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          id?: string
          playlist_id: string
          position?: number
          upload_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          id?: string
          playlist_id?: string
          position?: number
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_songs_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_songs_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_collaborative: boolean | null
          is_public: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          followers_count: number | null
          id: string
          is_producer: boolean | null
          social_links: Json | null
          updated_at: string
          user_id: string
          username: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          followers_count?: number | null
          id?: string
          is_producer?: boolean | null
          social_links?: Json | null
          updated_at?: string
          user_id: string
          username?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          followers_count?: number | null
          id?: string
          is_producer?: boolean | null
          social_links?: Json | null
          updated_at?: string
          user_id?: string
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      project_collaborators: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          project_id: string
          role: string
          split_percentage: number | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          project_id: string
          role?: string
          split_percentage?: number | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          project_id?: string
          role?: string
          split_percentage?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          note_type: string
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          note_type?: string
          project_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          note_type?: string
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
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
      project_samples: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_url: string
          id: string
          project_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_url: string
          id?: string
          project_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_url?: string
          id?: string
          project_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_samples_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          bpm: number | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          featured_artist: string | null
          genre: string | null
          id: string
          key_signature: string | null
          linked_upload_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bpm?: number | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          featured_artist?: string | null
          genre?: string | null
          id?: string
          key_signature?: string | null
          linked_upload_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bpm?: number | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          featured_artist?: string | null
          genre?: string | null
          id?: string
          key_signature?: string | null
          linked_upload_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_linked_upload_id_fkey"
            columns: ["linked_upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string
          name: string
          tier: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url: string
          name: string
          tier?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string
          name?: string
          tier?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      uploads: {
        Row: {
          album_id: string | null
          bpm: number | null
          composer: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          downloads_count: number | null
          duration_seconds: number | null
          file_url: string | null
          genre: string | null
          id: string
          is_published: boolean | null
          is_single: boolean | null
          isrc_code: string | null
          plays_count: number | null
          price: number | null
          release_date: string | null
          scheduled_publish_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          album_id?: string | null
          bpm?: number | null
          composer?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          downloads_count?: number | null
          duration_seconds?: number | null
          file_url?: string | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          is_single?: boolean | null
          isrc_code?: string | null
          plays_count?: number | null
          price?: number | null
          release_date?: string | null
          scheduled_publish_at?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          album_id?: string | null
          bpm?: number | null
          composer?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          downloads_count?: number | null
          duration_seconds?: number | null
          file_url?: string | null
          genre?: string | null
          id?: string
          is_published?: boolean | null
          is_single?: boolean | null
          isrc_code?: string | null
          plays_count?: number | null
          price?: number | null
          release_date?: string | null
          scheduled_publish_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_project_collaborator: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_owner: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
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
