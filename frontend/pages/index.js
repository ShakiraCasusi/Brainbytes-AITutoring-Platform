import { useState, useEffect } from 'react';
import Head from 'next/head';
import LearningWorkspace from '../components/LearningWorkspace';
import { BrainBytesMonitor } from '../utils/metrics';

export default function Home() {
  
  useEffect(() => {
    // 1. Start tracking the student's learning session duration
    BrainBytesMonitor.initializeSession();
    
    // 2. Start monitoring UI click latency / responsiveness
    BrainBytesMonitor.initUserInteractionTracking('home_workspace');

    // 3. Monitor intermittent signals (online/offline events common in PH)
    if (typeof BrainBytesMonitor.trackNetworkStatus === 'function') {
      BrainBytesMonitor.trackNetworkStatus();
    }

    // 4. Automatically save and push the session length when they close the app
    const handleUnload = () => {
      BrainBytesMonitor.flushSessionDuration();
    };

    window.addEventListener('beforeunload', handleUnload);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        BrainBytesMonitor.flushSessionDuration();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <>
      <Head>
        <title>BrainBytes AI Tutor</title>
        <meta name="description" content="AI-powered tutoring platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <LearningWorkspace />
    </>
  );
}
