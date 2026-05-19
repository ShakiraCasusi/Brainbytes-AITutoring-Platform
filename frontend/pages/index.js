import { useState, useEffect } from 'react';
import Head from 'next/head';
import Chat from '../components/Chat';

export default function Home() {
  return (
    <>
      <Head>
        <title>BrainBytes AI Tutor</title>
        <meta name="description" content="AI-powered tutoring platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Chat />
      </main>
    </>
  );
}