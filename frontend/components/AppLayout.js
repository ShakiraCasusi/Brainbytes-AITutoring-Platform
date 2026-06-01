export default function AppLayout({ activeView, onNavigate, children }) {
  const items = [
    { id: 'chat', label: 'Chat' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <h1>BrainBytes</h1>
          <p>AI tutoring workspace</p>
        </div>
        <nav>
          {items.map((item) => (
            <button
              key={item.id}
              className={activeView === item.id ? 'active' : ''}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="content">{children}</main>
      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 230px 1fr;
          background: #f6f7fb;
          color: #172033;
        }
        .sidebar {
          background: #102033;
          color: white;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        h1 {
          margin: 0;
          font-size: 28px;
          line-height: 1.2;
        }
        p {
          margin: 8px 0 0;
          color: #b8c2d4;
          line-height: 1.5;
        }
        nav {
          display: grid;
          gap: 8px;
        }
        button {
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: transparent;
          color: white;
          border-radius: 6px;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
        }
        button.active {
          background: #2f80ed;
          border-color: #2f80ed;
          font-weight: 700;
        }
        .content {
          padding: 24px;
          min-width: 0;
        }
        @media (max-width: 760px) {
          .layout {
            grid-template-columns: 1fr;
          }
          .sidebar {
            position: sticky;
            top: 0;
            z-index: 2;
            padding: 16px;
            gap: 16px;
          }
          nav {
            grid-template-columns: repeat(3, 1fr);
          }
          button {
            text-align: center;
          }
          .content {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
