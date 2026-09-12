/** DI-023 — help: sealed review record (package) vs decision register (ledger). */
export const DESK_IA_HELP_SEALED_VS_REGISTER_SLUG = "sealed-record-vs-decision-register" as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_TITLE =
  "Sealed review record vs decision register" as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_OVERVIEW =
  "A sealed review record is the finalized package for one review — findings, exports, and manifest detail. The decision register is the ledger of recorded dispositions and approvals across reviews. Open the package when you need artifacts; open the register when you need who decided what." as const;

export const DESK_IA_HELP_SEALED_VS_REGISTER_ALIASES = [
  "sealed record",
  "signed record",
  "finalized review record",
  "decision register",
  "signed decision record",
  "package vs ledger",
] as const;
