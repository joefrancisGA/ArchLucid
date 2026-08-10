"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AlertsHubHeaderConfigureLinkContextValue = {
  readonly showHeaderConfigureLink: boolean;
  readonly setShowHeaderConfigureLink: (show: boolean) => void;
};

const AlertsHubHeaderConfigureLinkContext =
  createContext<AlertsHubHeaderConfigureLinkContextValue | null>(null);

/**
 * Owns header “Configure alert rules” visibility so the streaming inbox can
 * suppress the link in `no_rules` without duplicating variant logic in chrome (TB-2103).
 */
export function AlertsHubHeaderConfigureLinkProvider({
  children,
  initialShow = true,
}: {
  readonly children: ReactNode;
  readonly initialShow?: boolean;
}): React.JSX.Element {
  const [showHeaderConfigureLink, setShowHeaderConfigureLinkState] = useState(initialShow);

  const setShowHeaderConfigureLink = useCallback((show: boolean): void => {
    setShowHeaderConfigureLinkState((previous) => (previous === show ? previous : show));
  }, []);

  const value = useMemo(
    (): AlertsHubHeaderConfigureLinkContextValue => ({
      showHeaderConfigureLink,
      setShowHeaderConfigureLink,
    }),
    [setShowHeaderConfigureLink, showHeaderConfigureLink],
  );

  return (
    <AlertsHubHeaderConfigureLinkContext.Provider value={value}>
      {children}
    </AlertsHubHeaderConfigureLinkContext.Provider>
  );
}

export function useAlertsHubHeaderConfigureLinkVisibility(): boolean {
  const ctx = useContext(AlertsHubHeaderConfigureLinkContext);

  return ctx?.showHeaderConfigureLink ?? true;
}

/** Keeps chrome header configure-link visibility aligned with the resolved inbox empty variant. */
export function useSyncAlertsHubHeaderConfigureLink(show: boolean): void {
  const ctx = useContext(AlertsHubHeaderConfigureLinkContext);
  const setShowHeaderConfigureLink = ctx?.setShowHeaderConfigureLink;
  const currentShow = ctx?.showHeaderConfigureLink;

  useEffect(() => {
    if (setShowHeaderConfigureLink === undefined) {
      return;
    }

    if (currentShow === show) {
      return;
    }

    setShowHeaderConfigureLink(show);
  }, [currentShow, setShowHeaderConfigureLink, show]);

  useEffect(() => {
    return () => {
      setShowHeaderConfigureLink?.(true);
    };
  }, [setShowHeaderConfigureLink]);
}
