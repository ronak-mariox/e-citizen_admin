import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authApi from "../api/auth";
import { getErrorField, getErrorMessage, setSessionExpiredHandler } from "../api/client";
import { PANEL_ROLE, PANEL_WRONG_ROLE_MESSAGE } from "../constants/auth";
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  saveSession,
} from "../utils/session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [status, setStatus] = useState(
    getAccessToken() ? "loading" : "anonymous"
  );

  // Logout helper
  const endSession = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus("anonymous");
  }, []);

  // Handle expired session
  useEffect(() => {
    setSessionExpiredHandler(endSession);
  }, [endSession]);

  // Check logged-in user on page refresh
  useEffect(() => {
    if (!getAccessToken()) return;

    async function loadUser() {
      try {
        const userData = await authApi.getMe();

        if (userData.role !== PANEL_ROLE) {
          endSession();
          return;
        }

        saveSession({ user: userData });
        setUser(userData);
        setStatus("authenticated");
      } catch {
        endSession();
      }
    }

    loadUser();
  }, [endSession]);

  /**
   * Replaces the signed-in account after the profile screen saves it.
   *
   * The shell reads the name from here, so this is what repaints the sidebar
   * and the top bar without a reload — and it writes through to storage, or a
   * refresh would show the old name again until /auth/me answered.
   */
  const updateUser = useCallback((updated) => {
    saveSession({ user: updated });
    setUser(updated);
  }, []);

  // Login
  const signIn = useCallback(async (credentials) => {
    try {
      const { user, accessToken } = await authApi.login(credentials);

      if (user.role !== PANEL_ROLE) {
        throw new Error(PANEL_WRONG_ROLE_MESSAGE);
      }

      saveSession({ accessToken, user });
      setUser(user);
      setStatus("authenticated");

      return user;
    } catch (error) {
      // The wrong-role check above throws a plain Error with its own message.
      // Only an axios failure has `.response`, and only that needs unwrapping —
      // running getErrorMessage on our own Error would report it as a network
      // problem and lose what it actually said.
      if (!error.response) throw error;

      const failure = new Error(getErrorMessage(error));
      // Which input was wrong, when the API says so, so the sign-in form can
      // mark that field rather than describe the whole attempt as invalid.
      failure.field = getErrorField(error);
      throw failure;
    }
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // The local session goes either way. Letting this reject would leave the
      // caller's navigate() unreached, stranding the agent on a screen whose
      // session has already been cleared.
    } finally {
      endSession();
    }
  }, [endSession]);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      signIn,
      signOut,
      updateUser,
    }),
    [user, status, signIn, signOut, updateUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export default AuthContext;