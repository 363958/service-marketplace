import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

export type AuthContextType = {
  userToken: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

type Props = {
  children: ReactNode;
};

const AuthProvider = ({ children }: Props) => {
  const [userToken, setUserToken] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const login = async (token: string) => {
    setUserToken(token);
    await AsyncStorage.setItem("token", token);
  };

  const logout = async () => {
    setUserToken(null);
    await AsyncStorage.removeItem("token");
  };

  useEffect(() => {
    const checkLogin = async () => {
      const token =
        await AsyncStorage.getItem("token");

      setUserToken(token);
      setLoading(false);
    };

    checkLogin();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userToken,
        login,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;