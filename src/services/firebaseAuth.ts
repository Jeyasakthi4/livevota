import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';
import { api, setAuthSession } from './api';
import { User } from '../types';

export interface GoogleAuthResult {
  token: string;
  user: User;
}

// 1. Initialize Firebase Client
const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey || '',
  authDomain: firebaseConfigData.authDomain || '',
  projectId: firebaseConfigData.projectId || '',
  storageBucket: firebaseConfigData.storageBucket || '',
  messagingSenderId: firebaseConfigData.messagingSenderId || '',
  appId: firebaseConfigData.appId || '',
};

export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(firebaseApp);
export const GOOGLE_CLIENT_ID =
  firebaseConfigData.oAuthClientId || '375134866945-tfrhti5g8275cnetq02s5a87vsdih3dj.apps.googleusercontent.com';

/**
 * Sign in using Firebase Google Auth Provider with popup
 */
export async function signInWithFirebasePopup(): Promise<GoogleAuthResult> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  const credential: UserCredential = await signInWithPopup(firebaseAuth, provider);
  const fbUser = credential.user;

  if (!fbUser.email) {
    throw new Error('Google account did not return a valid email address.');
  }

  const idToken = await fbUser.getIdToken();
  const res = await api.verifyGoogleToken({
    credential: idToken,
    email: fbUser.email,
    name: fbUser.displayName || fbUser.email.split('@')[0],
  });

  setAuthSession(res.token, res.user);
  return res;
}

/**
 * Sign in using Google Identity Services (GIS) Token Client Popup
 * Perfect fallback if Firebase Auth provider is not enabled in Firebase console
 */
export function signInWithGisTokenClient(clientId?: string): Promise<GoogleAuthResult> {
  return new Promise((resolve, reject) => {
    const targetClientId = clientId || GOOGLE_CLIENT_ID;

    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      return reject(
        new Error('Google Identity Services script is not loaded yet. Please check your connection and try again.')
      );
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: targetClientId,
        scope: 'openid email profile',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Google sign-in was cancelled.'));
          }

          if (!tokenResponse.access_token) {
            return reject(new Error('No access token received from Google.'));
          }

          try {
            // Fetch verified user profile directly from Google
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });

            if (!userInfoRes.ok) {
              throw new Error('Failed to retrieve user info from Google.');
            }

            const userInfo = await userInfoRes.json();
            if (!userInfo.email) {
              throw new Error('Google account does not have a verified email.');
            }

            const res = await api.verifyGoogleToken({
              email: userInfo.email,
              name: userInfo.name || userInfo.email.split('@')[0],
              credential: tokenResponse.access_token,
            });

            setAuthSession(res.token, res.user);
            resolve(res);
          } catch (fetchErr: any) {
            reject(fetchErr);
          }
        },
        error_callback: (nonOAuthErr: any) => {
          console.warn('[GIS Error Callback]', nonOAuthErr);
          // When GIS popup fails to open in iframe context, trigger direct provider OAuth popup
          reject(new Error(nonOAuthErr?.type || nonOAuthErr?.message || 'popup_blocked'));
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Open direct Google OAuth Provider window as per AI Studio preview guidelines
 */
export function openGoogleOAuthDirectPopup(customRedirectUri?: string): Promise<GoogleAuthResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const redirectUri = customRedirectUri || `${window.location.origin}/auth/callback`;
      const authData = await api.getGoogleAuthUrl(redirectUri);

      if (!authData.configured || !authData.url) {
        return reject(new Error(authData.message || 'Google OAuth is not configured yet.'));
      }

      const popup = window.open(
        authData.url,
        'google_oauth_popup',
        'width=550,height=650,left=250,top=120'
      );

      if (!popup) {
        return reject(new Error('Popup was blocked by your browser. Please allow popups or use email sign-in.'));
      }

      const handleMsg = (event: MessageEvent) => {
        const origin = event.origin;
        if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
          return;
        }
        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMsg);
          resolve({
            token: event.data.token,
            user: event.data.user,
          });
        } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
          window.removeEventListener('message', handleMsg);
          reject(new Error(event.data.error || 'Google authentication was cancelled or failed.'));
        }
      };

      window.addEventListener('message', handleMsg);

      // Check if popup was closed without authenticating
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          window.removeEventListener('message', handleMsg);
        }
      }, 1000);
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Unified Google Sign-in flow:
 * 1. Tries Firebase Auth popup first.
 * 2. If Firebase throws configuration/operation errors or popup fails, falls back gracefully to GIS Token Client.
 */
export async function executeGoogleSignIn(customClientId?: string): Promise<GoogleAuthResult> {
  // 1. Try Firebase popup first
  try {
    return await signInWithFirebasePopup();
  } catch (fbErr: any) {
    console.warn('[Firebase Auth] Notice:', fbErr?.code || fbErr?.message);

    // If user explicitly closed Firebase popup, abort cleanly
    if (fbErr?.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing authentication.');
    }

    // 2. Fall back to GIS OAuth Token Client
    try {
      return await signInWithGisTokenClient(customClientId || GOOGLE_CLIENT_ID);
    } catch (gisErr: any) {
      console.warn('[GIS Client] Notice:', gisErr?.message);

      if (gisErr?.message?.includes('closed') || gisErr?.message?.includes('cancel')) {
        throw gisErr;
      }

      // 3. Fall back to direct provider popup window (works reliably when SDK popups are restricted in iframe)
      try {
        return await openGoogleOAuthDirectPopup();
      } catch (directErr: any) {
        throw new Error(
          directErr?.message || fbErr?.message || 'Could not complete Google authentication. Please try email sign-in or allow popups.'
        );
      }
    }
  }
}

/**
 * Sign out from Firebase session
 */
export async function signOutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(firebaseAuth);
  } catch {}
}
