// import React, { useState, useEffect } from 'react';
// import { GNSSProvider, useGNSS } from '../context/GNSSContext';
// import { ConnectionScreen } from './components/ConnectionScreen';
// import { DashboardScreen } from './components/DashboardScreen';
// import { ConfigurationScreen } from './components/ConfigurationScreen';
// import { HistoryScreen } from './components/HistoryScreen';
// import { SettingsScreen } from './components/SettingsScreen';
// import { Toaster } from './components/ui/sonner';
// import { BackendLoggerDebugPanel } from './components/BackendLoggerDebugPanel';
// import { uiLogger } from '../utils/uiLogger';
// import {
//   Home,
//   Settings,
//   History,
//   FileText,
//   LogOut
// } from 'lucide-react';

// type Screen = 'connection' | 'dashboard' | 'configuration' | 'history' | 'settings';

// const AppContent: React.FC = () => {
//   const { connection, disconnect, settings, survey } = useGNSS();
//   const [currentScreen, setCurrentScreen] = useState<Screen>('connection');

//   // Apply theme on mount and when settings change
//   useEffect(() => {
//     const applyTheme = () => {
//       const htmlElement = document.documentElement;
//       if (settings.theme === 'system') {
//         const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//         if (isDark) {
//           htmlElement.classList.add('dark');
//         } else {
//           htmlElement.classList.remove('dark');
//         }
//       } else if (settings.theme === 'dark') {
//         htmlElement.classList.add('dark');
//       } else {
//         htmlElement.classList.remove('dark');
//       }
//     };

//     applyTheme();

//     // Listen for system theme changes
//     const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//     mediaQuery.addListener(applyTheme);

//     return () => mediaQuery.removeListener(applyTheme);
//   }, [settings.theme]);

//   // Auto-navigate to dashboard when connected
//   useEffect(() => {
//     if (connection.isConnected && currentScreen === 'connection') {
//       setCurrentScreen('dashboard');
//     }
//   }, [connection.isConnected, currentScreen]);

//   // Trigger auto-start survey event when dashboard is shown
//   useEffect(() => {
//     if (currentScreen === 'dashboard' && connection.isConnected) {
//       // Dispatch custom event to trigger auto-start survey
//       window.dispatchEvent(new CustomEvent('dashboard-navigated'));
//     }
//   }, [currentScreen, connection.isConnected]);

//   const handleDisconnect = () => {
//     uiLogger.log('Disconnect button clicked', 'App');
//     disconnect();
//     setCurrentScreen('connection');
//     uiLogger.log('Navigated to Connection Screen', 'App');
//   };

//   const handleScreenChange = (screen: Screen) => {
//     uiLogger.log(`Maps to ${screen}`, 'App', { screen });
//     setCurrentScreen(screen);
//   };

//   // Listen for reconfigure button click
//   useEffect(() => {
//     const handleNavigation = () => {
//       handleScreenChange('configuration');
//     };
//     window.addEventListener('navigate-to-configuration', handleNavigation);
//     return () => window.removeEventListener('navigate-to-configuration', handleNavigation);
//   }, []);

//   // Added shortLabel specifically for the expanding mobile bottom nav
//   const navItems = [
//     { id: 'dashboard' as Screen, label: 'Dashboard', shortLabel: 'Home', icon: Home },
//     { id: 'configuration' as Screen, label: 'Configuration', shortLabel: 'Config', icon: Settings },
//     { id: 'history' as Screen, label: 'History', shortLabel: 'History', icon: History },
//     { id: 'settings' as Screen, label: 'Settings', shortLabel: 'Settings', icon: FileText },
//   ];

//   const renderScreen = () => {
//     switch (currentScreen) {
//       case 'connection':
//         return <ConnectionScreen />;
//       case 'dashboard':
//         return <DashboardScreen />;
//       case 'configuration':
//         return <ConfigurationScreen />;
//       case 'history':
//         return <HistoryScreen />;
//       case 'settings':
//         return <SettingsScreen />;
//       default:
//         return <ConnectionScreen />;
//     }
//   };

//   // If not connected and no active survey, show only connection screen
//   if (!connection.isConnected && !survey.isActive) {
//     return (
//       <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-50 transition-colors duration-300">
//         <div key="connection-screen" className="animate-in fade-in zoom-in-[0.99] duration-200 ease-out">
//           <ConnectionScreen />
//         </div>
//         <Toaster />
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-50 flex overflow-hidden transition-colors duration-300">

