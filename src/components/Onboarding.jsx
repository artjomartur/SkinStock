import React, { useState } from 'react';
import { Mail, Lock, AlertTriangle, ArrowRight, ArrowLeft, TrendingUp, Briefcase, Link as LinkIcon, Settings2 } from 'lucide-react';
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

  const getGlowColor = () => {
    switch(step) {
      case 0: return '#00FF77';
      case 1: return '#a855f7';
      case 2: return '#00F0FF';
      case 3: return '#FF2E93';
      default: return '#00F0FF';
    }
  };

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <div className="onboarding-step-content slide-in-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="step-icon-wrapper" style={{ filter: 'drop-shadow(0 0 15px rgba(0, 255, 119, 0.35))' }}>
            <Briefcase size={36} color="#00FF77" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>
            {lang === 'de' ? 'Dein CS2 Portfolio' : 'Your CS2 Portfolio'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', padding: '0 12px' }}>
            {lang === 'de' 
              ? 'Behalte den Überblick über all deine Skins. Verfolge den Gesamtwert deines Inventars in Echtzeit und sieh sofort, wie viel du im Plus bist.'
              : 'Keep track of all your skins. Monitor the total value of your inventory in real-time and instantly see your profits.'}
          </p>
          <button 
            onClick={() => setStep(1)} 
            className="onboarding-btn primary-btn" 
            style={{ 
              marginTop: '32px', 
              background: '#fff', 
              color: '#000', 
              boxShadow: '0 8px 24px rgba(255,255,255,0.15)',
              borderRadius: '16px',
              height: '52px'
            }}
          >
            {lang === 'de' ? 'Weiter' : 'Next'} <ArrowRight size={18} />
          </button>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="onboarding-step-content slide-in-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="step-icon-wrapper" style={{ filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.35))' }}>
            <TrendingUp size={36} color="#a855f7" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>
            {lang === 'de' ? 'Analysen & Trends' : 'Analytics & Trends'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', padding: '0 12px' }}>
            {lang === 'de'
              ? 'Nutze technische Indikatoren (RSI, SMA) und Marktdaten, um den perfekten Kauf- oder Verkaufszeitpunkt für deine Skins zu finden.'
              : 'Use technical indicators (RSI, SMA) and market data to find the perfect time to buy or sell your skins.'}
          </p>
          <div className="step-nav-buttons" style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '32px' }}>
            <button 
              onClick={() => setStep(0)} 
              className="onboarding-btn secondary-btn" 
              style={{ flex: 1, height: '52px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft size={18} /> {lang === 'de' ? 'Zurück' : 'Back'}
            </button>
            <button 
              onClick={() => setStep(2)} 
              className="onboarding-btn primary-btn" 
              style={{ 
                flex: 1, 
                height: '52px', 
                borderRadius: '16px', 
                background: '#fff', 
                color: '#000',
                boxShadow: '0 8px 24px rgba(255,255,255,0.15)'
              }}
            >
              {lang === 'de' ? 'Loslegen' : 'Get Started'} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="onboarding-step-content slide-in-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="step-icon-wrapper" style={{ filter: 'drop-shadow(0 0 15px rgba(0, 240, 255, 0.35))' }}>
            <Settings2 size={36} color="#00F0FF" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
            {lang === 'de' ? 'Einstellungen' : 'Settings'}
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '28px', textAlign: 'center', lineHeight: '1.5' }}>
            {lang === 'de' ? 'Passe deine Währung und deinen favorisierten Marktplatz an.' : 'Customize your currency and preferred marketplace.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', textAlign: 'left', marginBottom: '32px' }}>
            {/* Currency Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {lang === 'de' ? 'WÄHRUNG' : 'CURRENCY'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '4px' }}>
                <button 
                  type="button" 
                  onClick={() => setCurrency('EUR')} 
                  className="segmented-control-btn"
                  style={{ 
                    background: currency === 'EUR' ? 'rgba(255,255,255,0.1)' : 'transparent', 
                    color: currency === 'EUR' ? '#fff' : 'rgba(255,255,255,0.4)',
                    boxShadow: currency === 'EUR' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                  }}
                >
                  EUR (€)
                </button>
                <button 
                  type="button" 
                  onClick={() => setCurrency('USD')} 
                  className="segmented-control-btn"
                  style={{ 
                    background: currency === 'USD' ? 'rgba(255,255,255,0.1)' : 'transparent', 
                    color: currency === 'USD' ? '#fff' : 'rgba(255,255,255,0.4)',
                    boxShadow: currency === 'USD' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                  }}
                >
                  USD ($)
                </button>
              </div>
            </div>

            {/* Valuation Mode Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {lang === 'de' ? 'BEVORZUGTER MARKTPLATZ' : 'PREFERRED MARKETPLACE'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '4px' }}>
                <button 
                  type="button" 
                  onClick={() => setValuationMode('STEAM')} 
                  className="segmented-control-btn"
                  style={{ 
                    background: valuationMode === 'STEAM' ? 'rgba(255,255,255,0.1)' : 'transparent', 
                    color: valuationMode === 'STEAM' ? '#fff' : 'rgba(255,255,255,0.4)',
                    boxShadow: valuationMode === 'STEAM' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                  }}
                >
                  Steam (Standard)
                </button>
                <button 
                  type="button" 
                  onClick={() => setValuationMode('CASHOUT')} 
                  className="segmented-control-btn"
                  style={{ 
                    background: valuationMode === 'CASHOUT' ? 'rgba(255,255,255,0.1)' : 'transparent', 
                    color: valuationMode === 'CASHOUT' ? '#fff' : 'rgba(255,255,255,0.4)',
                    boxShadow: valuationMode === 'CASHOUT' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                  }}
                >
                  Cashout (75%)
                </button>
              </div>
            </div>
          </div>

          <div className="step-nav-buttons" style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button 
              onClick={() => setStep(1)} 
              className="onboarding-btn secondary-btn" 
              style={{ flex: 1, height: '52px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft size={18} /> {lang === 'de' ? 'Zurück' : 'Back'}
            </button>
            <button 
              onClick={() => setStep(3)} 
              className="onboarding-btn primary-btn" 
              style={{ 
                flex: 1, 
                height: '52px', 
                borderRadius: '16px', 
                background: '#fff', 
                color: '#000',
                boxShadow: '0 8px 24px rgba(255,255,255,0.15)'
              }}
            >
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
        <div className="onboarding-step-content fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="step-icon-wrapper" style={{ filter: 'drop-shadow(0 0 15px rgba(255, 46, 147, 0.35))' }}>
            <LinkIcon size={36} color="#FF2E93" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
            {lang === 'de' ? 'Mit Steam verbinden' : 'Connect Steam'}
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '28px', textAlign: 'center', lineHeight: '1.5', padding: '0 12px' }}>
            {lang === 'de' 
              ? 'Verbinde deinen Account sicher über Steam OpenID, um dein CS2-Inventar automatisch zu laden.'
              : 'Connect your account securely via Steam OpenID to load your CS2 inventory automatically.'}
          </p>

          {error && (
            <div className="onboarding-error" style={{ marginBottom: '16px', width: '100%' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <button 
              onClick={handleSteamRedirect} 
              className="onboarding-btn primary-btn"
              style={{ 
                background: 'linear-gradient(135deg, #4B69FF 0%, #00F0FF 100%)', 
                color: '#fff', 
                fontWeight: '700',
                height: '52px',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(75, 105, 255, 0.3)',
                letterSpacing: '0.3px'
              }}
            >
              {lang === 'de' ? 'Jetzt mit Steam anmelden 🎮' : 'Sign in with Steam 🎮'}
            </button>

            {/* Manual Entry Fallback */}
            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', width: '100%' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center', letterSpacing: '0.8px' }}>
                {lang === 'de' ? 'ODER MANUELL VERBINDEN' : 'OR CONNECT MANUALLY'}
              </div>
              <form onSubmit={handleSaveSteamId} className="onboarding-form">
                <div className="input-group">
                  <input 
                    type="text" 
                    placeholder={lang === 'de' ? 'SteamID64 oder Profil-URL' : 'SteamID64 or Profile URL'} 
                    value={steamIdLocal}
                    onChange={(e) => setSteamIdLocal(e.target.value)}
                    required
                    style={{ 
                      paddingLeft: '16px', 
                      height: '48px', 
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff'
                    }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="onboarding-btn secondary-btn" 
                  disabled={loading} 
                  style={{ 
                    marginTop: '8px', 
                    height: '44px', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  {loading ? <span className="spinner"></span> : (lang === 'de' ? 'Manuell laden' : 'Load Manually')}
                </button>
              </form>
            </div>

            <button 
              onClick={handleSkipMock} 
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '11px', cursor: 'pointer', marginTop: '12px', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
            >
              {lang === 'de' ? 'Ohne Steam fortfahren (Mock Data)' : 'Continue without Steam (Mock Data)'}
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="onboarding-overlay" style={{ position: 'relative', overflow: 'hidden', background: '#000' }}>
      {/* Background Glow */}
      <div 
        className="onboarding-chromatic-blob" 
        style={{ 
          background: getGlowColor(),
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }} 
      />

      <div className="onboarding-container" style={{ position: 'relative', zIndex: 2, background: 'rgba(10, 10, 10, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '28px' }}>
        
        {step < 2 && (
          <button 
            className="skip-btn" 
            onClick={() => setStep(2)}
            style={{ 
              position: 'absolute', 
              top: '24px', 
              right: '24px', 
              background: 'transparent', 
              border: 'none', 
              color: 'rgba(255,255,255,0.4)', 
              fontSize: '13px', 
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#fff'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
          >
            {lang === 'de' ? 'Überspringen' : 'Skip'}
          </button>
        )}

        <div className="onboarding-header" style={{ marginBottom: step === 2 ? '0' : '24px', display: step === 3 ? 'none' : 'block' }}>
          <h1 className="onboarding-title" style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #a1a1a1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SkinStock
          </h1>
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
