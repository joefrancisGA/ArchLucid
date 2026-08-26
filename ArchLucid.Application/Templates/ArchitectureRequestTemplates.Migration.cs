using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Templates;

public static partial class ArchitectureRequestTemplates
{
    public static ArchitectureRequest MonolithMigrationAssessment(string? requestId = null)
    {
        return Build("monolith-migration-assessment", requestId, "Monolith migration assessment", """
                                                                                                  Assess decomposition options for a legacy ASP.NET MVC / Web API monolith on .NET Framework backed by SQL Server.
                                                                                                  Current pain: scaling bottlenecks, deployment coupling (big-bang releases), and lack of team autonomy around modules.
                                                                                                  Deliver a migration path (strangler vs. big-bang), candidate service boundaries, data split risks, and test strategy.
                                                                                                  """, "LegacyMonolithAssessment", "prod", CloudProvider.Azure,
            [
                "Workspace and project scope are taken from the signed-in operator session (default workspace and project).",
                "The monolith remains authoritative until cutover; dual-write is only introduced with explicit approval.",
                "Teams are organized around business capabilities, not technical layers."
            ],
            [
                "Preserve regulatory and audit trails currently stored in SQL Server until a verified migration is complete.",
                "Avoid breaking existing public interfaces during incremental extraction."
            ],
            [
                "Read scaling for high-traffic read models without rewriting the entire monolith on day one",
                "Independent deployment units for at least two candidate bounded contexts", "SQL Server integration and eventual per-service data ownership"
            ], [
                ("Evidence — Legacy monolith", """
                                               **Stack:** .NET Framework monolith hosting HTTP workloads and batch-style jobs in-process.

                                               **Pain:** Shared database schema across modules; release trains require full regression of unrelated features.
                                               """),
                ("Evidence — SQL Server footprint", """
                                                    **Data:** Central SQL Server instance with cross-module foreign keys and shared reporting views.

                                                    **Risk:** Splitting ownership without transaction boundary analysis causes consistency bugs.
                                                    """),
                ("Evidence — Scaling and coupling", """
                                                    **Symptoms:** Vertical scaling limits hit during seasonal peaks; hot modules cannot scale independently.

                                                    **Deployment:** Single artifact means low-risk fixes wait behind large features.
                                                    """),
                ("Evidence — Team autonomy gap", """
                                                 **Organization:** Multiple squads commit to the same solution; merge conflicts and coordination tax dominate.

                                                 **Goal:** Define service APIs and data ownership so squads can ship on independent cadence.
                                                 """)
            ], ["strangler-fig", "domain-aligned-services", "legacy-sql-server", "incremental-extraction"], ["audit-retention", "least-privilege-db-access"]);
    }

    public static ArchitectureRequest CloudNativeMigration(string? requestId = null)
    {
        return Build("cloud-native-migration-azure", requestId, "Cloud-native migration to Azure", """
                                                                                                   Plan migration of an on-premises VM-hosted application stack to Azure. Target reference: App Service for compute,
                                                                                                   Azure SQL for relational data, Azure Blob Storage for object artifacts. Include network boundaries (private access
                                                                                                   where possible), identity (Entra ID / managed identity), backup/DR, cost controls, and compliance attestations.
                                                                                                   """, "VmToAzureMigration", "prod", CloudProvider.Azure,
            [
                "Workspace and project scope are taken from the signed-in operator session (default workspace and project).",
                "Lift-and-shift to IaaS is an interim option only if PaaS blockers are documented with expiry dates.",
                "Existing RTO/RPO targets must be met or revised explicitly in the plan."
            ],
            [
                "No public SQL endpoints — private connectivity or approved exceptions only.",
                "Customer-owned encryption keys required for regulated blob containers where applicable."
            ],
            [
                "Azure App Service hosting with deployment slots", "Azure SQL with automated backups and geo-redundant options",
                "Blob storage for static assets and integration file drops", "Entra ID–backed authentication and managed identities for service calls"
            ], [
                ("Evidence — Current on-premises footprint", """
                                                             **As-is:** Multi-tier app on Windows/Linux VMs, load balancer, and attached SAN/NAS for files.

                                                             **Dependencies:** Scheduled jobs, file shares, and integration endpoints with partner systems.
                                                             """),
                ("Evidence — Target Azure topology", """
                                                     **To-be:** App Service plans sized for workload; Azure SQL logical server with private link; Blob containers with
                                                     lifecycle tiers (hot/cool/archive) per retention policy.
                                                     """),
                ("Evidence — Security and compliance", """
                                                       **Controls:** Conditional Access, PIM for break-glass, Key Vault for secrets, Defender for Cloud baseline.

                                                       **Compliance:** Data residency region locked; logging to Log Analytics; alert routing to SOC queue.
                                                       """),
                ("Evidence — Migration waves", """
                                               **Approach:** Strangler for edge traffic, database DMA / online migration tooling, blob sync for large file sets.

                                               **Validation:** Parallel run window with reconciliation dashboards before DNS cutover.
                                               """)
            ], ["azure-paas", "app-service", "azure-sql", "private-link", "blob-storage"], ["managed-identity", "private-endpoints", "defender-for-cloud"]);
    }

