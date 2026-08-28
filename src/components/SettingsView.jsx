import React from 'react';
import { LogOut } from 'lucide-react';

export default function SettingsView({
  lang,
  realInventoryItems,
  handleDisconnectInventory,
  handleImportInventory,
  steamIdInput,
  setSteamIdInput,
  isFetchingInventory,
  user,
  handleLogout,
  inventoryError
}) {
  return (
    <div className="settings-view" style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>{lang === 'de' ? 'Einstellungen' : 'Settings'}</h2>

      <div className="settings-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
        <h3 style={{ marginBottom: '16px' }}>{lang === 'de' ? 'Steam Inventar' : 'Steam Inventory'}</h3>
        {realInventoryItems.length > 0 ? (
          <div>
            <p style={{ marginBottom: '16px', color: '#94a3b8' }}>
              {lang === 'de' ? 'Dein Inventar ist verbunden.' : 'Your inventory is connected.'}
            </p>
            <button onClick={handleDisconnectInventory} className="steam-import-btn" style={{ background: 'rgba(255,59,48,0.2)', color: '#ff3b30' }}>
              {lang === 'de' ? 'Verbindung trennen' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleImportInventory} className="steam-input-form">
            <div className="steam-input-wrapper">
              <input
                type="text"
                className="steam-input"
                placeholder={lang === 'de' ? 'SteamID64 eingeben' : 'Enter SteamID64'}
                value={steamIdInput}
                onChange={(e) => setSteamIdInput(e.target.value)}
              />
            </div>
            <button type="submit" className="steam-import-btn" disabled={isFetchingInventory}>
              {isFetchingInventory ? 'Loading...' : 'Import'}
            </button>
            {inventoryError && (
              <p style={{ marginTop: '12px', color: '#ff3b30', fontSize: '13px' }}>
                {inventoryError}
              </p>
            )}
          </form>
        )}
      </div>

      {user && (
        <div className="settings-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Account</h3>
          <button onClick={handleLogout} className="steam-import-btn" style={{ background: 'rgba(255,59,48,0.2)', color: '#ff3b30' }}>
            <LogOut size={16} style={{ display: 'inline', marginRight: '8px' }} />
            {lang === 'de' ? 'Abmelden' : 'Log Out'}
          </button>
        </div>
      )}

      {/* Mobile Apps Promo Card */}
      <div className="settings-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginTop: '20px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '8px' }}>{lang === 'de' ? 'SkinStock für unterwegs' : 'SkinStock on the go'}</h3>
        <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', marginBottom: '16px' }}>
          {lang === 'de'
            ? 'Hol dir die SkinStock App bald für iOS und Android! Echtzeit-Preisalarme per Push-Meldung, Widgets für deinen Homescreen und nativer Flüssig-Wear-Simulator.'
            : 'Get the SkinStock App soon for iOS and Android! Real-time price alerts via push notifications, homescreen widgets, and native fluid wear simulator.'}
        </p>

        {/* Store Badges SVG */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <a href="#store-coming-soon" style={{ cursor: 'default', textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 14px', width: '135px', boxSizing: 'border-box', textAlign: 'left' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff" style={{ flexShrink: 0 }}>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1 2.97 1.12.09 2.27-.6 2.95-1.41z" />
              </svg>
              <div>
                <div style={{ fontSize: '7px', color: '#fff', textTransform: 'uppercase' }}>Coming soon to</div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', marginTop: '-2px' }}>App Store</div>
              </div>
            </div>
          </a>

          <a href="#store-coming-soon" style={{ cursor: 'default', textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 14px', width: '135px', boxSizing: 'border-box', textAlign: 'left' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff" style={{ flexShrink: 0 }}>
                <path d="M5 3.25c-.26 0-.52.07-.74.22L13.12 12l-8.86 8.53c.22.15.48.22.74.22.21 0 .42-.05.61-.15l13.62-7.85c.61-.35.98-1 .98-1.75s-.37-1.4-1-1.75L6.2 3.4c-.19-.1-.4-.15-.6-.15z" />
              </svg>
              <div>
                <div style={{ fontSize: '7px', color: '#fff', textTransform: 'uppercase' }}>Coming soon to</div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', marginTop: '-2px' }}>Google Play</div>
              </div>
            </div>
          </a>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px', display: 'flex', gap: '12px', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '80px', height: '140px', background: 'rgba(255,255,255,0.02)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ fontSize: '6px', color: '#00FF77', fontWeight: 'bold', position: 'absolute', top: '6px' }}>Portfolio</div>
              <div style={{ width: '100%', height: '80px', background: 'linear-gradient(180deg, rgba(0,255,119,0.1) 0%, transparent 100%)', borderRadius: '4px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '80%', height: '40px', borderBottom: '1px solid #00FF77', opacity: 0.5 }} />
              </div>
            </div>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>Dashboard</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '80px', height: '140px', background: 'rgba(255,255,255,0.02)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ fontSize: '6px', color: '#ffd700', fontWeight: 'bold', position: 'absolute', top: '6px' }}>Achievements</div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #ffd700', borderTopColor: 'transparent', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '8px', color: '#ffd700' }}>🏆</span>
              </div>
            </div>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>Milestones</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '80px', height: '140px', background: 'rgba(255,255,255,0.02)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ fontSize: '6px', color: '#00F0FF', fontWeight: 'bold', position: 'absolute', top: '6px' }}>Wear Slider</div>
              <div style={{ width: '60px', height: '40px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', marginTop: '12px' }} />
              <div style={{ width: '80%', height: '4px', background: '#00F0FF', borderRadius: '9px', marginTop: '12px' }} />
            </div>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>Simulator</span>
          </div>
        </div>
      </div>
    </div>
  );
}
