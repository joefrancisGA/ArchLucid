/**
 * Shared buyer-polished copy — import here instead of scattering literals across pages.
 *
 * Copy lives in one module per product surface. Guards that scan copy by path read the surface
 * modules listed in `BUYER_COPY_MODULE_PATHS` (`./module-paths.ts`), not this barrel.
 */

export * from "./ask";
export * from "./audit";
export * from "./cto-demo";
export * from "./evidence-graph";
export * from "./sponsor";
export * from "./glossary";
export * from "./governance";
export * from "./module-paths";
export * from "./onboarding";
export * from "./operator-home";
export * from "./pricing";
export * from "./review-record";
export * from "./reviews-compare";
export * from "./reviews-list";
export * from "./reviews-new";
export * from "./showcase";
export * from "./workspace-scope";
