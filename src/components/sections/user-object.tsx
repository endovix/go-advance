import { useState, useEffect } from "react";
import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import { showSuccessToast, showErrorToast } from "../ui/custom-toast";
import { getUserRewards, claimReward } from "../../services/api";
import type { UserRewardsResponse } from "../../services/types";
import { CalendarDaysIcon, DocumentTextIcon, UserIcon } from "@heroicons/react/16/solid";

interface Reward {
  id: string;
  type: 'space' | 'feedback';
  spaceId?: string;
  spaceTitle?: string;
  contentType?: 'post' | 'account';
  title?: string;
  username?: string;
  amount: number;
  earnedAt: string;
  claimed: boolean;
  claimedAt?: string;
}

const UserObject = () => {
  const [userRewards, setUserRewards] = useState<UserRewardsResponse | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const accessToken = getAuthToken();
      if (!accessToken) {
        setLoading(false);
        return;
      }

      const rewardsData = await getUserRewards(accessToken);
      if (rewardsData) {
        setUserRewards(rewardsData);
      }

      // Still load from chrome storage for historical rewards display
      if (chrome?.storage?.local) {
        chrome.storage.local.get(['rewardHistory'], (result) => {
          const rewardHistory = result.rewardHistory || [];

          const formattedRewards: Reward[] = rewardHistory.map((reward: any) => {
            if (reward.type === 'feedback') {
              return {
                id: reward.id,
                type: 'feedback',
                contentType: reward.contentType,
                title: reward.title,
                username: reward.username,
                amount: reward.rewardAmount,
                earnedAt: reward.submittedAt,
                claimed: reward.claimed || false,
                claimedAt: reward.claimedAt
              };
            } else {
              // Space reward
              return {
                id: reward.id || `space_${Date.now()}`,
                type: 'space',
                spaceId: reward.spaceId,
                spaceTitle: reward.title,
                amount: reward.rewardAmount,
                earnedAt: reward.timestamp || reward.earnedAt,
                claimed: reward.claimed || false,
                claimedAt: reward.claimedAt
              };
            }
          });

          setRewards(formattedRewards);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.log('Error loading rewards:', error);
      setLoading(false);
    }
  };

  const rewardClaim = async (rewardId: string) => {
    setClaimingReward(rewardId);
    try {
      // In production, this would call the xeet API to claim the reward
      const accessToken = getAuthToken();
      if (!accessToken) return;
      const result = await claimReward(accessToken, rewardId);

      if (!result) throw new Error("claim failed!");
      console.log("claim result:", result);

      const claimedAt = new Date().toISOString();

      setRewards(prev => prev.map(reward =>
        reward.id === rewardId
          ? { ...reward, claimed: true, claimedAt }
          : reward
      ));

      // Update local storage with the claimed reward status
      if (chrome?.storage?.local) {
        chrome.storage.local.get(['rewardHistory'], (result) => {
          const rewardHistory = result.rewardHistory || [];
          const updatedHistory = rewardHistory.map((reward: any) =>
            reward.id === rewardId
              ? { ...reward, claimed: true, claimedAt }
              : reward
          );
          
          chrome.storage.local.set({ rewardHistory: updatedHistory }, () => {
            console.log('Reward claim status saved to local storage');
          });
        });
      }

      showSuccessToast("Reward claimed successfully!");
    } catch (error) {
      console.log('Failed to claim reward:', error);
      showErrorToast("Failed to claim reward");
    } finally {
      setClaimingReward(null);
    }
  };

  const totalEarned = userRewards ? userRewards.totalAccumulated : rewards.reduce((sum, reward) => sum + reward.amount, 0);
  const totalClaimed = rewards?.filter(r => r.claimed).reduce((sum, reward) => sum + reward.amount, 0);
  const availableToClaim = rewards?.filter(r => !r.claimed).reduce((sum, reward) => sum + reward.amount, 0);

  if (loading) {
    return (
      <div className="w-full md:w-[400px] bg-black flex flex-col gap-2 p-4 h-[calc(100vh-120px)]">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF2574] mx-auto"></div>
          <p className="text-primary mt-2">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-[400px] bg-blacke flex flex-col p-4 h-[calc(100vh-120px)] overflow-y-auto hide-scrollbar">
      <h2 className="text-lg text-white font-semibold mb-4">Rewards</h2>
      <p className="text-sm text-gray-600 mb-6">
        Track your xeet rewards earned from Space participation and content engagement. Claim rewards to add them to your wallet and monitor your earning history.
      </p>
      <div className="card-gradient mb-4 border border-secondary rounded-2xl p-4 relative overflow-y-clip">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-white text-sm mb-2">Total Earned</h2>
            <div className="text-3xl font-bold text-primary mb-6">{totalEarned}</div>
          </div>
          <img src="/xeet-vector.svg" alt="Total Earned" className="w-20 h-20" />
        </div>

        <div className="flex items-start justify-between">
          <h3 className="text-gray-500 text-sm mb-2">Claimed</h3>
          <div className="text-sm font-bold text-green-500 mb-2">{totalClaimed}</div>
        </div>

        <div className="flex items-start justify-between">
          <h3 className="text-gray-500 text-sm ">Available</h3>
          <div className="text-sm font-bold text-yellow-500">{availableToClaim}</div>
        </div>

        {/* Gift Box Floating */}
        <img
          src="/gift-box.png"
          alt="Gift"
          className="absolute -bottom-20 rotate-30 right-1/4 w-36 select-none pointer-events-none"
        />
      </div>
      {/* Summary Stats */}
      {/* <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card-gradient  border border-secondary p-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-primary">{totalEarned}</div>
          <div className="text-sm text-gray-600">Accumulated Xeets</div>
        </div>
        <div className="card-gradient border border-secondary p-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-primary">{currentStreak}</div>
          <div className="text-sm text-gray-600">Current Streak</div>
        </div>
        <div className="card-gradient border border-secondary p-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-primary">{dailyEarned}/{dailyCap}</div>
          <div className="text-sm text-gray-600">Daily Progress</div>
        </div>
        <div className="card-gradient border border-secondary p-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-primary">{remainingCap}</div>
          <div className="text-sm text-gray-600">Remaining Cap</div>
        </div>
      </div> */}
      {/* Rewards List */}
      <div className="space-y-3 mb-4">
        <h3 className="text-[14px] text-primary font-semibold mb-2">Recent Rewards</h3>
        {rewards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No rewards earned yet</p>
            <p className="text-sm text-gray-400 mt-1">Join Spaces to start earning Xeet rewards!</p>
          </div>
        ) : (
          rewards.map(reward => (
            <div key={reward.id} className={`${reward.claimed ? "card-gradient-base border border-[#ffffff0c] border-b-gray-500" : "card-gradient border border-secondary"} rounded-xl p-4`}>
              <div className="flex items-center gap-4 justify-between">
                <div className="w-12 h-12 bg-[#1A1A1A] rounded-md flex items-center justify-center shrink-0">
                  <img src="/x-white.png" className="w-6 h-6" alt="x-reward" />
                </div>
                <div className="">
                  <div className="font-medium text-[14px] text-primary">+{reward.amount} Xeet</div>
                  <div className="text-[12px] text-gray-500">
                    {reward.type === "space" ? (
                      <>Space: {reward.spaceTitle || "Unknown Space"}</>
                    ) : reward.type === "feedback" ? (
                      <div className="flex items-center gap-1">
                        {reward.contentType === "post" ? (
                          <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-gray-500" />
                        )}
                        <span>{reward.title || "Unknown Content"}</span>
                      </div>
                    ) : (
                      "Unknown reward"
                    )}

                  </div>
                  <div className="inline-flex leading-none my-1 px-2 items-center gap-1 bg-white/5 text-white py-1 rounded-full">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                    Earned: {new Date(reward.earnedAt).toLocaleDateString()}
                  </div>
                  {/* {reward.claimed && reward.claimedAt && (
                    <div className="inline-flex items-center leading-none border text-primary border-primary rounded-full my-2 py-1 px-2">
                      {reward.type === 'feedback' ? 'Auto-claimed' : `Claimed: ${new Date(reward.claimedAt).toLocaleDateString()}`}
                    </div>
                  )} */}
                </div>
                {!reward.claimed && reward.type === 'space' && (
                  <button
                    onClick={() => rewardClaim(reward.id)}
                    disabled={claimingReward === reward.id}
                    className="button-primary !text-xs disabled:cursor-not-allowed cursor-pointer"
                  >
                    {claimingReward === reward.id ? 'Claiming...' : 'Claim'}
                  </button>
                )}
                {!reward.claimed && reward.type === 'feedback' && (
                  <button
                    onClick={() => rewardClaim(reward.id)}
                    disabled={claimingReward === reward.id}
                    className="button-primary !text-xs disabled:cursor-not-allowed cursor-pointer"
                  >
                    {claimingReward === reward.id ? 'Claiming...' : 'Claim'}
                  </button>
                )}
                {reward.claimed && (
                  <div className=" items-center leading-none border text-primary font-semibold border-primary p-3 reward-status-label rounded-full">
                    Claimed
                  </div>)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserObject;
