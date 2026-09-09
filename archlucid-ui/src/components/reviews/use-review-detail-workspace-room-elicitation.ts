"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { readRoomElicitationFromSearchParams, reviewRoomElicitationHrefFromSearch } from "@/lib/reviews/review-room-elicitation-url";

export type UseReviewDetailWorkspaceRoomElicitationResult = {
  readonly roomElicitationActive: boolean;
  readonly enterRoomElicitation: () => void;
  readonly exitRoomElicitation: () => void;
  readonly toggleRoomElicitation: () => void;
};

export function useReviewDetailWorkspaceRoomElicitation(): UseReviewDetailWorkspaceRoomElicitationResult {
  const router = useRouter();
  const pathname = usePathname() ?? "/architecture/reviews";
  const searchParams = useSearchParams();
  const roomElicitationActive = readRoomElicitationFromSearchParams(searchParams);

  const setRoomElicitation = useCallback(
    (active: boolean) => {
      router.replace(
        reviewRoomElicitationHrefFromSearch(searchParams.toString(), active, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const enterRoomElicitation = useCallback(() => {
    setRoomElicitation(true);
  }, [setRoomElicitation]);

  const exitRoomElicitation = useCallback(() => {
    setRoomElicitation(false);
  }, [setRoomElicitation]);

  const toggleRoomElicitation = useCallback(() => {
    setRoomElicitation(!roomElicitationActive);
  }, [roomElicitationActive, setRoomElicitation]);

  return {
    roomElicitationActive,
    enterRoomElicitation,
    exitRoomElicitation,
    toggleRoomElicitation,
  };
}
