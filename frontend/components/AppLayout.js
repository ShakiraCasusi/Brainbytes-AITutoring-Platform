import React, { useState, useEffect } from 'react';

export default function AppLayout({
  activeView,
  onNavigate,
  profile,
  theme,
  currentSubject,
  onSelectSubject,
  onNewChat,
  children,
}) {
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
      }
    }
  }, [theme]);

  const items = [
    { id: 'chat', label: 'Tutor', icon: 'tutor' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'profile', label: 'Profile', icon: 'profile' },
    { id: 'telemetry', label: 'Telemetry', icon: 'telemetry' },

  ];

  const viewTitles = {
    chat: `Chat Tutor - ${currentSubject ? currentSubject.charAt(0).toUpperCase() + currentSubject.slice(1) : 'General'}`,
    dashboard: 'Dashboard',
    profile: 'Profile',
    telemetry: 'System Monitoring & Telemetry'
  };

  const activeTitle = viewTitles[activeView] || 'BrainBytes';

  const renderIcon = (iconType, isActive) => {
    const color = isActive ? 'var(--accent-orange)' : 'var(--text-secondary)';
    if (iconType === 'tutor') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    if (iconType === 'dashboard') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="14" y="3" width="7" height="7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="14" y="14" width="7" height="7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="3" y="14" width="7" height="7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    if (iconType === 'profile') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    if (iconType === 'telemetry') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    return null;
  };

  const isGuest = !profile || !profile.name;
  const isGoogle = profile?.isGoogleUser === true;

  return (
    <div className={`layout ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Global CSS variable injector for theming */}
      <style jsx global>{`
        :root {
          --bg-layout: #FAF8FF;
          --bg-card: #FFFFFF;
          --bg-sidebar: #EDEDF9;
          --bg-input: #F3F3FE;
          --border-color: #C3C6D7;
          --border-light: #EDEDF9;
          --text-primary: #191B23;
          --text-secondary: #434655;
          --text-muted: #6B7280;
          --text-light: #737686;
          --accent-blue: #004AC6;
          --accent-orange: #F97316;
          --avatar-bg: #004AC6;
          --bubble-ai-bg: #F3F3FE;
          --bubble-ai-text: #191B23;
          --bubble-user-bg: #004AC6;
          --bubble-user-text: #FFFFFF;
          --inc-bg: #FFFFFF;
          --button-plus-bg: #FFFFFF;
        }

        .dark-theme {
          --bg-layout: #121214;
          --bg-card: #1A1A1E;
          --bg-sidebar: #151518;
          --bg-input: #24242A;
          --border-color: #3E4049;
          --border-light: #2A2B32;
          --text-primary: #E1E2ED;
          --text-secondary: #C3C6D7;
          --text-muted: #9CA3AF;
          --text-light: #A1A5B7;
          --accent-blue: #3B82F6;
          --accent-orange: #FF9800;
          --avatar-bg: #3B82F6;
          --bubble-ai-bg: #24242A;
          --bubble-ai-text: #E1E2ED;
          --bubble-user-bg: #3B82F6;
          --bubble-user-text: #FFFFFF;
          --inc-bg: #24242A;
          --button-plus-bg: #24242A;
        }

        /* Ensure global body inherits layout background */
        body {
          background-color: var(--bg-layout);
          color: var(--text-primary);
          transition: background-color 0.2s, color 0.2s;
        }
      `}</style>

      {/* Sidebar - SideNavBar */}
      <aside className="sidebar">
        <div className="brand-container">
          <div className="logo-box">
            <img src="/brain.png" alt="BrainBytes Logo" className="logo-img" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">BrainBytes</h1>
            <p className="brand-subtitle">Your personal tutor</p>
          </div>
        </div>

        <nav className="nav-menu">
          {items.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon">{renderIcon(item.icon, isActive)}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="main-wrapper">
        {/* Header - TopNavBar */}
        <header className="top-navbar">
          <div className="navbar-left">
            <h2 className="navbar-title">{activeTitle}</h2>
          </div>
          <div className="navbar-right">
            {/* New Chat Button */}
            <button
              className="icon-button new-chat-btn"
              onClick={onNewChat}
              aria-label="New Chat"
              title="Start a new chat thread"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14M5 12H19" stroke="var(--accent-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="new-chat-text">New Chat</span>
            </button>

            {/* Chat History Drawer Toggle Button (Replaces WiFi status button) */}
            <button
              className="icon-button"
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              aria-label="Chat History"
              title="Toggle chat history threads"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Notification Bell Icon Button */}
            <button className="icon-button" aria-label="Notifications">
              <svg width="18" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Profile Avatar Circle */}
            <button
              className={`profile-border ${isGuest ? 'bg-guest' : ''} ${isGoogle ? 'bg-google' : ''}`}
              onClick={() => onNavigate?.('profile')}
              title="View Profile Settings"
            >
              {profile && profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="profile-avatar-img" referrerPolicy="no-referrer" />
              ) : (
                <div className="profile-initials">
                  {profile && profile.name ? profile.name.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="content">{children}</main>
      </div>

      {/* Chat History sliding drawer overlay */}
      {showHistoryDrawer && (
        <div className="drawer-backdrop" onClick={() => setShowHistoryDrawer(false)}>
          <div className="history-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="drawer-title">Chat Subjects</h3>
              <button className="drawer-close" onClick={() => setShowHistoryDrawer(false)}>
                &times;
              </button>
            </div>
            <div className="drawer-body">
              <p className="drawer-instruction">Jump to a subject's conversation thread:</p>
              <div className="subject-rows-list">
                {[
                  { id: 'general', label: 'General Chat', desc: 'Ask about any academic topic' },
                  { id: 'math', label: 'Mathematics Lab', desc: 'Prime numbers, formulas, equations' },
                  { id: 'science', label: 'Science Room', desc: 'Biology, chemistry, physics, processes' },
                  { id: 'history', label: 'History Archive', desc: 'Past events, capital cities, war records' },
                  { id: 'english', label: 'English Academy', desc: 'Grammar rules, sentence structure, essay guide' }
                ].map((sub) => {
                  const isActive = currentSubject === sub.id && activeView === 'chat';
                  return (
                    <button
                      key={sub.id}
                      className={`subject-history-row ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        onSelectSubject(sub.id);
                        setShowHistoryDrawer(false);
                      }}
                    >
                      <span className="row-status-dot"></span>
                      <div className="row-meta">
                        <strong className="row-label">{sub.label}</strong>
                        <span className="row-desc">{sub.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: flex;
          background: var(--bg-layout);
          font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: var(--text-primary);
          transition: background 0.2s, color 0.2s;
        }
        
        .sidebar {
          width: 256px;
          min-height: 100vh;
          background: var(--bg-sidebar);
          box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          padding: 32px 0;
          box-sizing: border-box;
          flex-shrink: 0;
          z-index: 10;
          transition: background-color 0.2s;
        }

        .brand-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0 24px;
          margin-bottom: 32px;
          height: 48px;
          gap: 12px;
        }

        .logo-box {
          width: 44.33px;
          height: 40px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .brand-title {
          font-family: 'Lexend', sans-serif;
          font-style: normal;
          font-weight: 900;
          font-size: 24px;
          line-height: 32px;
          color: var(--accent-blue);
          margin: 0;
        }

        .brand-subtitle {
          font-family: 'Public Sans', sans-serif;
          font-style: normal;
          font-weight: 500;
          font-size: 12px;
          line-height: 16px;
          color: var(--text-secondary);
          margin: 0;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          padding: 0 16px;
          gap: 8px;
          flex-grow: 1;
        }

        .nav-link {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 12px 16px;
          gap: 12px;
          width: 224px;
          height: 44px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s, border-right 0.2s;
          text-align: left;
        }

        .nav-link.active {
          background: rgba(225, 226, 237, 0.2);
          border-right: 4px solid var(--accent-orange);
          border-radius: 8px;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        }

        .nav-label {
          font-family: 'Public Sans', sans-serif;
          font-style: normal;
          font-weight: 600;
          font-size: 14px;
          line-height: 20px;
          letter-spacing: 0.14px;
          color: var(--text-secondary);
        }

        .nav-link.active .nav-label {
          color: var(--accent-orange);
        }

        .main-wrapper {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        /* TopNavBar */
        .top-navbar {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 8px 24px;
          height: 60px;
          background: var(--bg-layout);
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
          transition: background-color 0.2s, border-color 0.2s;
        }

        .navbar-title {
          font-family: 'Lexend', sans-serif;
          font-style: normal;
          font-weight: 700;
          font-size: 24px;
          line-height: 32px;
          color: var(--accent-blue);
          margin: 0;
        }

        .navbar-right {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 16px;
        }

        .icon-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .icon-button:hover {
          background-color: rgba(67, 70, 85, 0.08);
        }

        .new-chat-btn {
          width: auto;
          height: 38px;
          border: 1px solid var(--accent-orange);
          background: transparent;
          border-radius: 20px;
          padding: 0 16px;
          gap: 6px;
          display: flex;
          align-items: center;
        }

        .new-chat-btn:hover {
          background-color: rgba(249, 115, 22, 0.1);
        }

        .new-chat-text {
          font-family: 'Public Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--accent-orange);
        }

        .profile-border {
          box-sizing: border-box;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 40px;
          height: 40px;
          border: 2px solid var(--accent-blue);
          border-radius: 9999px;
          background: var(--accent-blue);
          color: white;
          font-weight: bold;
          font-family: 'Lexend', sans-serif;
          overflow: hidden;
          cursor: pointer;
          padding: 0;
          outline: none;
        }

        .profile-border.bg-guest {
          background: #9CA3AF !important;
          border-color: #6B7280 !important;
        }

        .profile-border.bg-google {
          border-color: #34A853 !important;
        }

        .profile-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-initials {
          font-size: 16px;
        }

        .content {
          flex-grow: 1;
          padding: 24px;
          overflow-y: auto;
          min-width: 0;
        }

        /* Drawer Overlay */
        .drawer-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 9999;
          display: flex;
          justify-content: flex-end;
          animation: fadeIn 0.2s ease-out;
        }

        .history-drawer {
          width: 360px;
          max-width: 90%;
          height: 100vh;
          background: var(--bg-card);
          border-left: 1px solid var(--border-color);
          box-shadow: -4px 0 15px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-light);
        }

        .drawer-title {
          font-family: 'Lexend', sans-serif;
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          color: var(--accent-blue);
        }

        .drawer-close {
          background: transparent;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: var(--text-secondary);
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .drawer-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
        }

        .drawer-instruction {
          font-size: 14px;
          color: var(--text-muted);
          margin: 0;
        }

        .subject-rows-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .subject-history-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: background-color 0.2s, border-color 0.2s;
        }

        .subject-history-row:hover {
          background-color: var(--border-light);
          border-color: var(--accent-blue);
        }

        .subject-history-row.active {
          background-color: rgba(0, 74, 198, 0.1);
          border-color: var(--accent-blue);
        }

        .row-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-orange);
        }

        .row-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .row-label {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .row-desc {
          font-size: 11px;
          color: var(--text-muted);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @media (max-width: 768px) {
          .layout {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            min-height: auto;
            padding: 16px 0;
          }

          .brand-container {
            margin-bottom: 16px;
          }

          .nav-menu {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: space-around;
          }

          .nav-link {
            width: auto;
            padding: 8px 12px;
          }
          
          .nav-link.active {
            border-right: none;
            border-bottom: 4px solid var(--accent-orange);
            border-radius: 8px 8px 0 0;
          }

          .top-navbar {
            padding: 8px 16px;
          }
        }
      `}</style>
    </div>
  );
}
