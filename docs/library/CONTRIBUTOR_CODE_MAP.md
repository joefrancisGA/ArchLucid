> **Scope:** 1-page visual/textual decision tree for new contributors.

# Contributor Code Map

Use this quick-reference to find where to make changes in the ArchLucid codebase based on your goal.

## 1. Modifying the API or Endpoints
**"I need to add or change an HTTP route."**
- **Location:** `ArchLucid.Api/Controllers/`
- **What to know:** Endpoints are organized by domain (e.g., `Authority`, `Governance`, `Tenancy`). You must apply the correct authorization policy (e.g., `[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]`).

## 2. Changing Persistence or Database Logic
**"I need to modify how data is saved or retrieved."**
- **Location:** `ArchLucid.Persistence/`
- **What to know:** 
  - Sub-assemblies (e.g., Alerts, Advisory, Integration) have been consolidated into this single project to reduce cognitive load. 
  - Look in `Repositories/` for data access.
  - SQL Migrations live in `ArchLucid.Persistence/Migrations/`. Remember to add your `.sql` file as an Embedded Resource.

## 3. Editing the Operator UI
**"I need to change a React component or screen."**
- **Location:** `archlucid-ui/src/`
- **What to know:**
  - Pages and routing: `app/(operator)/`
  - Reusable components: `components/`
  - Sidebar navigation and progressive disclosure configuration: `lib/nav-config.ts` and `components/SidebarNav.tsx`

## 4. Modifying Architecture Agents or Pipelines
**"I need to adjust how the AI analyzes an architecture."**
- **Location:** `ArchLucid.Application/Runs/Orchestration/` and `ArchLucid.Decisioning/`
- **What to know:** 
  - The pipeline orchestrates the sequence of agent execution.
  - Golden Manifests have been renamed in the UI to "Committed Architecture Manifest", but internal types remain `GoldenManifest`.
  - **Custom in-repo handlers:** register `IAgentHandler` in `ArchLucid.Host.Composition` — see [`CUSTOM_AGENT_HANDLER_GUIDE.md`](CUSTOM_AGENT_HANDLER_GUIDE.md). **Out-of-process:** [`CUSTOM_AGENT_HANDLERS.md`](CUSTOM_AGENT_HANDLERS.md). V1 contract: [`V1_SCOPE.md`](V1_SCOPE.md) §2.18.

## 5. Adding a New Integration or Connector
**"I need to add a new ITSM sink (like Jira) or Slack webhook."**
- **Location:** `ArchLucid.Application/Integrations/`
- **What to know:** 
  - Webhooks use a unified Architecture Run payload. Do not invent a parallel schema. 
  - For UI setup, edit `archlucid-ui/src/app/(operator)/integrations/`.

## 6. Modifying Configuration or Startup
**"I need to add a new appsettings value."**
- **Location:** `ArchLucid.Host.Core/Configuration/` and `ArchLucid.Api/appsettings.json`
- **What to know:** 
  - Add your strongly-typed configuration class.
  - Do not add boilerplate defaults to `appsettings.json`—rely on the C# class defaults to keep the pilot startup clean.
