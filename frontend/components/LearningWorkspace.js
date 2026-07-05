import { useEffect, useState, useRef } from 'react';
import AppLayout from './AppLayout';
import ChatPanel from './ChatPanel';
import ProfilePage from './ProfilePage';
import Dashboard from '../pages/Dashboard'; 
import { api, WS_URL } from '../utils/api';

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

        const elapsed24h = now - prev.timerResetStart;
        if (elapsed24h >= 24 * 60 * 60 * 1000) {
          updated.activeStudyTime = 0;
          updated.timerResetStart = now;
        }

        if (prev.isRunning && document.visibilityState === 'visible') {
          const timeSinceLastQuestion = now - prev.lastQuestionTime;
          if (timeSinceLastQuestion > 120 * 1000) {
            updated.isRunning = false;
            showToast('Study timer paused due to 2 minutes of inactivity.', 'info');
          } else {
            updated.activeStudyTime += 1;
            
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
      const updated = { ...prev, isRunning: true, lastQuestionTime: now };
      localStorage.setItem('brainbytes_timer_state', JSON.stringify(updated));
      return updated;
    });
  };

  async function bootstrap() {
    let dbIsConnected = true;
    try {
      const healthRes = await api.get('/health');
      dbIsConnected = healthRes.data.databaseConnected === true;
    } catch (err) {
      dbIsConnected = false;
    }
    setDbConnected(dbIsConnected);

    const storedProfile = JSON.parse(localStorage.getItem('brainbytesProfile') || 'null');
    if (storedProfile) setProfile(storedProfile);
    
    const storedSettings = JSON.parse(localStorage.getItem('brainbytesSettings') || 'null');
    if (storedSettings) setSettings(storedSettings);

    const storedSessionIds = JSON.parse(localStorage.getItem('brainbytesSessionIds') || '{}');
    setSessionIds(storedSessionIds);

    const storedTimer = JSON.parse(localStorage.getItem('brainbytes_timer_state') || 'null');
    if (storedTimer) setTimerState(storedTimer);
  }

  const handleNewChat = () => {
    setNewChatTrigger((prev) => prev + 1);
    setView('chat');
  };

  return (
    <AppLayout
      activeView={view} // Uses the singular 'view' state hooks variable mapped out on Line 16
      onNavigate={setView} // Changes states cleanly whenever sidebar items are pressed
      profile={profile}
      theme={settings.theme}
      currentSubject={currentSubject}
      onNewChat={handleNewChat}
    >
      {/* Dynamic Main Wrapper Frames Content Areas Mapping */}
      {view === 'chat' && (
        <ChatPanel 
          currentSubject={currentSubject} 
          setCurrentSubject={setCurrentSubject}
          newChatTrigger={newChatTrigger}
          resumeTimerOnQuestion={resumeTimerOnQuestion}
          showToast={showToast}
        />
      )}
      
      {/* Existing Student Learning Dashboard Placeholder mock */}
      {view === 'dashboard' && (
        <div style={{ padding: '20px' }}>
          <h2>Student Activity Analytics Workspace</h2>
          <p>Database Health Check: {dbConnected ? 'CONNECTED' : 'DISCONNECTED'}</p>
        </div>
      )}

      {view === 'profile' && (
        <ProfilePage profile={profile} setProfile={setProfile} settings={settings} setSettings={setSettings} />
      )}

      {view === 'telemetry' && <Dashboard />}
    </AppLayout>
  );
}
