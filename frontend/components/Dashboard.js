import React from 'react';

export default function Dashboard({
  activity = [],
  profile = {},
  online,
  activeStudyTime = 0,
  streakCount = 0,
}) {
  const subjects = profile?.preferredSubjects || [];
  const name = profile?.name || 'Learner';

  // Format resilient active study duration (HH:MM:SS)
  const hours = String(Math.floor(activeStudyTime / 3600)).padStart(2, '0');
  const mins = String(Math.floor((activeStudyTime % 3600) / 60)).padStart(2, '0');
  const secs = String(activeStudyTime % 60).padStart(2, '0');
  const sessionDuration = `${hours}:${mins}:${secs}`;

  // Time elapsed calculator (e.g. "2m ago", "1h ago")
  const timeAgo = (dateString) => {
    if (!dateString) return 'just now';
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Maps database/local entries to readable titles, descriptions, and icons
  const parseActivity = (item) => {
    let title = 'Learning Lab';
    let description = item.summary || 'Completed workspace module.';
    let badgeLabel = 'SUCCESS';
    let badgeClass = 'badge-success';
    let iconType = 'brain'; // brain, code, award

    if (item.type === 'message') {
      const subjectLabel = item.subject ? item.subject.charAt(0).toUpperCase() + item.subject.slice(1) : 'General';
      title = `${subjectLabel} Session`;
      
      // Clean up summaries
      let cleanedDesc = item.summary;
      if (cleanedDesc.startsWith('Sent a message in ')) {
        cleanedDesc = cleanedDesc.replace(/^Sent a message in \w+:\s*/, 'Asked: ');
      } else {
        cleanedDesc = `Asked: ${cleanedDesc}`;
      }
      // Truncate description if very long
      description = cleanedDesc.length > 55 ? `${cleanedDesc.substring(0, 52)}...` : cleanedDesc;
      
      badgeLabel = 'SUCCESS';
      badgeClass = 'badge-success';
      iconType = 'brain';
    } else if (item.type === 'material') {
      title = 'Quantum Logic Puzzle';
      description = item.summary || 'Processing study materials...';
      badgeLabel = 'IN PROGRESS';
      badgeClass = 'badge-progress';
      iconType = 'code';
    } else if (item.type === 'profile' || item.type === 'settings') {
      title = item.type === 'profile' ? 'Profile Updated' : 'Preferences Saved';
      description = 'User configurations successfully updated.';
      badgeLabel = 'COMPLETED';
      badgeClass = 'badge-completed';
      iconType = 'award';
    }

    return { title, description, badgeLabel, badgeClass, iconType };
  };

  const renderCardIcon = (cardType) => {
    if (cardType === 'subjects') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    if (cardType === 'activities') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="var(--accent-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    if (cardType === 'streak') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="var(--accent-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="var(--accent-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    if (cardType === 'status') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8v4l3 3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2"/>
        </svg>
      );
    }
    return null;
  };

  const renderFeedIcon = (iconType) => {
    if (iconType === 'brain') {
      return (
        <div className="feed-icon-circle bg-blue">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="11" width="18" height="10" rx="2" stroke="white" strokeWidth="2"/>
            <circle cx="8.5" cy="16" r="1.5" fill="white"/>
            <circle cx="15.5" cy="16" r="1.5" fill="white"/>
            <path d="M8 11V8C8 5.79086 9.79086 4 12 4v0c2.209 0 4 1.791 4 4v3" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
      );
    }
    if (iconType === 'code') {
      return (
        <div className="feed-icon-circle bg-orange">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 18l6-6-6-6M8 6L2 12l6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    }
    if (iconType === 'award') {
      return (
        <div className="feed-icon-circle bg-purple">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="white" strokeWidth="2"/>
            <path d="M19.071 4.929a10 10 0 00-14.142 0M12 15v7l3.5-2 3.5 2V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    }
    return null;
  };

  // Recent Feed: filter to include ONLY the user's asked questions
  const userQuestionsFeed = activity.filter(
    (item) => item.type === 'message'
  );

  const subjectSummaryText = subjects.length > 0 
    ? subjects.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
    : 'No subjects selected';

  return (
    <section className="dashboard">
      {/* Connected and ready badge */}
      <div className="status-badge-container">
        <div className={`status-pill ${online ? 'pill-online' : 'pill-offline'}`}>
          <span className="pill-dot"></span>
          <span className="pill-text">{online ? 'Connected and ready' : 'Offline mode active'}</span>
        </div>
      </div>

      {/* Welcome Heading */}
      <header className="dashboard-header">
        <h2 className="welcome-title">Welcome back, {name}</h2>
        <p className="welcome-subtitle">Your learning session is active and syncing in real-time.</p>
      </header>

      {/* Metrics Cards (4 columns) */}
      <div className="metrics-grid">
        {/* Preferred Subjects Card */}
        <div className="metric-card">
          <div className="card-top">
            <span className="card-label">Preferred Subjects</span>
            <span className="card-icon-wrapper">{renderCardIcon('subjects')}</span>
          </div>
          <div className="card-value">{subjects.length} Subjects</div>
          <div className="card-subtext truncate-subtext" title={subjectSummaryText}>{subjectSummaryText}</div>
        </div>

        {/* Recent Questions Count Card */}
        <div className="metric-card">
          <div className="card-top">
            <span className="card-label">Recent Questions</span>
            <span className="card-icon-wrapper">{renderCardIcon('activities')}</span>
          </div>
          <div className="card-value">{userQuestionsFeed.length} Asked</div>
          <div className="card-subtext">Total active discussions</div>
        </div>

        {/* Study Streak Card */}
        <div className="metric-card">
          <div className="card-top">
            <span className="card-label">Study Streak</span>
            <span className="card-icon-wrapper">{renderCardIcon('streak')}</span>
          </div>
          <div className="card-value">{streakCount} Day(s) 🔥</div>
          <div className="card-subtext">Consecutive study days</div>
        </div>

        {/* Session Status Card (Premium Blue Grid Card) */}
        <div className="metric-card active-session-card">
          <div className="card-top">
            <span className="card-label color-white">Session Status: Live</span>
            <span className="card-icon-wrapper">{renderCardIcon('status')}</span>
          </div>
          <div className="card-value color-white">Optimized</div>
          <div className="card-subtext color-light-blue">Active: {sessionDuration}</div>
        </div>
      </div>

      {/* Recent Activity Feed Section */}
      <div className="feed-box">
        <div className="feed-header">
          <h3 className="feed-title">Recent Activity Feed (My Questions)</h3>
          <span className="view-all-link">View all</span>
        </div>

        <div className="feed-content">
          {userQuestionsFeed.length === 0 ? (
            <p className="empty-feed-text">Start chatting with your tutor to build your activity feed.</p>
          ) : (
            <div className="feed-list">
              {userQuestionsFeed.slice(0, 5).map((item) => {
                const parsed = parseActivity(item);
                return (
                  <div key={item._id} className="feed-row">
                    {/* Icon */}
                    <div className="feed-left">
                      {renderFeedIcon(parsed.iconType)}
                      <div className="feed-info">
                        <span className="feed-item-title">{parsed.title}</span>
                        <span className="feed-item-desc">{parsed.description}</span>
                      </div>
                    </div>

                    {/* Status Badge and Time */}
                    <div className="feed-right">
                      <span className={`status-badge ${parsed.badgeClass}`}>{parsed.badgeLabel}</span>
                      <span className="feed-time">{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-family: 'Public Sans', sans-serif;
          max-width: 1024px;
          margin: 0 auto;
        }

        .status-badge-container {
          display: flex;
          align-items: center;
        }

        .status-pill {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 6px 12px;
          gap: 8px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
        }

        .pill-online {
          background: #E8F5E9;
          color: #2E7D32;
        }

        .pill-offline {
          background: #FFEbee;
          color: #C62828;
        }

        .pill-dot {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
        }

        .pill-online .pill-dot {
          background: #22C55E;
        }

        .pill-offline .pill-dot {
          background: #EF5350;
        }

        .dashboard-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .welcome-title {
          font-family: 'Lexend', sans-serif;
          font-style: normal;
          font-weight: 700;
          font-size: 32px;
          line-height: 40px;
          color: var(--text-primary);
          margin: 0;
        }

        .welcome-subtitle {
          font-family: 'Public Sans', sans-serif;
          font-style: normal;
          font-weight: 500;
          font-size: 16px;
          line-height: 24px;
          color: var(--text-muted);
          margin: 0;
        }

        /* Metrics grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          width: 100%;
        }

        .metric-card {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px;
          height: 140px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.05), 0px 2px 4px -2px rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.08);
        }

        .active-session-card {
          background: #004AC6;
          border: none;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .card-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .card-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-value {
          font-family: 'Lexend', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 8px;
        }

        .card-subtext {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-light);
          margin-top: 4px;
        }

        .truncate-subtext {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .color-white {
          color: #FFFFFF !important;
        }

        .color-light-blue {
          color: rgba(219, 225, 255, 0.8) !important;
        }

        /* Feed container */
        .feed-box {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.05), 0px 2px 4px -2px rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          width: 100%;
        }

        .feed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-light);
        }

        .feed-title {
          font-family: 'Lexend', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .view-all-link {
          font-size: 13px;
          font-weight: 600;
          color: var(--accent-blue);
          cursor: pointer;
        }

        .feed-content {
          padding: 8px 24px 24px;
        }

        .empty-feed-text {
          color: var(--text-muted);
          font-size: 15px;
          padding: 24px 0;
          text-align: center;
          margin: 0;
        }

        .feed-list {
          display: flex;
          flex-direction: column;
        }

        .feed-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid var(--border-light);
        }

        .feed-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .feed-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }

        .feed-icon-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .bg-blue {
          background: #2563EB;
        }

        .bg-orange {
          background: #F97316;
        }

        .bg-purple {
          background: #8B5CF6;
        }

        .feed-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .feed-item-title {
          font-family: 'Public Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: var(--text-primary);
          margin: 0 0 2px;
        }

        .feed-item-desc {
          font-size: 13px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .feed-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .status-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }

        .badge-success {
          background: #E8F5E9;
          color: #2E7D32;
        }

        .badge-progress {
          background: #E0F2FE;
          color: #0369A1;
        }

        .badge-completed {
          background: #F3E8FF;
          color: #6B21A8;
        }

        .feed-time {
          font-size: 12px;
          color: var(--text-light);
          width: 60px;
          text-align: right;
        }

        @media (max-width: 1024px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .metric-card {
            height: 120px;
          }

          .feed-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .feed-right {
            width: 100%;
            justify-content: space-between;
            padding-left: 52px;
            box-sizing: border-box;
          }
        }
      `}</style>
    </section>
  );
}
