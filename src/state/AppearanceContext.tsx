import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type AppearanceMode = "light" | "dark";

type AppearanceContextValue = {
  mode: AppearanceMode;
  setMode: (mode: AppearanceMode) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppearanceMode>(() => {
    const stored = localStorage.getItem("copticcloud-appearance");
    if (stored === "light" || stored === "dark") {
      return stored;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem("copticcloud-appearance", mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode: setModeState
    }),
    [mode]
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext);

  if (!context) {
    throw new Error("useAppearance must be used within AppearanceProvider.");
  }

  return context;
}
