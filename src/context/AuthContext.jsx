import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USER } from '../utils/mockData';
import { auth, googleProvider, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { bleService } from '../services/bleService';

const AuthContext = createContext();

// Helper to prevent getDoc hanging indefinitely if Firestore DB is not created or unreachable
const safeGetDoc = async (docRef, timeoutMs = 3500) => {
  try {
    return await Promise.race([
      getDoc(docRef),
      new Promise((resolve) => setTimeout(() => resolve({ exists: () => false }), timeoutMs))
    ]);
  } catch (e) {
    return { exists: () => false };
  }
};

// Helper to prevent setDoc hanging indefinitely if Firestore DB is not created or unreachable
const safeSetDoc = async (docRef, data, options = {}, timeoutMs = 3500) => {
  try {
    return await Promise.race([
      setDoc(docRef, data, options),
      new Promise((resolve) => setTimeout(() => resolve(), timeoutMs))
    ]);
  } catch (e) {
    console.error('Firestore setDoc notice:', e);
    return;
  }
};

/**
 * Retrieve previously saved health profile from persistent local storage
 */
export const getSavedHealthProfile = (userId, email) => {
  try {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const profilesStr = localStorage.getItem('footpod_health_profiles');
    const profiles = profilesStr ? JSON.parse(profilesStr) : {};

    // 1. Direct match by userId
    if (userId && profiles[userId]) {
      return profiles[userId];
    }
    // 2. Direct match by email
    if (cleanEmail && profiles[cleanEmail]) {
      return profiles[cleanEmail];
    }
    // 3. Match in footpod_users array
    const usersStr = localStorage.getItem('footpod_users');
    if (usersStr) {
      const usersList = JSON.parse(usersStr);
      const found = usersList.find(u => 
        (userId && u.id === userId) ||
        (cleanEmail && u.email && u.email.toLowerCase().trim() === cleanEmail)
      );
      if (found && (found.hasEnteredHealthData || found.age || found.weightKg || found.heightCm)) {
        return found;
      }
    }
    // 4. Individual keys
    if (userId) {
      const ind = localStorage.getItem('footpod_health_profile_' + userId);
      if (ind) return JSON.parse(ind);
    }
    if (cleanEmail) {
      const ind = localStorage.getItem('footpod_health_profile_' + cleanEmail);
      if (ind) return JSON.parse(ind);
    }
  } catch (e) {
    console.warn('Error reading saved health profile:', e);
  }
  return null;
};

/**
 * Save user health profile locally and permanently so it is never lost on logout
 */
export const saveHealthProfileLocally = (user) => {
  if (!user) return;
  try {
    const profilesStr = localStorage.getItem('footpod_health_profiles');
    const profiles = profilesStr ? JSON.parse(profilesStr) : {};
    const cleanEmail = user.email ? user.email.toLowerCase().trim() : '';

    const healthData = {
      id: user.id,
      name: user.name || '',
      email: cleanEmail,
      age: user.age !== undefined && user.age !== null ? user.age : '',
      gender: user.gender || 'ชาย (Male)',
      weightKg: user.weightKg !== undefined && user.weightKg !== null ? user.weightKg : '',
      heightCm: user.heightCm !== undefined && user.heightCm !== null ? user.heightCm : '',
      footSide: user.footSide || 'ขวา (Right Foot)',
      hasEnteredHealthData: Boolean(user.age || user.weightKg || user.heightCm || user.hasEnteredHealthData),
      updatedAt: new Date().toISOString()
    };

    if (user.id) {
      profiles[user.id] = healthData;
      localStorage.setItem('footpod_health_profile_' + user.id, JSON.stringify(healthData));
    }
    if (cleanEmail) {
      profiles[cleanEmail] = healthData;
      localStorage.setItem('footpod_health_profile_' + cleanEmail, JSON.stringify(healthData));
    }
    localStorage.setItem('footpod_health_profiles', JSON.stringify(profiles));

    // Also update footpod_users array
    const usersStr = localStorage.getItem('footpod_users');
    if (usersStr) {
      try {
        const list = JSON.parse(usersStr);
        const idx = list.findIndex(u => (user.id && u.id === user.id) || (cleanEmail && u.email && u.email.toLowerCase().trim() === cleanEmail));
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...healthData };
        } else {
          list.push({ ...user, ...healthData });
        }
        localStorage.setItem('footpod_users', JSON.stringify(list));
      } catch (e) {}
    }
  } catch (e) {
    console.warn('Error saving health profile locally:', e);
  }
};

