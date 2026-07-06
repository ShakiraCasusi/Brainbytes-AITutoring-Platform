import { useState, useEffect } from 'react';
import Head from 'next/head';
import LearningWorkspace from '../components/LearningWorkspace';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Head>
        <title>BrainBytes AI Tutor</title>
        <meta name="description" content="AI-powered tutoring platform" />
        <link rel="icon" href="/brain.png" />
      </Head>
      {mounted && <LearningWorkspace />}
    </>
  );
}
