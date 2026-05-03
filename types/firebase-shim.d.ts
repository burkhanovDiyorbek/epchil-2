declare module "firebase/app" {
  export type FirebaseOptions = {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
  };

  export type FirebaseApp = object;

  export function initializeApp(options: FirebaseOptions): FirebaseApp;
}

declare module "firebase/analytics" {
  import type { FirebaseApp } from "firebase/app";

  export type Analytics = object;
  export function getAnalytics(app?: FirebaseApp): Analytics;
}
