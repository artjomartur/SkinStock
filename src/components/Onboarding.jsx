import React, { useState, useEffect } from 'react';
import { Mail, Lock, AlertTriangle, ArrowRight, ArrowLeft, TrendingUp, Briefcase, Link as LinkIcon } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Onboarding({ user, setSteamIdInput, currency, setCurrency, valuationMode, setValuationMode }) {
  const [step, setStep] = useState(0);
  const [steamIdLocal, setSteamIdLocal] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const lang = typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('de') ? 'de' : 'en';

  const handleSaveSteamId = async (e) => {
    e.preventDefault();
    if (!steamIdLocal.trim()) {
      setError(lang === 'de' ? 'Bitte gib eine Steam ID ein.' : 'Please enter a Steam ID.');
      return;
    }
    
    // Extract ID if it's a URL
    let finalId = steamIdLocal.trim();
    if (finalId.includes('steamcommunity.com/profiles/')) {
      finalId = finalId.split('steamcommunity.com/profiles/')[1].split('/')[0];
    } else if (finalId.includes('steamcommunity.com/id/')) {
      finalId = finalId.split('steamcommunity.com/id/')[1].split('/')[0];
    }
    
    setLoading(true);
    setError('');
    try {
      localStorage.setItem('skinstock_steam_id', finalId);
      if (setSteamIdInput) {
        setSteamIdInput(finalId);
      }
      
      // Auto sign in anonymously to keep database syncing working if firebase is configured
      if (auth && !user) {
        await signInAnonymously(auth);
      }
      
      if (user && db) {
        await setDoc(doc(db, 'users', user.uid), { steamId: finalId }, { merge: true });
      }
    } catch (err) {
      console.error(err);
      setError(lang === 'de' ? 'Fehler beim Speichern der Steam ID.' : 'Error saving Steam ID.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <div className="onboarding-step-content slide-in-right">
          <div className="step-icon-wrapper" style={{ marginBottom: '24px' }}>
            <Briefcase size={48} color="var(--color-green)" />
          </div>
          <h2>{lang === 'de' ? 'Dein CS2 Portfolio' : 'Your CS2 Portfolio'}</h2>
          <p>
            {lang === 'de' 
              ? 'Behalte den Überblick über all deine Skins. Verfolge den Gesamtwert deines Inventars in Echtzeit und sieh sofort, wie viel du im Plus bist.'
              : 'Keep track of all your skins. Monitor the total value of your inventory in real-time and instantly see your profits.'}
          </p>
          <button onClick={() => setStep(1)} className="onboarding-btn primary-btn" style={{ marginTop: '24px' }}>
            {lang === 'de' ? 'Weiter' : 'Next'} <ArrowRight size={18} />
          </button>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="onboarding-step-content slide-in-right">
          <div className="step-icon-wrapper" style={{ marginBottom: '24px' }}>
            <TrendingUp size={48} color="#a855f7" />
          </div>
          <h2>{lang === 'de' ? 'Analysen & Trends' : 'Analytics & Trends'}</h2>
          <p>
            {lang === 'de'
              ? 'Nutze technische Indikatoren (RSI, SMA) und Marktdaten, um den perfekten Kauf- oder Verkaufszeitpunkt für deine Skins zu finden.'
              : 'Use technical indicators (RSI, SMA) and market data to find the perfect time to buy or sell your skins.'}
          </p>
          <div className="step-nav-buttons" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => setStep(0)} className="onboarding-btn secondary-btn" style={{ flex: 1 }}>
              <ArrowLeft size={18} /> {lang === 'de' ? 'Zurück' : 'Back'}
            </button>
            <button onClick={() => setStep(2)} className="onboarding-btn primary-btn" style={{ flex: 1 }}>
              {lang === 'de' ? 'Loslegen' : 'Get Started'} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="onboarding-step-content slide-in-right">
          <div className="step-icon-wrapper" style={{ marginBottom: '16px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </div>
          <h2>{lang === 'de' ? 'Einstellungen' : 'Settings'}</h2>
          <p style={{ fontSize: '0.9rem', color: '#8e8e93', marginBottom: '20px' }}>
            {lang === 'de' ? 'Passe deine Währung und deinen favorisierten Marktplatz an.' : 'Customize your currency and preferred marketplace.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', textAlign: 'left', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase' }}>Währung</label>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="EUR" style={{ background: '#000' }}>EUR (€)</option>
                <option value="USD" style={{ background: '#000' }}>USD ($)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase' }}>Marktplatz</label>
              <select 
                value={valuationMode} 
                onChange={(e) => setValuationMode(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="STEAM" style={{ background: '#000' }}>Steam (Standard)</option>
                <option value="CASHOUT" style={{ background: '#000' }}>Cashout (75% Realwert)</option>
              </select>
            </div>
          </div>

          <div className="step-nav-buttons" style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button onClick={() => setStep(1)} className="onboarding-btn secondary-btn" style={{ flex: 1 }}>
              <ArrowLeft size={18} /> {lang === 'de' ? 'Zurück' : 'Back'}
            </button>
            <button onClick={() => setStep(3)} className="onboarding-btn primary-btn" style={{ flex: 1 }}>
              {lang === 'de' ? 'Speichern & Weiter' : 'Save & Next'} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      );
    }

    if (step === 3) {
      const getSteamAuthURL = () => {
        const returnUrl = window.location.origin;
        const url = new URL("https://steamcommunity.com/openid/login");
        url.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
        url.searchParams.set("openid.mode", "checkid_setup");
        url.searchParams.set("openid.return_to", returnUrl);
        url.searchParams.set("openid.realm", returnUrl);
        url.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
        url.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");
        return url.toString();
      };

      const handleSteamRedirect = () => {
        window.location.href = getSteamAuthURL();
      };

      const handleSkipMock = async () => {
        const mockId = "76561198000000000";
        localStorage.setItem('skinstock_steam_id', mockId);
        
        if (auth && !user) {
          try {
            await signInAnonymously(auth);
          } catch (e) {
            console.error('Anonymous sign in failed', e);
          }
        }
        
        if (setSteamIdInput) {
          setSteamIdInput(mockId);
        }
      };

      return (
        <div className="onboarding-step-content fade-in">
          <div className="step-icon-wrapper" style={{ marginBottom: '16px' }}>
            <LinkIcon size={40} color="#4B69FF" />
          </div>
          <h2 style={{ marginBottom: '8px', fontSize: '1.5rem' }}>{lang === 'de' ? 'Mit Steam verbinden' : 'Connect Steam'}</h2>
          <p style={{ marginBottom: '24px', fontSize: '0.95rem' }}>
            {lang === 'de' 
              ? 'Verbinde deinen Account sicher über Steam OpenID, um dein CS2-Inventar automatisch zu laden.'
              : 'Connect your account securely via Steam OpenID to load your CS2 inventory automatically.'}
          </p>

          {error && (
            <div className="onboarding-error" style={{ marginBottom: '16px' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <button 
              onClick={handleSteamRedirect} 
              className="onboarding-btn primary-btn"
              style={{ background: 'linear-gradient(135deg, #4B69FF 0%, #00F0FF 100%)', color: '#fff', fontWeight: 'bold' }}
            >
              {lang === 'de' ? 'Jetzt mit Steam anmelden 🎮' : 'Sign in with Steam 🎮'}
            </button>

            {/* Manual entry fallback */}
            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>
                Oder manuell mit SteamID verbinden
              </div>
              <form onSubmit={handleSaveSteamId} className="onboarding-form">
                <div className="input-group">
                  <input 
                    type="text" 
                    placeholder={lang === 'de' ? 'SteamID64 eingeben (z.B. 7656119...)' : 'Enter SteamID64 (e.g. 7656119...)'} 
                    value={steamIdLocal}
                    onChange={(e) => setSteamIdLocal(e.target.value)}
                    required
                    style={{ paddingLeft: '16px' }}
                  />
                </div>
                <button type="submit" className="onboarding-btn secondary-btn" disabled={loading} style={{ marginTop: '8px' }}>
                  {loading ? <span className="spinner"></span> : (lang === 'de' ? 'Manuell laden' : 'Load Manually')}
                </button>
              </form>
            </div>

            <button 
              onClick={handleSkipMock} 
              style={{ background: 'none', border: 'none', color: '#8e8e93', fontSize: '0.8rem', cursor: 'pointer', marginTop: '12px' }}
            >
              {lang === 'de' ? 'Ohne Steam fortfahren (Mock Data)' : 'Continue without Steam (Mock Data)'}
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container" style={{ position: 'relative' }}>
        
        {step < 2 && (
          <button 
            className="skip-btn" 
            onClick={() => setStep(2)}
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#8e8e93', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            {lang === 'de' ? 'Überspringen' : 'Skip'}
          </button>
        )}

        <div className="onboarding-header" style={{ marginBottom: step === 2 ? '0' : '24px', display: step === 3 ? 'none' : 'block' }}>
          <h1 className="onboarding-title">SkinStock</h1>
        </div>

        {renderStepContent()}

        {step < 3 && (
          <div className="step-indicators">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className={`step-dot ${step === i ? 'active' : ''}`}
                onClick={() => setStep(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
