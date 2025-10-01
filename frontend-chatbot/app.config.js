import 'dotenv/config';

export default {
  expo: {
    name: "Mobile Chatbot",
    slug: "mobile-chatbot",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    scheme: "mobile-chatbot",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    },
  },
};
