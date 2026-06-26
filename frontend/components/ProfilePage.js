import { useState, useEffect, useRef } from 'react';

export default function ProfilePage({
  profile,
  settings,
  onSaveProfile,
  onSaveSettings,
  onGoogleLogin,
  onDeactivateAccount,
}) {
  const fileInputRef = useRef(null);
  const isProd = process.env.NODE_ENV === 'production';

  const [form, setForm] = useState({
    name: '',
    email: '',
    avatar: '',
  });

  const [subjectsList, setSubjectsList] = useState([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newSubject, setNewSubject] = useState('');

  const [prefs, setPrefs] = useState({
    theme: 'light',
    readingLevel: 'intermediate',
    dailyGoalMinutes: 15,
    notifications: true,
  });

  // Google Login dialog states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleName, setGoogleName] = useState('Alex Thompson');
  const [googleEmail, setGoogleEmail] = useState('alex.thompson@gmail.com');
  const [googleAvatar, setGoogleAvatar] = useState('');

  // Load from props
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        avatar: profile.avatar || '',
      });
      setSubjectsList(profile.preferredSubjects || []);
    }
  }, [profile]);

  // Handle actual Google Sign-In Button rendering dynamically
  useEffect(() => {
    let checkInterval;
    const initGoogle = () => {
      if (typeof window !== 'undefined' && window.google) {
        clearInterval(checkInterval);
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "153119868663-jqdmv0u7h9jp94512fju56uioagkenaj.apps.googleusercontent.com",
            callback: (response) => {
              const credential = response.credential;
              const base64Url = credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const payload = JSON.parse(jsonPayload);
              onGoogleLogin?.({
                name: payload.name || 'Google User',
                email: payload.email || '',
                avatar: payload.picture || '',
              });
            },
          });

          const container = document.getElementById("google-signin-btn-container");
          if (container) {
            window.google.accounts.id.renderButton(container, {
              theme: "outline",
              size: "medium",
              text: "signin_with",
              shape: "rectangular",
            });
          }
        } catch (err) {
          console.error('Google OAuth init error:', err);
        }
      }
    };

    initGoogle();
    checkInterval = setInterval(initGoogle, 1000);
    return () => clearInterval(checkInterval);
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setPrefs({
        theme: settings.theme || 'light',
        readingLevel: settings.readingLevel || 'intermediate',
        dailyGoalMinutes: settings.dailyGoalMinutes || 15,
        notifications: settings.notifications !== false,
      });
    }
  }, [settings]);

  // Handle image upload
  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Subject tag actions
  const removeSubject = (subjectToRemove) => {
    setSubjectsList(subjectsList.filter((s) => s !== subjectToRemove));
  };

  const addSubject = () => {
    const cleanSub = newSubject.trim().toLowerCase();
    if (cleanSub && !subjectsList.includes(cleanSub)) {
      setSubjectsList([...subjectsList, cleanSub]);
    }
    setNewSubject('');
    setShowAddInput(false);
  };

  // Settings increments
  const adjustGoal = (amount) => {
    setPrefs((prev) => ({
      ...prev,
      dailyGoalMinutes: Math.max(5, prev.dailyGoalMinutes + amount),
    }));
  };

  const toggleDarkMode = () => {
    setPrefs((prev) => {
      const nextTheme = prev.theme === 'dark' ? 'light' : 'dark';
      const nextPrefs = {
        ...prev,
        theme: nextTheme,
      };
      onSaveSettings?.(nextPrefs);
      return nextPrefs;
    });
  };

  // Submit all
  const handleSaveAll = (e) => {
    e.preventDefault();
    onSaveProfile({
      name: form.name,
      email: form.email,
      avatar: form.avatar,
      preferredSubjects: subjectsList,
      isGoogleUser: profile?.isGoogleUser || false,
    });
    onSaveSettings(prefs);
  };

  // Disconnect Google Sandbox
  const handleDisconnectGoogle = () => {
    if (confirm('Disconnect Google account? This will revert back to standard database synchronization.')) {
      onSaveProfile({
        name: '',
        email: '',
        avatar: '',
        preferredSubjects: [],
        isGoogleUser: false,
      });
      localStorage.removeItem('brainbytesProfile');
    }
  };

  // Deactivate and Delete Account
  const handleDeactivateDelete = () => {
    if (confirm("Are you sure you want to deactivate and permanently delete your account? This will wipe out all local data, settings, and chat history. This action cannot be undone.")) {
      onDeactivateAccount?.();
    }
  };

  // Display name capitalize
  const capitalize = (str) => {
    if (!str) return '';
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const isGuest = !profile || !profile.name;
  const isGoogle = profile?.isGoogleUser === true;

  const selectMockGoogleAccount = (name, email) => {
    setGoogleName(name);
    setGoogleEmail(email);
    // Draw generic avatar initials background
    setGoogleAvatar('');
  };

  const triggerGoogleLogin = () => {
    onGoogleLogin?.({
      name: googleName || 'Google User',
      email: googleEmail || '',
      avatar: googleAvatar || '',
    });
    setShowGoogleModal(false);
  };

  return (
    <section className="profile-settings-page">
      {/* Header */}
      <header className="page-header">
        <h2 className="page-title">Profile & Settings</h2>
        <p className="page-subtitle">Manage your personal information and learning preferences.</p>
      </header>

      {/* Google Sandbox OAuth Banner */}
      <div className="google-oauth-banner">
        {isGoogle ? (
          <div className="google-active-box">
            <div className="google-status">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <div>
                <strong className="google-active-title">Google Sandbox Connected</strong>
                <p className="google-active-desc">Bypassing remote database sync. All chats are private and saved locally.</p>
              </div>
            </div>
            <button type="button" onClick={handleDisconnectGoogle} className="google-disconnect-btn">
              Disconnect
            </button>
          </div>
        ) : (
          <div className="google-login-prompt">
            <span className="google-prompt-text">Want local-only data privacy? Save all chats to device local storage.</span>
            <div className="google-buttons-group">
              <div id="google-signin-btn-container"></div>
              {!isProd && (
                <button type="button" onClick={() => setShowGoogleModal(true)} className="google-mock-trigger-btn">
                  Use Local Mock Account
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveAll} className="settings-container">
        
        {/* Card 1: User Profile */}
        <div className="settings-card">
          <div className="card-header-profile">
            {/* Avatar Circle with Upload */}
            <div className="avatar-upload-section">
              <div className={`avatar-preview-circle ${(isGuest && !form.avatar) ? 'bg-guest' : ''}`}>
                {form.avatar ? (
                  <img src={form.avatar} alt="User Profile" className="avatar-img" referrerPolicy="no-referrer" />
                ) : (
                  <span className="avatar-text">
                    {form.name ? form.name.charAt(0).toUpperCase() : 'G'}
                  </span>
                )}
              </div>
              <button type="button" onClick={handlePhotoClick} className="change-photo-btn">
                Change Photo
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
            
            <div className="profile-heading-info">
              <h3 className="card-section-title">User Profile</h3>
            </div>
          </div>

          {/* Form fields */}
          <div className="form-fields-grid">
            <div className="field-group">
              <label htmlFor="name-input">Full Name</label>
              <input
                id="name-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Alex Thompson"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="email-input">Email Address</label>
              <input
                id="email-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. alex.thompson@example.com"
                required
              />
            </div>
          </div>

          {/* Preferred Subjects CRUD */}
          <div className="subjects-crud-section">
            <label className="section-field-label">Preferred Subjects</label>
            <div className="tags-container">
              {subjectsList.map((sub) => (
                <span key={sub} className="subject-tag">
                  {capitalize(sub)}
                  <button type="button" onClick={() => removeSubject(sub)} className="remove-tag-btn" aria-label={`Remove ${sub}`}>
                    &times;
                  </button>
                </span>
              ))}

              {showAddInput ? (
                <div className="add-tag-inline">
                  <input
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Subject name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSubject();
                      }
                    }}
                  />
                  <button type="button" onClick={addSubject} className="inline-add-btn">Add</button>
                  <button type="button" onClick={() => setShowAddInput(false)} className="inline-cancel-btn">Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowAddInput(true)} className="add-subject-btn">
                  + Add Subject
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Learning Settings */}
        <div className="settings-card">
          <h3 className="card-section-title border-bottom-divider">Learning Settings</h3>

          <div className="settings-rows-list">
            {/* Reading Level */}
            <div className="setting-row">
              <div className="setting-row-left">
                <span className="setting-title">Reading Level</span>
                <span className="setting-desc">Adjust how the AI explains complex concepts.</span>
              </div>
              <div className="setting-row-right">
                <select
                  value={prefs.readingLevel}
                  onChange={(e) => setPrefs({ ...prefs, readingLevel: e.target.value })}
                  className="settings-select"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Dark Mode */}
            <div className="setting-row">
              <div className="setting-row-left">
                <span className="setting-title">Dark Mode</span>
                <span className="setting-desc">Reduce eye strain in low-light environments.</span>
              </div>
              <div className="setting-row-right">
                {/* Custom toggle slider */}
                <label className="switch-toggle" htmlFor="darkmode-toggle">
                  <input
                    id="darkmode-toggle"
                    type="checkbox"
                    checked={prefs.theme === 'dark'}
                    onChange={toggleDarkMode}
                  />
                  <span className="slider-round"></span>
                </label>
              </div>
            </div>

            {/* Daily Learning Goal */}
            <div className="setting-row">
              <div className="setting-row-left">
                <span className="setting-title">Daily Learning Goal</span>
                <span className="setting-desc">How many new bytes do you want to learn today?</span>
              </div>
              <div className="setting-row-right">
                <div className="increment-control">
                  <button type="button" onClick={() => adjustGoal(-5)} className="inc-btn">-</button>
                  <span className="inc-value">{prefs.dailyGoalMinutes}</span>
                  <button type="button" onClick={() => adjustGoal(5)} className="inc-btn">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Danger Zone */}
        <div className="settings-card danger-zone-card">
          <h3 className="card-section-title border-bottom-divider text-danger">Danger Zone</h3>
          <div className="settings-rows-list">
            <div className="setting-row">
              <div className="setting-row-left">
                <span className="setting-title text-danger">Deactivate or Delete Account</span>
                <span className="setting-desc">Permanently delete your profile data, settings, and conversation history. This action is irreversible.</span>
              </div>
              <div className="setting-row-right">
                <button type="button" onClick={handleDeactivateDelete} className="deactivate-account-btn">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orange Submit Button */}
        <div className="submit-action-container">
          <button type="submit" className="save-all-changes-btn">
            Save All Changes
          </button>
        </div>

      </form>

      {/* Google Mock OAuth Sign-In Modal */}
      {showGoogleModal && !isProd && (
        <div className="modal-backdrop">
          <div className="google-modal">
            <h3 className="gmodal-title">Sign in with Google</h3>
            <p className="gmodal-subtitle">Select a mock account to test local-only device sandbox database storage.</p>

            <div className="mock-accounts-list">
              <button type="button" onClick={() => selectMockGoogleAccount('Alex Thompson', 'alex.thompson@gmail.com')} className="mock-account-row">
                <div className="m-avatar">AT</div>
                <div className="m-info">
                  <strong className="m-name">Alex Thompson</strong>
                  <span className="m-email">alex.thompson@gmail.com (Math Expert)</span>
                </div>
              </button>
              <button type="button" onClick={() => selectMockGoogleAccount('Maria Santos', 'maria.santos@gmail.com')} className="mock-account-row">
                <div className="m-avatar">MS</div>
                <div className="m-info">
                  <strong className="m-name">Maria Santos</strong>
                  <span className="m-email">maria.santos@gmail.com (Science Lover)</span>
                </div>
              </button>
            </div>

            <div className="custom-account-fields">
              <label htmlFor="g-custom-name">Or enter custom credentials:</label>
              <input
                id="g-custom-name"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                placeholder="Google Name"
              />
              <input
                id="g-custom-email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="Google Email"
                type="email"
              />
            </div>

            <div className="gmodal-actions">
              <button type="button" onClick={() => setShowGoogleModal(false)} className="gmodal-btn-cancel">
                Cancel
              </button>
              <button type="button" onClick={triggerGoogleLogin} className="gmodal-btn-signin">
                Connect Google Account
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .profile-settings-page {
          font-family: 'Public Sans', sans-serif;
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .page-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .page-title {
          font-family: 'Lexend', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .page-subtitle {
          font-size: 16px;
          color: var(--text-muted);
          margin: 0;
        }

        /* Google OAuth Banner */
        .google-oauth-banner {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 16px 24px;
          box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .google-active-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .google-status {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .google-active-title {
          color: var(--text-primary);
          font-family: 'Lexend', sans-serif;
          font-size: 16px;
        }

        .google-active-desc {
          color: var(--text-muted);
          font-size: 13px;
          margin: 2px 0 0;
        }

        .google-disconnect-btn {
          background: #EF4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .google-disconnect-btn:hover {
          background: #DC2626;
        }

        .google-login-prompt {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .google-prompt-text {
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
        }

        .google-signin-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          color: #191B23;
          border: 1px solid #C3C6D7;
          border-radius: 6px;
          padding: 8px 16px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          transition: background-color 0.2s;
        }

        .google-signin-btn:hover {
          background-color: #F8FAFC;
        }

        /* Settings Grid & Cards */
        .settings-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .settings-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.05), 0px 2px 4px -2px rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card-header-profile {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 24px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 16px;
        }

        .avatar-upload-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .avatar-preview-circle {
          box-sizing: border-box;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--accent-blue);
          border: 3px solid var(--accent-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .avatar-preview-circle.bg-guest {
          background: #9CA3AF !important;
          border-color: #6B7280 !important;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-text {
          font-family: 'Lexend', sans-serif;
          color: #FFFFFF;
          font-size: 32px;
          font-weight: 700;
        }

        .change-photo-btn {
          background: transparent;
          border: none;
          color: var(--accent-blue);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }

        .profile-heading-info {
          display: flex;
          flex-direction: column;
        }

        .card-section-title {
          font-family: 'Lexend', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .border-bottom-divider {
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 16px;
        }

        .form-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        input {
          box-sizing: border-box;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 10px 14px;
          font: inherit;
          background: var(--bg-input);
          color: var(--text-primary);
          outline: none;
          font-size: 15px;
          transition: border-color 0.2s;
        }

        input:focus {
          border-color: var(--accent-blue);
        }

        /* Subjects tags */
        .subjects-crud-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .section-field-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .subject-tag {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          background: var(--bg-input);
          color: var(--accent-blue);
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 600;
          gap: 8px;
        }

        .remove-tag-btn {
          background: transparent;
          border: none;
          color: var(--accent-blue);
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .add-subject-btn {
          box-sizing: border-box;
          border: 1px dashed var(--border-color);
          background: transparent;
          border-radius: 9999px;
          padding: 6px 14px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .add-subject-btn:hover {
          border-color: var(--accent-blue);
          color: var(--accent-blue);
        }

        .add-tag-inline {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .add-tag-inline input {
          padding: 4px 10px;
          font-size: 14px;
          border-radius: 6px;
          width: 120px;
        }

        .inline-add-btn {
          background: var(--accent-blue);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
        }

        .inline-cancel-btn {
          background: var(--bg-input);
          color: var(--text-secondary);
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
        }

        /* Settings Rows */
        .settings-rows-list {
          display: flex;
          flex-direction: column;
        }

        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid var(--border-light);
        }

        .setting-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .setting-row-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .setting-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .setting-desc {
          font-size: 13px;
          color: var(--text-muted);
        }

        .settings-select {
          box-sizing: border-box;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 8px 12px;
          background: var(--bg-input);
          color: var(--text-primary);
          outline: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Switch Toggle */
        .switch-toggle {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
        }

        .switch-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider-round {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--border-color);
          transition: .3s;
          border-radius: 34px;
        }

        .slider-round:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }

        input:checked + .slider-round {
          background-color: var(--accent-blue);
        }

        input:checked + .slider-round:before {
          transform: translateX(24px);
        }

        /* Increment control */
        .increment-control {
          display: flex;
          align-items: center;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          height: 38px;
          overflow: hidden;
          background: var(--inc-bg);
        }

        .inc-btn {
          background: transparent;
          border: none;
          width: 38px;
          height: 100%;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .inc-btn:hover {
          background-color: var(--bg-input);
        }

        .inc-value {
          width: 44px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        /* Orange Save All button */
        .submit-action-container {
          display: flex;
          justify-content: flex-end;
          width: 100%;
        }

        .save-all-changes-btn {
          box-sizing: border-box;
          background: #F97316;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 14px 28px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
          box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .save-all-changes-btn:hover {
          background: #ea580c;
        }

        /* Google Mock OAuth Modal Styles */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }

        .google-modal {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 32px;
          max-width: 480px;
          width: 90%;
          box-shadow: 0px 10px 25px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          gap: 16px;
          color: var(--text-primary);
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .gmodal-title {
          font-family: 'Lexend', sans-serif;
          font-size: 20px;
          font-weight: 700;
          margin: 0;
        }

        .gmodal-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .mock-accounts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mock-account-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px 16px;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .mock-account-row:hover {
          background-color: var(--border-light);
        }

        .m-avatar {
          width: 36px;
          height: 36px;
          background: var(--accent-blue);
          color: white;
          font-weight: bold;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Lexend', sans-serif;
        }

        .m-info {
          display: flex;
          flex-direction: column;
        }

        .m-name {
          color: var(--text-primary);
          font-size: 14px;
        }

        .m-email {
          color: var(--text-muted);
          font-size: 12px;
        }

        .custom-account-fields {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
          border-top: 1px solid var(--border-light);
          padding-top: 16px;
        }

        .custom-account-fields label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .custom-account-fields input {
          width: 100%;
        }

        .gmodal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 16px;
        }

        .gmodal-btn-cancel {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 8px 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .gmodal-btn-signin {
          background: #4285F4;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .gmodal-btn-signin:hover {
          background: #357ae8;
        }

        .text-danger {
          color: #EF4444 !important;
        }

        .deactivate-account-btn {
          background: #EF4444;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .deactivate-account-btn:hover {
          background: #DC2626;
        }

        .google-buttons-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .google-mock-trigger-btn {
          background: transparent;
          border: 1px dashed var(--border-color);
          color: var(--text-secondary);
          padding: 8px 14px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .google-mock-trigger-btn:hover {
          background-color: var(--border-light);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 768px) {
          .form-fields-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .card-header-profile {
            flex-direction: column;
            align-items: flex-start;
          }

          .setting-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .setting-row-right {
            width: 100%;
            display: flex;
            justify-content: flex-end;
          }
        }
      `}</style>
    </section>
  );
}
