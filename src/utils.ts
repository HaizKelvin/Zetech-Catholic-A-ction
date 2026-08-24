import { auth, db } from './firebase';
import { OperationType, FirestoreErrorInfo } from './types';
import { doc, getDocFromServer } from 'firebase/firestore';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  return errInfo;
}

export interface FormattedAuthError {
  title: string;
  message: string;
  isConnectionError: boolean;
  canRetry: boolean;
  code?: string;
}

export function formatAuthError(error: any): FormattedAuthError {
  if (!error) {
    return {
      title: 'Error',
      message: 'An unknown error occurred.',
      isConnectionError: false,
      canRetry: true
    };
  }

  const code = error.code || '';
  const message = error.message || String(error);

  // Network / Connection errors
  if (
    code === 'auth/network-request-failed' ||
    message.includes('network-request-failed') ||
    message.includes('offline') ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('the client is offline') ||
    message.includes('took too long to respond')
  ) {
    return {
      title: 'Connection / Network Notice',
      message: 'The network connection was interrupted. Please check your internet connection or use the Phone Number / Email form below, which connects directly to Firebase.',
      isConnectionError: true,
      canRetry: true,
      code
    };
  }

  // Invalid credentials
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return {
      title: 'Incorrect Credentials',
      message: 'The phone number, email address, or password entered does not match our records. Please verify and try again, or create a new student account.',
      isConnectionError: false,
      canRetry: true,
      code
    };
  }

  // Account exists
  if (code === 'auth/email-already-in-use') {
    return {
      title: 'Account Already Exists',
      message: 'An account with this email or phone number already exists. Please switch to the Sign In tab.',
      isConnectionError: false,
      canRetry: false,
      code
    };
  }

  // Weak password
  if (code === 'auth/weak-password') {
    return {
      title: 'Password Too Weak',
      message: 'Your password must be at least 6 characters long.',
      isConnectionError: false,
      canRetry: true,
      code
    };
  }

  // Invalid email
  if (code === 'auth/invalid-email') {
    return {
      title: 'Invalid Email Address',
      message: 'Please enter a valid email address (e.g., student@zetech.ac.ke).',
      isConnectionError: false,
      canRetry: true,
      code
    };
  }

  // Popup blocked
  if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
    return {
      title: 'Google Popup Blocked in Preview',
      message: 'The browser or iframe blocked the Google sign-in window. To use Google Sign-In, please allow popups or open this app in a new browser tab. Alternatively, use your Phone Number or Email below for instant access.',
      isConnectionError: true,
      canRetry: true,
      code
    };
  }

  // Popup closed by user
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return {
      title: 'Google Sign-In Cancelled',
      message: 'The Google authentication popup was closed before completing. Please try again or use Phone / Email registration.',
      isConnectionError: false,
      canRetry: true,
      code
    };
  }

  // Account exists with different credential
  if (code === 'auth/account-exists-with-different-credential') {
    return {
      title: 'Account Exists with Different Method',
      message: 'An account already exists with this email using password sign-in. Please sign in using your Password.',
      isConnectionError: false,
      canRetry: false,
      code
    };
  }

  // Unauthorized domain
  if (code === 'auth/unauthorized-domain') {
    return {
      title: 'Google OAuth Domain Notice',
      message: 'Google Sign-In requires adding this preview domain to Firebase Authorized Domains. You can immediately create an account or sign in using your Phone Number or Email below with zero setup!',
      isConnectionError: true,
      canRetry: false,
      code
    };
  }

  // Operation not allowed
  if (code === 'auth/operation-not-allowed') {
    return {
      title: 'Google Provider Disabled in Firebase',
      message: 'Google Sign-In is not currently enabled in this project’s Firebase Auth settings. Please use your Phone Number or Email to sign up and join instantly.',
      isConnectionError: true,
      canRetry: false,
      code
    };
  }

  // Admin restricted operation
  if (code === 'auth/admin-restricted-operation') {
    return {
      title: 'Operation Restricted',
      message: 'Anonymous sign-in or guest account creation is disabled in your Firebase Authentication console settings. Please sign in or create an account with your Email & Password.',
      isConnectionError: false,
      canRetry: true,
      code
    };
  }

  // Too many requests
  if (code === 'auth/too-many-requests') {
    return {
      title: 'Too Many Attempts',
      message: 'Access has been temporarily disabled due to too many failed login attempts. Please wait a few minutes and try again.',
      isConnectionError: false,
      canRetry: false,
      code
    };
  }

  // Missing or internal error
  return {
    title: 'Authentication Error',
    message: error.message || 'An unexpected error occurred. Please check your connection and try again.',
    isConnectionError: false,
    canRetry: true,
    code
  };
}

export async function checkFirebaseConnection(): Promise<{ ok: boolean; message: string; details?: string }> {
  try {
    const testRef = doc(db, '_connection_test_', 'ping');
    await getDocFromServer(testRef).catch((err) => {
      // Permission denied still confirms server is reachable!
      if (err?.code === 'permission-denied' || (err?.message && err.message.includes('Missing or insufficient permissions'))) {
        return;
      }
      throw err;
    });
    return { ok: true, message: 'Firebase is connected' };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes('offline') || err?.code === 'unavailable' || errMsg.includes('network-request-failed')) {
      return {
        ok: false,
        message: 'Cannot connect to Firebase (Client is offline or network is blocked)',
        details: errMsg
      };
    }
    return {
      ok: false,
      message: 'Firebase connection check failed',
      details: errMsg
    };
  }
}

// RFC 5322 compliant regex for strict client-side & database-aligned email validation
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  sanitized: string;
}

export function validateEmailPattern(rawEmail: string): EmailValidationResult {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { isValid: false, error: 'Email address is required.', sanitized: '' };
  }
  const sanitized = rawEmail.trim().toLowerCase();
  if (sanitized.length < 5) {
    return { isValid: false, error: 'Email address is too short.', sanitized };
  }
  if (sanitized.length > 120) {
    return { isValid: false, error: 'Email address cannot exceed 120 characters.', sanitized };
  }
  if (!EMAIL_REGEX.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g., student@domain.com).', sanitized };
  }
  if (sanitized.includes('..') || sanitized.startsWith('.') || sanitized.endsWith('.')) {
    return { isValid: false, error: 'Email format contains invalid dot placements.', sanitized };
  }
  return { isValid: true, sanitized };
}

export function isValidEmail(email: string): boolean {
  return validateEmailPattern(email).isValid;
}

export const cn = (...inputs: any[]) => {
  return inputs.filter(Boolean).join(' ');
};

export function compressImage(file: File, maxWidth = 360, maxHeight = 360, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      return reject(new Error('Invalid file provided for image compression'));
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const result = event.target?.result;
      if (!result || typeof result !== 'string') {
        return reject(new Error('Failed to read image data'));
      }
      const img = new Image();
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }

        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(result);
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