    public static ArchitectureRequest RegulatedHealthcareSystem(string? requestId = null)
    {
        return Build("regulated-healthcare-hipaa", requestId, "Regulated healthcare information system", """
                                                                                                         Design or review a patient data processing system subject to HIPAA. Cover minimum necessary access, auditability
                                                                                                         (who accessed what PHI and when), encryption in transit and at rest, breach notification hooks, BAA-covered flows,
                                                                                                         and residency constraints for PHI storage and processing.
                                                                                                         """, "HealthcarePhiPlatform", "prod",
            CloudProvider.Azure,
            [
                "Workspace and project scope are taken from the signed-in operator session (default workspace and project).",
                "Business Associate Agreements cover all subprocessors in the critical path for PHI.",
                "Clinical workflows require sub-second reads for certain hot paths — document latency SLOs."
            ],
            [
                "PHI must remain in approved geographic regions; cross-border replication disabled unless legally cleared.",
                "All PHI access paths must emit tamper-evident audit records with 7-year (or policy-defined) retention."
            ],
            [
                "Role-based and attribute-based access control for clinician vs. operational roles", "Full-disk and database TDE; TLS 1.2+ for all API traffic",
                "Break-glass access with post-incident review workflow", "Disaster recovery without PHI leakage to non-production environments"
            ], [
                ("Evidence — HIPAA scope", """
                                           **Scope:** Electronic PHI ingestion (HL7/FHIR/API), storage, transformation, and disclosure to authorized apps.

                                           **Administrative safeguards:** Workforce training, sanctions policy, BA breach notification timelines.
                                           """),
                ("Evidence — Audit and monitoring", """
                                                    **Audit:** Centralized logging of authentication, CRUD on PHI tables, bulk exports, and admin configuration changes.

                                                    **Monitoring:** Anomaly detection on unusual access patterns; SIEM integration.
                                                    """),
                ("Evidence — Encryption posture", """
                                                  **At rest:** TDE on databases; CMK option for blob and key vault keys with rotation runbooks.

                                                  **In transit:** mTLS or TLS for internal service hops where PHI traverses the network.
                                                  """),
                ("Evidence — Access control", """
                                              **Identity:** Entra ID with phishing-resistant MFA for administrators; JIT elevation for infrastructure roles.

                                              **Application:** Consent screens, session timeouts, and purpose-of-use enforcement on APIs.
                                              """),
                ("Evidence — Data residency", """
                                              **Residency:** Primary and backup regions pinned; backups and replicas verified to stay in-policy.

                                              **Testing:** Synthetic PHI only in non-prod; production-like datasets masked or tokenized.
                                              """)
            ], ["hipaa-aligned-azure", "phi-partitioning", "audit-everything", "cmk-option"],
            ["hipaa-security-rule", "nist-800-66r2-aligned", "break-glass-audited", "minimum-necessary-access"]);
    }

