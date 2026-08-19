using System.Text.Json;
using System.Threading;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Bootstrap;

/// <summary>
///     Trial welcome sample run: one completed Retail Online Store review per trial tenant.
/// </summary>
public sealed partial class DemoSeedService
{
    /// <inheritdoc/>
    public async Task SeedTrialWelcomeRunAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Guid welcomeRunGuid = ContosoRetailDemoIds.TrialWelcomeAuthorityRunId(scope.TenantId);
        string requestId = ContosoRetailDemoIds.TrialWelcomeRequestId(scope.TenantId);
        string manifestVersion = ContosoRetailDemoIds.TrialWelcomeManifestVersion(scope.TenantId);
        (string topoTaskId, string costTaskId, string compTaskId, string topoResultId, string costResultId, string compResultId) =
            ContosoRetailDemoIds.TrialWelcomeAgentKeys(scope.TenantId);

        if (await runRepository.GetByIdAsync(scope, welcomeRunGuid, cancellationToken) is RunRecord existingWelcomeRun)
        {
            await TryRepairSeededRunDescriptionAsync(existingWelcomeRun, cancellationToken);

            return;
        }

        await EnsureTrialWelcomeRequestAsync(requestId, cancellationToken);
        string runId = welcomeRunGuid.ToString("D");
        const string systemName = "Retail Online Store";
        RunRecord authorityRow = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = welcomeRunGuid,
            ProjectId = systemName,
            Description = "Trial welcome sample — ecommerce modernization to Azure.",
            CreatedUtc = TrialWelcomeSeedUtc,
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            IsDemoWelcomeRun = true,
            IsSample = true
        };
        await runRepository.SaveAsync(authorityRow, cancellationToken);
        AgentTask topoTask = new()
        {
            TaskId = topoTaskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Objective =
                "Propose Azure landing targets for storefront, BFF, catalog, orders, and payment integration with Front Door and private egress.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = TrialWelcomeSeedUtc,
            CompletedUtc = TrialWelcomeSeedUtc,
            EvidenceBundleRef = null,
            AllowedTools = SeedAllowedTools(AgentType.Topology),
            AllowedSources = []
        };
        AgentTask costTask = new()
        {
            TaskId = costTaskId,
            RunId = runId,
            AgentType = AgentType.Cost,
            Objective =
                "Estimate monthly run-rate for Front Door, Container Apps (consumption profile), Azure SQL (GP tier), and Redis P1 with dev/test mirrors.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = TrialWelcomeSeedUtc,
            CompletedUtc = TrialWelcomeSeedUtc,
            EvidenceBundleRef = null,
            AllowedTools = SeedAllowedTools(AgentType.Cost),
            AllowedSources = []
        };
        AgentTask compTask = new()
        {
            TaskId = compTaskId,
            RunId = runId,
            AgentType = AgentType.Compliance,
            Objective =
                "Validate PCI boundaries for checkout, EU residency for PII, Key Vault secret rotation, and Defender for Cloud baseline coverage.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = TrialWelcomeSeedUtc,
            CompletedUtc = TrialWelcomeSeedUtc,
            EvidenceBundleRef = null,
            AllowedTools = SeedAllowedTools(AgentType.Compliance),
            AllowedSources = []
        };
        await taskRepository.CreateManyAsync([topoTask, costTask, compTask], cancellationToken);
        AgentResult topoResult = new()
        {
            ResultId = topoResultId,
            TaskId = topoTaskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Claims =
            [
                "Front Door + WAF terminates TLS; React storefront on Static Web Apps; BFF and commerce APIs on Container Apps in hub-spoke VNets.",
                "Payment processor integration stays out of cardholder database scope via tokenized checkout handoff."
            ],
            EvidenceRefs = ["trial-welcome-topology-overview"],
            Confidence = 0.86,
            Findings = [],
            ProposedChanges = null,
            CreatedUtc = TrialWelcomeSeedUtc
        };
        AgentResult costResult = new()
        {
            ResultId = costResultId,
            TaskId = costTaskId,
            RunId = runId,
            AgentType = AgentType.Cost,
            Claims =
            [
                "Primary region footprint (~2k RPS peak) lands near $45–60k/month at target SKUs with reserved capacity on SQL and Front Door savings plans."
            ],
            EvidenceRefs = ["trial-welcome-cost-model-v1"],
            Confidence = 0.78,
            Findings = [],
            ProposedChanges = null,
            CreatedUtc = TrialWelcomeSeedUtc
        };
        AgentResult compResult = new()
        {
            ResultId = compResultId,
            TaskId = compTaskId,
            RunId = runId,
            AgentType = AgentType.Compliance,
            Claims =
            [
                "PII persistence limited to West Europe SQL with customer-managed keys; audit logging forwarded to immutable storage; Defender CSPM alerts wired for public IP drift."
            ],
            EvidenceRefs = ["trial-welcome-compliance-notes"],
            Confidence = 0.82,
            Findings = [],
            ProposedChanges = null,
            CreatedUtc = TrialWelcomeSeedUtc
        };
        await resultRepository.CreateManyAsync([topoResult, costResult, compResult], cancellationToken);
        GoldenManifest manifest = BuildTrialWelcomeManifest(runId, manifestVersion);
        IReadOnlyList<Finding> findings = BuildTrialWelcomeFindings(welcomeRunGuid);
        AuthorityChainKeying chainKeying = new(AuthorityDemoChainIds.Manifest(welcomeRunGuid), AuthorityDemoChainIds.ContextSnapshot(welcomeRunGuid),
            AuthorityDemoChainIds.GraphSnapshot(welcomeRunGuid), AuthorityDemoChainIds.FindingsSnapshot(welcomeRunGuid),
            AuthorityDemoChainIds.DecisionTrace(welcomeRunGuid));
        AuthorityManifestPersistResult authorityChain = await _authorityCommittedManifestChainWriter.PersistCommittedChainAsync(scope, welcomeRunGuid, systemName, manifest,
            chainKeying, TrialWelcomeSeedUtc, richFindingsAndGraph: true, cancellationToken, connection: null, transaction: null,
            committedFindingsOverride: findings);
        await AuthorityCommittedChainDurableAudit.TryLogAsync(_auditService, scopeContextProvider, _actorContext, logger, welcomeRunGuid, systemName, authorityChain,
            "trial-welcome-seed", richFindingsAndGraph: true, cancellationToken);

        Guid bundleId = TrialWelcomeSeedIds.ArtifactBundleId(welcomeRunGuid);
        Guid manifestKey = authorityChain.GoldenManifestId;
        ArtifactBundle bundle = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            BundleId = bundleId,
            RunId = welcomeRunGuid,
            ManifestId = manifestKey,
            CreatedUtc = TrialWelcomeSeedUtc,
            Status = ArtifactBundleStatus.Available,
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactId = TrialWelcomeSeedIds.AnalysisArtifactId(welcomeRunGuid),
                    RunId = welcomeRunGuid,
                    ManifestId = manifestKey,
                    CreatedUtc = TrialWelcomeSeedUtc,
                    ArtifactType = ArtifactType.CoverageSummary,
                    Name = "Sponsor architecture analysis (trial welcome)",
                    Format = "Markdown",
                    Content =
                        "# Retail Online Store — Azure migration readout\n\n"
                        + "This sample summarizes topology, cost posture, and compliance signals seeded for trial onboarding. "
                        + "Use it to see how ArchLucid packages findings with a committed manifest and artifact bundle.",
                    ContentHash = "sha256:trial-welcome-analysis-report-v1",
                    Metadata = new Dictionary<string, string> { ["seed"] = "trial-welcome" },
                    ContributingDecisionIds = []
                }
            ],
            Trace = new SynthesisTrace()
        };
        await _artifactBundleRepository.SaveAsync(bundle, cancellationToken);
        RunRecord? authorityCommitted = await runRepository.GetByIdAsync(scope, welcomeRunGuid, cancellationToken);

        if (authorityCommitted is not null)
        {
            authorityCommitted.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed);
            authorityCommitted.CurrentManifestVersion = manifestVersion;
            authorityCommitted.CompletedUtc = TrialWelcomeSeedUtc;
            authorityCommitted.ContextSnapshotId = authorityChain.ContextSnapshotId;
            authorityCommitted.GraphSnapshotId = authorityChain.GraphSnapshotId;
            authorityCommitted.FindingsSnapshotId = authorityChain.FindingsSnapshotId;
            authorityCommitted.GoldenManifestId = authorityChain.GoldenManifestId;
            authorityCommitted.DecisionTraceId = authorityChain.DecisionTraceId;
            authorityCommitted.ArtifactBundleId = bundleId;
            await runRepository.UpdateAsync(authorityCommitted, cancellationToken);
        }

        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Trial welcome run seeded ({RunId}).", welcomeRunGuid);
    }

    private async Task EnsureTrialWelcomeRequestAsync(string requestId, CancellationToken cancellationToken)
    {
        if (await requestRepository.GetByIdAsync(requestId, cancellationToken) is not null)
            return;

        ArchitectureRequest request = new()
        {
            RequestId = requestId,
            Description = TrialWelcomeArchitectureBriefText,
            SystemName = "Retail Online Store",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints =
            [
                "EU data residency for customer PII",
                "Checkout must stay outside in-scope cardholder database (tokenized processor handoff)",
                "RTO under four hours for transactional order path"
            ]
        };
        await requestRepository.CreateAsync(request, cancellationToken);
    }

    private static GoldenManifest BuildTrialWelcomeManifest(string runId, string manifestVersion)
    {
        ManifestGovernance gov = new()
        {
            ComplianceTags = ["PCI-DSS", "GDPR"],
            PolicyConstraints =
            [
                "No public SQL endpoints",
                "Secrets only from Key Vault with rotation policy",
                "Front Door WAF blocks legacy origin spoofing patterns"
            ],
            RequiredControls = ["AzureFrontDoor", "PrivateEndpoints", "DefenderForCloud", "AzureMonitor"],
            RiskClassification = "Moderate",
            CostClassification = "Moderate"
        };
        const string storefront = "svc-storefront-ui";
        const string bff = "svc-commerce-bff";
        const string catalog = "svc-catalog-api";
        const string orders = "svc-orders-api";
        const string paymentAdapter = "svc-payment-adapter";
        const string ordersDb = "ds-orders-sql";
        const string sessionCache = "ds-session-redis";
        List<ManifestService> services =
        [
            new()
            {
                ServiceId = storefront,
                ServiceName = "Storefront UI",
                ServiceType = ServiceType.Ui,
                RuntimePlatform = RuntimePlatform.AppService,
                Purpose = "React storefront behind Azure Front Door.",
                Tags = ["public-edge"],
                RequiredControls = ["WAF", "ManagedTls"]
            },
            new()
            {
                ServiceId = bff,
                ServiceName = "Commerce BFF",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.ContainerApps,
                Purpose = "Aggregates catalog, cart, and checkout orchestration for the UI.",
                Tags = ["internal-spoke"],
                RequiredControls = ["ManagedIdentity", "PrivateLink"]
            },
            new()
            {
                ServiceId = catalog,
                ServiceName = "Catalog API",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.ContainerApps,
                Purpose = "Product search, pricing views, and merchandising reads.",
                Tags = ["data-reader"],
                RequiredControls = ["ManagedIdentity"]
            },
            new()
            {
                ServiceId = orders,
                ServiceName = "Orders API",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.ContainerApps,
                Purpose = "Order lifecycle, reservations, and fulfillment hooks.",
                Tags = ["transactional"],
                RequiredControls = ["ManagedIdentity", "EncryptionAtRest"]
            },
            new()
            {
                ServiceId = paymentAdapter,
                ServiceName = "Payment adapter",
                ServiceType = ServiceType.Integration,
                RuntimePlatform = RuntimePlatform.ContainerApps,
                Purpose = "Bridges checkout to external PSP with network-isolated callbacks.",
                Tags = ["pci-adjacent"],
                RequiredControls = ["PrivateEgress", "KeyVaultReferences"]
            }
        ];
        List<ManifestDatastore> datastores =
        [
            new()
            {
                DatastoreId = ordersDb,
                DatastoreName = "Orders SQL",
                DatastoreType = DatastoreType.Sql,
                RuntimePlatform = RuntimePlatform.SqlServer,
                Purpose = "Authoritative order and payment reference data (no PAN storage)."
            },
            new()
            {
                DatastoreId = sessionCache,
                DatastoreName = "Session cache",
                DatastoreType = DatastoreType.Cache,
                RuntimePlatform = RuntimePlatform.Redis,
                Purpose = "Cart and session edges with TTL for peak shopping events."
            }
        ];
        List<ManifestRelationship> relationships =
        [
            new()
            {
                RelationshipId = $"{storefront}-to-{bff}",
                SourceId = storefront,
                TargetId = bff,
                RelationshipType = RelationshipType.Calls,
                Description = "Storefront calls the commerce BFF for authenticated APIs."
            },
            new()
            {
                RelationshipId = $"{bff}-to-{catalog}",
                SourceId = bff,
                TargetId = catalog,
                RelationshipType = RelationshipType.Calls,
                Description = "BFF queries catalog for product detail and availability."
            },
            new()
            {
                RelationshipId = $"{bff}-to-{orders}",
                SourceId = bff,
                TargetId = orders,
                RelationshipType = RelationshipType.Calls,
                Description = "BFF creates and updates orders during checkout."
            },
            new()
            {
                RelationshipId = $"{bff}-to-{paymentAdapter}",
                SourceId = bff,
                TargetId = paymentAdapter,
                RelationshipType = RelationshipType.Calls,
                Description = "Checkout flow invokes payment adapter for tokenized authorization."
            },
            new()
            {
                RelationshipId = $"{orders}-writes-{ordersDb}",
                SourceId = orders,
                TargetId = ordersDb,
                RelationshipType = RelationshipType.WritesTo,
                Description = "Orders API persists transactional state."
            },
            new()
            {
                RelationshipId = $"{bff}-uses-{sessionCache}",
                SourceId = bff,
                TargetId = sessionCache,
                RelationshipType = RelationshipType.WritesTo,
                Description = "BFF stages session and cart hydration in Redis."
            }
        ];
        return new GoldenManifest
        {
            RunId = runId,
            SystemName = "Retail Online Store",
            Services = services,
            Datastores = datastores,
            Relationships = relationships,
            Governance = gov,
            Metadata = new ManifestMetadata
            {
                ManifestVersion = manifestVersion,
                ParentManifestVersion = null,
                ChangeDescription = "Trial welcome sample — Azure ecommerce modernization",
                DecisionTraceIds = [],
                CreatedUtc = TrialWelcomeSeedUtc
            }
        };
    }

    private static IReadOnlyList<Finding> BuildTrialWelcomeFindings(Guid authorityRunId)
    {
        string rid = authorityRunId.ToString("N");

        return
        [
            new Finding
            {
                FindingId = $"trial-welcome-{rid}-edge-headers",
                FindingType = "ArchitectureReview",
                Category = "Security",
                EngineType = "TrialWelcomeSeed",
                Severity = FindingSeverity.Warning,
                Title = "Front Door still forwards legacy CDN forwarding headers",
                Rationale =
                    "Migrating traffic through Azure Front Door without stripping obsolete x-forwarded-* headers from the retired CDN lets session affinity and bot scoring drift. Normalize headers at the edge and add a WAF rule to reject ambiguous origin chains."
            },
            new Finding
            {
                FindingId = $"trial-welcome-{rid}-sql-ha",
                FindingType = "ReliabilityReview",
                Category = "Reliability",
                EngineType = "TrialWelcomeSeed",
                Severity = FindingSeverity.Info,
                Title = "Orders SQL failover pairs are documented but not yet validated under regional outage",
                Rationale =
                    "The design references geo-redundant SQL with automatic failover groups; run a game-day that forces read/write cutover while checkout traffic is replayed so recovery time stays inside the four-hour sponsor target."
            },
            new Finding
            {
                FindingId = $"trial-welcome-{rid}-redis-tier",
                FindingType = "CostReview",
                Category = "Cost",
                EngineType = "TrialWelcomeSeed",
                Severity = FindingSeverity.Warning,
                Title = "Redis Premium tier is oversized for non-peak months",
                Rationale =
                    "Session and cart cache is pinned to Premium P2 before load tests justify it. Start with burstable Premium P1 with autoscale policy tied to connection saturation and egress, then step up after Thanksgiving peak rehearsal."
            },
            new Finding
            {
                FindingId = $"trial-welcome-{rid}-payment-callback",
                FindingType = "ComplianceReview",
                Category = "Compliance",
                EngineType = "TrialWelcomeSeed",
                Severity = FindingSeverity.Error,
                Title = "Payment adapter callbacks lack signed replay protection",
                Rationale =
                    "Asynchronous PSP callbacks enter the adapter over mutual TLS but do not carry a rotating JWS profile yet, which weakens replay detection. Adopt provider-supported signature validation plus short-lived nonces before production cutover."
            },
            new Finding
            {
                FindingId = $"trial-welcome-{rid}-observability",
                FindingType = "OperationalReview",
                Category = "Operational",
                EngineType = "TrialWelcomeSeed",
                Severity = FindingSeverity.Info,
                Title = "Synthetic canaries stop at catalog path — extend through payment sandbox",
                Rationale =
                    "Availability tests cover storefront → BFF → catalog only. Add a nightly sandbox transaction through payment adapter with alert routing to commerce ops so silent checkout regressions surface before business hours."
            }
        ];
    }

    private const string TrialWelcomeArchitectureBriefText =
        "Retail Online Store is retiring a decade-old monolith that still serves catalog search, cart, checkout, and payment handoff from shared VMs. "
        + "Leadership chose Azure for elastic scale ahead of peak holidays. The target exposes a React storefront on Azure Static Web Apps behind Azure Front Door with regional WAF rules, OWASP defaults, and bot management. "
        + "A Node commerce BFF runs on Azure Container Apps inside a dedicated spoke, calling catalog and order microservices that are also on Container Apps with workload identities to Azure SQL and Redis. "
        + "Checkout never persists payment cards; instead a payment adapter integrates with an external processor over private connectivity and Key Vault–backed secrets. "
        + "Customer profile data must stay in EU regions, so primary writes land in a West Europe Azure SQL failover group with geo-redundant backups, while media sits in zone-redundant storage accounts with lifecycle rules. "
        + "Observability standardizes on Application Insights with distributed tracing across Front Door, BFF, and downstream APIs, plus budget alerts tied to cost management exports. "
        + "Delivery follows a strangler pattern: extract catalog and inventory read paths first, then checkout orchestration, while legacy APIs remain behind compatibility routes until traffic drains. "
        + "Quality gates include blue/green releases for the storefront, automated failover tests for SQL, chaos drills on private link dependencies, and quarterly tabletop exercises for payment outages. "
        + "Sponsor constraints include EU residency for PII, an order-path recovery time under four hours, and elimination of any public SQL endpoints.";
}
