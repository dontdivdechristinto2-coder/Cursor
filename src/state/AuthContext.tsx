import type { User } from "firebase/auth";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { UserProfile } from "../domain/user";

const firebaseEnvConfigured = [
  import.meta.env.VITE_FIREBASE_API_KEY,
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  import.meta.env.VITE_FIREBASE_APP_ID
].every((value) => typeof value === "string" && value.length > 0);

type AuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  authMode: "firebase" | "local";
  isAuthenticated: boolean;
  loading: boolean;
  isConfigured: boolean;
  onboardingRequired: boolean;
  startLocalOnboarding: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const LOCAL_PROFILE_KEY = "copticcloud-local-profile";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => readLocalProfile());
  const [localOnboarding, setLocalOnboarding] = useState(false);
  const [loading, setLoading] = useState(firebaseEnvConfigured);

  const refreshProfile = useCallback(async () => {
    if (!firebaseEnvConfigured) {
      setProfile(readLocalProfile());
      setLocalOnboarding(false);
      return;
    }

    if (!firebaseUser) {
      setProfile(null);
      return;
    }

    const { getUserProfile } = await import("../services/userRepository");
    setProfile(await getUserProfile(firebaseUser.uid));
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseEnvConfigured) {
      setProfile(readLocalProfile());
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    async function subscribeToAuth() {
      const [{ firebaseServices }, { onAuthStateChanged }, { getUserProfile }] = await Promise.all([
        import("../services/firebase"),
        import("firebase/auth"),
        import("../services/userRepository")
      ]);

      if (!firebaseServices || cancelled) {
        setLoading(false);
        return;
      }

      unsubscribe = onAuthStateChanged(firebaseServices.auth, async (user) => {
        setLoading(true);
        setFirebaseUser(user);
        setProfile(user ? await getUserProfile(user.uid) : null);
        setLoading(false);
      });
    }

    void subscribeToAuth();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      authMode: firebaseEnvConfigured ? "firebase" : "local",
      isAuthenticated: Boolean(firebaseUser || profile),
      loading,
      isConfigured: firebaseEnvConfigured,
      onboardingRequired: firebaseEnvConfigured
        ? Boolean(firebaseUser && !profile && !loading)
        : Boolean(localOnboarding && !profile && !loading),
      startLocalOnboarding: () => {
        setLocalOnboarding(true);
      },
      signInWithGoogle: async () => {
        if (!firebaseEnvConfigured) {
          throw new Error("Firebase environment variables are required before Google Sign-In can run.");
        }

        const [{ requireFirebaseServices }, { signInWithPopup }] = await Promise.all([
          import("../services/firebase"),
          import("firebase/auth")
        ]);
        const firebaseServices = requireFirebaseServices();
        await signInWithPopup(firebaseServices.auth, firebaseServices.googleProvider);
      },
      signOut: async () => {
        if (firebaseEnvConfigured) {
          const [{ requireFirebaseServices }, { signOut: firebaseSignOut }] = await Promise.all([
            import("../services/firebase"),
            import("firebase/auth")
          ]);
          await firebaseSignOut(requireFirebaseServices().auth);
        } else {
          localStorage.removeItem(LOCAL_PROFILE_KEY);
          setProfile(null);
          setLocalOnboarding(false);
        }
      },
      refreshProfile
    }),
    [firebaseUser, loading, localOnboarding, profile, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function readLocalProfile(): UserProfile | null {
  if (firebaseEnvConfigured || typeof localStorage === "undefined") {
    return null;
  }

  const stored = localStorage.getItem(LOCAL_PROFILE_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as UserProfile;
  } catch {
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    return null;
  }
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
