import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = 'https://tu-dominio.azurecontainerapps.io';
const appBoundDomain = new URL(serverUrl).hostname;

const config: CapacitorConfig = {
  appId: 'com.vmoda.app',
  appName: 'VModa',
  webDir: 'www',
  server: {
    url: serverUrl,
    cleartext: false,
    allowNavigation: [appBoundDomain, '*.azurecontainerapps.io'],
  },
  ios: {
    limitsNavigationsToAppBoundDomains: true,
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      showSpinner: false,
      backgroundColor: '#ffffff',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
    },
    FirebaseMessaging: {
      presentationOptions: [],
    },
  },
};

export default config;
