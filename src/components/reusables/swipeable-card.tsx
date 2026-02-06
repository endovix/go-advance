import { useState, useRef, useEffect } from "react";

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  disabled?: boolean;
}

const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  disabled = false,
}: SwipeableCardProps) => {
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | "up" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100; // Minimum distance for a valid swipe
  const VERTICAL_THRESHOLD = 80; // Minimum vertical distance for up swipe

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging && !disabled) {
        handleDragEnd();
      }
    };

    const handleTouchEnd = () => {
      if (isDragging && !disabled) {
        handleDragEnd();
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, currentX, currentY, startX, startY, disabled]);

  const handleDragStart = (clientX: number, clientY: number) => {
    if (disabled) return;
    setStartX(clientX);
    setStartY(clientY);
    setCurrentX(0);
    setCurrentY(0);
    setIsDragging(true);
    setSwipeDirection(null);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || disabled) return;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    setCurrentX(deltaX);
    setCurrentY(deltaY);

    // Determine swipe direction preview
    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -VERTICAL_THRESHOLD) {
      setSwipeDirection("up");
    } else if (deltaX < -SWIPE_THRESHOLD) {
      setSwipeDirection("left");
    } else if (deltaX > SWIPE_THRESHOLD) {
      setSwipeDirection("right");
    } else {
      setSwipeDirection(null);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || disabled) return;

    const deltaX = currentX;
    const deltaY = currentY;

    // Check if swipe is strong enough
    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -VERTICAL_THRESHOLD) {
      // Swipe up
      animateSwipeOut("up");
      setTimeout(() => onSwipeUp(), 300);
    } else if (deltaX < -SWIPE_THRESHOLD) {
      // Swipe left
      animateSwipeOut("left");
      setTimeout(() => onSwipeLeft(), 300);
    } else if (deltaX > SWIPE_THRESHOLD) {
      // Swipe right
      animateSwipeOut("right");
      setTimeout(() => onSwipeRight(), 300);
    } else {
      // Return to center
      setCurrentX(0);
      setCurrentY(0);
      setSwipeDirection(null);
    }

    setIsDragging(false);
  };

  const animateSwipeOut = (direction: "left" | "right" | "up") => {
    if (direction === "left") {
      setCurrentX(-500);
    } else if (direction === "right") {
      setCurrentX(500);
    } else if (direction === "up") {
      setCurrentY(-500);
    }
  };

  const getRotation = () => {
    if (swipeDirection === "up") return 0;
    return currentX / 20; // Rotation proportional to horizontal movement
  };

  const getOpacity = () => {
    const distance = Math.sqrt(currentX * currentX + currentY * currentY);
    return Math.max(0.5, 1 - distance / 300);
  };

  return (
    <div className="relative touch-none select-none">
      <div
        ref={cardRef}
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
        onMouseMove={(e) => isDragging && handleDragMove(e.clientX, e.clientY)}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => isDragging && handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
        style={{
          transform: `translate(${currentX}px, ${currentY}px) rotate(${getRotation()}deg)`,
          opacity: getOpacity(),
          transition: isDragging ? "none" : "transform 0.3s ease-out, opacity 0.3s ease-out",
          cursor: disabled ? "default" : "grab",
        }}
        className={`${disabled ? "pointer-events-none" : ""}`}
      >
        {children}

        {/* Swipe Indicators */}
        {isDragging && swipeDirection === "left" && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/30 rounded-xl border-4 border-red-500 pointer-events-none">
            <div className="bg-red-500 text-white px-6 py-3 rounded-lg text-2xl font-bold rotate-[-20deg]">
              FAKE
            </div>
          </div>
        )}

        {isDragging && swipeDirection === "right" && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/30 rounded-xl border-4 border-green-500 pointer-events-none">
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg text-2xl font-bold rotate-[20deg]">
              REAL
            </div>
          </div>
        )}

        {isDragging && swipeDirection === "up" && (
          <div className="absolute inset-0 flex items-center justify-center bg-yellow-500/30 rounded-xl border-4 border-yellow-500 pointer-events-none">
            <div className="bg-yellow-500 text-white px-6 py-3 rounded-lg text-2xl font-bold">
              DON'T KNOW
            </div>
          </div>
        )}
      </div>

      {/* Swipe Instructions */}
      {/* {!disabled && !isDragging && (
        <div className="absolute -bottom-16 left-0 right-0 flex justify-between items-center px-4 text-xs text-gray-500">
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
      )} */}
    </div>
  );
};

export default SwipeableCard;