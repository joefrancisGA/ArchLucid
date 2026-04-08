## ArchLucid documentation index

### Orientation

- **Start here (new contributors)** — canonical front door: layered overview, pick-your-role, key concepts, quick commands  
  - `docs/START_HERE.md`
- **Golden path (environments: zero → local → prod-like → Azure)** — role lanes, one diagram, phased checklists, advanced appendix  
  - `docs/GOLDEN_PATH.md`
- **Week-one role tickets (dev / SRE / security)** — 3–5 checkboxes each  
  - `docs/onboarding/README.md`
- **C4 diagrams for exec/security (PNG + `.mmd` sources)**  
  - `docs/diagrams/c4/README.md`
- **Request happy path (client → API → SQL → agents)**  
  - `docs/ONBOARDING_HAPPY_PATH.md`
- **System map (Mermaid flows + entry points)**  
  - `docs/SYSTEM_MAP.md`
- **One-page system view (nodes/edges/ops)**  
  - `docs/ARCHITECTURE_ON_A_PAGE.md`
- **Code map (where to open first)**  
  - `docs/CODE_MAP.md`
- **Context** – high-level purpose and boundary  
  - `docs/ARCHITECTURE_CONTEXT.md`
- **Containers** – projects and their responsibilities  
  - `docs/ARCHITECTURE_CONTAINERS.md`
- **Components** – key modules inside each container  
  - `docs/ARCHITECTURE_COMPONENTS.md`
- **Dual pipeline navigator** – Coordinator (string run) vs Authority (ingestion) paths, shared artifacts, `RunEventTrace` vs `RuleAuditTrace` (JSON still one `DecisionTrace` envelope with `kind`)  
  - `docs/DUAL_PIPELINE_NAVIGATOR.md`
- **DI registration map** – `AddArchLucidApplicationServices` order (`ArchLucid.Host.Composition`), `AddArchLucidStorage`, partial `ServiceCollectionExtensions`, config gates  
  - `docs/DI_REGISTRATION_MAP.md`
- **Key flows** – run, export, comparison, replay sequences  
  - `docs/ARCHITECTURE_FLOWS.md`

### Operator shell (front end)

- **Operator shell guide (55R)** – workflow, artifact review, graph vs compare/replay, focused UI tests, API expectations  
  - `docs/operator-shell.md`
- **Architecture** – context, containers, components, data flow, security model, operational concerns  
  - `archlucid-ui/docs/ARCHITECTURE.md`
- **Tutorial** – Next.js/React concepts for back-end developers  
  - `archlucid-ui/docs/OPERATOR_SHELL_TUTORIAL.md`
- **Component reference** – every component, prop, and helper library  
  - `archlucid-ui/docs/COMPONENT_REFERENCE.md`
- **Data flow and state** – data flow diagrams, state patterns, templates for new pages  
  - `archlucid-ui/docs/DATA_FLOW_AND_STATE.md`
- **C# to React Rosetta Stone** – side-by-side code for every pattern  
  - `archlucid-ui/docs/CSHARP_TO_REACT_ROSETTA.md`
- **Annotated walkthrough** – line-by-line reading of a real page  
  - `archlucid-ui/docs/ANNOTATED_PAGE_WALKTHROUGH.md`
- **Testing and troubleshooting** – tests, debugging, common issues  
  - `archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md`
- **Data model** – core tables/records and relationships  
  - `docs/DATA_MODEL.md`
- **SQL scripts** – migrations, consolidated SQL Server DDL, DbUp vs Persistence bootstrap  
  - `docs/SQL_SCRIPTS.md`
- **Context ingestion** – connectors, parsers, deduplication, create-run fields  
  - `docs/CONTEXT_INGESTION.md`
- **Knowledge graph** – typed nodes/edges from `ContextSnapshot`, inference, validation, SQL JSON  
  - `docs/KNOWLEDGE_GRAPH.md`

### Decisions and onboarding

- **Glossary** – 20 domain terms (authority run, golden manifest, finding engine, policy pack …)  
  - `docs/GLOSSARY.md`
- **Changelog** – per-release summaries (55R → latest); archived design-session logs in `docs/archive/`  
  - `docs/CHANGELOG.md`
- **ADRs** – 11 numbered decisions; no shared prefix IDs  
  - `docs/adr/README.md`
