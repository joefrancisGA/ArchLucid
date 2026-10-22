> **Scope:** Copy-paste prompts **BR-01–BR-09**. Index: [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). Contract: [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) §9. Existing: [`../brand/BRAND_SYSTEM.md`](../brand/BRAND_SYSTEM.md), [`../library/CONSULTING_DOCX_TEMPLATE.md`](../library/CONSULTING_DOCX_TEMPLATE.md), `ITenantFirstValueReportBrandingRepository`.

# BR-01–BR-09 — Tenant white-label branding

Visual identity is tenant-scoped. **Text may still say ArchLucid** (powered-by, help, legal, version). Do not fork a second logo store — extend first-value report branding. `--brand-*` must not override severity tokens. Tenant A marks never appear in Tenant B artifacts.

---

# BR-01 — Branding domain model

**Depends on:** plane · **Branch:** `cursor/tenant-branding-profile-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: TenantBrandingProfile SQL + repository. One Active profile per tenant. Status Default|Draft|Active|Disabled. Tenant isolated.

Fields: BrandingProfileId, TenantId, CompanyDisplayName, CompanyLegalName, ShortDisplayName, logo asset ids (primary, secondary, square, favicon, dark, light, report-cover, optional mono), Primary/Secondary/Accent/Background/Foreground colors, optional typography/tagline, WebsiteUrl, SupportUrl, BrandingStatus, Version, audit columns.

Do not: replace legal/docs strings globally with company name; put logos in git; skip TenantId.

Read: TenantFirstValueReportBranding repository types; FirstValueReportBrandingSanitizer; CONSULTING_DOCX_TEMPLATE.md future-tenant note.

Work: unique filtered index one Active per tenant; Default row = product brand; tests: two Active rejected; isolation; sanitizer HTTPS-only URLs remain.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'
Done when: versioned profiles exist; one Active; first-value branding can later read this profile.
```

---

# BR-02 — Brand asset management

**Depends on:** BR-01 · **Branch:** `cursor/tenant-brand-assets-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: upload/store BrandAsset (SVG preferred, PNG, JPEG). Validate type, dimensions, max size, integrity, SVG safety (no script/foreignObject/external use — never execute SVG). Store original + render-safe derivatives. Checksum. Preview before activation. Replace without redeploy. Reuse blob patterns (extractor chunk / evidence blobs). No public unauthenticated CDN.

Work: AssetId, TenantId, AssetType, OriginalFileName, MimeType, Width, Height, StorageReference, Checksum, Status. Tests: XSS SVG rejected; oversized rejected; tenant B cannot GET tenant A blob.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: admins can upload safely; SVG cannot execute.
```

---

# BR-03 — Central ITenantBrandingService

**Depends on:** BR-01, BR-02 · **Branch:** `cursor/tenant-branding-resolver-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: ITenantBrandingService is the ONLY branding lookup: GetBrandingProfile, GetCompanyDisplayName, GetLogo(tenant, BrandingDisplayContext), GetBrandColors, GetBrandAsset. Resolve: Active profile → tenant default → ArchLucid product brand (ArchLucidLogo / BRAND_SYSTEM). Cache per tenant; invalidate on change; no restart. No cross-tenant cache keys.

Do not: let FirstValueReportBuilder keep a private resolver — refactor it to this service. Do not let UI pages hardcode logos on tenant-aware surfaces after BR-07 (this prompt: service + PDF path at minimum).

Tests: missing profile → product name/logo; interleaved tenant A/B resolves never leak (concurrency); FirstValueReport uses the service.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: one resolver; cache isolated.
```

---

# BR-04 — Product text vs visual brand + BrandingDisplayContext

**Depends on:** BR-03 · **Branch:** `cursor/branding-display-context-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: BrandingDisplayContext enum (ApplicationHeader, Navigation, Login, Dashboard, ArchitectureDiagram, SecurityDiagram, MermaidDiagram, ReportCover, ReportHeader, ReportFooter, Export, Email, Presentation, Print, Mobile, Favicon). Visual mastheads use CompanyDisplayName + tenant logo. Text may include “Powered by ArchLucid”, help, legal, version. Co-branding (company logo + powered-by) default OFF unless configured. Do not rewrite product vocabulary (architecture package, sealed record) or simulator chrome.

Tests: header context returns company display name when Active; help markdown still contains ArchLucid; co-branding flag false → no ArchLucid mark in header fixture.

Done when: context rules are explicit and tested.
```

