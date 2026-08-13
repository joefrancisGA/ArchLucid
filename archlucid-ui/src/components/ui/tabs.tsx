"use client";

import { cn } from "@/lib/utils";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { isTabsKeyboardMove, resolveNextTabIndex, type TabsOrientation } from "@/components/ui/tabs-keyboard";
import { TABS_PILL_LIST_CLASS, tabsPillTriggerClass } from "@/components/ui/tabs-pill-styles";

export type TabsVariant = "line" | "pill";

type TabsContextValue = {
  baseId: string;
  value: string;
  setValue: (next: string) => void;
  orientation: TabsOrientation;
  variant: TabsVariant;
  registerTrigger: (tabValue: string, element: HTMLButtonElement) => void;
  unregisterTrigger: (tabValue: string) => void;
  focusTrigger: (tabValue: string) => void;
  triggerOrder: readonly string[];
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(componentName: string): TabsContextValue {
  const context = useContext(TabsContext);

  if (context === null) {
    throw new Error(`${componentName} must be used within <Tabs>.`);
  }

  return context;
}

function readUrlTabValue(paramName: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get(paramName);
}

function writeUrlTabValue(paramName: string, tabValue: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set(paramName, tabValue);
  window.history.replaceState(null, "", url.toString());
}

export type TabsProps = {
  readonly children: ReactNode;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly syncUrlParam?: string;
  readonly orientation?: TabsOrientation;
  /**
   * Default `line` — Carbon line tabs are the only sanctioned visual per **TB-1661**.
   * `pill` is legacy and retained only as an explicit opt-out; new call sites must not use it.
   */
  readonly variant?: TabsVariant;
  readonly className?: string;
  readonly "data-testid"?: string;
};

export function Tabs(props: TabsProps): ReactElement {
  const baseId = useId().replace(/:/g, "");
  const orientation = props.orientation ?? "horizontal";
  const variant = props.variant ?? "line";
  const onValueChange = props.onValueChange;
  const syncUrlParam = props.syncUrlParam;
  const isControlled = props.value !== undefined;
  const urlDefault = props.syncUrlParam ? readUrlTabValue(props.syncUrlParam) : null;
  const initialValue = props.defaultValue ?? urlDefault ?? "";

  const [uncontrolledValue, setUncontrolledValue] = useState(initialValue);
  const activeValue = isControlled ? (props.value ?? "") : uncontrolledValue;

  const triggerElementsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const triggerOrderRef = useRef<string[]>([]);
  const [triggerOrder, setTriggerOrder] = useState<readonly string[]>([]);

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolledValue(next);
      }

      onValueChange?.(next);

      if (syncUrlParam) {
        writeUrlTabValue(syncUrlParam, next);
      }
    },
    [isControlled, onValueChange, syncUrlParam],
  );

  const registerTrigger = useCallback((tabValue: string, element: HTMLButtonElement) => {
    triggerElementsRef.current.set(tabValue, element);

    if (!triggerOrderRef.current.includes(tabValue)) {
      triggerOrderRef.current = [...triggerOrderRef.current, tabValue];
      setTriggerOrder([...triggerOrderRef.current]);
    }
  }, []);

  const unregisterTrigger = useCallback((tabValue: string) => {
    if (!triggerElementsRef.current.has(tabValue)) {
      return;
    }

    triggerElementsRef.current.delete(tabValue);
    const nextOrder = triggerOrderRef.current.filter((entry) => entry !== tabValue);

    if (nextOrder.length === triggerOrderRef.current.length) {
      return;
    }

    triggerOrderRef.current = nextOrder;
    setTriggerOrder(nextOrder);
  }, []);

  const focusTrigger = useCallback((tabValue: string) => {
    triggerElementsRef.current.get(tabValue)?.focus();
  }, []);

  useEffect(() => {
    if (!props.syncUrlParam) {
      return;
    }

    const fromUrl = readUrlTabValue(props.syncUrlParam);

    if (fromUrl && fromUrl !== activeValue) {
      setValue(fromUrl);
    }
  }, [activeValue, props.syncUrlParam, setValue]);

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      baseId,
      value: activeValue,
      setValue,
      orientation,
      variant,
      registerTrigger,
      unregisterTrigger,
      focusTrigger,
      triggerOrder,
    }),
    [
      activeValue,
      baseId,
      focusTrigger,
      orientation,
      registerTrigger,
      setValue,
      triggerOrder,
      unregisterTrigger,
      variant,
    ],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        className={cn("flex flex-col", props.className)}
        data-tabs-root
        data-testid={props["data-testid"]}
      >
        {props.children}
      </div>
    </TabsContext.Provider>
  );
}

