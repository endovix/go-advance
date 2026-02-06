import { useState, useEffect } from "react";
import MiniCard from "../reusables/mini-card";
import { fetchNextTask } from "../../services/api";
import { getUserProfile, transformTaskToContentItem } from "../../services/lib";

type ContentItem = Post | Account;

interface Post {
    id: string;
    type: 'post';
    name: string;
    username: string;
    profilePictureUrl: string;
    content: string;
    tweetlink: string;
    timestamp: string;
    replies: number;
    reposts: number;
    likes: number;
    views: number;
}

interface Account {
    id: string;
    type: 'account';
    name: string;
    username: string;
    profilePictureUrl: string;
    bio: string;
    accountlink: string;
    joinedDate: string;
    followers: number;
    following: number;
    tweets: number;
}

const CardList = () => {
    const [contentItems, setContentItems] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Track feedback submissions to prevent repeats within 24 hours
    const [feedbackHistory, setFeedbackHistory] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        const init = async () => {
            await loadFeedbackHistory();
            await fetchContent();
        };
        init();
    }, []);

    const fetchContent = async () => {
        try {
            setLoading(true);

            const userData = await getUserProfile();

            if (!userData?.id) {
                setError('Failed to load user profile');
                setLoading(false);
                return;
            }

            // Fetch all tasks from backend using API service
            const tasksData = await fetchNextTask(userData.id);
            const feedbackHistory = JSON.parse(localStorage.getItem('feedbackHistory') || '{}');

            // Transform backend data to match our ContentItem interface
            let contentItems: ContentItem[] = [];

            if (tasksData) {
                // Handle both single task object and array of tasks
                const taskArray = Array.isArray(tasksData) ? tasksData : [tasksData];
                contentItems = taskArray
                    .map(task => transformTaskToContentItem(task))
                    .filter((item): item is ContentItem => item !== null);
            }

            // Filter out content that has been rated in the last 24 hours
            const now = Date.now();
            const filteredContent = contentItems.filter(item => {
                const lastRated = feedbackHistory[item.id];
                if (!lastRated) return true;
                return (now - lastRated) > 1000; // 1 second in milliseconds
                // return (now - lastRated) > (24 * 60 * 60 * 1000); // 24 hours in milliseconds
            });

            setContentItems(filteredContent);
        } catch (err) {
            setError('Failed to load content from server');
        } finally {
            setLoading(false);
        }
    };

    const loadFeedbackHistory = async () => {
        const history = localStorage.getItem('feedbackHistory');
        if (history) {
            setFeedbackHistory(JSON.parse(history));
        }
    };

    const saveFeedbackHistory = (postId: string) => {
        const updatedHistory = {
            ...feedbackHistory,
            [postId]: Date.now()
        };
        setFeedbackHistory(updatedHistory);
        localStorage.setItem('feedbackHistory', JSON.stringify(updatedHistory));
    };

    const handleFeedbackSubmit = (contentId: string) => {
        saveFeedbackHistory(contentId);
        // Remove the content from the list after feedback is submitted
        setContentItems(prevItems => prevItems?.filter(item => item.id !== contentId));
    };

    // Removed handleJoinSpace function as spaces are now handled in the dedicated Spaces Tracking tab

    if (loading) {
        return (
            <div className="w-full md:w-[400px] bg-black flex flex-col gap-2 p-4 h-[calc(100vh-60px)]">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF2574] mx-auto"></div>
                    <p className="text-primary mt-2">Loading content...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full md:w-[400px] bg-black flex flex-col gap-2 p-4 h-[calc(100vh-60px)]">
                <div className="text-center py-8 flex flex-col">
                    <p className="text-red-500 pb-4">{error}</p>
                    <button
                        onClick={fetchContent}
                        className="btn-primary mx-auto"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full md:w-[400px] ${contentItems.length ? 'bg-black' : 'card-gradient'}bg-black flex flex-col p-4 h-[calc(100vh-120px)] overflow-hidden`}>
            <h2 className="text-lg text-white font-semibold mb-4">Signals</h2>
            <p className="text-sm text-gray-600 mb-6">
                Discover trending posts, accounts, and Spaces on X. Rate content to help improve recommendations and earn rewards for quality engagement.
            </p>

            {contentItems.length ? (
                <div className="relative flex-1 mb-20">
                    {contentItems.map((item, index) => (
                        <div
                            key={item.id}
                            className="absolute top-0 left-0 right-0"
                            style={{
                                zIndex: contentItems.length - index,
                                transform: `translateY(${index * 8}px) scale(${1 - index * 0.02})`,
                                opacity: index < 3 ? 1 : 0,
                                pointerEvents: index === 0 ? 'auto' : 'none',
                            }}
                        >
                            <MiniCard
                                key={item.id}
                                {...item}
                                onFeedbackSubmit={() => handleFeedbackSubmit(item.id)}
                            />
                        </div>
                    ))}
                    <div className="absolute -bottom-10 left-0 right-0 flex justify-between items-center px-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <span className="text-red-500">←</span> Fake
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-yellow-500">↑</span> Don't Know
                        </div>
                        <div className="flex items-center gap-1">
                            Real <span className="text-green-500">→</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-primary">No new content to rate!</p>
                    <p className="text-sm text-primary mt-1 mb-2">Check back later for more posts and accounts.</p>
                </div>
            )}
        </div>
    );
};

export default CardList;
