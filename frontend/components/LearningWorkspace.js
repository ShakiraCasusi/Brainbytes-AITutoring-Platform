import { useEffect, useState, useRef } from 'react';
import AppLayout from './AppLayout';
import ChatPanel from './ChatPanel';
import Dashboard from './Dashboard';
import ProfilePage from './ProfilePage';
import SettingsPage from './SettingsPage';
import { api, setToken, getToken, WS_URL } from '../utils/api';

const defaultProfile = { name: '', email: '', preferredSubjects: [] };
const defaultSettings = {
  theme: 'light',
  readingLevel: 'intermediate',
  dailyGoalMinutes: 30,
  notifications: true,
};

export default function LearningWorkspace() {
  const [view, setView] = useState('chat');
  const [profile, setProfile] = useState(defaultProfile);
  const [settings, setSettings] = useState(defaultSettings);
  const [activity, setActivity] = useState([]);
  const [online, setOnline] = useState(true);
  const [dbConnected, setDbConnected] = useState(true);

  // Lifted Chat & Subject states
  const [currentSubject, setCurrentSubject] = useState('general');
  const [sessionIds, setSessionIds] = useState({});
  const [newChatTrigger, setNewChatTrigger] = useState(0);

  // Toast notification state
  const [toast, setToast] = useState({ message: '', type: '' });
  const toastTimeoutRef = useRef(null);

  // Study timer and streak state
  const [timerState, setTimerState] = useState({
    activeStudyTime: 0,
    lastQuestionTime: 0,
    timerResetStart: Date.now(),
    isRunning: false,
    streakCount: 0,
    lastStreakEarnedDate: '',
  });

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ message: '', type: '' });
    }, 4000);
  };

  // Bootstrap state and local storage restoration
  useEffect(() => {
    bootstrap();
    setOnline(navigator.onLine);
    
    // Set up Visibility & focus event listeners for the study timer
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseTimer();
      }
    };
    const handleBlur = () => {
      pauseTimer();
    };

    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    // Set up WebSocket for real-time activity updates if not Google sandbox
    const socket = new WebSocket(WS_URL);
    socket.onmessage = () => {
      const storedProfile = JSON.parse(localStorage.getItem('brainbytesProfile') || '{}');
      if (!storedProfile.isGoogleUser) {
        refreshActivity();
      }
    };

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      } else {
        socket.onopen = () => socket.close();
      }
    };
  }, []);

  // Timer Tick Interval Loop
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimerState((prev) => {
        const now = Date.now();
        let updated = { ...prev };

        // 24 Hours Reset Check
        const elapsed24h = now - prev.timerResetStart;
        if (elapsed24h >= 24 * 60 * 60 * 1000) {
          updated.activeStudyTime = 0;
          updated.timerResetStart = now;
        }

        // Active Ticking
        if (prev.isRunning && document.visibilityState === 'visible') {
          // Check 2-minute inactivity limit
          const timeSinceLastQuestion = now - prev.lastQuestionTime;
          if (timeSinceLastQuestion > 120 * 1000) {
            updated.isRunning = false;
            showToast('Study timer paused due to 2 minutes of inactivity.', 'info');
          } else {
            updated.activeStudyTime += 1;
            
            // Check study streak qualification (at least 10 seconds of active study time)
            if (updated.activeStudyTime >= 10) {
              const todayStr = new Date().toISOString().split('T')[0];
              if (prev.lastStreakEarnedDate !== todayStr) {
                let nextStreak = prev.streakCount;
                if (prev.lastStreakEarnedDate) {
                  const lastDate = new Date(prev.lastStreakEarnedDate);
                  const todayDate = new Date(todayStr);
                  const diffTime = Math.abs(todayDate - lastDate);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays === 1) {
                    nextStreak += 1;
                  } else {
                    nextStreak = 1;
                  }
                } else {
                  nextStreak = 1;
                }
                updated.streakCount = nextStreak;
                updated.lastStreakEarnedDate = todayStr;
                showToast(`🔥 Daily Study Streak updated. Current streak: ${nextStreak} day(s).`, 'success');
              }
            }
          }
        }

        localStorage.setItem('brainbytes_timer_state', JSON.stringify(updated));
        return updated;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  const pauseTimer = () => {
    setTimerState((prev) => {
      if (prev.isRunning) {
        const updated = { ...prev, isRunning: false };
        localStorage.setItem('brainbytes_timer_state', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  const resumeTimerOnQuestion = () => {
    setTimerState((prev) => {
      const now = Date.now();
      const updated = {
        ...prev,
        isRunning: true,
        lastQuestionTime: now,
      };
      localStorage.setItem('brainbytes_timer_state', JSON.stringify(updated));
      return updated;
    });
  };

  async function bootstrap() {
    // 0. Check Database Health
    let dbIsConnected = true;
    try {
      const healthRes = await api.get('/health');
      dbIsConnected = healthRes.data.databaseConnected === true;
    } catch (err) {
      dbIsConnected = false;
    }
    setDbConnected(dbIsConnected);

    // 1. Load Profile
    const storedProfile = JSON.parse(
      localStorage.getItem('brainbytesProfile') || 'null'
    );
    if (storedProfile) {
      setProfile(storedProfile);
    }
    
    // 2. Load Settings (local or backend)
    const storedSettings = JSON.parse(
      localStorage.getItem('brainbytesSettings') || 'null'
    );
    if (storedSettings) {
      setSettings(storedSettings);
    } else if (storedProfile && storedProfile.id && !storedProfile.isGoogleUser && dbIsConnected) {
      await loadSettings(storedProfile.id);
    }

    // 3. Load Session IDs
    const storedSessionIds = JSON.parse(
      localStorage.getItem('brainbytesSessionIds') || '{}'
    );
    setSessionIds(storedSessionIds);

    // 4. Load Timer State
    const storedTimer = JSON.parse(
      localStorage.getItem('brainbytes_timer_state') || 'null'
    );
    if (storedTimer) {
      setTimerState(storedTimer);
    }

    // 5. Load Activity List
    if (storedProfile && !storedProfile.isGoogleUser && dbIsConnected) {
      await refreshActivity();
    } else {
      // For Google users, offline users or guests, derive activities locally from chats
      deriveLocalActivity();
    }
  }

  // Derive recent activities from local chats
  const deriveLocalActivity = () => {
    const list = [];
    const subjectsList = ['general', 'math', 'science', 'history', 'english'];
    subjectsList.forEach((sub) => {
      const messages = JSON.parse(localStorage.getItem(`brainbytes_messages_${sub}`) || '[]');
      messages.forEach((msg) => {
        if (msg.sender === 'user') {
          list.push({
            _id: msg._id || msg.timestamp || Math.random().toString(),
            type: 'message',
            subject: sub,
            summary: `Sent a message in ${sub}: ${msg.text.substring(0, 40)}...`,
            createdAt: msg.timestamp || new Date(),
          });
        }
      });
    });

    const storedProfile = JSON.parse(localStorage.getItem('brainbytesProfile') || 'null');
    if (storedProfile) {
      list.push({
        _id: 'profile-created',
        type: 'profile',
        summary: 'Profile configuration loaded.',
        createdAt: storedProfile.updatedAt || new Date(),
      });
    }

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setActivity(list.slice(0, 20));
  };

  async function ensureUser(nextProfile) {
    if (profile.id) return profile.id;
    const password = `Brainbytes-${Date.now()}`;
    const response = await api.post('/auth/register', {
      ...nextProfile,
      password,
    });
    setToken(response.data.token);
    return response.data.user.id;
  }

  async function saveProfile(nextProfile) {
    try {
      if (profile.isGoogleUser || nextProfile.isGoogleUser || !dbConnected) {
        // Local storage sandbox only
        const updated = {
          ...profile,
          ...nextProfile,
          id: profile.id || `local-${Date.now()}`,
          isLocalUser: true,
          updatedAt: new Date(),
        };
        localStorage.setItem('brainbytesProfile', JSON.stringify(updated));
        setProfile(updated);
        deriveLocalActivity();
        showToast(`Profile saved to local storage. (${!dbConnected ? 'Offline sandbox' : 'Google sandbox'} mode)`, 'success');
      } else {
        const id = await ensureUser(nextProfile);
        const response = await api.put(`/users/${id}`, nextProfile);
        localStorage.setItem(
          'brainbytesProfile',
          JSON.stringify(response.data.user)
        );
        setProfile(response.data.user);
        await refreshActivity();
        showToast('Profile successfully saved and updated.', 'success');
      }
    } catch (err) {
      showToast('Error saving profile changes.', 'error');
    }
  }

  async function loadSettings(userId) {
    if (!userId || !getToken()) return;
    try {
      const response = await api.get(`/settings/${userId}`);
      setSettings(response.data.settings);
      localStorage.setItem('brainbytesSettings', JSON.stringify(response.data.settings));
    } catch (err) {
      console.warn('Failed to load settings:', err.message);
    }
  }

  async function saveSettings(nextSettings) {
    try {
      localStorage.setItem('brainbytesSettings', JSON.stringify(nextSettings));
      setSettings(nextSettings);

      if (profile.id && !profile.isGoogleUser && dbConnected) {
        const response = await api.put(`/settings/${profile.id}`, nextSettings);
        setSettings(response.data.settings);
        await refreshActivity();
      } else {
        deriveLocalActivity();
      }
      showToast('Settings saved successfully.', 'success');
    } catch (err) {
      showToast('Failed to save settings to server.', 'error');
    }
  }

  async function refreshActivity() {
    if (profile.isGoogleUser || !dbConnected) {
      deriveLocalActivity();
      return;
    }
    if (!getToken()) return;
    try {
      const response = await api.get('/activity');
      setActivity(response.data.activities || []);
    } catch (err) {
      console.warn('Failed to fetch activity:', err.message);
    }
  }

  const startNewChat = (subject = currentSubject) => {
    const newId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const updatedSessions = {
      ...sessionIds,
      [subject]: newId,
    };
    setSessionIds(updatedSessions);
    localStorage.setItem('brainbytesSessionIds', JSON.stringify(updatedSessions));
    
    // Clear local storage messages for this subject to start fresh
    localStorage.setItem(`brainbytes_messages_${subject}`, JSON.stringify([]));
    
    setNewChatTrigger((prev) => prev + 1);
    setView('chat');
    showToast(`New ${subject.charAt(0).toUpperCase() + subject.slice(1)} chat started.`, 'info');
  };

  const handleSubjectChange = (subject) => {
    setCurrentSubject(subject);
    setView('chat');
  };

  // Helper to handle auto-classifying profile subjects from chat
  const handleSubjectDetected = (detectedSubject) => {
    if (!detectedSubject || detectedSubject === 'general') return;
    
    setProfile((prev) => {
      const currentPrefs = prev.preferredSubjects || [];
      if (!currentPrefs.includes(detectedSubject)) {
        const updatedPrefs = [...currentPrefs, detectedSubject];
        const updatedProfile = { ...prev, preferredSubjects: updatedPrefs };
        
        // Save to localStorage
        localStorage.setItem('brainbytesProfile', JSON.stringify(updatedProfile));
        
        // If not google user and registered, sync with backend
        if (prev.id && !prev.isGoogleUser) {
          api.put(`/users/${prev.id}`, updatedProfile).catch(() => {});
        }
        
        showToast(`Auto-added "${detectedSubject}" to your Preferred Subjects.`, 'info');
        return updatedProfile;
      }
      return prev;
    });
  };

  const handleDeactivateAccount = async () => {
    if (profile.id && !profile.isGoogleUser) {
      try {
        await api.delete(`/users/${profile.id}`);
      } catch (err) {
        console.warn('Backend profile deletion failed:', err.message);
      }
    }
    
    localStorage.removeItem('brainbytesProfile');
    localStorage.removeItem('brainbytesSettings');
    localStorage.removeItem('brainbytesSessionIds');
    localStorage.removeItem('brainbytes_timer_state');
    
    const subjectsList = ['general', 'math', 'science', 'history', 'english'];
    subjectsList.forEach((sub) => {
      localStorage.removeItem(`brainbytes_messages_${sub}`);
    });
    
    setProfile(defaultProfile);
    setSettings(defaultSettings);
    setSessionIds({});
    setTimerState({
      activeStudyTime: 0,
      lastQuestionTime: 0,
      timerResetStart: Date.now(),
      isRunning: false,
      streakCount: 0,
      lastStreakEarnedDate: '',
    });
    setActivity([]);
    setCurrentSubject('general');
    
    showToast('Account successfully deactivated and deleted.', 'info');
    setView('chat');
  };

  return (
    <AppLayout
      activeView={view}
      onNavigate={setView}
      profile={profile}
      theme={settings.theme}
      currentSubject={currentSubject}
      onSelectSubject={handleSubjectChange}
      onNewChat={() => startNewChat(currentSubject)}
    >
      {view === 'chat' && (
        <ChatPanel
          profile={profile}
          subject={currentSubject}
          setSubject={handleSubjectChange}
          sessionIds={sessionIds}
          setSessionIds={setSessionIds}
          newChatTrigger={newChatTrigger}
          onActivityRefresh={refreshActivity}
          onQuestionAsked={resumeTimerOnQuestion}
          onSubjectDetected={handleSubjectDetected}
          dbConnected={dbConnected}
        />
      )}
      {view === 'dashboard' && (
        <Dashboard
          activity={activity}
          profile={profile}
          online={online}
          activeStudyTime={timerState.activeStudyTime}
          streakCount={timerState.streakCount}
        />
      )}
      {view === 'profile' && (
        <ProfilePage
          profile={profile}
          settings={settings}
          onSaveProfile={saveProfile}
          onSaveSettings={saveSettings}
          onGoogleLogin={(googleProfile) => {
            saveProfile({
              ...googleProfile,
              isGoogleUser: true,
            });
            showToast('Logged in with Google. Sandbox enabled.', 'success');
          }}
          onDeactivateAccount={handleDeactivateAccount}
        />
      )}
      {view === 'settings' && (
        <SettingsPage
          profile={profile}
          settings={settings}
          onSaveSettings={saveSettings}
        />
      )}

      {/* Built-in Toast Notification UI */}
      {toast.message && (
        <div className={`toast-notification ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'i'}
          </span>
          <span className="toast-text">{toast.message}</span>
          <style jsx="true">{`
            .toast-notification {
              position: fixed;
              bottom: 24px;
              right: 24px;
              background: #191B23;
              color: #E1E2ED;
              padding: 14px 24px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              gap: 12px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
              z-index: 99999;
              font-family: 'Public Sans', sans-serif;
              font-weight: 600;
              font-size: 14px;
              border: 1px solid #C3C6D7;
              animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .toast-notification.success {
              border-left: 4px solid #22C55E;
            }
            .toast-notification.error {
              border-left: 4px solid #EF4444;
            }
            .toast-notification.info {
              border-left: 4px solid #004AC6;
            }
            .toast-icon {
              font-size: 16px;
            }
            @keyframes slideIn {
              from {
                transform: translateY(24px) scale(0.95);
                opacity: 0;
              }
              to {
                transform: translateY(0) scale(1);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}
    </AppLayout>
  );
}
