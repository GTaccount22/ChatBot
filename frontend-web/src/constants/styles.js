// Constantes de colores y estilos reutilizables
export const COLOR_PALETTES = {
  dark: {
    background: '#15151D',
    cardBackground: '#2C2C34',
    inputBackground: '#393249',
    buttonColor: '#A988F2',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    borderColor: 'rgba(255,255,255,0.1)',
    chipBackground: '#302E40',
    ratingCardBackground: '#393249'
  },
  light: {
    background: '#D9D9D9',
    cardBackground: '#B0B0B0',
    inputBackground: '#E8E8E8',
    buttonColor: '#A988F2',
    textPrimary: '#000000',
    textSecondary: '#000000',
    borderColor: 'rgba(0,0,0,0.1)',
    chipBackground: '#E0E0E0',
    ratingCardBackground: '#E6E6E6'
  }
};

// Estilos comunes de componentes
export const COMMON_STYLES = {
  card: {
    borderRadius: 4,
    backdropFilter: "blur(10px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.2)",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    transform: "perspective(1000px) rotateX(2deg)",
    "&:hover": {
      transform: "perspective(1000px) rotateX(0deg) translateY(-8px) scale(1.02)",
      boxShadow: "0 30px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.3)"
    }
  },
  input: {
    borderRadius: 2,
    backgroundColor: 'colors.inputBackground',
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#B0B0B0",
      borderWidth: 2
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#475569"
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#9933FF",
      borderWidth: 2
    },
    "& .MuiInputBase-input": {
      color: 'colors.textPrimary'
    },
    "& .MuiInputLabel-root": {
      color: 'colors.textPrimary'
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#A988F2"
    }
  },
  select: {
    borderRadius: 2,
    backgroundColor: 'colors.inputBackground',
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#B0B0B0",
      borderWidth: 2
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#475569"
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#9933FF",
      borderWidth: 2
    },
    "& .MuiSelect-select": {
      color: 'colors.textPrimary'
    },
    "& .MuiSelect-icon": {
      color: 'colors.textPrimary'
    }
  },
  button: {
    borderRadius: 3,
    background: "linear-gradient(145deg, #A988F2 0%, #8B6BCF 50%, #7C4EDB 100%)",
    color: "white",
    fontWeight: 700,
    fontSize: "1rem",
    px: 3,
    minWidth: 120,
    boxShadow: "0 8px 16px rgba(169, 136, 242, 0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)",
    border: `1px solid colors.borderColor`,
    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    transform: "perspective(1000px) rotateX(5deg)",
    "&:hover": {
      background: "linear-gradient(145deg, #8B6BCF 0%, #7C4EDB 50%, #6A3BC7 100%)",
      transform: "perspective(1000px) rotateX(0deg) translateY(-4px) scale(1.05)",
      boxShadow: "0 12px 24px rgba(169, 136, 242, 0.4), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.3)"
    },
    "&:active": {
      transform: "perspective(1000px) rotateX(2deg) translateY(-2px) scale(0.98)",
      boxShadow: "0 4px 8px rgba(169, 136, 242, 0.3), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.4)"
    }
  }
};

// Configuración de MenuProps para Selects
export const SELECT_MENU_PROPS = {
  PaperProps: {
    style: {
      maxHeight: 150,
      overflow: 'auto',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      scrollbarWidth: 'thin',
      scrollbarColor: '#475569 #f1f1f1'
    }
  }
};
