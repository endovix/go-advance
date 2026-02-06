import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {
  DynamicContextProvider,
  getAuthToken
} from "@dynamic-labs/sdk-react-core";
import { getUser } from "./services/api.ts";

// Suppress DynamicSDK user cancellation errors
const originalError = console.error;
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  if (message.includes('[DynamicSDK]') && message.includes('User cancelled')) {
    return; // Silently ignore user cancellation
  }
  originalError.apply(console, args);
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DynamicContextProvider
      theme="dark"
      settings={{
        environmentId: import.meta.env.VITE_DYNAMIC_ENV_ID!,
        social: { strategy: "popup" },
        debugError: false,
        logLevel: "MUTE",
        handlers: {
          handleAuthenticatedUser: async () => {
            try {
              const token = getAuthToken();
              if (!token) {
                console.log('No auth token available');
                return;
              }

              const user = await getUser(token);
              if (user) {
                // Save user profile to localStorage for persistence
                localStorage.setItem('user', JSON.stringify(user));
                
                // Dispatch custom event to notify App component
                window.dispatchEvent(new CustomEvent('user-authenticated', { detail: 'user-authenticated' }));
                console.log('User authenticated and saved to localStorage');
              } else {
                console.log('Failed to fetch user data from API');
              }
            } catch (error) {
              console.log('Error during authentication:', error);
            }
          },
        },
      }}
    >
      <App />
    </DynamicContextProvider>
  </StrictMode>
);