//       {/* ── Desktop Sidebar (Fixed Left) ── */}
//       <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50">
//         <div className="p-6">
//           <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
//             GNSS Base Station
//           </h1>
//           <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
//             RTK Configuration
//           </p>
//         </div>

//         <nav className="flex-1 px-4 space-y-1.5 mt-2">
//           {navItems.map((item) => {
//             const Icon = item.icon;
//             return (
//               <button
//                 key={item.id}
//                 onClick={() => handleScreenChange(item.id)}
//                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-95 ${currentScreen === item.id
//                   ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-semibold shadow-sm'
//                   : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
//                   }`}
//               >
//                 <Icon className="size-5" />
//                 <span>{item.label}</span>
//               </button>
//             );
//           })}
//         </nav>

//         <div className="p-4 border-t border-slate-200 dark:border-slate-800">
//           <button
//             onClick={handleDisconnect}
//             className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all active:scale-95 shadow-sm"
//           >
//             <LogOut className="size-5" />
//             <span>Disconnect</span>
//           </button>
//         </div>
//       </aside>

//       {/* ── Mobile Header (Fixed Top) ── */}
//       <div className="md:hidden fixed top-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 pt-safe">
//         <div className="flex items-center justify-between px-5 py-3">
//           <div>
//             <h1 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
//               GNSS Base Station
//             </h1>
//             <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
//               Connected
//             </p>
//           </div>
          
//           {/* Quick Disconnect Button for Mobile */}
//           <button
//             onClick={handleDisconnect}
//             className="p-2.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-90"
//             aria-label="Disconnect"
//           >
//             <LogOut className="size-5" />
//           </button>
//         </div>
//       </div>

//       {/* ── Mobile Interactive Bottom Navbar ── */}
//       <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#020617]/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
//         <div className="flex items-center justify-between px-3 py-2.5 gap-1">
//           {navItems.map((item) => {
//             const isActive = currentScreen === item.id;
//             const Icon = item.icon;
            
//             return (
//               <button
//                 key={item.id}
//                 onClick={() => handleScreenChange(item.id)}
//                 // Flex-grow ratio drives the smooth elastic expansion animation
//                 className={`relative flex items-center justify-center gap-2 px-3 py-3 rounded-2xl transition-all duration-500 ease-out active:scale-95 ${
//                   isActive 
//                     ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 flex-grow-[2]' 
//                     : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex-grow-[1]'
//                 }`}
//               >
//                 <Icon className={`size-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
//                 {isActive && (
//                   <span className="text-sm font-semibold tracking-wide animate-in fade-in zoom-in-50 duration-300 whitespace-nowrap">
//                     {item.shortLabel}
//                   </span>
//                 )}
//               </button>
//             );
//           })}
//         </div>
//       </nav>

//       {/* ── Main Content Area ── */}
//       {/* Note the mb-[80px] specifically for mobile so content isn't trapped under the bottom navbar */}
//       <main className="flex-1 overflow-y-auto md:ml-64 mt-[calc(env(safe-area-inset-top,0px)+72px)] mb-[80px] md:mt-0 md:mb-0 overflow-x-hidden">
//         <div 
//           key={currentScreen} 
//           className="animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out h-full"
//         >
//           {renderScreen()}
//         </div>
//       </main>

//       <Toaster />
//       {import.meta.env.MODE === 'development' && (
//         <BackendLoggerDebugPanel />
//       )}
//     </div>
//   );
// };

// const App: React.FC = () => {
//   return (
//     <GNSSProvider>
//       <AppContent />
//     </GNSSProvider>
//   );
// };

// export default App;



















































import React, { useState, useEffect } from 'react';
import { GNSSProvider, useGNSS } from '../context/GNSSContext';
import { ConnectionScreen } from './components/ConnectionScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { ConfigurationScreen } from './components/ConfigurationScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { Toaster } from './components/ui/sonner';
import { BackendLoggerDebugPanel } from './components/BackendLoggerDebugPanel';
import { uiLogger } from '../utils/uiLogger';
import {
  Home,
  Settings,
  History,
  FileText,
  LogOut
} from 'lucide-react';

type Screen = 'connection' | 'dashboard' | 'configuration' | 'history' | 'settings';

