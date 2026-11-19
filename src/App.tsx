import {useEffect, useState} from 'react';
import {AppInstallModal} from './components/AppInstallModal';
import {ChatScreen} from './components/ChatScreen';
import {JoinScreen} from './components/JoinScreen';
import {OfflineIndicator} from './components/OfflineIndicator';
import {useChatSocket} from './hooks/useChatSocket';

const THEME_KEY = 'chatrieng_theme_v1';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  });
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  const {
    currentUser,
    messages,
    members,
    connectionState,
    authError,
    chatError,
    isJoining,
    joinRoom,
    leaveRoom,
    sendMessage,
    clearAuthError,
    clearChatError,
  } = useChatSocket();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode]);

  return (
    <>
      {currentUser ? (
        <ChatScreen
          currentUser={currentUser}
          messages={messages}
          members={members}
          connectionState={connectionState}
          chatError={chatError}
          onClearChatError={clearChatError}
          onSendMessage={sendMessage}
          onLeaveRoom={leaveRoom}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          onOpenInstallModal={() => setIsInstallOpen(true)}
        />
      ) : (
        <JoinScreen
          onJoin={joinRoom}
          authError={authError}
          onClearError={clearAuthError}
          isJoining={isJoining}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          onOpenInstallModal={() => setIsInstallOpen(true)}
        />
      )}

      <AppInstallModal isOpen={isInstallOpen} onClose={() => setIsInstallOpen(false)} />
      <OfflineIndicator />
    </>
  );
}
