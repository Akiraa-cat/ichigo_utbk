import React from 'react';
import { BottomNav } from './components/BottomNav';
import { HeaderBar } from './components/HeaderBar';
import { MangaOverlays } from './components/MangaOverlays';
import { AppProvider, useApp } from './context/AppContext';
import { AgendaScreen } from './screens/AgendaScreen';
import { BerandaScreen } from './screens/BerandaScreen';
import { DataScreen } from './screens/DataScreen';
import { JadwalScreen } from './screens/JadwalScreen';
import { NilaiScreen } from './screens/NilaiScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { StudySessionFormScreen } from './screens/StudySessionFormScreen';
import { TryoutFormScreen } from './screens/TryoutFormScreen';

const AppShell: React.FC = () => {
  const { route } = useApp();

  const renderScreen = () => {
    if (route.type === 'study_form') {
      return (
        <StudySessionFormScreen
          initialDate={route.date}
          sessionId={route.sessionId}
        />
      );
    }
    if (route.type === 'tryout_form') {
      return <TryoutFormScreen tryoutId={route.tryoutId} />;
    }
    if (route.type === 'settings') {
      return <SettingsScreen />;
    }
    switch (route.tab) {
      case 'beranda':
        return <BerandaScreen />;
      case 'nilai':
        return <NilaiScreen />;
      case 'agenda':
        return <AgendaScreen />;
      case 'jadwal':
        return <JadwalScreen />;
      case 'data':
        return <DataScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <HeaderBar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 pt-20 pb-24 md:pb-12">
        {renderScreen()}
      </main>
      <BottomNav />
      <MangaOverlays />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
