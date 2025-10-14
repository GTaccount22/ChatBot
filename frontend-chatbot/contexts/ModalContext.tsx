import React, { createContext, ReactNode, useContext, useState } from 'react';

interface ModalContextType {
  isMenuVisible: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const openMenu = () => setIsMenuVisible(true);
  const closeMenu = () => setIsMenuVisible(false);

  return (
    <ModalContext.Provider value={{ isMenuVisible, openMenu, closeMenu }}>
      {children}
    </ModalContext.Provider>
  );
};
