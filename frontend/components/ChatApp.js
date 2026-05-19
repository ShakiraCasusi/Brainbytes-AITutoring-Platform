import React, { Suspense } from 'react';
import { getPlatformInfo } from '../utils/platform';

// Lazy load components
const FullChatInterface = React.lazy(() => import('./ChatInterface'));
const LightChatInterface = React.lazy(() => import('./LightChatInterface'));

function Loading() {
  return <div>Loading...</div>;
}

function ChatApp() {
  const { isLowEndDevice } = getPlatformInfo();

  // Use React.lazy for code splitting based on device capability
  const ChatInterface = isLowEndDevice ? LightChatInterface : FullChatInterface;

  return (
    <React.Suspense fallback={<Loading />}>
      <ChatInterface />
    </React.Suspense>
  );
}

export default ChatApp;