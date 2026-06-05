// Progressive enhancement - detect supported features
export function getAvailableChatFeatures() {
  let chatFeatures = {
    sendMessage: true,
    viewHistory: true,
  };

  // Progressive enhancements
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    chatFeatures.voiceInput = true;
  }

  if (navigator.storage && navigator.storage.persist) {
    chatFeatures.persistentStorage = true;
  }

  if ('serviceWorker' in navigator) {
    chatFeatures.offlineSupport = true;
  }

  return chatFeatures;
}
