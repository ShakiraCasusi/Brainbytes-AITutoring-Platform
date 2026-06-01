export default function Dashboard({ activity, profile, online }) {
  const subjects = profile.preferredSubjects || [];

  return (
    <section className="dashboard">
      <header>
        <div>
          <h2>Learning dashboard</h2>
          <p>{online ? 'Connected and ready' : 'Offline mode active'}</p>
        </div>
      </header>
      <div className="metrics">
        <article>
          <span>{subjects.length}</span>
          <p>Preferred subjects</p>
        </article>
        <article>
          <span>{activity.length}</span>
          <p>Recent activities</p>
        </article>
        <article>
          <span>{online ? 'Live' : 'Saved'}</span>
          <p>Session status</p>
        </article>
      </div>
      <div className="feed">
        <h3>Recent activity</h3>
        {activity.length === 0 ? (
          <p className="empty">Start chatting to build your activity feed.</p>
        ) : (
          activity.map((item) => (
            <article key={item._id}>
              <strong>{item.summary}</strong>
              <span>{new Date(item.createdAt).toLocaleString()}</span>
            </article>
          ))
        )}
      </div>
      <style jsx>{`
        .dashboard {
          display: grid;
          gap: 20px;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        h2 {
          margin: 0;
          font-size: 28px;
          line-height: 1.2;
        }
        h3 {
          margin: 0 0 12px;
          font-size: 18px;
        }
        p {
          margin: 6px 0 0;
          line-height: 1.5;
          color: #5c667a;
        }
        .metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .metrics article,
        .feed {
          background: white;
          border: 1px solid #dde3ee;
          border-radius: 8px;
          padding: 18px;
        }
        .metrics span {
          display: block;
          font-size: 24px;
          font-weight: 800;
          color: #102033;
        }
        .feed article {
          border-top: 1px solid #edf0f5;
          padding: 12px 0;
          display: grid;
          gap: 4px;
        }
        .feed span {
          color: #7a8496;
          font-size: 13px;
        }
        .empty {
          max-width: 60ch;
        }
        @media (max-width: 760px) {
          .metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
