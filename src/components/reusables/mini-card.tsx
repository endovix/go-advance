import { useState, useRef, useEffect } from "react";
import { EyeIcon, getAuthToken } from "@dynamic-labs/sdk-react-core";
import { showSuccessToast, showErrorToast } from "../ui/custom-toast";
import { submitFeedback } from "../../services/api";
import { formatCount, truncateText, formatJoinedDate, formatTimeDiff } from "../../services/lib";
import { ArrowPathIcon, ChatBubbleOvalLeftIcon, HeartIcon } from "@heroicons/react/16/solid";
import SwipeableCard from "./swipeable-card";

// interface FeedbackData {
//   signalStrength: number | null;
//   authenticity: number | null;
//   sentiment: string;
//   note: string;
// }

interface BaseCardProps {
  id: string;
  name: string;
  username: string;
  profilePictureUrl: string;
  onFeedbackSubmit?: () => void;
}

interface PostCardProps extends BaseCardProps {
  type: "post";
  content: string;
  tweetlink: string;
  timestamp: string;
  replies: number;
  reposts: number;
  likes: number;
  views: number;
}

interface AccountCardProps extends BaseCardProps {
  type: "account";
  bio: string;
  accountlink: string;
  joinedDate: string;
  followers: number;
  following: number;
  tweets: number;
}

type MiniCardProps = PostCardProps | AccountCardProps;

/* ---------- Feedback Submission Handler ---------- */
const submitFeedbackWithReason = async (
  id: string,
  title: string,
  contentType: "post" | "account",
  sentiment: 3 | 2 | 1,
  reason: string,
  onComplete?: () => void
) => {
  try {
    const accessToken = getAuthToken();
    if (!accessToken) throw new Error("No access token");

    const result = await submitFeedback(
      accessToken,
      `task_${id}`,
      sentiment,
      reason || `Quick feedback: ${sentiment}`
    );

    if (!result) throw new Error("Submission failed");

    // Store reward history
    if (chrome?.storage?.local && result.rewardGranted) {
      const feedbackReward = {
        id: result.feedbackId,
        type: "feedback",
        contentType,
        title,
        submittedAt: new Date().toISOString(),
        rewardGranted: result.rewardGranted,
        rewardAmount: result.rewardAmount,
      };
      chrome.storage.local.get(["rewardHistory"], (res) => {
        const existing = Array.isArray(res.rewardHistory) ? res.rewardHistory : [];
        chrome.storage.local.set({
          rewardHistory: [...existing, feedbackReward].slice(-100),
        });
      });
    }

    const sentimentLabels = {
      3: "Bad",
      1: "Good",
      2: "Don't Know"
    };

    showSuccessToast(
      result.rewardGranted
        ? `${sentimentLabels[sentiment]}! You won ${result.rewardAmount} Xeet reward!`
        : `Feedback submitted: ${sentimentLabels[sentiment]}`,
      result.rewardGranted
        ? `${result.rewardAmount.toString()} Xeet`
        : undefined
    );
    onComplete?.();
  } catch (err) {
    showErrorToast("Failed to submit feedback. Please try again.");
  }
};