    public static ArchitectureRequest RetailBankingAndPaymentsPlatform(string? requestId = null)
    {
        return Build("financial-services-pci-sox", requestId, "Retail banking and payments reference platform", """
                Architecture for retail banking workloads that handle card-present and card-not-present rails, ACH/wires, ledgered
                customer accounts, and settlement with external networks. Produce clear PCI DSS scope artifacts (CDE boundaries,
                PAN minimization/tokenization vault), strong customer and operator authentication posture, transactional integrity on
                journal postings (idempotency, balanced double-entry assumptions), nightly and intraday reconciliation with
                PSP/acquirer files, AML and fraud-detection pipelines that stay materially separated from CHD stores, audit evidence
                that SOX-aligned reviewers recognize (immutable logs, access reviews, segregation of duties), and Azure-native controls
                (Key Vault/HSM-backed keys, CMK where warranted, Encryption everywhere, Private Link/private endpoints vs public data
                planes by default).
                """, "RetailBankingAndPaymentsPlatform", "prod", CloudProvider.Azure,
            [
                "Workspace and project scope are taken from the signed-in operator session (default workspace and project).",
                "Cardholder data must be processed only inside an explicitly documented Cardholder Data Environment (CDE).",
                "Money movement and regulatory reporting responsibilities follow the bank's licensed entity and regional rules."
            ],
            [
                "PAN and sensitive authentication data must not land in general-purpose logs, analytics lakes, or email systems.",
                "Production payment paths require MFA for operators; customer digital channels follow regional strong-auth rules."
            ],
            [
                "Tokenization or vault service isolating PAN from application databases where feasible",
                "Double-entry ledger with posting controls; idempotent payment capture and settlement hooks",
                "PSP/acquirer file ingestion with automated exception queues and manual approval workflow",
                "AML and fraud analytics on derived features without co-mingling raw CHD",
                "Azure Key Vault for keys/secrets; private connectivity to core banking and payment switches"
            ], [
                ("Evidence — PCI scope and CHD boundaries", """
                                                            **CDE:** Map every system that stores, processes, or transmits account data; draw trust boundaries between CDE,
                                                            tokenization services, and back-office analytics.

                                                            **Minimization:** Prefer network tokens or vault references in app databases; scope reduction for call centers
                                                            and partner APIs via controlled fields and retention limits.
                                                            """),
                ("Evidence — Strong authentication", """
                                                     **Customers:** Step-up authentication for high-risk transactions; device binding and risk scoring at the edge.

                                                     **Operators:** Phishing-resistant MFA for payment operations; PIM/JIT for infrastructure; break-glass only with
                                                     compensating monitoring.
                                                     """),
                ("Evidence — Ledger posting integrity", """
                                                        **Posting model:** Authoritative general ledger with balanced entries; idempotency keys on payment commands to
                                                        survive retries.

                                                        **Controls:** Maker-checker for manual adjustments; immutable append-only journal where policy requires;
                                                        compensating entries instead of silent edits.
                                                        """),
                ("Evidence — Settlement and reconciliation", """
                                                             **Clearing:** Match acquirer/PSP settlement files to internal postings; suspense accounts for timing differences.

                                                             **Operational SLAs:** Cut-off windows documented; rollback and replay procedures tested; nostro/vostro
                                                             reconciliation cadence automated with exception dashboards.
                                                             """),
                ("Evidence — AML/fraud adjacency", """
                                                   **AML:** Transaction monitoring aggregates on non-CHD dimensions; SAR workflow integration without exporting PAN.

                                                   **Fraud:** Real-time scoring on session and device telemetry; supervised models trained on pseudonymous features —
                                                   forbid raw PAN in ML feature stores aligned to policy.
                                                   """),
                ("Evidence — SOX-minded audit trails and Azure controls", """
                                                                          **Audit:** Tamper-evident logs for ledger changes, access grants, privileged actions, and config drift; recurring
                                                                          access reviews evidenced.

                                                                          **Azure:** Keys in Key Vault/HSM routes; TLS and encryption at rest; Private Link/App Service integration subnet
                                                                          patterns; Defender for Cloud and policy-as-code for misconfiguration detection.
                                                                          """)
            ], ["pci-dss-scope", "tokenization-vault", "double-entry-ledger", "settlement-recon", "aml-fraud-lake-separated", "azure-private-connectivity"],
            ["sox-controls-friendly", "no-pan-in-logs", "mfa-everywhere-sensitive", "key-vault-cmk"]);
    }

