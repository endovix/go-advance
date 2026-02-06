// FILE ALTERED FROM CANONICAL STARTER
import { ToastContainer } from "react-toastify";
import {
  useDynamicContext
} from "@dynamic-labs/sdk-react-core";
import CardList from "./components/sections/card-list";
import SpacesTracking from "./components/sections/spaces-tracking";
import ReportFlag from "./components/sections/report-flag";
import UserObject from "./components/sections/user-object";
import { useState, useEffect } from "react";
import AuthScreen from "./components/ui/auth-screen";
import RegisterScreen from "./components/ui/register-screen";
import type { UserProfile } from "./services/types";

function App() {
  const { handleLogOut, setShowAuthFlow, user } = useDynamicContext();
  const [activeTab, setActiveTab] = useState<'signals' | 'spaces' | 'report' | 'rewards'>('signals');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load user profile from localStorage on mount and whenever Dynamic user changes
  useEffect(() => {
    const loadUserProfile = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserProfile(parsedUser);
          console.log('User profile loaded from localStorage:', parsedUser);
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.log('Error loading user profile from localStorage:', error);
        setUserProfile(null);
      }
    };

    // Load on mount and when user changes
    loadUserProfile();

    // Listen for custom storage event when handleAuthenticatedUser completes
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'user-authenticated') {
        loadUserProfile();
      }
    };

    window.addEventListener('user-authenticated', handleStorageChange);

    return () => {
      window.removeEventListener('user-authenticated', handleStorageChange);
    };
  }, [user]);
  // Listen for messages to switch tabs
  useEffect(() => {
    if (chrome?.runtime?.onMessage) {
      const messageListener = (message: any) => {
        if (message.type === 'SWITCH_TO_SPACES_TAB') {
          setActiveTab('spaces');
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);

      // Cleanup listener on unmount
      return () => {
        chrome.runtime.onMessage.removeListener(messageListener);
      };
    }
  }, []);

  const handleLogin = () => {
    setShowAuthFlow(true);
  };

  const handleLogout = () => {
    handleLogOut();
    // Clear localStorage
    localStorage.removeItem('user');
    setUserProfile(null);
  };

  const handleRegister = () => {
    // Logout from Dynamic
    handleLogout();
    // Open xeet.ai platform
    window.open('https://xeet.ai', '_blank', 'noopener,noreferrer');
  };

  // Show auth screen if no Dynamic user
  if (!user) {
    return <AuthScreen onLogin={handleLogin} />
  } else if (!userProfile) {
    return <RegisterScreen onRegister={handleRegister} />
  }

  return (
    <div className="bg-white md:max-h-[100vh]">
      <section className="w-full flex flex-col">
        <div className="flex flex-col h-fit justify-between fixed top-0 left-0 w-full md:static z-10 ">
          <div className=" flex bg-black/95 w-full profile-header-bg flex-col">
            <div className=" flex w-full justify-between p-4 items-center">
              <div className=" flex flex-row gap-2 items-center bg-black/10">
                <img
                  src={userProfile.avatar || '/xeet-icon.png'}
                  alt="User Avatar"
                  className="h-16 w-16 rounded-full"
                />
                <div className="flex flex-col text-white">
                  <div className="flex gap-2 items-center">
                    <a className="text-white font-semibold text-[18px]">
                      {userProfile.name || userProfile.handle}
                    </a>
                    {userProfile.verified && (
                      <img src="/verified.svg" alt="Verified" className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-primary font-semibold text-[12px]">
                      @{userProfile.handle}
                    </span>
                    {userProfile.followersCount !== undefined && (
                      <>
                        <span>·</span>
                        <span className="text-gray-500 text-[12px]">
                          {userProfile.followersCount.toLocaleString()} Followers
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button className="button-primary cursor-pointer" onClick={handleLogout}>
                Logout
              </button>
            </div>
            {/* Tab Navigation */}
            <div className="flex h-fit justify-between">
              <button
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap cursor-pointer ${activeTab === 'signals' ? 'border-b border-white text-white tab-active' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('signals')}
              >
                Signals
              </button>
              <button
                className={`px-3 py-3 text-sm font-medium whitespace-nowrap cursor-pointer ${activeTab === 'spaces' ? 'border-b border-white text-white tab-active' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('spaces')}
              >
                Spaces Tracking
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap cursor-pointer ${activeTab === 'report' ? 'border-b border-white text-white tab-active' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('report')}
              >
                Report & Flag
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap cursor-pointer ${activeTab === 'rewards' ? 'border-b border-white text-white tab-active' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('rewards')}
              >
                Rewards
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'signals' && <CardList />}
          {activeTab === 'spaces' && <SpacesTracking />}
          {activeTab === 'report' && <ReportFlag />}
          {activeTab === 'rewards' && <UserObject />}
        </div>
      </section>
      <ToastContainer
        position="top-center"
        autoClose={1000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
        limit={1}
        aria-label="Toast notifications"
        style={{ top: 58 }}
      />
    </div>
  );
}

export default App;