export type TabsListProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly "aria-label": string;
  readonly "data-testid"?: string;
};

export function TabsList(props: TabsListProps): ReactElement {
  const { orientation, value, setValue, focusTrigger, triggerOrder, variant } = useTabsContext("TabsList");

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!isTabsKeyboardMove(event.key)) {
      return;
    }

    const currentIndex = triggerOrder.indexOf(value);
    const nextIndex = resolveNextTabIndex(
      currentIndex < 0 ? 0 : currentIndex,
      triggerOrder.length,
      event.key,
      orientation,
    );

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();

    const nextValue = triggerOrder[nextIndex];

    if (nextValue === undefined) {
      return;
    }

    setValue(nextValue);
    focusTrigger(nextValue);
  };

  return (
    <div
      role="tablist"
      aria-label={props["aria-label"]}
      aria-orientation={orientation}
      className={cn(
        "flex",
        variant === "pill"
          ? TABS_PILL_LIST_CLASS
          : "gap-1 border-b border-neutral-200 pb-0 dark:border-neutral-800",
        orientation === "vertical"
          ? variant === "pill"
            ? "flex-col"
            : "flex-col border-b-0 border-r pr-2"
          : "flex-row",
        props.className,
      )}
      onKeyDown={handleKeyDown}
      data-tabs-list
      data-testid={props["data-testid"]}
    >
      {props.children}
    </div>
  );
}

export type TabsTriggerProps = {
  readonly children: ReactNode;
  readonly value: string;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly title?: string;
  readonly "data-testid"?: string;
};

export function TabsTrigger(props: TabsTriggerProps): ReactElement {
  const { registerTrigger, unregisterTrigger, value: activeValue, setValue, baseId, variant } =
    useTabsContext("TabsTrigger");
  const selected = activeValue === props.value;
  const triggerId = `${baseId}-tab-${props.value}`;
  const panelId = `${baseId}-panel-${props.value}`;
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const node = buttonRef.current;

    if (!node) {
      return;
    }

    registerTrigger(props.value, node);

    return () => {
      unregisterTrigger(props.value);
    };
  }, [props.value, registerTrigger, unregisterTrigger]);

  return (
    <button
      ref={buttonRef}
      id={triggerId}
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      disabled={props.disabled}
      title={props.title}
      data-tabs-value={props.value}
      data-tabs-trigger
      data-state={selected ? "active" : "inactive"}
      data-testid={props["data-testid"]}
      className={cn(
        "outline-none transition-colors",
        variant === "pill"
          ? tabsPillTriggerClass(selected, props.disabled ?? false)
          : [
              "px-4 py-2 text-[13px] font-normal leading-5",
              "font-medium leading-none",
              "-mb-px border-b-2",
              selected
                ? "border-teal-600 font-semibold text-al-text-primary dark:border-teal-400 dark:text-teal-300"
                : "border-transparent font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100",
              "focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
            ],
        props.disabled && "cursor-not-allowed opacity-50",
        props.className,
      )}
      onClick={() => {
        if (!props.disabled) {
          setValue(props.value);
        }
      }}
    >
      {props.children}
    </button>
  );
}

export type TabsContentProps = {
  readonly children: ReactNode;
  readonly value: string;
  readonly className?: string;
  readonly forceMount?: boolean;
  readonly "data-testid"?: string;
};

export function TabsContent(props: TabsContentProps): ReactElement | null {
  const context = useTabsContext("TabsContent");
  const selected = context.value === props.value;
  const triggerId = `${context.baseId}-tab-${props.value}`;
  const panelId = `${context.baseId}-panel-${props.value}`;

  if (!selected && !props.forceMount) {
    return null;
  }

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={triggerId}
      hidden={!selected}
      data-tabs-panel
      data-tabs-value={props.value}
      data-testid={props["data-testid"]}
      className={cn("pt-4 focus:outline-none", !selected && "hidden", props.className)}
    >
      {props.children}
    </div>
  );
}
