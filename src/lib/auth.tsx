import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, ownerEmailAllowlist } from '@/lib/firebase';
import type { OwnerRole } from '@/lib/db/types';

type AuthState = {
  ready: boolean;
  user: User | null;
  role: OwnerRole | null;
  isOwnerWorkspace: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function ensureStaffProfile(user: User): Promise<OwnerRole | null> {
  try {
    const ref = doc(db, 'staff', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return (snap.data().role as OwnerRole) || null;
    const email = (user.email || '').toLowerCase();
    const role: OwnerRole | null = ownerEmailAllowlist().includes(email)
      ? 'owner'
      : null;
    if (role) {
      await setDoc(ref, {
        email,
        name: user.displayName || '',
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return role;
  } catch {
    const email = (user.email || '').toLowerCase();
    return ownerEmailAllowlist().includes(email) ? 'owner' : null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<OwnerRole | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      if (next) {
        void ensureStaffProfile(next).then((r) => {
          setRole(r);
          setReady(true);
        });
      } else {
        setRole(null);
        setReady(true);
      }
    });
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      user,
      role,
      isOwnerWorkspace: Boolean(role),
      async signInEmail(email, password) {
        await signInWithEmailAndPassword(auth, email, password);
      },
      async signUpEmail(name, email, password) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
        await ensureStaffProfile(cred.user);
      },
      async signInGoogle() {
        await signInWithPopup(auth, new GoogleAuthProvider());
      },
      async logout() {
        await signOut(auth);
      },
    }),
    [ready, user, role],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
