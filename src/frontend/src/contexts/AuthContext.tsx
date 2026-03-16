import { createContext, useContext, useEffect, useState } from "react";

export interface User {
  username: string;
  password: string;
  role: "admin" | "staff";
}

interface AuthContextValue {
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  users: User[];
  addUser: (username: string, password: string) => void;
  deleteUser: (username: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_KEY = "jewel_users";
const SESSION_KEY = "jewel_session";

const DEFAULT_ADMIN: User = {
  username: "Ronak",
  password: "ZYRA",
  role: "admin",
};

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as User[];
  } catch {}
  return [];
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    let u = loadUsers();
    if (u.length === 0) {
      u = [DEFAULT_ADMIN];
      saveUsers(u);
    }
    return u;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        let u = loadUsers();
        if (u.length === 0) u = [DEFAULT_ADMIN];
        return u.find((usr) => usr.username === session) ?? null;
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, currentUser.username);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  const login = (username: string, password: string): boolean => {
    const user = users.find(
      (u) => u.username === username && u.password === password,
    );
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addUser = (username: string, password: string) => {
    const newUser: User = { username, password, role: "staff" };
    const updated = [...users, newUser];
    setUsers(updated);
    saveUsers(updated);
  };

  const deleteUser = (username: string) => {
    const adminCount = users.filter((u) => u.role === "admin").length;
    const target = users.find((u) => u.username === username);
    if (!target) return;
    if (target.role === "admin" && adminCount <= 1) return;
    const updated = users.filter((u) => u.username !== username);
    setUsers(updated);
    saveUsers(updated);
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, login, logout, users, addUser, deleteUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
