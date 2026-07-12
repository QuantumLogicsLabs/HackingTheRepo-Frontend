import { useState, useEffect, useRef, type ReactElement } from "react";

export interface TypingTextProps {
  text: string;
  delay?: number;
  started?: boolean;
  onComplete?: () => void;
  className?: string;
  showCursor?: boolean;
}

/**
 * Typewriter effect — keeps parent `onComplete` stable via ref so inline callbacks
 * do not restart the interval on every parent re-render (React StrictMode safe).
 */
export default function TypingText({
  text,
  delay = 25,
  started = true,
  onComplete,
  className = "",
  showCursor = true,
}: TypingTextProps): ReactElement | null {
  const [displayedText, setDisplayedText] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!started) return;

    let index = 0;
    setDisplayedText("");
    setIsFinished(false);

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsFinished(true);
        onCompleteRef.current?.();
      }
    }, delay);

    return () => clearInterval(timer);
  }, [text, delay, started]);

  if (!started && displayedText === "") return null;

  return (
    <span className={className}>
      {displayedText}
      {started && !isFinished && showCursor && (
        <span className="typing-cursor">|</span>
      )}
    </span>
  );
}
