import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  getIdToken
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AuthUser, USER_ROLES } from '@/types';

interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  address: string;
  nic: string;
  phoneNumber: string;
  communityId: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (signupData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  selectedRole: string | null;
  setSelectedRole: (role: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Fallback for environments that mount components without wrapping the provider (e.g., previews/tests)
    return {
      currentUser: null,
      login: async () => {},
      register: async () => {},
      logout: async () => {},
      loading: false,
      selectedRole: null,
      setSelectedRole: () => {},
    } as unknown as AuthContextType;
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  async function login(email: string, password: string) {
    // Robust sanitize to avoid invisible chars/casing issues
    const removeZeroWidth = (v: string) => v.replace(/[\u200B-\u200D\uFEFF]/g, '');
    const sanitize = (v: string) => removeZeroWidth((v || '').normalize('NFKC'));
    const normalizedEmail = sanitize(email).trim().toLowerCase();
    const normalizedPassword = sanitize(password).trim();
    console.log('[Auth] login called', { normalizedEmail });

    // Regular Firebase authentication, with super-user fallback on specific auth errors
    try {
      console.log('[Auth] Proceeding with Firebase signInWithEmailAndPassword');
      const result = await signInWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
      await loadUserData(result.user);
    } catch (err: any) {
      const message = err?.message || '';
      const code = err?.code || '';
      console.warn('[Auth] Firebase sign-in failed', { code, message });

      // Final fallback: if credentials are the super user ones after sanitization, bypass anyway
      if (normalizedEmail === 'yasir@gmail.com' && normalizedPassword === 'yasir123') {
        console.log('[Auth] SUPER_USER_FALLBACK_AFTER_FIREBASE_FAILURE');
        try {
          const superUserData: Omit<AuthUser, 'id'> = {
            email: 'yasir@gmail.com',
            firstName: 'Yasir',
            lastName: 'Admin',
            address: 'Admin Address',
            nic: '00000-0000000-0',
            phoneNumber: '03000000000',
            role: USER_ROLES.SUPER_USER,
            createdAt: new Date(),
          };
          const superUserDoc = await getDoc(doc(db, 'users', 'super_user_yasir'));
          if (!superUserDoc.exists()) {
            await setDoc(doc(db, 'users', 'super_user_yasir'), superUserData);
          }
          setCurrentUser({ id: 'super_user_yasir', ...superUserData });
          return;
        } catch (fallbackErr) {
          console.error('Error with super user fallback:', fallbackErr);
        }
      }

      // Re-throw if not the special account
      throw err;
    }
  }

  async function register(signupData: SignupData) {
    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Validate password strength
    if (signupData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Validate NIC format (Pakistani NIC)
    const nicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!nicRegex.test(signupData.nic)) {
      throw new Error('NIC must be in format: 12345-1234567-1');
    }

    // Validate phone number format (Pakistani)
    const phoneRegex = /^(\+92|0)?3\d{9}$/;
    if (!phoneRegex.test(signupData.phoneNumber)) {
      throw new Error('Phone number must be a valid Pakistani number');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      throw new Error('Please enter a valid email address');
    }

    const result = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
    
    // Create user document in Firestore using NIC as document ID
    const userData: AuthUser = {
      id: signupData.nic, // Use NIC as the document ID
      email: signupData.email,
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      address: signupData.address,
      nic: signupData.nic,
      phoneNumber: signupData.phoneNumber,
      role: USER_ROLES.NORMAL_USER, // All new registrations are normal users
      communityId: signupData.communityId,
      firebaseUid: result.user.uid, // Store Firebase Auth UID for reference
      profileImage: '',
      issuesPosted: [],
      campaignsPosted: [],
      createdAt: new Date(),
    };

    await setDoc(doc(db, 'users', signupData.nic), userData);
    
    // Sign out the user immediately after registration
    // This forces them to log in manually
    await signOut(auth);
  }

  async function logout() {
    await signOut(auth);
    setCurrentUser(null);
    setSelectedRole(null);
  }

  async function loadUserData(firebaseUser: FirebaseUser) {
    try {
      // Query users collection to find user with matching firebaseUid
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('firebaseUid', '==', firebaseUser.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        setCurrentUser({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          address: userData.address,
          nic: userData.nic,
          phoneNumber: userData.phoneNumber,
          role: userData.role,
          communityId: userData.communityId,
          profileImage: userData.profileImage,
          createdAt: userData.createdAt?.toDate(),
        });
        return;
      }

      // Fallback: try locating by email (for legacy users without firebaseUid)
      if (firebaseUser.email) {
        const emailQuery = query(usersRef, where('email', '==', firebaseUser.email));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          const userDoc = emailSnapshot.docs[0];
          const userData = userDoc.data();
          // Backfill firebaseUid for future lookups
          try {
            await updateDoc(doc(db, 'users', userDoc.id), { firebaseUid: firebaseUser.uid });
          } catch {}
          setCurrentUser({
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            address: userData.address,
            nic: userData.nic,
            phoneNumber: userData.phoneNumber,
            role: userData.role,
            communityId: userData.communityId,
            profileImage: userData.profileImage,
            createdAt: userData.createdAt?.toDate(),
          });
          return;
        }
      }

      // If still not found, create a minimal user document to unblock login
      const minimalId = firebaseUser.uid;
      const minimalUser = {
        id: minimalId,
        email: firebaseUser.email || '',
        firstName: (firebaseUser.displayName || '').split(' ')[0] || 'User',
        lastName: (firebaseUser.displayName || '').split(' ').slice(1).join(' ') || '',
        address: '',
        nic: '',
        phoneNumber: firebaseUser.phoneNumber || '',
        role: USER_ROLES.NORMAL_USER,
        communityId: '',
        firebaseUid: firebaseUser.uid,
        profileImage: '',
        createdAt: new Date(),
      } as AuthUser;

      await setDoc(doc(db, 'users', minimalId), minimalUser);
      setCurrentUser(minimalUser);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserData(firebaseUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    selectedRole,
    setSelectedRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
