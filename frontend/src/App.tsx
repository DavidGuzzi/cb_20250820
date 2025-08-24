import { useState } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Results } from './components/ResultsV2';

type AppState = 'login' | 'dashboard' | 'results';

export default function App() {
  const [currentView, setCurrentView] = useState<AppState>('login');
  const [userEmail, setUserEmail] = useState<string>('');

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

  if (currentView === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  if (currentView === 'dashboard') {
    return (
      <Dashboard 
        userEmail={userEmail}
        onNavigateToResults={handleNavigateToResults}
      />
    );
  }

  if (currentView === 'results') {
    return (
      <Results 
        userEmail={userEmail}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  return null;
}