import { useState } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Results } from './components/ResultsV2';
import { ChatProvider } from './contexts/ChatContext';

type AppState = 'login' | 'dashboard' | 'results';

export default function App() {
  const [currentView, setCurrentView] = useState<AppState>('login');
  const [userEmail, setUserEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setCurrentView('dashboard');
  };

  const handleNavigateToResults = () => {
    setCurrentView('results');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUserEmail('');
    setCurrentView('login');
  };

  const handleError = (err: string) => {
    setError(err);
    console.error('Chat Error:', err);
  };

  if (currentView === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  // Wrap authenticated views with ChatProvider to maintain chat state
  return (
    <ChatProvider userEmail={userEmail} onError={handleError}>
      {currentView === 'dashboard' && (
        <Dashboard 
          userEmail={userEmail}
          onNavigateToResults={handleNavigateToResults}
        />
      )}

      {currentView === 'results' && (
        <Results 
          userEmail={userEmail}
          onBackToDashboard={handleBackToDashboard}
        />
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded">
          {error}
          <button onClick={() => setError(null)} className="ml-2">×</button>
        </div>
      )}
    </ChatProvider>
  );
}