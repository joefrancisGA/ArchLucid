export type TenantBrandingDisplayContext =
  | "ApplicationHeader"
  | "Navigation"
  | "Login"
  | "Dashboard"
  | "ArchitectureDiagram"
  | "SecurityDiagram"
  | "MermaidDiagram"
  | "ReportCover"
  | "ReportHeader"
  | "ReportFooter"
  | "Export"
  | "Email"
  | "Presentation"
  | "Print"
  | "Mobile"
  | "Favicon";

export type TenantBrandingPresentationPayload = {
  readonly context: string;
  readonly mastheadDisplayName: string;
  readonly usesTenantVisualBrand: boolean;
  readonly showPoweredByArchLucid: boolean;
  readonly showArchLucidMarkInMasthead: boolean;
  readonly isProductBrand: boolean;
  readonly colors: {
    readonly primary?: string | null;
    readonly secondary?: string | null;
    readonly accent?: string | null;
    readonly background?: string | null;
    readonly foreground?: string | null;
  };
  readonly logoAssetId?: string | null;
  readonly logoHttpsUrl?: string | null;
  readonly logoContentPath?: string | null;
};
