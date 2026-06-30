import React, { useState } from 'react';
import { Mail, Lock, AlertTriangle, ArrowRight, User } from 'lucide-react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';

export default function Onboarding() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const lang = typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('de') ? 'de' : 'en';

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!auth) {
      setError(lang === 'de' ? 'Firebase ist nicht konfiguriert.' : 'Firebase is not configured.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!auth) {
      setError(lang === 'de' ? 'Firebase ist nicht konfiguriert.' : 'Firebase is not configured.');
      return;
    }
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    if (!auth) {
      setError(lang === 'de' ? 'Firebase ist nicht konfiguriert.' : 'Firebase is not configured.');
      return;
    }
    setError('');
    setLoading(true);
    const provider = new OAuthProvider('apple.com');
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <div className="onboarding-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00d182" />
                  <stop offset="100%" stopColor="#009688" />
                </linearGradient>
              </defs>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h1 className="onboarding-title">SkinStock</h1>
          <p className="onboarding-subtitle">
            {lang === 'de' ? 'Dein ultimativer CS2 Portfolio Tracker.' : 'Your ultimate CS2 Portfolio Tracker.'}
          </p>
        </div>

        {error && (
          <div className="onboarding-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="onboarding-form">
          <div className="input-group">
            <div className="input-icon"><Mail size={18} /></div>
            <input 
              type="email" 
              placeholder={lang === 'de' ? 'E-Mail Adresse' : 'Email Address'} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <div className="input-icon"><Lock size={18} /></div>
            <input 
              type="password" 
              placeholder={lang === 'de' ? 'Passwort' : 'Password'} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>
          
          <button type="submit" className="onboarding-btn primary-btn" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                {isLogin ? (lang === 'de' ? 'Anmelden' : 'Log In') : (lang === 'de' ? 'Account erstellen' : 'Create Account')}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="onboarding-divider">
          <span>{lang === 'de' ? 'ODER' : 'OR'}</span>
        </div>

        <div className="social-auth-container">
          <button onClick={handleGoogleAuth} className="onboarding-btn social-btn" disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {lang === 'de' ? 'Weiter mit Google' : 'Continue with Google'}
          </button>

          <button onClick={handleAppleAuth} className="onboarding-btn social-btn" disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.126 3.805 3.075 1.52-.05 2.116-.969 3.936-.969 1.802 0 2.348.969 3.936.936 1.627-.035 2.668-1.52 3.64-2.95 1.14-1.663 1.611-3.275 1.629-3.359-.036-.017-3.14-1.206-3.167-4.814-.025-3.02 2.457-4.475 2.57-4.542-1.423-2.078-3.626-2.361-4.407-2.42-1.89-.187-3.774 1.134-4.54 1.134zM15.82 3.646c.833-1.012 1.393-2.416 1.24-3.824-1.205.048-2.698.802-3.551 1.815-.765.894-1.419 2.33-.16 3.702 1.34.104 2.638-.679 3.471-1.693z" />
            </svg>
            {lang === 'de' ? 'Weiter mit Apple' : 'Continue with Apple'}
          </button>
        </div>

        <div className="onboarding-toggle">
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
            {isLogin 
              ? (lang === 'de' ? 'Noch keinen Account? Hier registrieren' : "Don't have an account? Sign up here")
              : (lang === 'de' ? 'Bereits einen Account? Hier einloggen' : 'Already have an account? Log in here')}
          </button>
        </div>
      </div>
    </div>
  );
}
