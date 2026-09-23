"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  readRoomElicitationFromSearchParams,
  reviewRoomElicitationHrefFromSearch,
} from "@/lib/reviews/review-room-elicitation-url";

export type UseReviewDetailWorkspaceRoomElicitationResult = {
  readonly roomElicitationActive: boolean;
  readonly enterRoomElicitation: () => void;
  readonly exitRoomElicitation: () => void;
  readonly toggleRoomElicitation: () => void;
};

function readRoomElicitationFromWindowLocation(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return readRoomElicitationFromSearchParams(new URLSearchParams(window.location.search));
}

export function useReviewDetailWorkspaceRoomElicitation(): UseReviewDetailWorkspaceRoomElicitationResult {
  const pathname = usePathname() ?? "/architecture/reviews";
  const [roomElicitationActive, setRoomElicitationActiveState] = useState(() =>
    readRoomElicitationFromWindowLocation(),
  );
  const roomElicitationActiveRef = useRef(roomElicitationActive);
  roomElicitationActiveRef.current = roomElicitationActive;

  const syncRoomElicitationToUrl = useCallback(
    (active: boolean) => {
      commitHrefIfChanged(reviewRoomElicitationHrefFromSearch(readWindowLocationSearch(), active, pathname), {
        notify: false,
      });
    },
    [pathname],
  );

  const setRoomElicitation = useCallback(
    (active: boolean) => {
      if (roomElicitationActiveRef.current === active) {
        return;
      }

      roomElicitationActiveRef.current = active;
      setRoomElicitationActiveState(active);
      syncRoomElicitationToUrl(active);
    },
    [syncRoomElicitationToUrl],
  );

  useEffect(() => {
    const syncRoomElicitationFromUrl = (): void => {
      const nextActive = readRoomElicitationFromWindowLocation();

      if (roomElicitationActiveRef.current === nextActive) {
        return;
      }

      roomElicitationActiveRef.current = nextActive;
      setRoomElicitationActiveState(nextActive);
    };

    syncRoomElicitationFromUrl();
    window.addEventListener("popstate", syncRoomElicitationFromUrl);

    return () => {
      window.removeEventListener("popstate", syncRoomElicitationFromUrl);
    };
  }, []);

  const enterRoomElicitation = useCallback(() => {
    setRoomElicitation(true);
  }, [setRoomElicitation]);

  const exitRoomElicitation = useCallback(() => {
    setRoomElicitation(false);
  }, [setRoomElicitation]);

  const toggleRoomElicitation = useCallback(() => {
    setRoomElicitation(!roomElicitationActiveRef.current);
  }, [setRoomElicitation]);

  return {
    roomElicitationActive,
    enterRoomElicitation,
    exitRoomElicitation,
    toggleRoomElicitation,
  };
}
