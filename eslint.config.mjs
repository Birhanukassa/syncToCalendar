import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "src/archive/**",
      "src/claud-refactored.js",
      "src/Code.js"
    ],
  },
  {
    // Base configuration for all JS/TS files
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn", // Use "warn" instead of "error" for unused vars
        { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" },
      ],
    },
    languageOptions: {
      globals: {
        ...globals.browser, // Keep browser globals
        // --- Add Google Apps Script Globals Here ---
        CalendarApp: "readonly",
        PropertiesService: "readonly",
        CacheService: "readonly",
        UrlFetchApp: "readonly",
        Utilities: "readonly",
        MailApp: "readonly",
        Session: "readonly",
        HtmlService: "readonly",
        OAuth2: "readonly", // For the OAuth2 library
        QUnit: "readonly", // For your test runner
        // --- Add your own global functions/classes ---
        // These are the classes and functions you've split into separate files.
        // Since Apps Script treats them all as global, we'll do the same for ESLint.
        ConfigurationManager: "readonly",
        ErrorHandler: "readonly",
        PerformanceMonitor: "readonly",
        CalendarManager: "readonly",
        ApiClient: "readonly",
        TogglSource: "readonly",
        GoogleFitSource: "readonly",
      },
    },
  },
  {
    // Special overrides for third-party libraries
    files: ["src/OAuth2.js"],
    rules: {
      "no-cond-assign": "off",
      "no-prototype-builtins": "off",
    },
  },
]);
