import { useState, useEffect } from 'react';
import Head from 'next/head';
import LearningWorkspace from '../components/LearningWorkspace';

export default function Home() {
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
