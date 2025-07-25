// Global type definitions for Vite build-time constants

interface BuildInfo {
  timestamp: string;
  buildDate: string;
}

declare const __BUILD_INFO__: BuildInfo;
