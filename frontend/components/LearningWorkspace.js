import { useEffect, useState } from 'react';
import AppLayout from './AppLayout';
import ChatPanel from './ChatPanel';
import Dashboard from './Dashboard';
import ProfilePage from './ProfilePage';
import { api, setToken, WS_URL } from '../utils/api';

const defaultProfile = { name: '', email: '', preferredSubjects: [] };
const defaultSettings = {
  theme: 'system',
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

  useEffect(() => {
    bootstrap();
    setOnline(navigator.onLine);
    const socket = new WebSocket(WS_URL);
    socket.onmessage = () => refreshActivity();
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    return () => socket.close();
  }, []);

  async function bootstrap() {
    const stored = JSON.parse(localStorage.getItem('brainbytesProfile') || 'null');
    if (stored) {
      setProfile(stored);
      await loadSettings(stored.id);
    }
    await refreshActivity();
  }

  async function ensureUser(nextProfile) {
    if (profile.id) return profile.id;
    const password = `Brainbytes-${Date.now()}`;
    const response = await api.post('/auth/register', { ...nextProfile, password });
    setToken(response.data.token);
    return response.data.user.id;
  }

  async function saveProfile(nextProfile) {
    const id = await ensureUser(nextProfile);
    const response = await api.put(`/users/${id}`, nextProfile);
    localStorage.setItem('brainbytesProfile', JSON.stringify(response.data.user));
    setProfile(response.data.user);
    await refreshActivity();
  }

  async function loadSettings(userId) {
    if (!userId) return;
    const response = await api.get(`/settings/${userId}`);
    setSettings(response.data.settings);
  }

  async function saveSettings(nextSettings) {
    if (!profile.id) return;
    const response = await api.put(`/settings/${profile.id}`, nextSettings);
    setSettings(response.data.settings);
    await refreshActivity();
  }

  async function refreshActivity() {
    const response = await api.get('/activity');
    setActivity(response.data.activities || []);
  }

  return (
    <AppLayout activeView={view} onNavigate={setView}>
      {view === 'chat' && <ChatPanel profile={profile} onActivityRefresh={refreshActivity} />}
      {view === 'dashboard' && <Dashboard activity={activity} profile={profile} online={online} />}
      {view === 'profile' && (
        <ProfilePage
          profile={profile}
          settings={settings}
          onSaveProfile={saveProfile}
          onSaveSettings={saveSettings}
        />
      )}
    </AppLayout>
  );
}
