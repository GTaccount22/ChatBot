import { useCallback } from 'react';

// Hook simplificado para protección contra duplicación
export const useProtectedInput = () => {
  const handleChange = useCallback((
    newValue: string, 
    setValue: (value: string) => void,
    transform?: (value: string) => string
  ) => {
    const processedValue = transform ? transform(newValue) : newValue;
    setValue(processedValue);
  }, []);

  return { handleChange };
};

// Utilidades de formateo simplificadas
export const SamsungInputUtils = {
  formatRut: (text: string): string => {
    let clean = text.replace(/[^0-9kK]/g, "").toUpperCase();
    let body = clean.slice(0, -1);
    let dv = clean.slice(-1);
    body = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return body ? `${body}-${dv}` : dv;
  },
  formatEmail: (text: string): string => text.toLowerCase().trim(),
  formatComments: (text: string): string => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },
};
