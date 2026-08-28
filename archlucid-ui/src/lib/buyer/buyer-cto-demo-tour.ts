export {
  ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT,
  ARCHLUCID_CTO_DEMO_SPOTLIGHT_CHANGED_EVENT,
  ARCHLUCID_CTO_DEMO_STORY_CHANGED_EVENT,
  appendBuyerCtoDemoTourStartQuery,
  BUYER_CTO_DEMO_EXPLORE_MODE_STORAGE_KEY,
  BUYER_CTO_DEMO_PRESENTER_LAYER_STORAGE_KEY,
  BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY,
  BUYER_CTO_DEMO_SPOTLIGHT_STORAGE_KEY,
  BUYER_CTO_DEMO_STEP_BUDGET_MINUTES,
  BUYER_CTO_DEMO_STORY_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_AUTOPLAY_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_NOTES_FULL_SCRIPT_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_NOTES_VISIBLE_STORAGE_KEY,
  BUYER_CTO_DEMO_TOUR_QUERY_PARAM,
  BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY,
  clearBuyerCtoDemoState,
  clearBuyerCtoDemoVisitedSteps,
  readBuyerCtoDemoAutoplay,
  readBuyerCtoDemoExploreMode,
  readBuyerCtoDemoPreflightAcknowledged,
  readBuyerCtoDemoPresenterNotesFullScript,
  readBuyerCtoDemoPresenterNotesVisible,
  readBuyerCtoDemoSpotlight,
  readBuyerCtoDemoStoryId,
  readBuyerCtoDemoTourActive,
  readBuyerCtoDemoTourCollapsed,
  readBuyerCtoDemoVisitedSteps,
  readCtoDemoPresenterLayerVisible,
  writeBuyerCtoDemoAutoplay,
  writeBuyerCtoDemoExploreMode,
  writeBuyerCtoDemoPreflightAcknowledged,
  writeBuyerCtoDemoPresenterNotesFullScript,
  writeBuyerCtoDemoPresenterNotesVisible,
  writeBuyerCtoDemoSpotlight,
  writeBuyerCtoDemoStoryId,
  writeBuyerCtoDemoTourActive,
  writeBuyerCtoDemoTourCollapsed,
  writeBuyerCtoDemoVisitedStep,
  writeCtoDemoPresenterLayerVisible,
} from "@/lib/buyer/buyer-cto-demo-tour-storage";

export type { BuyerCtoDemoTourNavigation } from "@/lib/buyer/buyer-cto-demo-tour-presenter";

export {
  buildCtoDemoRunOfShowMarkdown,
  buyerCtoDemoTourPresenterLine,
  buyerCtoDemoTourPresenterScript,
  getStartCtoDemoTourHref,
  resolveBuyerCtoDemoTourNavigation,
} from "@/lib/buyer/buyer-cto-demo-tour-presenter";

export type { CtoDemoStepTimerState } from "@/lib/buyer/buyer-cto-demo-tour-timer";

export {
  buyerCtoDemoRemainingBudgetMinutes,
  buyerCtoDemoStepBudgetSeconds,
  formatCtoDemoStepBudgetLabel,
  formatCtoDemoStepTimer,
} from "@/lib/buyer/buyer-cto-demo-tour-timer";
