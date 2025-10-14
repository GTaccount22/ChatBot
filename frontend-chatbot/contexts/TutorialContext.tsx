import React, { createContext, ReactNode, useContext, useState } from 'react';

interface TutorialContextType {
  startTutorial: () => void;
  finishTutorial: () => void;
  isTutorialVisible: boolean;
  currentStep: number;
  nextStep: () => void;
  isManualTutorial: boolean;
  setIsManualTutorial: (isManual: boolean) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) throw new Error('useTutorial must be used within a TutorialProvider');
  return context;
};

interface TutorialProviderProps { 
  children: ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isManualTutorial, setIsManualTutorial] = useState(false);

  const startTutorial = () => {
    setCurrentStep(0);
    setIsTutorialVisible(true);
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const finishTutorial = () => {
    setIsTutorialVisible(false);
    setCurrentStep(0);
    setIsManualTutorial(false);
  };

  return (
    <TutorialContext.Provider
      value={{ 
        startTutorial, 
        finishTutorial, 
        isTutorialVisible, 
        currentStep, 
        nextStep,
        isManualTutorial,
        setIsManualTutorial
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};