import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile } from "../types";
import {
  getSupabaseClient,
  configureCustomSupabase,
  isSupabaseConfigured,
  getStoredSupabaseConfig,
} from "../lib/supabase";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isSupabaseActive: boolean;
  supabaseConfig: { url: string; key: string };
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  continueAsGuest: (name?: string) => void;
  updateSupabaseCredentials: (url: string, key: string) => void;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_GUEST_KEY = "nexora_guest_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(false);
  const [supabaseConfig, setSupabaseConfig] = useState(getStoredSupabaseConfig());

  useEffect(() => {
    // Check Supabase session first
    const client = getSupabaseClient();
    const active = isSupabaseConfigured();
    setIsSupabaseActive(active);
    setSupabaseConfig(getStoredSupabaseConfig());

    if (client) {
      client.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || "developer@supabase.cloud",
              name:
                session.user.user_metadata?.full_name ||
                session.user.email?.split("@")[0] ||
                "Cloud Developer",
              avatarUrl: session.user.user_metadata?.avatar_url,
              isAnonymous: false,
              createdAt: session.user.created_at,
            });
          } else {
            loadGuestUser();
          }
          setLoading(false);
        })
        .catch(() => {
          loadGuestUser();
          setLoading(false);
        });

      const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "developer@supabase.cloud",
            name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "Cloud Developer",
            avatarUrl: session.user.user_metadata?.avatar_url,
            isAnonymous: false,
            createdAt: session.user.created_at,
          });
        } else if (_event === "SIGNED_OUT") {
          loadGuestUser();
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      loadGuestUser();
      setLoading(false);
    }
  }, []);

  const loadGuestUser = () => {
    try {
      const saved = localStorage.getItem(LOCAL_GUEST_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        const defaultGuest: UserProfile = {
          id: "usr_guest_" + Math.random().toString(36).slice(2, 8),
          email: "guest@offline.local",
          name: "Guest Developer",
          isAnonymous: true,
          createdAt: new Date().toISOString(),
        };
        setUser(defaultGuest);
        localStorage.setItem(LOCAL_GUEST_KEY, JSON.stringify(defaultGuest));
      }
    } catch {
      setUser(null);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const client = getSupabaseClient();
    if (!client) {
      return {
        success: false,
        error:
          "Supabase Cloud is not configured. Please enter your Supabase Project URL and Anon Key in Settings or the setup tab to enable cloud accounts.",
      };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split("@")[0],
          isAnonymous: false,
          createdAt: data.user.created_at,
        });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to sign in to Supabase." };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    const client = getSupabaseClient();
    if (!client) {
      return {
        success: false,
        error:
          "Supabase Cloud is not configured. Please enter your Supabase Project URL and Anon Key in Settings or the setup tab to create a cloud account.",
      };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            full_name: name?.trim() || email.split("@")[0],
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        if (data.session) {
          setUser({
            id: data.user.id,
            email: data.user.email || email,
            name: name?.trim() || data.user.user_metadata?.full_name || email.split("@")[0],
            isAnonymous: false,
            createdAt: data.user.created_at,
          });
          return { success: true };
        } else {
          // Email confirmation is required by Supabase auth configuration
          return {
            success: true,
            error: "Registration successful! Please check your email to confirm your account before signing in.",
          };
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Supabase sign up failed." };
    }
  };

  const logout = async () => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn("Supabase sign out notice:", err);
      }
    }
    loadGuestUser();
  };

  const continueAsGuest = (name?: string) => {
    const guest: UserProfile = {
      id: "usr_guest_" + Math.random().toString(36).slice(2, 8),
      email: "guest@offline.local",
      name: name || "Guest Developer",
      isAnonymous: true,
      createdAt: new Date().toISOString(),
    };
    setUser(guest);
    localStorage.setItem(LOCAL_GUEST_KEY, JSON.stringify(guest));
  };

  const updateSupabaseCredentials = (url: string, key: string) => {
    configureCustomSupabase(url, key);
    const active = isSupabaseConfigured();
    setIsSupabaseActive(active);
    setSupabaseConfig(getStoredSupabaseConfig());

    if (!active) {
      loadGuestUser();
    }
  };

  const deleteAccount = async () => {
    const client = getSupabaseClient();
    if (client && user && !user.isAnonymous) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn("Supabase signout on delete notice:", err);
      }
    }
    localStorage.removeItem(LOCAL_GUEST_KEY);
    localStorage.removeItem("nexora_projects");
    continueAsGuest("Guest Developer");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseActive,
        supabaseConfig,
        loginWithEmail,
        signUpWithEmail,
        logout,
        continueAsGuest,
        updateSupabaseCredentials,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