const AppContent: React.FC = () => {
  const { connection, disconnect, settings, survey } = useGNSS();
  const [currentScreen, setCurrentScreen] = useState<Screen>('connection');

  // Apply theme on mount and when settings change
  useEffect(() => {
    const applyTheme = () => {
      const htmlElement = document.documentElement;
      if (settings.theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
          htmlElement.classList.add('dark');
        } else {
          htmlElement.classList.remove('dark');
        }
      } else if (settings.theme === 'dark') {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addListener(applyTheme);

    return () => mediaQuery.removeListener(applyTheme);
  }, [settings.theme]);

  // ⭐ THE BYPASS: Auto-navigate to dashboard when connected successfully
  useEffect(() => {
    if (connection.isConnected && currentScreen === 'connection') {
      setCurrentScreen('dashboard');
    }
  }, [connection.isConnected, currentScreen]);

  // ⭐ THE GATEWAY: Strictly force the user back to the connection screen if the link drops
  useEffect(() => {
    if (!connection.isConnected && !survey.isActive && currentScreen !== 'connection') {
      setCurrentScreen('connection');
    }
  }, [connection.isConnected, survey.isActive, currentScreen]);

  // Trigger auto-start survey event when dashboard is shown
  useEffect(() => {
    if (currentScreen === 'dashboard' && connection.isConnected) {
      // Dispatch custom event to trigger auto-start survey
      window.dispatchEvent(new CustomEvent('dashboard-navigated'));
    }
  }, [currentScreen, connection.isConnected]);

  const handleDisconnect = () => {
    uiLogger.log('Disconnect button clicked', 'App');
    disconnect();
    setCurrentScreen('connection');
    uiLogger.log('Navigated to Connection Screen', 'App');
  };

  const handleScreenChange = (screen: Screen) => {
    uiLogger.log(`Maps to ${screen}`, 'App', { screen });
    setCurrentScreen(screen);
  };

  // Listen for reconfigure button click
  useEffect(() => {
    const handleNavigation = () => {
      handleScreenChange('configuration');
    };
    window.addEventListener('navigate-to-configuration', handleNavigation);
    return () => window.removeEventListener('navigate-to-configuration', handleNavigation);
  }, []);

  const navItems = [
    { id: 'dashboard' as Screen, label: 'Dashboard', shortLabel: 'Home', icon: Home },
    { id: 'configuration' as Screen, label: 'Configuration', shortLabel: 'Config', icon: Settings },
    { id: 'history' as Screen, label: 'History', shortLabel: 'History', icon: History },
    { id: 'settings' as Screen, label: 'Settings', shortLabel: 'Settings', icon: FileText },
  ];

  const renderScreen = () => {
    switch (currentScreen) {
      case 'connection':
        return <ConnectionScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'configuration':
        return <ConfigurationScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <ConnectionScreen />;
    }
  };

  // If not connected and no active survey, block rendering of the internal app structure
  if (!connection.isConnected && !survey.isActive) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-50 transition-colors duration-300">
        <div key="connection-screen" className="animate-in fade-in zoom-in-[0.99] duration-200 ease-out">
          <ConnectionScreen />
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-50 flex overflow-hidden transition-colors duration-300">

      {/* ── Desktop Sidebar (Fixed Left) ── */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
            GNSS Base Station
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
            RTK Configuration
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleScreenChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-95 ${currentScreen === item.id
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all active:scale-95 shadow-sm"
          >
            <LogOut className="size-5" />
            <span>Disconnect</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Header (Fixed Top) ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 pt-safe">
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
              GNSS Base Station
            </h1>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Connected
            </p>
          </div>
          
          <button
            onClick={handleDisconnect}
            className="p-2.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-90"
            aria-label="Disconnect"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile Interactive Bottom Navbar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#020617]/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 mobile-nav-safe">
        <div className="flex items-center justify-between px-3 py-2.5 gap-1">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleScreenChange(item.id)}
                className={`relative flex items-center justify-center gap-2 px-3 py-3 rounded-2xl transition-all duration-500 ease-out active:scale-95 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 flex-grow-[2]' 
                    : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex-grow-[1]'
                }`}
              >
                <Icon className={`size-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
                {isActive && (
                  <span className="text-sm font-semibold tracking-wide animate-in fade-in zoom-in-50 duration-300 whitespace-nowrap">
                    {item.shortLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-y-auto md:ml-64 mt-[calc(env(safe-area-inset-top,0px)+72px)] mobile-main-safe md:mt-0 md:mb-0 overflow-x-hidden">
        <div 
          key={currentScreen} 
          className="animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out h-full"
        >
          {renderScreen()}
        </div>
      </main>

      <Toaster />
      {import.meta.env.MODE === 'development' && (
        <BackendLoggerDebugPanel />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GNSSProvider>
      <AppContent />
    </GNSSProvider>
  );
};

export default App;