/* ---------- Reason Popup Modal ---------- */
const ReasonPopup = ({
  sentiment,
  onSubmit,
  onCancel,
}: {
  sentiment: 3 | 2 | 1;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) => {
  const [reason, setReason] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    onSubmit(reason);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSubmit();
    }
  };

  const sentimentLabel = sentiment === 3 ? "Bad" : "Don't Know";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="rounded-xl p-6 max-w-md w-full report-modal">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            Why {sentimentLabel}?
          </h3>
          <button
            onClick={onCancel}
            className="flex items-center justify-center w-8 h-8 border border-secondary bg-transparent hover:bg-gray-800 rounded-full cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3.31592 3.31589L12.6004 12.6003M12.6004 3.31589L3.31592 12.6003" stroke="white" stroke-width="1.32635" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter your reason"
          maxLength={500}
          rows={4}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary mb-2 resize-none"
        />
        <div className="text-xs text-gray-500 mb-4 text-right">
          {reason.length}/500 characters
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-full text-white bg-[#FFFFFF1F] border border-gray-500 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 items-center justify-center px-4 py-2 button-secondary text-sm shadow-red-500 border border-red-500  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- AccountCard ---------- */
const AccountCard = (props: AccountCardProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [showReasonPopup, setShowReasonPopup] = useState(false);
  const [pendingSentiment, setPendingSentiment] = useState<any>();
  const [cardKey, setCardKey] = useState(0);

  const handleSwipe = (direction: "left" | "right" | "up") => {
    if (direction === "left") {
      // Bad - show popup
      setPendingSentiment(3);
      setShowReasonPopup(true);
      return;
    } else if (direction === "right") {
      // Good - submit directly
      setSubmitted(true);
      setPendingSentiment(1);
      submitFeedbackWithReason(props.id, props.name, "account", 1, "", props.onFeedbackSubmit);
      return;
    } else {
      // Don't Know - show popup
      setPendingSentiment(2);
      setShowReasonPopup(true);
      return;
    }
  };

  const handleReasonSubmit = (reason: string) => {
    if (pendingSentiment === 3 || pendingSentiment === 2) {
      setSubmitted(true);
      setShowReasonPopup(false);
      submitFeedbackWithReason(props.id, props.name, "account", pendingSentiment, reason, props.onFeedbackSubmit);
    }
  };

  const handleReasonCancel = () => {
    setShowReasonPopup(false);
    setPendingSentiment(null);
    // Reset the card by changing its key to force remount
    setCardKey(prev => prev + 1);
  };

  if (submitted) return null;

  return (
    <>
      {showReasonPopup && pendingSentiment && (
        <ReasonPopup
          sentiment={pendingSentiment}
          onSubmit={handleReasonSubmit}
          onCancel={handleReasonCancel}
        />
      )}
      <SwipeableCard
        key={cardKey}
        onSwipeLeft={() => handleSwipe("left")}
        onSwipeRight={() => handleSwipe("right")}
        onSwipeUp={() => handleSwipe("up")}
        disabled={showReasonPopup}
      >
        <div className="py-4 my-2 border border-secondary rounded-xl p-4 card-gradient">
          <div className="flex flex-col gap-1">
            <div className="flex w-full items-center justify-between">
              <div className=" flex flex-row">
                <img
                  src={props.profilePictureUrl}
                  className="h-12 w-12 rounded-full mr-3"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-lg text-white">{props.name}</div>
                    <img src="/verified.svg" className="h-4 w-4" />
                  </div>
                  <div className="text-gray-500 text-sm">
                    <span className="text-primary">@{props.username}</span> ·{" "}
                    {formatJoinedDate(props.joinedDate)}
                  </div>
                </div>
              </div>
              <span className="signal-type px-3 py-2 text-white text-[13px]">
                Account
              </span>
            </div>
            <p className="text-gray-100 mt-2 py-1 text-xs px-2">
              {props.bio}
            </p>
          </div>
          <div className="border-t border-secondary my-4"></div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span><span className="text-md text-white">{formatCount(props.following)}</span> Following</span>
            <span><span className="text-md text-white">{formatCount(props.followers)}</span> Followers</span>
            <span><span className="text-md text-white">{formatCount(props.tweets)}</span> Posts</span>
          </div>
        </div>
      </SwipeableCard>
    </>
  );
};

/* ---------- PostCard ---------- */
const PostCard = (props: PostCardProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [showReasonPopup, setShowReasonPopup] = useState(false);
  const [pendingSentiment, setPendingSentiment] = useState<any>();
  const [cardKey, setCardKey] = useState(0);

  const handleSwipe = (direction: "left" | "right" | "up") => {
    if (direction === "left") {
      // Bad - show popup
      setPendingSentiment(3);
      setShowReasonPopup(true);
      return;
    } else if (direction === "right") {
      // Good - submit directly
      setSubmitted(true);
      setPendingSentiment(1);
      submitFeedbackWithReason(props.id, truncateText(props.content, 50), "post", 1, "", props.onFeedbackSubmit);
      return;
    } else {
      // Don't Know - show popup
      setPendingSentiment(2);
      setShowReasonPopup(true);
      return;
    }
  };

  const handleReasonSubmit = (reason: string) => {
    if (pendingSentiment) {
      setSubmitted(true);
      setShowReasonPopup(false);
      submitFeedbackWithReason(props.id, truncateText(props.content, 50), "post", pendingSentiment, reason, props.onFeedbackSubmit);
    }
  };

  const handleReasonCancel = () => {
    setShowReasonPopup(false);
    setPendingSentiment(1);
    // Reset the card by changing its key to force remount
    setCardKey(prev => prev + 1);
  };

  if (submitted) return null;

  return (
    <>
      {showReasonPopup && pendingSentiment && (
        <ReasonPopup
          sentiment={pendingSentiment}
          onSubmit={handleReasonSubmit}
          onCancel={handleReasonCancel}
        />
      )}
      <SwipeableCard
        key={cardKey}
        onSwipeLeft={() => handleSwipe("left")}
        onSwipeRight={() => handleSwipe("right")}
        onSwipeUp={() => handleSwipe("up")}
        disabled={showReasonPopup}
      >
        <div className="py-4 my-2 border border-secondary rounded-xl p-4 card-gradient">
          <div className="flex items-center mt-2 w-full justify-between">
            <div className="flex items-center">
              <img
                src={props.profilePictureUrl}
                className="h-10 w-10 rounded-full mr-2"
              />

              <div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-white">{props.name}</div>
                  <img src="/verified.svg" className="h-4 w-4" />
                </div>

                <div className="text-gray-500 text-sm">
                  <span className="text-primary">@{props.username}</span> ·{" "}
                  {formatTimeDiff(props.timestamp)}
                </div>
              </div>
            </div>
            <span className="signal-type px-3 py-2 text-white text-[13px]">
              Post
            </span>
          </div>

          <p className="text-gray-700 mt-2 break-all text-sm">{truncateText(props.content)}</p>
          <div className="border-t border-secondary my-4"></div>
          <div className="flex justify-between text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <ChatBubbleOvalLeftIcon className="h-4 w-4 text-gray-500" />
              <span className="text-white">{formatCount(props.replies)}</span>
            </span>
            <span className="flex items-center gap-1">
              <ArrowPathIcon className="h-4 w-4 text-gray-500" />
              <span className="text-white">{formatCount(props.reposts)}</span>
            </span>
            <span className="flex items-center gap-1">
              <HeartIcon className="h-4 w-4 text-gray-500" />
              <span className="text-white">{formatCount(props.likes)}</span>
            </span>
            <span className="flex items-center gap-1">
              <EyeIcon className="h-4 w-4 text-gray-500" />
              <span className="text-white">{formatCount(props.views)}</span>
            </span>
          </div>
        </div>
      </SwipeableCard>
    </>
  );
};

/* ---------- MiniCard ---------- */
const MiniCard = (props: MiniCardProps) =>
  props.type === "account" ? <AccountCard {...props} /> : <PostCard {...props} />;

export default MiniCard;
