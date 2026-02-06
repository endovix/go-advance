import { CheckBadgeIcon, ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { toast } from "react-toastify";

type ToastVariant = "success" | "error";

interface CustomToastProps {
  message: string;
  variant?: ToastVariant;
  reward?: string;
}

export const CustomToast: React.FC<CustomToastProps> = ({
  message,
  variant = "success",
  reward,
}) => {
  const isError = variant === "error";

  const containerClasses = [
    "flex",
    "items-center",
    "gap-2",
    "p-2",
    "rounded-lg-24",
    "border",
    "border-mint",
    "bg-mint-10",
    "backdrop-blur-14",
    isError
      ? "bg-[rgba(254,226,226,0.8)] border-[#F69393]"
      : "bg-[rgba(11,235,153,0.1)] border-[rgba(11,235,153,0.4)]",
  ].join(" ");

  const textClasses = [
    "text-sm",
    "font-medium",
    "leading-none",
    isError ? "text-[#DC2626]" : "text-green-500",
    "flex-1",
    "break-words",
  ].join(" ");

  const rewardClasses = [
    "text-sm",
    "font-medium",
    "leading-none",
    "text-[#EB0B5C]",
  ].join(" ");

  const renderMessage = () => {
    if (!reward) return message;

    const parts = message.split(reward);
    return (
      <>
        {parts[0]}
        <span className={rewardClasses}>{reward}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <div
      className={containerClasses}
      style={{
        boxShadow:
          "0px 4px 10px -2px rgba(16, 24, 40, 0.08), 0px 10px 20px -3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="shrink-0" aria-hidden>
        {isError ? (
          // <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          //   <path
          //     d="M12 9v4"
          //     stroke="#DC2626"
          //     strokeWidth="1.5"
          //     strokeLinecap="round"
          //   />
          //   <path
          //     d="M12 16.5h.01"
          //     stroke="#DC2626"
          //     strokeWidth="1.5"
          //     strokeLinecap="round"
          //   />
          //   <path
          //     d="M12 3.5l9 16H3l9-16Z"
          //     stroke="#DC2626"
          //     strokeWidth="1.5"
          //     strokeLinejoin="round"
          //   />
          // </svg>
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
        ) : (
          // <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          //   <path
          //     d="M16.6666 5L7.49996 14.1667L3.33329 10"
          //     stroke="#0BEB99"
          //     strokeWidth="1.5"
          //     strokeLinecap="round"
          //     strokeLinejoin="round"
          //   />
          // </svg>
          <CheckBadgeIcon className="h-5 w-5 text-green-500" />
        )}
      </div>
      <div className={textClasses}>{renderMessage()}</div>
      <button
        aria-label="Close"
        className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 hover:bg-white/10 transition-colors cursor"
        onClick={() => toast.dismiss()}
      >
        {/* <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="#0BEB99"
            strokeWidth="1.33"
            strokeLinecap="round"
            strokeLinejoin="round"
          />                                   
        </svg> */}
        <XMarkIcon className="h-5 w-5 text-white" />
      </button>
    </div>
  );
};

export const showSuccessToast = (message: string, reward?: string) => {
  toast(<CustomToast message={message} variant="success" reward={reward} />, {
    position: "top-center",
    autoClose: 1000,
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: false,
    closeButton: false,
    icon: false,
    className: "bg-transparent shadow-none p-0 m-0",
    style: {
      background: "transparent",
      boxShadow: "none",
      width: "auto",
      maxWidth: "none",
    },
  });
};

export const showErrorToast = (message: string) => {
  toast(<CustomToast message={message} variant="error" />, {
    position: "top-center",
    autoClose: 1000,
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: false,
    closeButton: false,
    icon: false,
    className: "bg-transparent shadow-none p-0 m-0 mt-4",
    style: {
      background: "transparent",
      boxShadow: "none",
      width: "auto",
      maxWidth: "none",
    },
  });
};

export const showCustomToast = (message: string, reward?: string) => showSuccessToast(message, reward);