    public static ArchitectureRequest SmartManufacturingOtItReference(string? requestId = null)
    {
        return Build("manufacturing-ot-it-convergence", requestId, "Smart manufacturing OT/IT convergence reference", """
                Reference architecture for discrete or process manufacturing where shop-floor OT (PLCs, MES, SCADA) converges with
                enterprise IT (ERP, quality, planning). Cover ingestion from plant assets and historians, deterministic low-latency
                paths for line control versus batch analytics upstream, ERP production-order and BOM/routing synchronization, time-series
                retention for historians and predictive maintenance, resilient availability when WAN links degrade, Purdue / ISA-style
                segmentation between OT Levels 0–3 and DMZ/cloud services, safety-related automation and audited change windows
                (fat/sat, lockout-tagout-aligned procedures for software pushes), and supply-chain touchpoints (ASN, EDI, supplier
                quality portals) without flattening OT networks.
                """, "SmartManufacturingOtItReference", "prod", CloudProvider.Azure,
            [
                "Workspace and project scope are taken from the signed-in operator session (default workspace and project).",
                "Safety instrumented systems and emergency stops remain under plant engineering authority — cloud does not directly actuate SIL-rated loops without explicit exception.",
                "ERP remains the financial and planning system of record; MES owns real-time execution state at the line."
            ],
            [
                "No flat network between PLCs and corporate Wi-Fi; jump hosts and bastions are documented and time-bounded.",
                "Historian and MES exports that leave the plant must be classified (PII, export control) and encrypted in transit."
            ],
            [
                "OPC-UA or industrial protocol gateways with certificate-based trust into a plant DMZ",
                "MES orchestration integrating work orders with ERP confirmations and genealogy",
                "Historian/time-series path (edge buffer + Azure IoT/TS or equivalent) sized for anomaly detection",
                "Site-level resilience — store-and-forward during uplink loss without losing safety interlocks locally",
                "Supplier integration APIs or EDI for inbound materials visibility"
            ], [
                ("Evidence — MES and line integration", """
                                                        **MES:** Executes work orders, enforces routing and parameters, publishes OEE downtime reasons to IT systems.

                                                        **PLCs/HMI:** deterministic cycle times; deterministic messaging into MES queues; anomaly detection at edge
                                                        before noisy flood to cloud.
                                                        """),
                ("Evidence — ERP handoff", """
                                           **Sync:** Planned orders released from ERP; confirmations, scrap, yield, and labor confirmations write back via
                                           controlled batches or event topics.

                                           **Master data:** BOM and revision governance — engineering change workflows prevent unauthorized shop-floor pushes.
                                           """),
                ("Evidence — Historian and time-series telemetry", """
                                                                   **Historian:** High-frequency sensor and tag retention at the edge with rollups to analytics regions.

                                                                   **Downstream:** Feature stores or lakehouse zones for predictive maintenance without blocking line SCADA refresh
                                                                   rates.
                                                                   """),
                ("Evidence — Shop-floor latency and availability", """
                                                                   **Latency:** Control loops stay on-plant; IT analytics tolerate seconds-to-minutes batching versus sub-100 ms line
                                                                   control.

                                                                   **Resilience:** Redundant gateways, local buffering, playbook for degraded WAN that preserves production continuity
                                                                   and operator visibility.
                                                                   """),
                ("Evidence — OT/IT segmentation", """
                                                  **Zones:** Cell/area networks isolated; DMZ for protocol translation; north-south inspection and default-deny
                                                  between OT and corporate identity planes.

                                                  **Identity:** Separate Entra tenant usage or scoped app registrations for plant services — no shared corporate
                                                  laptops on OT VLANs.
                                                  """),
                ("Evidence — Safety, change control, and supply chain", """
                                                                        **Safety:** SIL/SIS boundaries documented; PLC firmware and safety logic updates through controlled maintenance
                                                                        windows with validation evidence.

                                                                        **Supply chain:** ASN/serialization handshakes inbound; outbound finished-goods manifests to 3PL/ERP; anomaly
                                                                        alerts on supplier deviations without opening OT VLANs externally.
                                                                        """)
            ],
            [
                "mes-plc-gateway", "erp-production-sync", "historian-timeseries-edge", "ot-dmz-private-link", "store-and-forward-resilience",
                "supplier-integration"
            ],
            ["purdue-segmentation", "no-flat-ot-corporate-network", "safety-critical-change-controlled", "encrypted-northbound-egress"]);
    }