- **Contributor onboarding** – build, test filters (see **START_HERE** for entry point)  
  - `docs/CONTRIBUTOR_ONBOARDING.md`

### API and contracts

- **HTTP contracts** – status codes, validation, problem details  
  - `docs/API_CONTRACTS.md`
- **Alerts** – rules, evaluation, delivery, persistence  
  - `docs/ALERTS.md`
- **Typed findings schema** – payloads and versioning  
  - `docs/FINDINGS_TYPED_SCHEMA.md`, `docs/DECISIONING_TYPED_FINDINGS.md`

### Build, CLI, and operations

- **RTO / RPO targets by environment tier** – SQL HA, geo-replication, production vs dev  
  - `docs/RTO_RPO_TARGETS.md`
- **Build and run** – configuration, ports, local setup  
  - `docs/BUILD.md`
- **CLI usage** – commands and flags  
  - `docs/CLI_USAGE.md`
- **CLI ↔ API plan** – implementation status and phases  
  - `docs/CLI_API_IMPLEMENTATION_PLAN.md`
- **Demo quickstart**  
  - `docs/demo-quickstart.md`
- **Replay drift runbook**  
  - `docs/RUNBOOK_REPLAY_DRIFT.md`
- **Advisory scan failures** – `docs/runbooks/ADVISORY_SCAN_FAILURES.md`
- **Comparison replay rate limits** – `docs/runbooks/COMPARISON_REPLAY_RATE_LIMITS.md`
- **Provenance / retrieval indexing** – `docs/runbooks/PROVENANCE_INDEXING.md`
- **Terraform variable sketch (Azure)** – `docs/terraform-azure-variables.md`
- **Infrastructure index (Terraform roots)** – `infra/README.md`
- **Customer trust and access (edge, private data plane, Entra)** – `docs/CUSTOMER_TRUST_AND_ACCESS.md`
- **Azure API Management (Consumption), optional** – `infra/terraform/README.md`
- **Rate limiting / CORS / auth** – see `README.md` and `docs/BUILD.md` (cross-links from backlog `docs/NEXT_REFACTORINGS.md`)

### Contributing and process

- **Test layout** – integration vs unit, traits  
  - `docs/TEST_STRUCTURE.md`
- **Test execution model (54R)** – Core / Fast core / Integration / SQL / Full regression, scripts, CI  
  - `docs/TEST_EXECUTION_MODEL.md`
- **Formatting** – repo conventions  
  - `docs/FORMATTING.md`
- **Method documentation** – XML doc expectations  
  - `docs/METHOD_DOCUMENTATION.md`
- **Refactoring backlog** – completed batches (§88+) and open ideas  
  - `docs/NEXT_REFACTORINGS.md`

### How-to guides

- **Comparison replay** – formats, modes, headers, examples  
  - `docs/COMPARISON_REPLAY.md`
- **Add a new comparison type** – step-by-step: type constant → service → replay formatter → DI → tests  
  - `docs/HOWTO_ADD_COMPARISON_TYPE.md`
- **CI migration and seeding regression loop** – pre-push checklist, per-migration checklist, CI YAML  
  - `docs/CI_MIGRATION_CHECKLIST.md`

---

### Typical questions and where to read

- **“How does a run become a manifest?”**  
  → `ARCHITECTURE_FLOWS.md` (Flow A) + `ARCHITECTURE_COMPONENTS.md` (`DecisionEngineService` in `ArchLucid.Decisioning.Merge`) + `KNOWLEDGE_GRAPH.md` (graph → findings → manifest)

- **“How do I replay a comparison and re-export it?”**  
  → `COMPARISON_REPLAY.md` + `ARCHITECTURE_FLOWS.md` (Flow C)

- **“Where do comparison records live and how do I query them?”**  
  → `DATA_MODEL.md` (ComparisonRecords) + `ARCHITECTURE_COMPONENTS.md` (ComparisonRecordRepository, ComparisonReplayService)

- **“Which SQL file runs when? How do I add a migration?”**  
  → `SQL_SCRIPTS.md`

- **“Where should I add a new feature?”**  
  → `ARCHITECTURE_CONTAINERS.md` first, then the relevant section of `ARCHITECTURE_COMPONENTS.md`.

