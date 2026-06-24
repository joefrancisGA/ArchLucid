# Implementation Prompt: Policy Pack Authoring Validation Tool

**Objective:**
Provide a lightweight CLI or interactive validator for custom `PolicyPackContentDocument` JSON authoring, so power users and enterprise architects can catch schema errors, formatting issues, and invalid rule keys locally before attempting to publish via the API or Operator UI.

**Context:**
Currently, ArchLucid exposes `GET /v1/governance/policy-pack-content-schema` which returns the JSON Schema for `PolicyPackContentDocument`. However, customers building custom policy packs must assemble JSON documents by hand or script, often resulting in silent drops or 400 Bad Request errors when uploading to the platform. 

We need a dedicated validation tool (either an ArchLucid CLI subcommand or an exposed UI validator component) that validates a JSON payload against the current platform schema and known curated rule keys.

**Steps to Implement:**

### 1. Identify the Validation Host
Choose one of the following approaches (both achieve the objective, choose the one most aligned with the current codebase):
*   **Approach A (CLI):** Add a `archlucid policy validate my-pack.json` command to the ArchLucid CLI.
*   **Approach B (UI):** Add a "Validate JSON" tab or button in the `archlucid-ui/src/app/(operator)/policy-packs/` section that lets users paste raw JSON to see lint errors/warnings against the JSON Schema endpoint.

### 2. Implement JSON Schema Validation
*   The validator must retrieve or statically embed the schema from `GET /v1/governance/policy-pack-content-schema` (or `ArchLucid.Decisioning` schema generation).
*   Parse the target JSON document against this schema.
*   Output specific line/path errors (e.g., "Property `complianceRuleIds` must be an array of UUIDs").

### 3. Implement Deep Validation (Rule Key Existence)
*   Beyond simple JSON Schema validation, the tool must verify that strings inside `complianceRuleKeys` actually exist in the current GA platform rule library. 
*   *Action:* Use the `PolicyPackSchemaKeysService` or an equivalent curated-rules map to warn users if they reference a `complianceRuleKey` that ArchLucid does not recognize.

### 4. Provide Validation Summaries
*   If valid, return a success message detailing what was parsed (e.g., "Valid pack: 12 compliance rules, 2 advisory defaults").
*   If invalid, return structured error logs.

### 5. Documentation
*   Update `docs/library/API_CONTRACTS.md` or a new operator guide to explicitly mention the availability of this validation tool for custom pack authors.

**Important Guidelines:**
*   Ensure backwards compatibility with older `PolicyPackContentDocument` definitions (e.g., treating `elicitationQuestions` as optional).
*   Avoid adding heavy dependencies just for schema validation if a robust JSON schema library (like `Ajv` in TS or `JsonSchema.Net` in C#) is already present.
