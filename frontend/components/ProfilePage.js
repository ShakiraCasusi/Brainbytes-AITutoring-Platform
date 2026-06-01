import { useState } from 'react';

export default function ProfilePage({ profile, settings, onSaveProfile, onSaveSettings }) {
  const [form, setForm] = useState({
    name: profile.name || '',
    email: profile.email || '',
    preferredSubjects: (profile.preferredSubjects || []).join(', '),
  });
  const [prefs, setPrefs] = useState({
    theme: settings.theme || 'system',
    readingLevel: settings.readingLevel || 'intermediate',
    dailyGoalMinutes: settings.dailyGoalMinutes || 30,
    notifications: settings.notifications !== false,
  });

  function submitProfile(event) {
    event.preventDefault();
    onSaveProfile({
      ...form,
      preferredSubjects: form.preferredSubjects
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    });
  }

  function submitPrefs(event) {
    event.preventDefault();
    onSaveSettings(prefs);
  }

  return (
    <section className="profile">
      <form onSubmit={submitProfile}>
        <h2>User profile</h2>
        <label>
          Name
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label>
          Email
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Preferred subjects
          <input
            value={form.preferredSubjects}
            onChange={(e) => setForm({ ...form, preferredSubjects: e.target.value })}
          />
        </label>
        <button>Save profile</button>
      </form>
      <form onSubmit={submitPrefs}>
        <h2>Settings</h2>
        <label>
          Reading level
          <select
            value={prefs.readingLevel}
            onChange={(e) => setPrefs({ ...prefs, readingLevel: e.target.value })}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <label>
          Theme
          <select
            value={prefs.theme}
            onChange={(e) => setPrefs({ ...prefs, theme: e.target.value })}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          Daily goal
          <input
            type="number"
            min="5"
            max="240"
            value={prefs.dailyGoalMinutes}
            onChange={(e) => setPrefs({ ...prefs, dailyGoalMinutes: Number(e.target.value) })}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={prefs.notifications}
            onChange={(e) => setPrefs({ ...prefs, notifications: e.target.checked })}
          />{' '}
          Notifications
        </label>
        <button>Save settings</button>
      </form>
      <style jsx>{`
        .profile {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        form {
          background: white;
          border: 1px solid #dde3ee;
          border-radius: 8px;
          padding: 20px;
          display: grid;
          gap: 14px;
          align-content: start;
        }
        h2 {
          margin: 0;
          font-size: 22px;
          line-height: 1.25;
        }
        label {
          display: grid;
          gap: 6px;
          color: #3d4658;
          font-weight: 700;
        }
        input,
        select {
          border: 1px solid #cbd3df;
          border-radius: 6px;
          padding: 10px;
          font: inherit;
        }
        button {
          background: #2f80ed;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 11px 14px;
          font-weight: 800;
          cursor: pointer;
        }
        .check {
          grid-template-columns: auto 1fr;
          align-items: center;
          justify-content: start;
        }
        @media (max-width: 760px) {
          .profile {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
