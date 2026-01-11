import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Passwort-Validierung: mind. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl, Sonderzeichen
const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Mindestens 8 Zeichen erforderlich' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Mindestens ein Großbuchstabe erforderlich' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Mindestens ein Kleinbuchstabe erforderlich' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Mindestens eine Zahl erforderlich' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Mindestens ein Sonderzeichen erforderlich (!@#$%^&*...)' };
  }
  return { valid: true, message: '' };
};

// Firebase-Fehler auf Deutsch übersetzen
const mapAuthError = (error: any): string => {
  const errorMap: Record<string, string> = {
    'auth/user-not-found': 'E-Mail oder Passwort ist falsch',
    'auth/wrong-password': 'E-Mail oder Passwort ist falsch',
    'auth/invalid-credential': 'E-Mail oder Passwort ist falsch',
    'auth/invalid-email': 'Ungültige E-Mail-Adresse',
    'auth/weak-password': 'Das Passwort ist zu schwach',
    'auth/email-already-in-use': 'Diese E-Mail-Adresse ist bereits registriert',
    'auth/too-many-requests': 'Zu viele Anmeldeversuche. Bitte später erneut versuchen.',
    'auth/popup-closed-by-user': 'Anmeldung abgebrochen',
    'auth/operation-not-allowed': 'Diese Anmeldemethode ist nicht aktiviert',
  };
  return errorMap[error.code] || error.message || 'Ein Fehler ist aufgetreten';
};

type ViewMode = 'login' | 'register' | 'forgot-password' | 'verification-sent';

const Login: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const { signIn, signUp, signInWithGoogle, signInWithApple, resetPassword } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      if (err.message?.includes('E-Mail-Adresse')) {
        setError(err.message);
      } else {
        setError(mapAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Passwort-Validierung
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message);
      return;
    }

    // Passwörter müssen übereinstimmen
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      setViewMode('verification-sent');
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess('Eine E-Mail zum Zurücksetzen des Passworts wurde gesendet. Prüfen Sie Ihren Posteingang.');
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithApple();
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Passwort-Anforderungen Anzeige
  const PasswordRequirements = () => {
    const checks = [
      { label: 'Mindestens 8 Zeichen', valid: password.length >= 8 },
      { label: 'Großbuchstabe (A-Z)', valid: /[A-Z]/.test(password) },
      { label: 'Kleinbuchstabe (a-z)', valid: /[a-z]/.test(password) },
      { label: 'Zahl (0-9)', valid: /[0-9]/.test(password) },
      { label: 'Sonderzeichen (!@#$...)', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    ];

    return (
      <div className="bg-white/5 rounded-lg p-3 mt-2 text-sm">
        <p className="text-white/60 mb-2">Passwort-Anforderungen:</p>
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className={check.valid ? 'text-green-400' : 'text-white/40'}>
              {check.valid ? '✓' : '○'}
            </span>
            <span className={check.valid ? 'text-green-400' : 'text-white/60'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Bestätigungs-E-Mail gesendet Ansicht
  if (viewMode === 'verification-sent') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold mb-4">Bestätigungs-E-Mail gesendet</h2>
          <p className="text-white/70 mb-6">
            Wir haben eine Bestätigungs-E-Mail an <strong>{email}</strong> gesendet.
            Bitte klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
          </p>
          <p className="text-white/50 text-sm mb-6">
            Prüfen Sie auch Ihren Spam-Ordner, falls Sie die E-Mail nicht finden.
          </p>
          <button
            onClick={() => {
              setViewMode('login');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="btn-primary w-full"
          >
            Zur Anmeldung
          </button>
        </div>
      </div>
    );
  }

  // Passwort vergessen Ansicht
  if (viewMode === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔑</div>
            <h2 className="text-2xl font-bold">Passwort zurücksetzen</h2>
            <p className="text-white/60 mt-2">
              Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="ihre@email.de"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Wird gesendet...' : 'Link senden'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setViewMode('login');
                setError('');
                setSuccess('');
              }}
              className="text-purple-300 hover:text-purple-100 transition-colors"
            >
              Zurück zur Anmeldung
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login / Registrierung Ansicht
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Cashplan Logo" className="w-24 h-24 mx-auto mb-4" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Cashplan
          </h2>
          <p className="text-purple-200 italic">get your cash together</p>
        </div>

        <form onSubmit={viewMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              placeholder="ihre@email.de"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => viewMode === 'register' && setShowPasswordRequirements(true)}
              className="input w-full"
              placeholder={viewMode === 'register' ? 'Sicheres Passwort wählen' : 'Ihr Passwort'}
              required
            />
            {viewMode === 'register' && showPasswordRequirements && <PasswordRequirements />}
          </div>

          {viewMode === 'register' && (
            <div>
              <label className="block text-sm font-medium mb-2">Passwort bestätigen</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input w-full"
                placeholder="Passwort wiederholen"
                required
              />
            </div>
          )}

          {viewMode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setViewMode('forgot-password');
                  setError('');
                }}
                className="text-sm text-purple-300 hover:text-purple-100 transition-colors"
              >
                Passwort vergessen?
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Lädt...' : viewMode === 'login' ? 'Anmelden' : 'Registrieren'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#1a1025] text-white/50">oder</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {/* Google Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Mit Google fortfahren</span>
            </button>

            {/* Apple Button */}
            <button
              onClick={handleAppleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-black hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-xl transition-colors border border-white/20"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span>Mit Apple fortfahren</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setViewMode(viewMode === 'login' ? 'register' : 'login');
              setError('');
              setPassword('');
              setConfirmPassword('');
              setShowPasswordRequirements(false);
            }}
            className="text-purple-300 hover:text-purple-100 transition-colors"
          >
            {viewMode === 'login' ? 'Noch kein Konto? Registrieren' : 'Bereits registriert? Anmelden'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
