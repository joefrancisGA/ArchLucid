> **Scope:** ArchLucid Security White Paper detailing data at rest/transit, RBAC, and the honest boundary architecture.

# ArchLucid Security White Paper

## 1. Introduction
ArchLucid is an AI-assisted architecture workflow system designed to translate architecture requests into committed manifests and reviewable artifacts. Security is a foundational pillar, ensuring that all data, models, and governance evidence are protected and auditable.

## 2. Data Protection
### 2.1 Data in Transit
All communication between the operator (browser), CI/CD automation, and the ArchLucid API is encrypted using TLS 1.2 or higher over HTTPS. Internal communication between the API and SQL Server uses TDS with `TrustServerCertificate=True` in development, but requires strict certificate validation in production.

### 2.2 Data at Rest
All persistence is handled by SQL Server. In production, Transparent Data Encryption (TDE) is recommended to protect data at rest. ArchLucid does not store raw credentials; API keys are managed securely and validated via hashing.

## 3. Authentication and Authorization (RBAC)
ArchLucid supports flexible authentication modes:
- **ApiKey:** Configured via `Authentication:ApiKey:Enabled`. Supports `AdminKey` and `ReadOnlyKey`.
- **JwtBearer:** Production-style JWT validation mapping app roles to `Admin`, `Operator`, and `Reader`.

Policies (`ReadAuthority`, `ExecuteAuthority`, `AdminAuthority`) govern access to specific API routes and UI capabilities. The UI uses progressive disclosure based on these roles, but the API remains the ultimate enforcer (returning 401/403).

## 4. The Honest Boundary Architecture
ArchLucid implements an "honest boundary" to separate trusted baseline operations from hardened production configurations. This ensures that demo seeds and simulator agents do not pollute production governance data. The boundary is strictly enforced at the API and persistence layers.

## 5. Network Security
ArchLucid recommends deploying within a private virtual network (VNet). SMB access (port 445) is strictly prohibited from public exposure. All storage access must use private endpoints and controlled network boundaries unless explicitly overridden.

## 6. Audit and Governance
All architecture runs, agent results, and committed manifests are durably stored in SQL Server. Governance workflows are tracked via explicit state transitions, providing a clear audit trail of who approved which architecture and when.