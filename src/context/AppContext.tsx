import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios, { type AxiosInstance } from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  analysisCount?: number;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  api: AxiosInstance;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const SERVER_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [loading, setLoading] = useState(true);

  //  Axios instance only once
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: SERVER_URL,
    });

    instance.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    return instance;
  }, []);

  const getUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/api/auth/user");
      if (data.success) {
        setUser(data.user);
      }
    } catch {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${SERVER_URL}/api/auth/login`, {
        email,
        password,
      });
      console.log(res)

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true };
      }

      return { success: false, message: res.data.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Login Failed",
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await axios.post(`${SERVER_URL}/api/auth/register`, {
        name,
        email,
        password,
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true };
      }

      return { success: false, message: res.data.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Login Failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };
  useEffect(() => {
    getUser();
  }, [token]);
  const value: AppContextType = {
    user,
    token,
    loading,
    api,
    login,
    register,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return context;
}
