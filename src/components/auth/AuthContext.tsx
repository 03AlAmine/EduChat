import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';

interface AppUser extends User {
  isAdmin?: boolean;
}

interface UserData {
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;       // 🔧 Ajoute ceci
  description?: string;     // 🔧 Et ceci aussi
  phone?: string;
  location?: string;
  birthdate?: string;
  linkedin?: string;
  github?: string;
}


interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  userData: UserData | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  isAdmin: false,
  userData: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userDataFromDB = userDoc.data() as UserData | undefined;

          const adminStatus = userDataFromDB?.role === 'admin';

          setIsAdmin(adminStatus);
          setCurrentUser({
            ...user,
            isAdmin: adminStatus,
            email: userDataFromDB?.email || user.email,
          });

          setUserData(userDataFromDB ?? null);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setIsAdmin(false);
          setCurrentUser(user);
          setUserData(null);
        }
      } else {
        setIsAdmin(false);
        setCurrentUser(null);
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAdmin, userData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