---

# BR-05 — Generated graphics and diagram wrappers

**Depends on:** BR-03, IE-16 · **Branch:** `cursor/branded-diagram-exports-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: when a profile is Active, architecture/Azure/security/Mermaid/SVG/PNG/audit/exec/chart/thumbnail exports go through branding. Replace product marks with tenant logo/name. Brand colors only where they do not impair a11y, semantic meaning, severity coloring, or diagram readability. Severity/status/exposure colors stay semantic (--al-status / StatusTag). Mermaid: title/theme-safe vars + branded export CONTAINER — do not inject logos as graph nodes or corrupt semantics. If format cannot embed a logo, wrap at export (DOCX/PDF path).

Tests: Mermaid source from IE-16 unchanged except optional title; PNG wrapper contains checksum of tenant logo for tenant A not B; severity hex in chart series unchanged when brand primary is set.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'
Done when: branding is a wrapper; graphs stay evidence.
```

---

# BR-06 — Report and document branding

**Depends on:** BR-03 · **Branch:** `cursor/branded-report-exports-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: PDF, Word, PowerPoint, HTML/MD reports, audit packages (AE-08), remediation reports, architecture review reports, executive summaries use tenant cover/header/footer/logo/name/tagline/support URLs via ITenantBrandingService. One apply helper — refactor FirstValueReportPdfBuilder / DocxExportService / CONSULTING_DOCX_TEMPLATE path. Text may cite ArchLucid; graphics tenant. Co-branding off unless configured.

Tests: PDF fixture with Active profile shows company name on cover; “Generated by ArchLucid” still in body; tenant B PDF does not contain tenant A logo checksum.

Done when: exports share one branding apply helper.
```

---

# BR-07 — Application UI tokens

**Depends on:** BR-03 · **Branch:** `cursor/tenant-brand-ui-tokens-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: tenant-aware operator surfaces use --brand-primary/secondary/accent/background/foreground from the resolver. Audit hardcoded ArchLucidLogo/wordmark/favicon/banners/empty-states/loading/export templates where tenant context exists. Do NOT remap --al-status-*, severity, success/warning/error. Unauthenticated marketing may stay product-branded. Contrast gate: refuse Activate (or warn+block) if brand fg/bg fail WCAG against each other. Carbon spacing/typography stay. Note: docs/brand/BRAND_SYSTEM.md still mentions Tailwind-only — do not regress UI_DESIGN_SYSTEM.md --al-* ; add --brand-* beside them.

Vitest: tenant-aware header uses company name; marketing home still product wordmark without tenant cookie; severity class names unchanged.

Done when: operator chrome is tokenized; semantics untouched.
```

---

# BR-08 — Settings → Branding admin

**Depends on:** BR-02, BR-03 · **Branch:** `cursor/tenant-branding-admin-ui-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Settings → Branding for tenant admins: upload assets, display/legal names, colors, preview light/dark, preview header/report/diagram/exec dashboard, Activate, Revert to ArchLucid defaults. Warnings: poor contrast, unreadable logo, extreme aspect ratio, missing dark/light variant, unsupported format, logo too small for reports. Disable Activate until hard validation (TB-2005). Typed audit events on upload/activate/revert. Carbon Settings pattern; no new review tabs; no validation toasts for client-known errors.

Nav + route registry sync. OpenAPI for branding APIs.

Done when: an admin can preview and activate without deploy; actions are audited.
```

---

# BR-09 — Isolation, fallback, a11y tests

**Depends on:** BR-07, BR-08 · **Branch:** `cursor/tenant-branding-isolation-tests-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: automated tests as ship gates.

CRITICAL: Tenant A branding never appears in Tenant B UI, PDF, DOCX, PPT, Mermaid wrapper, audit ZIP, remediation report, snapshot report, or email. Cache concurrency: interleaved resolves.

Also: default fallback; malformed SVG/PNG cannot throw (default + warning); dark/light; company display name; headers; diagrams; Mermaid export; favicon; unauthenticated vs tenant-aware; contrast of --brand-* ; snapshot tests where practical (reuse FirstValueReportBrandingSanitizerTests patterns).

Compile: Application.Tests + Persistence isolation + archlucid-ui Vitest as needed.

Done when: the isolation test would catch a leaked logo checksum; malformed assets cannot 500 a report.
```