export const AuthProvider = ({ children }) => {
  // Load registered users from localStorage or initialize with default demo user
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('footpod_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse users:', e);
      }
    }
    return [INITIAL_USER];
  });

  // Current logged in user
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('footpod_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const savedHealth = getSavedHealthProfile(parsed.id, parsed.email);
        if (savedHealth) {
          return { ...parsed, ...savedHealth };
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse current user:', e);
      }
    }
    return null;
  });

  const [loadingAuth, setLoadingAuth] = useState(true);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check Firestore profile
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await safeGetDoc(userDocRef);

          // Check persistent local health profile for this user
          const savedLocalProfile = getSavedHealthProfile(firebaseUser.uid, firebaseUser.email);

          if (userSnap && typeof userSnap.exists === 'function' && userSnap.exists()) {
            const firestoreData = userSnap.data();
            const resolvedUser = {
              id: firebaseUser.uid,
              ...firestoreData,
              // If local has previously saved health data, keep it!
              name: firestoreData.name || savedLocalProfile?.name || firebaseUser.displayName || 'นักวิ่ง',
              age: (savedLocalProfile?.age !== undefined && savedLocalProfile?.age !== '') ? savedLocalProfile.age : (firestoreData.age ?? ''),
              weightKg: (savedLocalProfile?.weightKg !== undefined && savedLocalProfile?.weightKg !== '') ? savedLocalProfile.weightKg : (firestoreData.weightKg ?? ''),
              heightCm: (savedLocalProfile?.heightCm !== undefined && savedLocalProfile?.heightCm !== '') ? savedLocalProfile.heightCm : (firestoreData.heightCm ?? ''),
              gender: savedLocalProfile?.gender || firestoreData.gender || 'ชาย (Male)',
              footSide: savedLocalProfile?.footSide || firestoreData.footSide || 'ขวา (Right Foot)'
            };
            setCurrentUser(resolvedUser);
            saveHealthProfileLocally(resolvedUser);
          } else if (savedLocalProfile) {
            // Returning user who previously saved health data on this device
            const restoredUser = {
              id: firebaseUser.uid,
              name: savedLocalProfile.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'นักวิ่ง',
              email: firebaseUser.email || savedLocalProfile.email || '',
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firebaseUser.email || 'user')}`,
              age: savedLocalProfile.age ?? '',
              gender: savedLocalProfile.gender || 'ชาย (Male)',
              weightKg: savedLocalProfile.weightKg ?? '',
              heightCm: savedLocalProfile.heightCm ?? '',
              footSide: savedLocalProfile.footSide || 'ขวา (Right Foot)',
              hasEnteredHealthData: true
            };
            setCurrentUser(restoredUser);
            saveHealthProfileLocally(restoredUser);
          } else {
            // Brand-new user logging in (e.g. new Google user without previous data)
            // Leave age, weight, height empty as requested!
            const newUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
              email: firebaseUser.email || '',
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firebaseUser.email || 'user')}`,
              age: '',
              gender: 'ชาย (Male)',
              weightKg: '',
              heightCm: '',
              footSide: 'ขวา (Right Foot)',
              hasEnteredHealthData: false
            };
            setCurrentUser(newUser);
          }
        } catch (e) {
          console.log('Firestore fetch user notice:', e);
        }
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Persist users list on change
  useEffect(() => {
    localStorage.setItem('footpod_users', JSON.stringify(users));
  }, [users]);

  // Persist current session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('footpod_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('footpod_current_user');
    }
  }, [currentUser]);

  /**
   * Register a new user with Firebase Auth + Firestore Profile
   */
  const register = async (userData) => {
    const { name, email, password, age, gender, weightKg, heightCm, footSide } = userData;

    try {
      // 1. Firebase Auth Registration
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;

      const newUser = {
        id: uid,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        age: age !== undefined && age !== '' && age !== null ? Number(age) : '',
        gender: gender || 'ชาย (Male)',
        weightKg: weightKg !== undefined && weightKg !== '' && weightKg !== null ? Number(weightKg) : '',
        heightCm: heightCm !== undefined && heightCm !== '' && heightCm !== null ? Number(heightCm) : '',
        footSide: footSide || 'ขวา (Right Foot)',
        hasEnteredHealthData: Boolean(age || weightKg || heightCm),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        registeredAt: new Date().toISOString()
      };

      // 2. Save user profile into Firestore collection 'users'
      await safeSetDoc(doc(db, 'users', uid), newUser);

      saveHealthProfileLocally(newUser);
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);

      return {
        success: true,
        message: 'สมัครสมาชิกและบันทึกข้อมูลลง Firebase เรียบร้อยแล้ว!',
        user: newUser
      };
    } catch (firebaseErr) {
      console.error('Firebase Register Error:', firebaseErr.code, firebaseErr.message);

      if (firebaseErr.code === 'auth/email-already-in-use') {
        return {
          success: false,
          message: 'อีเมลนี้ถูกใช้งานในระบบแล้ว กรุณาใช้อีเมลอื่น หรือเข้าสู่ระบบ'
        };
      }

      if (firebaseErr.code === 'auth/weak-password') {
        return {
          success: false,
          message: 'รหัสผ่านค่อนข้างอ่อน กรุณาใช้รหัสผ่านอย่างน้อย 6 ตัวอักษร'
        };
      }

      if (firebaseErr.code === 'auth/invalid-email') {
        return {
          success: false,
          message: 'รูปแบบอีเมลไม่ถูกต้อง'
        };
      }

      // Fallback local registration if Firebase is unreachable or unconfigured
      const localUid = 'local_' + Date.now();
      const fallbackUser = {
        id: localUid,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        age: age !== undefined && age !== '' && age !== null ? Number(age) : '',
        gender: gender || 'ชาย (Male)',
        weightKg: weightKg !== undefined && weightKg !== '' && weightKg !== null ? Number(weightKg) : '',
        heightCm: heightCm !== undefined && heightCm !== '' && heightCm !== null ? Number(heightCm) : '',
        footSide: footSide || 'ขวา (Right Foot)',
        hasEnteredHealthData: Boolean(age || weightKg || heightCm),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        registeredAt: new Date().toISOString()
      };
      saveHealthProfileLocally(fallbackUser);
      setUsers(prev => [...prev, fallbackUser]);
      setCurrentUser(fallbackUser);

      return {
        success: true,
        message: 'สมัครสมาชิกสำเร็จ (บันทึกโปรไฟล์ในเครื่องเรียบร้อย)',
        user: fallbackUser
      };
    }
  };

  /**
   * Login with email & password via Firebase Auth
   */
  const login = async (email, password, rememberMe = true) => {
    if (!email || !password) {
      return {
        success: false,
        message: 'กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน'
      };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;

      // Try fetching profile from Firestore with timeout
      let userProfile = null;
      try {
        const userDoc = await safeGetDoc(doc(db, 'users', uid));
        if (userDoc && typeof userDoc.exists === 'function' && userDoc.exists()) {
          userProfile = { id: uid, ...userDoc.data() };
        }
      } catch (e) {}

      const savedLocalProfile = getSavedHealthProfile(uid, email);

      if (!userProfile) {
        if (savedLocalProfile) {
          userProfile = {
            id: uid,
            name: savedLocalProfile.name || userCredential.user.displayName || email.split('@')[0],
            email: email.trim(),
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
            age: savedLocalProfile.age ?? '',
            gender: savedLocalProfile.gender || 'ชาย (Male)',
            weightKg: savedLocalProfile.weightKg ?? '',
            heightCm: savedLocalProfile.heightCm ?? '',
            footSide: savedLocalProfile.footSide || 'ขวา (Right Foot)',
            hasEnteredHealthData: true
          };
        } else {
          userProfile = {
            id: uid,
            name: userCredential.user.displayName || email.split('@')[0],
            email: email.trim(),
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
            age: '',
            gender: 'ชาย (Male)',
            weightKg: '',
            heightCm: '',
            footSide: 'ขวา (Right Foot)',
            hasEnteredHealthData: false
          };
        }
        await safeSetDoc(doc(db, 'users', uid), userProfile, { merge: true });
      } else if (savedLocalProfile) {
        // Restore local values if previously entered
        userProfile = {
          ...userProfile,
          name: userProfile.name || savedLocalProfile.name,
          age: (savedLocalProfile.age !== undefined && savedLocalProfile.age !== '') ? savedLocalProfile.age : (userProfile.age ?? ''),
          weightKg: (savedLocalProfile.weightKg !== undefined && savedLocalProfile.weightKg !== '') ? savedLocalProfile.weightKg : (userProfile.weightKg ?? ''),
          heightCm: (savedLocalProfile.heightCm !== undefined && savedLocalProfile.heightCm !== '') ? savedLocalProfile.heightCm : (userProfile.heightCm ?? ''),
          gender: savedLocalProfile.gender || userProfile.gender || 'ชาย (Male)',
          footSide: savedLocalProfile.footSide || userProfile.footSide || 'ขวา (Right Foot)'
        };
      }

      saveHealthProfileLocally(userProfile);
      setCurrentUser(userProfile);

      return {
        success: true,
        message: `เข้าสู่ระบบด้วย Firebase สำเร็จ! ยินดีต้อนรับคุณ ${userProfile.name}`,
        user: userProfile
      };
    } catch (firebaseErr) {
      console.error('Firebase Login Error:', firebaseErr.code, firebaseErr.message);

      // Check if matches demo user or local registered user
      const trimmedEmail = email.toLowerCase().trim();
      const localMatched = users.find(
        u => u.email?.toLowerCase().trim() === trimmedEmail && u.password === password
      );
      if (localMatched) {
        const savedHealth = getSavedHealthProfile(localMatched.id, localMatched.email);
        const resolvedUser = savedHealth ? { ...localMatched, ...savedHealth } : localMatched;
        saveHealthProfileLocally(resolvedUser);
        setCurrentUser(resolvedUser);
        return {
          success: true,
          message: `เข้าสู่ระบบสำเร็จ ยินดีต้อนรับคุณ ${resolvedUser.name}`,
          user: resolvedUser
        };
      }

      if (firebaseErr.code === 'auth/operation-not-allowed' || firebaseErr.code === 'auth/configuration-not-found') {
        return {
          success: false,
          message: 'ยังไม่ได้เปิดใช้งาน Email/Password Sign-in ใน Firebase Console (สามารถกดปุ่ม "กรอกบัญชีทดลอง" เพื่อเข้าใช้งานได้ทันที)'
        };
      }

      if (
        firebaseErr.code === 'auth/invalid-credential' ||
        firebaseErr.code === 'auth/wrong-password' ||
        firebaseErr.code === 'auth/user-not-found'
      ) {
        return {
          success: false,
          message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือสามารถกดปุ่ม "กรอกบัญชีทดลอง" เพื่อทดสอบระบบได้ทันที'
        };
      }

      return {
        success: false,
        message: `การเข้าสู่ระบบขัดข้อง (${firebaseErr.code || 'Error'}): ${firebaseErr.message}`
      };
    }
  };

  /**
   * Google Sign-In with Firebase Popup & Safe Timeout
   * - Preserves previously saved health data for returning users
   * - Leaves health data fields EMPTY for brand-new Google users
   */
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      let googleUser = null;

      // 1. Try fetching existing profile from Firestore (with timeout)
      try {
        const userDoc = await safeGetDoc(doc(db, 'users', user.uid));
        if (userDoc && typeof userDoc.exists === 'function' && userDoc.exists()) {
          googleUser = { id: user.uid, ...userDoc.data() };
        }
      } catch (e) {}

      // 2. Check if this device has previously saved health data for this Google user
      const savedLocalProfile = getSavedHealthProfile(user.uid, user.email);

      if (googleUser && (googleUser.age || googleUser.weightKg || googleUser.heightCm || googleUser.hasEnteredHealthData)) {
        // Returning user with data in Firestore
        if (savedLocalProfile) {
          googleUser = {
            ...googleUser,
            name: googleUser.name || savedLocalProfile.name || user.displayName || '',
            age: (googleUser.age !== undefined && googleUser.age !== '') ? googleUser.age : (savedLocalProfile.age ?? ''),
            weightKg: (googleUser.weightKg !== undefined && googleUser.weightKg !== '') ? googleUser.weightKg : (savedLocalProfile.weightKg ?? ''),
            heightCm: (googleUser.heightCm !== undefined && googleUser.heightCm !== '') ? googleUser.heightCm : (savedLocalProfile.heightCm ?? ''),
            gender: googleUser.gender || savedLocalProfile.gender || 'ชาย (Male)',
            footSide: googleUser.footSide || savedLocalProfile.footSide || 'ขวา (Right Foot)',
            hasEnteredHealthData: true
          };
        }
      } else if (savedLocalProfile && (savedLocalProfile.age || savedLocalProfile.weightKg || savedLocalProfile.heightCm || savedLocalProfile.hasEnteredHealthData)) {
        // Returning user whose health data was saved locally on this device
        googleUser = {
          id: user.uid,
          name: savedLocalProfile.name || user.displayName || user.email?.split('@')[0] || '',
          email: user.email || '',
          avatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email || 'user')}`,
          age: savedLocalProfile.age ?? '',
          gender: savedLocalProfile.gender || 'ชาย (Male)',
          weightKg: savedLocalProfile.weightKg ?? '',
          heightCm: savedLocalProfile.heightCm ?? '',
          footSide: savedLocalProfile.footSide || 'ขวา (Right Foot)',
          isGoogleAuth: true,
          hasEnteredHealthData: true,
          registeredAt: new Date().toISOString()
        };
        await safeSetDoc(doc(db, 'users', user.uid), googleUser, { merge: true });
      } else {
        // BRAND NEW GOOGLE USER (never logged in / never saved health data before)
        // As requested: Leave fields EMPTY as default!
        googleUser = {
          id: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          avatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email || 'user')}`,
          age: '',
          gender: 'ชาย (Male)',
          weightKg: '',
          heightCm: '',
          footSide: 'ขวา (Right Foot)',
          isGoogleAuth: true,
          hasEnteredHealthData: false,
          registeredAt: new Date().toISOString()
        };
        await safeSetDoc(doc(db, 'users', user.uid), googleUser, { merge: true });
      }

      saveHealthProfileLocally(googleUser);
      setCurrentUser(googleUser);

      setUsers(prev => {
        const idx = prev.findIndex(u => u.id === googleUser.id || (u.email && u.email.toLowerCase() === googleUser.email?.toLowerCase()));
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...googleUser };
          return updated;
        }
        return [...prev, googleUser];
      });

      return {
        success: true,
        message: `เข้าสู่ระบบด้วย Google (${googleUser.email}) สำเร็จ!`,
        user: googleUser
      };
    } catch (err) {
      console.error('Firebase Google Sign-In Error:', err.code, err.message);

      if (err.code === 'auth/popup-closed-by-user') {
        return {
          success: false,
          message: 'คุณได้ปิดหน้าต่างเลือกบัญชี Google ก่อนทำรายการเสร็จสิ้น'
        };
      }

      if (err.code === 'auth/cancelled-popup-request') {
        return {
          success: false,
          message: 'มีการยกเลิกคำขอเข้าสู่ระบบ Google'
        };
      }

      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        return {
          success: false,
          message: 'กรุณาเปิดใช้งาน Google Sign-in ใน Firebase Console (Authentication > Sign-in method)'
        };
      }

      if (err.code === 'auth/unauthorized-domain') {
        return {
          success: false,
          message: 'โดเมนนี้ยังไม่ได้ลงทะเบียนใน Authorized Domains ของ Firebase Auth'
        };
      }

      return {
        success: false,
        message: `เข้าสู่ระบบ Google ขัดข้อง (${err.code || 'Error'}): ${err.message}`
      };
    }
  };

  /**
   * Reset / Forgot Password via Firebase Auth
   */
  const resetPassword = async (email, newPassword) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return {
        success: true,
        message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว กรุณาเช็คกล่องจดหมาย'
      };
    } catch (err) {
      const trimmedEmail = email.toLowerCase().trim();
      const userIndex = users.findIndex(u => u.email.toLowerCase().trim() === trimmedEmail);

      if (userIndex !== -1) {
        const updatedUsers = [...users];
        updatedUsers[userIndex] = { ...updatedUsers[userIndex], password: newPassword };
        setUsers(updatedUsers);
        return {
          success: true,
          message: 'รีเซ็ตรหัสผ่านใหม่เรียบร้อยแล้ว'
        };
      }

      return {
        success: false,
        message: 'ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบความถูกต้อง'
      };
    }
  };

  /**
   * Logout (แจ้งเตือนบอร์ด ESP32 ให้หยุดนับค่าและเข้าสู่โหมด Standby)
   * บันทึกข้อมูลสุขภาพที่ผู้ใช้กรอกไว้ล่าสุดลง local storage ก่อนเคลียร์ session
   */
  const logout = async () => {
    try {
      await bleService.notifyLogout();
    } catch (e) {
      console.warn('BLE notifyLogout error:', e);
    }

    // Always preserve health data that was entered before logging out
    if (currentUser) {
      saveHealthProfileLocally(currentUser);
    }

    try {
      await signOut(auth);
    } catch (e) {}
    setCurrentUser(null);
    localStorage.removeItem('footpod_current_user');
  };

  /**
   * Update Profile in Firestore + LocalState + Persistent Local Storage
   */
  const updateProfile = async (updatedData) => {
    if (!currentUser) return;
    const updated = { 
      ...currentUser, 
      ...updatedData, 
      hasEnteredHealthData: true 
    };
    setCurrentUser(updated);

    // Save locally and persistently
    saveHealthProfileLocally(updated);

    if (currentUser.id) {
      try {
        await updateDoc(doc(db, 'users', currentUser.id), { ...updatedData, hasEnteredHealthData: true });
      } catch (e) {
        await safeSetDoc(doc(db, 'users', currentUser.id), updated, { merge: true });
      }
    }

    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === updated.id || (u.email && u.email.toLowerCase() === updated.email?.toLowerCase()));
      if (idx >= 0) {
        const list = [...prev];
        list[idx] = updated;
        return list;
      }
      return [...prev, updated];
    });
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      loadingAuth,
      login,
      register,
      loginWithGoogle,
      resetPassword,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
