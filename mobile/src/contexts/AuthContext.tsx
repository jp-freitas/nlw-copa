import { createContext, ReactNode, useEffect, useState } from "react";
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { api } from "../services/api";

WebBrowser.maybeCompleteAuthSession();

interface UserProps {
  name: string;
  avatarUrl: string;
}

export interface AuthContextDataProps {
  user: UserProps;
  isUserLoggingIn: boolean;
  signIn: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextDataProps);

export function AuthContextProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProps>({} as UserProps);
  const [isUserLoggingIn, setIsUserLoggingIn] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.CLIENT_ID,
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
    scopes: ['profile', 'email']
  });


  async function signIn() {
    try {
      setIsUserLoggingIn(true);
      await promptAsync();

    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      setIsUserLoggingIn(false);
    }
  }

  async function signInWithGoogle(access_token: string) {
    try {
      setIsUserLoggingIn(true);
      const tokenResponse = await api.post("/users", {
        access_token
      });
      console.log(tokenResponse.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenResponse.data.token}`;
      const userInfoResponse = await api.get("/me");
      setUser(userInfoResponse.data.user);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      setIsUserLoggingIn(false);
    }
  }

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.accessToken) {
      signInWithGoogle(response.authentication.accessToken);
    }
  }, [response]);

  return (
    <AuthContext.Provider value={{
      signIn,
      isUserLoggingIn,
      user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}