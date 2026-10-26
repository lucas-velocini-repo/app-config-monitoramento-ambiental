const isDevelopment =
  process.env.APP_VARIANT === "development";

export default {
  expo: {
    name: isDevelopment
      ? "CASAS DEV"
      : "CASAS",

    slug: "app-config-it",

    version: "1.1.0",

    orientation: "portrait",

    icon: "./assets/images/logo-7.png",

    scheme: "meuappmobile",

    userInterfaceStyle: "automatic",

    newArchEnabled: true,

    ios: {
      supportsTablet: true,
    },

    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage:
          "./assets/images/logo-7.png",
        backgroundImage:
          "./assets/images/logo-7.png",
        monochromeImage:
          "./assets/images/logo-7.png",
      },

      edgeToEdgeEnabled: true,

      predictiveBackGestureEnabled: false,

      permissions: [
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.ACCESS_FINE_LOCATION",
      ],

      package: isDevelopment
        ? "com.anonymous.meuappmobile.dev"
        : "com.anonymous.meuappmobile",
    },

    web: {
      output: "static",
      favicon: "./assets/images/logo-7.png",
    },

    plugins: [
      "expo-router",
      "expo-secure-store",

      [
        "expo-splash-screen",
        {
          image:
            "./assets/images/logo-7.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",

          dark: {
            backgroundColor: "#000000",
          },
        },
      ],

      [
        "react-native-ble-plx",
        {
          isBackgroundEnabled: true,

          modes: [
            "peripheral",
            "central",
          ],

          bluetoothPermission:
            "Permitir que $(PRODUCT_NAME) acesse o bluetooth.",
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      router: {},

      eas: {
        projectId:
          "0acc96b7-149f-48fa-bf21-fe32dfda841c",
      },
    },
  },
};