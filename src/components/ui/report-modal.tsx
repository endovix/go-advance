import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from 'react-select';
import { showErrorToast } from "./custom-toast";
import { FlagIcon } from "@heroicons/react/16/solid";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        reason: string;
        description: string;
        originalPostLink?: string;
        includeScreenshot: boolean;
    }) => Promise<void>;
    isSubmitting: boolean;
    hasValidContext: boolean;
}

const options = [
    { value: 'copypasta', label: 'Copypasta' },
    { value: 'ai-generated', label: 'AI-generated content' },
    { value: 'automated', label: 'Automated or coordinated behavior' },
    { value: 'fake-engagement', label: 'Fake or boosted engagement' },
    { value: 'other', label: 'Other' },
];

const ReportModal = ({ isOpen, onClose, onSubmit, isSubmitting, hasValidContext }: ReportModalProps) => {
    const [reason, setReason] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [originalPostLink, setOriginalPostLink] = useState<string>("");
    const [includeScreenshot, setIncludeScreenshot] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (!hasValidContext) {
            showErrorToast("No user account or post detected on current page");
            return;
        }

        if (!reason) {
            showErrorToast("Please select a report reason");
            return;
        }

        if (description.length < 10) {
            showErrorToast("Description must be at least 10 characters");
            return;
        }

        if (description.length > 1000) {
            showErrorToast("Description must be 1000 characters or less");
            return;
        }

        if (reason === 'copypasta' && !originalPostLink.trim()) {
            showErrorToast("Please provide the original post link");
            return;
        }

        try {
            await onSubmit({
                reason,
                description,
                originalPostLink: reason === 'copypasta' ? originalPostLink : undefined,
                includeScreenshot
            });
            // Reset form
            setReason("");
            setDescription("");
            setOriginalPostLink("");
            setIncludeScreenshot(false);
            onClose();
        } catch (error) {
            // Error is handled in parent component
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setReason("");
            setDescription("");
            setOriginalPostLink("");
            setIncludeScreenshot(false);
            onClose();
        }
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSubmitting) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, isSubmitting]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-end justify-center backdrop-blur-md"
                >
                    <motion.div
                        className="report-modal rounded-t-2xl w-full max-w-md"
                        style={{ maxHeight: '90vh', overflowY: 'auto' }}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="w-6" /> {/* empty spacer same width as button */}

                            <h2 className="text-lg font-semibold text-gray-100 text-center flex-1">
                                Report Content
                            </h2>

                            <button
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="flex items-center justify-center w-8 h-8 border border-secondary bg-transparent hover:bg-gray-800 rounded-full cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3.31592 3.31589L12.6004 12.6003M12.6004 3.31589L3.31592 12.6003" stroke="white" stroke-width="1.32635" stroke-linecap="round" />
                                </svg>
                            </button>
                        </div>


                        {/* Content */}
                        <div className="px-6 py-3 space-y-4">
                            {/* Warning if no valid context */}
                            {!hasValidContext && (
                                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-md p-3">
                                    <p className="text-yellow-500 text-sm">
                                        ⚠️ No Twitter/X user account or post detected on this page. Please navigate to a valid Twitter/X profile or post to submit a report.
                                    </p>
                                </div>
                            )}
                            {/* Report Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-100 mb-2">
                                    Report Reason *
                                </label>
                                <Select
                                    defaultValue={null}
                                    onChange={(selectedOption: any) => setReason(selectedOption.value)}
                                    options={options}
                                    classNamePrefix="sentiment-option"
                                />
                                {/* <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full px-3 py-2 border text-gray-500 border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-gray-100 focus:border-gray-100"
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Select a reason...</option>
                                        {reportReasons.map(reasonOption => (
                                            <option key={reasonOption} value={reasonOption}>
                                                {reasonOption}
                                            </option>
                                        ))}
                                    </select> */}
                            </div>

                            {/* Original Post Link - Only for Copypasta */}
                            {reason === 'copypasta' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-100 mb-2">
                                        Original Post Link *
                                    </label>
                                    <input
                                        type="text"
                                        value={originalPostLink}
                                        onChange={(e) => setOriginalPostLink(e.target.value)}
                                        className="w-full text-gray-100 placeholder:text-gray-500 px-3 py-2 border border-[#FFFFFF66] rounded-md shadow-sm focus:outline-none focus:ring-gray-100"
                                        placeholder="Post ID or link"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <div className=" flex flex-row w-full items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-100 mb-2">
                                        Description *
                                    </label>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={description}
                                        onChange={(e) => {
                                            if (e.target.value.length <= 1000) {
                                                setDescription(e.target.value);
                                            }
                                        }}
                                        className="w-full text-gray-100 placeholder:text-gray-500 px-3 py-2 border border-[#FFFFFF66] rounded-md shadow-sm focus:outline-none focus:ring-gray-100 resize-none"
                                        rows={4}
                                        placeholder="Please provide details about why you're reporting this (minimum 10 characters)"
                                        disabled={isSubmitting}
                                    />
                                    <div className="absolute bottom-2 right-2 text-xs text-[#FFFFFF66]">
                                        {description.length}/1000
                                    </div>
                                </div>
                            </div>
                
                            {/* Screenshot Toggle */}
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="screenshot"
                                    checked={includeScreenshot}
                                    onChange={(e) => setIncludeScreenshot(e.target.checked)}
                                    className="w-4 h-4 text-primary bg-transparent border-gray-100 rounded focus:ring-gray-100 cursor-pointer"
                                    disabled={isSubmitting}
                                />
                                <label htmlFor="screenshot" className="text-sm text-[#FFFFFF66] cursor-pointer">
                                    Include screenshot of current page
                                </label>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex space-x-3 justify-between p-6">
                            <button
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 text-sm font-medium rounded-full text-white bg-[#FFFFFF1F] border border-gray-500 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!hasValidContext || isSubmitting || !reason || description.length < 10 || (reason === 'copypasta' && !originalPostLink.trim())}
                                className="flex-1 items-center justify-center px-4 py-2 button-secondary text-sm shadow-red-500 border border-red-500  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Submitting...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <FlagIcon className="h-4 w-4 mr-2" />
                                        Submit Report
                                    </div>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReportModal;