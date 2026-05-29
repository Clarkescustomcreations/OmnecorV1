import React, { createContext, useContext, useState, ReactNode } from "react";

interface FictionModeContextType {
  isFictionMode: boolean;
  toggleFictionMode: () => void;
  setFictionMode: (enabled: boolean) => void;
}

const FictionModeContext = createContext<FictionModeContextType | undefined>(
  undefined
);

export const FictionModeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isFictionMode, setIsFictionMode] = useState(false);

  const toggleFictionMode = () => setIsFictionMode(prev => !prev);
  const setFictionMode = (enabled: boolean) => setIsFictionMode(enabled);

  return (
    <FictionModeContext.Provider
      value={{ isFictionMode, toggleFictionMode, setFictionMode }}
    >
      {children}
    </FictionModeContext.Provider>
  );
};

export const useFictionMode = () => {
  const context = useContext(FictionModeContext);
  if (context === undefined) {
    throw new Error("useFictionMode must be used within a FictionModeProvider");
  }
  return context;
};
