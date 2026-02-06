import { useState, useEffect } from "react";
import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import { showSuccessToast, showErrorToast } from "../ui/custom-toast";
import { submitAdminReport } from "../../services/api";
import ReportModal from "../ui/report-modal";
import PageSnapshot from "../ui/page-snapshot";
import { CalendarDaysIcon, FlagIcon } from "@heroicons/react/16/solid";
import type { ReportData } from "../../services/types";
import { getUserProfile } from "../../services/lib";

const ReportFlag = () => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [isReporting, setIsReporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasValidContext, setHasValidContext] = useState(false);

  const extractContextFromUrl = (url: string) => {
    // Handle both twitter.com and x.com URLs
    const twitterMatch = url.match(/(?:twitter\.com|x\.com)\/([^\/]+)(?:\/status\/(\d+))?/);
    if (twitterMatch) {
      const username = twitterMatch[1];
      const tweetId = twitterMatch[2];

      return {
        reportedUserId: username,
        tweetId: tweetId || null,
        contextType: tweetId ? 'post' : 'account'
      };
    }
    return { reportedUserId: null, tweetId: null, contextType: 'unknown' };
  };

  const handleReport = async (data: { reason: string; description: string; originalPostLink?: string; includeScreenshot: boolean }) => {
    setIsReporting(true);
    try {
      // Get access token
      const accessToken = await getAuthToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Get current tab URL and extract contextual data
      let currentUrl = "";
      let contextData = { reportedUserId: null as string | null, tweetId: null as string | null, contextType: 'unknown' as string };

      if (chrome?.tabs) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        currentUrl = tabs[0]?.url || "";
        contextData = extractContextFromUrl(currentUrl);
      }

      // Build postIds array
      const postIds: string[] = [];
      if (contextData.tweetId) {
        postIds.push(contextData.tweetId);
      }

      // Add original post link to postIds if copypasta
      if (data.reason === 'copypasta' && data.originalPostLink) {
        // Extract post ID from the original link if it's a URL
        const originalMatch = data.originalPostLink.match(/\/status\/(\d+)/);
        if (originalMatch) {
          postIds.push(originalMatch[1]);
        }
      }

      // Capture screenshot if requested
      let screenshot = "";
      if (data.includeScreenshot) {
        try {
          if (chrome?.tabs?.captureVisibleTab) {
            screenshot = await chrome.tabs.captureVisibleTab();
          }
        } catch (error) {
          console.log("Screenshot capture failed:", error);
        }
      }

      // Get userId from localStorage
      const userProfile = await getUserProfile();
      const reporterId = userProfile?.id || 'anonymous';

      const reportData = {
        reporterId: reporterId,
        reportedUserId: contextData.reportedUserId || 'unknown',
        reportedTwitterId: contextData.reportedUserId || 'unknown',
        reason: data.reason,
        description: data.description,
        postIds: postIds,
        url: currentUrl,
        screenshot
      };

      // Submit to admin API
      const result = await submitAdminReport(accessToken, reportData);

      if (!result) {
        throw new Error('Failed to submit report to admin API');
      }

      // Save report locally for audit trail
      const localReport: ReportData = {
        reason: data.reason,
        description: data.description,
        reportedUserId: contextData.reportedUserId || undefined,
        postIds: postIds,
        reporterId: reporterId,
        url: currentUrl,
        reportId: result.reportId,
        timestamp: new Date().toISOString(),
        screenshot: screenshot || undefined
      };

      const existingReports = JSON.parse(localStorage.getItem('reports') || '[]');
      const updatedReports = [...existingReports, localReport];
      localStorage.setItem('reports', JSON.stringify(updatedReports));
      setReports(updatedReports);

      showSuccessToast("Report submitted successfully!");
    } catch (error) {
      showErrorToast("Failed to submit report");
    } finally {
      setIsReporting(false);
    }
  };

  const loadReports = () => {
    const savedReports = JSON.parse(localStorage.getItem('reports') || '[]');
    setReports(savedReports);
  };

  // Load reports on component mount
  useEffect(() => {
    loadReports();

    setTimeout(() => {
      setLoading(false);
    }, 1000);

  }, []);

  if (loading) {
    return (
      <div className="w-full md:w-[400px] bg-black flex flex-col gap-2 p-4 h-[calc(100vh-140px)]">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF2574] mx-auto"></div>
          <p className="text-primary mt-2">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full md:w-[400px] bg-black flex flex-col p-4 h-[calc(100vh-120px)] overflow-y-auto hide-scrollbar">
        <h2 className="text-lg text-white font-semibold mb-4">Report</h2>
        <p className="text-sm text-gray-600 mb-6">
          Help maintain a safe and positive X community. Report spam, fraud, harassment, or rule violations from profiles, posts, or Spaces. Your reports help protect users and improve platform safety.
        </p>

        {/* Page Snapshot */}
        <PageSnapshot onSnapshotChange={setHasValidContext} />

        {/* Report Button */}
        <div className="mb-6">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isReporting || !hasValidContext}
            className="submit-btn text-white w-full p-3 cursor-pointer  disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            <FlagIcon className="mr-2 h-4 w-4" />
            Report Content
          </button>
          {!hasValidContext && (
            <p className="text-yellow-500 text-xs mt-2 text-center">
              Navigate to a X profile or post to enable reporting
            </p>
          )}
        </div>

        {/* Recent Reports */}
        <div className="mb-4">
          <h3 className="text-md font-medium mb-3 flex items-center text-white">
            <FlagIcon className="mr-2 h-4 w-4 text-white" />
            Recent Reports
          </h3>
          {reports.length === 0 ? (
            <p className="text-gray-500 text-sm">No reports submitted yet</p>
          ) : (
            reports.slice(-5).reverse().map((report, index) => (
              <div key={index} className="card-gradient-report-black p-3 mb-4">
                <div className="font-medium text-primary">{report.reason}</div>
                <div className="text-sm text-gray-500 mb-1">{report.description || 'No additional details'}</div>
                {report.timestamp && (
                  <div className="inline-flex leading-none my-1 px-2 items-center gap-1 bg-white/5 text-white py-1 rounded-full">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                    {new Date(report.timestamp).toLocaleString()}
                  </div>
                )}
                <div className="text-xs text-gray-500 truncate">
                  <span className="text-white">URL:</span> {report.url}
                </div>
                {report.reportedUserId && (
                  <div className="text-xs text-gray-500">
                    <span className="text-white">Target:</span> @{report.reportedUserId}
                  </div>
                )}
                {report.screenshot && (
                  <div className="mt-2">
                    <img
                      src={report.screenshot}
                      alt="Screenshot"
                      className="w-full h-20 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleReport}
        isSubmitting={isReporting}
        hasValidContext={hasValidContext}
      />
    </>
  );
};

export default ReportFlag;