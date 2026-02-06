import { useState, useEffect } from "react";
import { isValidPostUrl, isValidAccountUrl, snapFormatCount } from "../../services/lib";

const DEFAULT_IMAGE =
  "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png";

interface PostSnapshot {
  type: "post";
  postId: string;
  username: string;
  profileImageUrl: string;
  likes: number;
  reposts: number;
  quotes: number;
  bookmarks: number;
}

interface AccountSnapshot {
  type: "account";
  username: string;
  profileImageUrl: string;
  followers: number;
  following: number;
}

type PageSnapshot = PostSnapshot | AccountSnapshot | null;

interface PageSnapshotProps {
  onSnapshotChange?: (hasSnapshot: boolean) => void;
}

const PageSnapshot = ({ onSnapshotChange }: PageSnapshotProps = {}) => {
  const [snapshot, setSnapshot] = useState<PageSnapshot>(null);
  const [loading, setLoading] = useState(true);

  const extractPageInfo = async () => {
    setLoading(true);

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab?.url) {
        setSnapshot(null);
        onSnapshotChange?.(false);
        return;
      }

      const postUrl = isValidPostUrl(currentTab.url);
      const accountUrl = isValidAccountUrl(currentTab.url);

      if (!postUrl && !accountUrl) {
        setSnapshot(null);
        onSnapshotChange?.(false);
        return;
      }

      let pageData: any = null;

      setTimeout(async () => {
        try {
          const res = await chrome.tabs.sendMessage(currentTab.id!, {
            action: "EXTRACT_PAGE_DATA",
          });
          pageData = res?.data;
        } catch {
          console.log("Content script not available — using fallback.");
        }

        if (postUrl) {
          setSnapshot({
            type: "post",
            postId: postUrl.postId,
            username: postUrl.username,
            profileImageUrl: pageData?.profileImage || DEFAULT_IMAGE,
            likes: pageData?.postMetrics?.likes ?? 0,
            reposts: pageData?.postMetrics?.reposts ?? 0,
            quotes: pageData?.postMetrics?.replies ?? 0,
            bookmarks: pageData?.postMetrics?.bookmarks ?? 0,
          });
          onSnapshotChange?.(true);
          return;
        }

        if (accountUrl) {
          setSnapshot({
            type: "account",
            username: accountUrl.username,
            profileImageUrl: pageData?.profileImage || DEFAULT_IMAGE,
            followers: pageData?.followers ?? 0,
            following: pageData?.following ?? 0,
          });
          onSnapshotChange?.(true);
          return;
        }
      }, 500);

    } catch (err) {
      console.log("Error extracting page info:", err);
      setSnapshot(null);
      onSnapshotChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    extractPageInfo();

    const listener = (_: any, changeInfo: any) => {
      if (changeInfo.url) extractPageInfo();
    };

    chrome.tabs.onUpdated.addListener(listener);
    return () => chrome.tabs.onUpdated.removeListener(listener);
  }, []);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 animate-pulse">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-blue-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-blue-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-blue-200 rounded w-1/4"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-3 bg-blue-200 rounded"></div>
          <div className="h-3 bg-blue-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!snapshot) return null;

  if (snapshot.type === "post") {
    return (
      <div className=" p-4 mb-6 card-gradient-report">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <img src={snapshot.profileImageUrl} className="w-12 h-12 rounded-full" />
            <div>
              <div className="font-semibold text-white">@{snapshot.username}</div>
              <div className="text-xs text-gray-600">Post ID: {snapshot.postId}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          {[
            ["Likes", snapshot.likes],
            ["Reposts", snapshot.reposts],
            ["Quotes", snapshot.quotes],
            ["Bookmarks", snapshot.bookmarks],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-lg font-semibold text-primary">{snapFormatCount(value as number)}</div>
              <div className="text-xs text-white">{label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 mb-6 card-gradient-report">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <img src={snapshot.profileImageUrl} className="w-12 h-12 rounded-full" />
          <div>
            <div className="font-semibold text-white">@{snapshot.username}</div>

            <div className="flex gap-4 mt-1 text-xs">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-primary">{snapFormatCount(snapshot.followers)}</span>
                <span className="text-white">Followers</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="font-semibold text-primary">{snapFormatCount(snapshot.following)}</span>
                <span className="text-white">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageSnapshot;
