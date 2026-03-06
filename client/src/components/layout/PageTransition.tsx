import { useRef, useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionState, setTransitionState] = useState<"enter" | "exit" | "idle">("idle");
  const prevLocation = useRef(location);

  useEffect(() => {
    if (location !== prevLocation.current) {
      setTransitionState("exit");

      const exitTimer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionState("enter");
        prevLocation.current = location;

        const enterTimer = setTimeout(() => {
          setTransitionState("idle");
        }, 350);

        return () => clearTimeout(enterTimer);
      }, 200);

      return () => clearTimeout(exitTimer);
    } else {
      setDisplayChildren(children);
    }
  }, [location, children]);

  const transitionClass =
    transitionState === "exit"
      ? "page-exit"
      : transitionState === "enter"
      ? "page-enter"
      : "";

  return (
    <div className={`page-transition-wrapper ${transitionClass}`}>
      {displayChildren}
    </div>
  );
}
