import { useState, useEffect } from "react";
import { formatDurationMin, formatTimeAgo, formatDurationSec } from "../../services/lib";
import { fetchAvailableSpaces } from "../../services/api";
import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import { ClockIcon, PlayIcon, UsersIcon } from "@heroicons/react/16/solid";

interface SpaceSession {
  id: string;
  title: string;
  hostName: string;
  hostUsername: string;
  spacelink: string;
  startTime: Date;
  duration: number; // in minutes
  endTime?: Date;
  isClaimable?: boolean;
}

interface AvailableSpace {
  id: string;
  spaceId: string;
  title: string;
  description: string;
  hostTwitterId: string;
  hostUsername: string;
  hostName: string;
  hostProfilePictureUrl: string;
  spacelink: string;
  scheduledStart: string;
  startedAt: string;
  endedAt: string | null;
  estimatedDurationMins: number;
  participantCount: number;
  isLive: boolean;
  isActive: boolean
  category: string;
  language: string;
  tags: string[];
  createdAt: string;
  udpatedAt: string;
}

const SpacesTracking = () => {
  const [activeSessions, setActiveSessions] = useState<SpaceSession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<SpaceSession[]>([]);
  const [availableSpaces, setAvailableSpaces] = useState<AvailableSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingSpaceTitle, setTrackingSpaceTitle] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
    loadAvailableSpaces();

    // Listen for messages from content script about space sessions
    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'SPACE_SESSION_UPDATE') {
          handleSpaceSessionUpdate(message.data);
        }
      });
    }
  }, []);

  const loadSessions = () => {
    // Load from chrome storage
    if (chrome?.storage?.local) {
      chrome.storage.local.get(['activeSpaces', 'completedSpaces'], (result) => {
        const activeSpaces = Array.isArray(result.activeSpaces) ? result.activeSpaces : [];
        const completedSpaces = Array.isArray(result.completedSpaces) ? result.completedSpaces : [];
        setActiveSessions(activeSpaces);
        setCompletedSessions(completedSpaces);
        setTrackingSpaceTitle(activeSpaces.length > 0 ? activeSpaces[0].title : null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  };

  const loadAvailableSpaces = async () => {
    try {
      setLoading(true);

      // Get access token from Privy
      const accessToken = getAuthToken();

      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Fetch space lists from backend using API service
      const availableSpaceLists = await fetchAvailableSpaces(accessToken);
      setAvailableSpaces(availableSpaceLists as AvailableSpace[]);
    } catch (err) {
      console.log('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpaceSessionUpdate = (sessionData: any) => {
    const session: SpaceSession = {
      id: sessionData.tabId,
      title: sessionData.title,
      hostName: sessionData.host,
      hostUsername: sessionData.hostUsername || 'unknown',
      spacelink: sessionData.spacelink || '',
      startTime: new Date(sessionData.startTime),
      duration: sessionData.duration || 0,
      endTime: sessionData.completed ? new Date() : undefined,
      isClaimable: sessionData.completed ? (sessionData.duration >= 1) : undefined
    };
    if (sessionData.completed) {
      setCompletedSessions(prev => {
        const updated = [...prev, session];
        return updated;
      });

      setActiveSessions([] as SpaceSession[]);
      // Clear tracking title if this was the tracked space
      if (trackingSpaceTitle === session.title) {
        setTrackingSpaceTitle(null);
      }

      // Submit space tracking if eligible for grant xeet
      if (session.isClaimable) {
        setTrackingSpaceTitle(null);
        // submitSpaceTrackingData(session);
      }
    } else {
      setActiveSessions(prev => {
        const existing = prev.find(s => s.id === session.id);
        const updated = existing
          ? prev.map(s => s.id === session.id ? session : s)
          : [...prev, session];
        return updated;
      });
      // Update tracking title when there's an active session
      setTrackingSpaceTitle(session.title);
    }
  };
  
  const handleJoinSpace = (space: AvailableSpace) => {
    // Open space link in new tab
    window.open(space.spacelink, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="w-full md:w-[400px] bg-black flex flex-col gap-2 p-4 h-[calc(100vh-140px)]">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF2574] mx-auto"></div>
          <p className="text-primary mt-2">Loading spaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-[400px] bg-black flex flex-col border-l p-4 h-[calc(100vh-140px)] overflow-y-auto hide-scrollbar">
      <h2 className="text-lg text-white font-semibold mb-4">X Spaces Hub</h2>
      <p className="text-sm text-gray-600 mb-6">
        Discover live X Spaces, join discussions, and earn xeet rewards for participation.
      </p>
      {/* Available Spaces */}
      <div className="mb-8">
        <h3 className="text-[14px] font-medium mb-3 flex items-center text-green-500">
          <img src="/x-green.png" alt="x-icon" className="h-6 w-6 mr-2" />
          Live Spaces
        </h3>
        <div className="space-y-3">
          {availableSpaces?.filter(space => space.isActive).map(space => (
            <div key={space.id} className={`card-gradient-secondary border border-gray-900 p-4 transition-all duration-300 ${trackingSpaceTitle === space.title ? 'ping-animation opacity-60' : ''}`}>
              <h4 className="font-semibold text-sm mb-1 text-white">{space.title}</h4>
              <div className="flex items-center space-x-2 mb-2">
                <img
                  src={space.hostProfilePictureUrl}
                  alt={space.hostName}
                  className="w-8 h-8 rounded-full border border-gray-500"
                />
                <span className="text-sm text-white">@{space.hostUsername}</span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-500">{formatTimeAgo(space.startedAt)}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs">
                  {/* Participants */}
                  <div className="flex items-center gap-1 bg-white/5 text-white px-2 py-1 rounded-full">
                    <UsersIcon className="w-3 h-3 text-gray-400" />
                    <span>{space.participantCount.toLocaleString()}</span>
                  </div>
                  {/* Duration */}
                  <div className="flex items-center gap-1 bg-white/5 text-white px-2 py-1 rounded-full">
                    <ClockIcon className="w-3 h-3 text-gray-400" />
                    <span>~{space.estimatedDurationMins}min</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 text-white px-2 py-1 rounded-full">
                    <img src="/xeet-icon.png" alt="xeet-icon" className="w-3 h-3" />
                    <span>Xeet</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleJoinSpace(space)}
                disabled={trackingSpaceTitle === space.title}
                className="mt-4 submit-btn text-white w-full p-3 cursor-pointer  disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                <PlayIcon className="w-4 h-4 text-white" />
                {trackingSpaceTitle === space.title
                  ? `🎯 Tracking for Rewards ${formatDurationSec(activeSessions[0]?.duration || 0)}`
                  : (
                    <>
                      Join Space & Earn
                      <span className="text-primary">Xeet</span>
                    </>
                  )
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Sessions */}
      <div>
        <h3 className="text-md font-medium mb-3 flex items-center text-white">
          <img src="/x-white.png" alt="x-icon" className="h-6 w-6 mr-2" />
          Recent Sessions
        </h3>
        {completedSessions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">No completed sessions yet</p>
            <p className="text-xs text-gray-400 mt-1">Join a Space above to start earning!</p>
          </div>
        ) : (
          completedSessions.slice(-5).reverse().map(session => (
            <div key={session.id} className="card-gradient border border-secondary rounded-xl p-3 mb-2">
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium text-white text-sm">{session.title}</div>
              </div>
              <div className=" flex gap-2">
                <div className="text-xs text-white">Host: {session.hostName}</div>
                <span className="text-xs text-gray-300">•</span>
                <div className="text-xs text-gray-500">Duration: {formatDurationMin(session.duration)}</div>
              </div>
              {session.endTime ? (
                <div className="text-xs text-white mt-1">
                  {new Date(session.endTime).toLocaleDateString()} at {new Date(session.endTime).toLocaleTimeString()}
                </div>
              ) : (
                <div className="text-xs text-white mt-1 italic">
                  Ongoing
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SpacesTracking;