    public static ArchitectureRequest GcpDataLakeAnalytics(string? requestId = null)
    {
        return Build("gcp-data-lake-analytics", requestId, "GCP data lake and analytics platform", """
                Architect a governed analytics platform on Google Cloud for batch and near-real-time workloads. Ingest operational and partner
                datasets into Cloud Storage landing zones, orchestrate transformations with Cloud Composer or Dataflow, and expose curated tables
                through BigQuery with row-level security expectations. Cover encryption, VPC Service Controls or private Google Access patterns,
                lineage from ingestion to consumption, and cost visibility across projects.
                """, "GcpAnalyticsLakehouse", "prod", CloudProvider.Gcp,
            [
                "Workspace and project scope are taken from the signed-in operator session (default workspace and project).",
                "BigQuery is the primary consumption plane; Dataproc or Spark on GKE is optional for heavy transformation.",
                "PII classification drives column-level access and retention policies."
            ],
            [
                "No public BigQuery datasets — authorized views and IAM conditions documented per consumer cohort.",
                "Customer-managed encryption keys required where regulated data lands in Cloud Storage or BigQuery."
            ],
            [
                "Cloud Storage raw and curated zones with lifecycle policies",
                "BigQuery datasets with row-level security and authorized views",
                "Cloud Composer or Dataflow orchestration with idempotent pipelines",
                "Dataplex or equivalent metadata catalog for lineage",
                "VPC Service Controls or private connectivity for sensitive ingestion paths"
            ], [
                ("Evidence — Ingestion and landing", """
                                                     **Landing:** Cloud Storage buckets partitioned by source system and ingestion date; schema-on-read contracts versioned.

                                                     **Quality:** Validation jobs quarantine bad files before curated promotion.
                                                     """),
                ("Evidence — Transformation", """
                                             **Orchestration:** Composer DAGs or Dataflow jobs with checkpointed offsets and replay from last good partition.

                                             **Cost:** Slot reservations or autoscaling policies documented for BigQuery-heavy stages.
                                             """),
                ("Evidence — Consumption", """
                                          **BigQuery:** Curated datasets with RLS policies; authorized views for partner extracts without exposing raw PII.

                                          **Governance:** Column descriptions, data stewards, and retention aligned to classification schedules.
                                          """),
                ("Evidence — Security and networking", """
                                                     **Connectivity:** Private Google Access or VPC-SC perimeters for sensitive pipelines.

                                                     **Keys:** CMEK for storage and BigQuery where policy mandates customer control.
                                                     """)
            ], ["gcp-data-lake", "bigquery-rls", "cloud-storage-zones", "composer-dataflow", "dataplex-lineage"],
            ["vpc-sc-or-private-access", "cmek-where-required", "no-public-datasets"]);
    }
}
