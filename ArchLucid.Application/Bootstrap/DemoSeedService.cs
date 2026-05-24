using System.Text.Json;

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
///     Idempotent seed for the Contoso Retail Modernization **trusted baseline** (two committed runs, governance workflow,
///     activations).
/// </summary>
/// <remarks>
///     Persists via <c>ArchLucid.Persistence</c> repositories. **Authority-only after ADR 0030 PR A3 (2026-04-24):**
///     each demo run is inserted into <c>dbo.Runs</c> via <see cref = "IRunRepository.SaveAsync"/> (project slug
///     <c>Contoso Retail Platform</c>, matching system-name-as-project-id from coordinator ingestion mapping).
///     Committed manifest bodies AND decision traces are written through
///     <see cref = "IAuthorityCommittedManifestChainWriter"/> in a single FK-chain insert
///     (Snapshot rows + GoldenManifest + AuthorityDecisionTrace). The previous
///     <c>ICoordinatorDecisionTraceRepository</c> second write to <c>dbo.DecisionTraces</c> was removed when
///     the coordinator interfaces themselves were deleted in PR A3 — see
///     <c>docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md</c>.
///     The export row is optional metadata for export history — not required for consulting DOCX replay. See
///     <c>docs/TRUSTED_BASELINE.md</c>.
/// </remarks>
public sealed class DemoSeedService(
    IArchitectureRequestRepository requestRepository,
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentTaskRepository taskRepository,
    IAgentResultRepository resultRepository,
    IAuthorityCommittedManifestChainWriter authorityCommittedManifestChainWriter,
    IOptionsMonitor<DemoOptions> demoOptions,
    IGovernanceApprovalRequestRepository approvalRepository,
    IGovernancePromotionRecordRepository promotionRepository,
    IGovernanceEnvironmentActivationRepository activationRepository,
    IRunExportRecordRepository runExportRecordRepository,
    IArtifactBundleRepository artifactBundleRepository,
    IAuditService auditService,
    IActorContext actorContext,
    ILogger<DemoSeedService> logger) : IDemoSeedService
{
    private readonly IArtifactBundleRepository _artifactBundleRepository =
        artifactBundleRepository ?? throw new ArgumentNullException(nameof(artifactBundleRepository));
    private readonly IRunExportRecordRepository _runExportRecordRepository =
        runExportRecordRepository ?? throw new ArgumentNullException(nameof(runExportRecordRepository));

    private readonly IAgentResultRepository _resultRepository = resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));

    private readonly IGovernancePromotionRecordRepository _promotionRepository =
        promotionRepository ?? throw new ArgumentNullException(nameof(promotionRepository));

    private readonly IGovernanceEnvironmentActivationRepository _activationRepository =
        activationRepository ?? throw new ArgumentNullException(nameof(activationRepository));

    private readonly ILogger<DemoSeedService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IGovernanceApprovalRequestRepository _approvalRepository =
        approvalRepository ?? throw new ArgumentNullException(nameof(approvalRepository));

    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IArchitectureRequestRepository _requestRepository = requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));
    private readonly IAgentTaskRepository _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));
    private static readonly DateTime DemoUtc = new(2025, 3, 1, 12, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime TrialWelcomeSeedUtc = new(2025, 6, 15, 14, 30, 0, DateTimeKind.Utc);
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IAuthorityCommittedManifestChainWriter _authorityCommittedManifestChainWriter =
        authorityCommittedManifestChainWriter ?? throw new ArgumentNullException(nameof(authorityCommittedManifestChainWriter));

    private readonly IOptionsMonitor<DemoOptions> _demoOptions = demoOptions ?? throw new ArgumentNullException(nameof(demoOptions));

    private static readonly JsonSerializerOptions DemoExportPersistJsonOptions = new(JsonSerializerDefaults.Web);

    /// <inheritdoc/>
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        ContosoRetailDemoIds demo = ContosoRetailDemoIds.ForTenant(scope.TenantId);
        await EnsureRequestAsync(demo, cancellationToken);
        await EnsureCommittedRunAsync(demo, demo.AuthorityRunBaselineId, demo.TaskBaseline, demo.ResultBaseline, demo.ManifestBaseline, demo.TraceBaseline,
            false, cancellationToken);
        await EnsureCommittedRunAsync(demo, demo.AuthorityRunHardenedId, demo.TaskHardened, demo.ResultHardened, demo.ManifestHardened, demo.TraceHardened,
            true, cancellationToken);
        await EnsureGovernanceAsync(demo, cancellationToken);
        await EnsureExportRecordAsync(demo, cancellationToken);
        await EnsureNorthwindProductTourWorkspaceSeedAsync(scope, cancellationToken);
        await EnsureMeridianAlpineRegulatedScenarioWorkspaceSeedAsync(scope, cancellationToken);
        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Demo seed completed (Contoso Retail Modernization). Runs: {Baseline}, {Hardened}.", demo.RunBaseline, demo.RunHardened);
    }

    /// <inheritdoc/>
    public async Task SeedTrialWelcomeRunAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Guid welcomeRunGuid = ContosoRetailDemoIds.TrialWelcomeAuthorityRunId(scope.TenantId);
        string requestId = ContosoRetailDemoIds.TrialWelcomeRequestId(scope.TenantId);
        string manifestVersion = ContosoRetailDemoIds.TrialWelcomeManifestVersion(scope.TenantId);
        (string topoTaskId, string costTaskId, string compTaskId, string topoResultId, string costResultId, string compResultId) =
            ContosoRetailDemoIds.TrialWelcomeAgentKeys(scope.TenantId);

        if (await runRepository.GetByIdAsync(scope, welcomeRunGuid, cancellationToken) is not null)
            return;

        await EnsureTrialWelcomeRequestAsync(requestId, cancellationToken);
        string legacyRunId = welcomeRunGuid.ToString("N");
        const string systemName = "Contoso Online Store";
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
            RunId = legacyRunId,
            AgentType = AgentType.Topology,
            Objective =
                "Propose Azure landing targets for storefront, BFF, catalog, orders, and payment integration with Front Door and private egress.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = TrialWelcomeSeedUtc,
            CompletedUtc = TrialWelcomeSeedUtc,
            EvidenceBundleRef = null,
            AllowedTools = [],
            AllowedSources = []
        };
        AgentTask costTask = new()
        {
            TaskId = costTaskId,
            RunId = legacyRunId,
            AgentType = AgentType.Cost,
            Objective =
                "Estimate monthly run-rate for Front Door, Container Apps (consumption profile), Azure SQL (GP tier), and Redis P1 with dev/test mirrors.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = TrialWelcomeSeedUtc,
            CompletedUtc = TrialWelcomeSeedUtc,
            EvidenceBundleRef = null,
            AllowedTools = [],
            AllowedSources = []
        };
        AgentTask compTask = new()
        {
            TaskId = compTaskId,
            RunId = legacyRunId,
            AgentType = AgentType.Compliance,
            Objective =
                "Validate PCI boundaries for checkout, EU residency for PII, Key Vault secret rotation, and Defender for Cloud baseline coverage.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = TrialWelcomeSeedUtc,
            CompletedUtc = TrialWelcomeSeedUtc,
            EvidenceBundleRef = null,
            AllowedTools = [],
            AllowedSources = []
        };
        await taskRepository.CreateManyAsync([topoTask, costTask, compTask], cancellationToken);
        AgentResult topoResult = new()
        {
            ResultId = topoResultId,
            TaskId = topoTaskId,
            RunId = legacyRunId,
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
            RunId = legacyRunId,
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
            RunId = legacyRunId,
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
        GoldenManifest manifest = BuildTrialWelcomeManifest(legacyRunId, manifestVersion);
        IReadOnlyList<Finding> findings = BuildTrialWelcomeFindings(welcomeRunGuid);
        AuthorityChainKeying chainKeying = new(AuthorityDemoChainIds.Manifest(welcomeRunGuid), AuthorityDemoChainIds.ContextSnapshot(welcomeRunGuid),
            AuthorityDemoChainIds.GraphSnapshot(welcomeRunGuid), AuthorityDemoChainIds.FindingsSnapshot(welcomeRunGuid),
            AuthorityDemoChainIds.DecisionTrace(welcomeRunGuid));
        AuthorityManifestPersistResult authorityChain = await _authorityCommittedManifestChainWriter.PersistCommittedChainAsync(scope, welcomeRunGuid, systemName, manifest,
            chainKeying, TrialWelcomeSeedUtc, richFindingsAndGraph: true, cancellationToken, connection: null, transaction: null,
            committedFindingsOverride: findings);
        await AuthorityCommittedChainDurableAudit.TryLogAsync(_auditService, scopeContextProvider, _actorContext, logger, welcomeRunGuid, systemName, authorityChain,
            "trial-welcome-seed", richFindingsAndGraph: true, cancellationToken);
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
            await runRepository.UpdateAsync(authorityCommitted, cancellationToken);
        }

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
                    Name = "Executive architecture analysis (trial welcome)",
                    Format = "Markdown",
                    Content =
                        "# Contoso Online Store — Azure migration readout\n\n"
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
        RunRecord? withBundle = await runRepository.GetByIdAsync(scope, welcomeRunGuid, cancellationToken);

        if (withBundle is not null)
        {
            withBundle.ArtifactBundleId = bundleId;
            await runRepository.UpdateAsync(withBundle, cancellationToken);
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
            SystemName = "Contoso Online Store",
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
            SystemName = "Contoso Online Store",
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
                    "The design references geo-redundant SQL with automatic failover groups; run a game-day that forces read/write cutover while checkout traffic is replayed so recovery time stays inside the four-hour executive target."
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
        "Contoso Online Store is retiring a decade-old monolith that still serves catalog search, cart, checkout, and payment handoff from shared VMs. "
        + "Leadership chose Azure for elastic scale ahead of peak holidays. The target exposes a React storefront on Azure Static Web Apps behind Azure Front Door with regional WAF rules, OWASP defaults, and bot management. "
        + "A Node commerce BFF runs on Azure Container Apps inside a dedicated spoke, calling catalog and order microservices that are also on Container Apps with workload identities to Azure SQL and Redis. "
        + "Checkout never persists payment cards; instead a payment adapter integrates with an external processor over private connectivity and Key Vault–backed secrets. "
        + "Customer profile data must stay in EU regions, so primary writes land in a West Europe Azure SQL failover group with geo-redundant backups, while media sits in zone-redundant storage accounts with lifecycle rules. "
        + "Observability standardizes on Application Insights with distributed tracing across Front Door, BFF, and downstream APIs, plus budget alerts tied to cost management exports. "
        + "Delivery follows a strangler pattern: extract catalog and inventory read paths first, then checkout orchestration, while legacy APIs remain behind compatibility routes until traffic drains. "
        + "Quality gates include blue/green releases for the storefront, automated failover tests for SQL, chaos drills on private link dependencies, and quarterly tabletop exercises for payment outages. "
        + "Executive constraints include EU residency for PII, an order-path recovery time under four hours, and elimination of any public SQL endpoints.";

    private async Task EnsureRequestAsync(ContosoRetailDemoIds demo, CancellationToken cancellationToken)
    {
        if (await requestRepository.GetByIdAsync(demo.RequestId, cancellationToken) is not null)
            return;
        ArchitectureRequest request = new()
        {
            RequestId = demo.RequestId,
            Description = "Contoso Retail modernization — migrate monolith checkout to Azure with PCI-aware boundaries.",
            SystemName = "Contoso Retail Platform",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints = ["Minimize public ingress", "Retain existing payment processor integration"]
        };
        await requestRepository.CreateAsync(request, cancellationToken);
    }

    private async Task EnsureCommittedRunAsync(ContosoRetailDemoIds demo, Guid authorityRunId, string taskId, string resultId, string manifestVersion,
        string traceId, bool isHardened, CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        if (await runRepository.GetByIdAsync(scope, authorityRunId, cancellationToken) is not null)
            return;
        string legacyRunId = authorityRunId.ToString("N");
        RunRecord authorityRow = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = authorityRunId,
            ProjectId = "Contoso Retail Platform",
            Description =
                isHardened
                    ? "Demo — Contoso retail hardened manifest (trusted baseline seed)."
                    : "Demo — Contoso retail baseline manifest (trusted baseline seed).",
            CreatedUtc = DemoUtc,
            ArchitectureRequestId = demo.RequestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            IsSample = ShouldMarkSeededRunAsSample(scope.TenantId)
        };
        await runRepository.SaveAsync(authorityRow, cancellationToken);
        AgentTask task = new()
        {
            TaskId = taskId,
            RunId = legacyRunId,
            AgentType = AgentType.Topology,
            Objective =
                isHardened
                    ? "Hardened topology: add WAF, Key Vault references, and segmented subnets for retail APIs."
                    : "Baseline topology: single App Service and SQL for retail checkout (minimal segmentation).",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = DemoUtc,
            CompletedUtc = DemoUtc,
            EvidenceBundleRef = null,
            AllowedTools = [],
            AllowedSources = []
        };
        await taskRepository.CreateManyAsync([task], cancellationToken);
        AgentResult result = new()
        {
            ResultId = resultId,
            TaskId = taskId,
            RunId = legacyRunId,
            AgentType = AgentType.Topology,
            Claims =
            [
                isHardened
                    ? "Proposed hardened retail edge with WAF and private connectivity to payment dependencies."
                    : "Proposed consolidated App Service tier with direct SQL connectivity for faster initial rollout."
            ],
            EvidenceRefs = ["contoso-policy-retail-001"],
            Confidence = isHardened ? 0.88 : 0.72,
            Findings = [],
            ProposedChanges = null,
            CreatedUtc = DemoUtc
        };
        await resultRepository.CreateAsync(result, cancellationToken);
        bool richSeed = IsVerticalDemoSeedDepth(_demoOptions.CurrentValue.SeedDepth);
        GoldenManifest manifest = BuildManifest(legacyRunId, manifestVersion, isHardened, richSeed);
        AuthorityChainKeying chainKeying = new(AuthorityDemoChainIds.Manifest(authorityRunId), AuthorityDemoChainIds.ContextSnapshot(authorityRunId),
            AuthorityDemoChainIds.GraphSnapshot(authorityRunId), AuthorityDemoChainIds.FindingsSnapshot(authorityRunId),
            AuthorityDemoChainIds.DecisionTrace(authorityRunId));
        AuthorityManifestPersistResult authorityChain = await _authorityCommittedManifestChainWriter.PersistCommittedChainAsync(scope, authorityRunId,
            "Contoso Retail Platform", manifest, chainKeying, DemoUtc, richSeed, cancellationToken);
        await AuthorityCommittedChainDurableAudit.TryLogAsync(_auditService, scopeContextProvider, _actorContext, logger, authorityRunId,
            "Contoso Retail Platform", authorityChain, "demo-seed", richSeed, cancellationToken);
        // Decision-trace persistence happens inside PersistCommittedChainAsync above (AuthorityDecisionTrace
        // FK-chain row keyed by chainKeying.DecisionTraceId). The legacy second write to dbo.DecisionTraces
        // via ICoordinatorDecisionTraceRepository was removed in ADR 0030 PR A3 (2026-04-24) along with the
        // interface itself. The traceId / event-shape metadata is no longer surfaced for the demo seed because
        // ArchitectureRunDetail.DecisionTraces now reads from AuthorityDecisionTraces (see RunDetailQueryService).
        _ = traceId;
        RunRecord? authorityCommitted = await runRepository.GetByIdAsync(scope, authorityRunId, cancellationToken);
        if (authorityCommitted is not null)
        {
            authorityCommitted.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed);
            authorityCommitted.CurrentManifestVersion = manifestVersion;
            authorityCommitted.CompletedUtc = DemoUtc;
            authorityCommitted.ContextSnapshotId = authorityChain.ContextSnapshotId;
            authorityCommitted.GraphSnapshotId = authorityChain.GraphSnapshotId;
            authorityCommitted.FindingsSnapshotId = authorityChain.FindingsSnapshotId;
            authorityCommitted.GoldenManifestId = authorityChain.GoldenManifestId;
            authorityCommitted.DecisionTraceId = authorityChain.DecisionTraceId;
            await runRepository.UpdateAsync(authorityCommitted, cancellationToken);
        }
    }

    private static bool IsVerticalDemoSeedDepth(string? seedDepth)
    {
        if (string.IsNullOrWhiteSpace(seedDepth))
            return false;
        return string.Equals(seedDepth.Trim(), "vertical", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(seedDepth.Trim(), "full", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(seedDepth.Trim(), "production-realistic", StringComparison.OrdinalIgnoreCase);
    }

    private static GoldenManifest BuildManifest(string runId, string manifestVersion, bool isHardened, bool richSeed)
    {
        ManifestGovernance gov = isHardened
            ? new ManifestGovernance
            {
                ComplianceTags = ["PCI-DSS", "SOC2"],
                PolicyConstraints = ["No public SQL endpoints", "Secrets in Key Vault only"],
                RequiredControls = ["WAF", "PrivateLink", "DefenderForCloud"],
                RiskClassification = "Moderate",
                CostClassification = "Moderate"
            }
            : new ManifestGovernance
            {
                ComplianceTags = ["PCI-DSS"],
                PolicyConstraints = ["HTTPS only"],
                RequiredControls = ["TLS-1.2"],
                RiskClassification = "High",
                CostClassification = "Low"
            };
        // ADR 0030 owner Decision B (2026-04-23): quickstart writes one-of-each minimum (single
        // service + datastore + relationship); vertical writes the production-realistic depth
        // (multiple services + datastore + relationships including a service-to-service edge).
        string checkoutServiceId = isHardened ? "svc-checkout-api-v2" : "svc-checkout-api-v1";
        string ordersDatastoreId = isHardened ? "ds-orders-v2" : "ds-orders-v1";
        List<ManifestService> services =
        [
            new()
            {
                ServiceId = checkoutServiceId,
                ServiceName = "Checkout API",
                ServiceType = ServiceType.Api,
                RuntimePlatform = isHardened ? RuntimePlatform.ContainerApps : RuntimePlatform.AppService,
                Purpose = "Orchestrates cart and payment initiation.",
                Tags = isHardened ? ["edge-hardened"] : ["legacy-monolith"],
                RequiredControls = isHardened ? ["WAF", "ManagedIdentity"] : ["BasicAuthOff"]
            }
        ];
        List<ManifestDatastore> datastores =
        [
            new()
            {
                DatastoreId = ordersDatastoreId,
                DatastoreName = "Orders DB",
                DatastoreType = DatastoreType.Sql,
                RuntimePlatform = RuntimePlatform.SqlServer,
                Purpose = "Order and payment state."
            }
        ];
        List<ManifestRelationship> relationships =
        [
            new()
            {
                RelationshipId = $"rel-{checkoutServiceId}-writes-{ordersDatastoreId}",
                SourceId = checkoutServiceId,
                TargetId = ordersDatastoreId,
                RelationshipType = RelationshipType.WritesTo,
                Description = "Checkout API persists order and payment state."
            }
        ];
        if (!richSeed)
            return new GoldenManifest
            {
                RunId = runId,
                SystemName = "Contoso Retail Platform",
                Services = services,
                Datastores = datastores,
                Relationships = relationships,
                Governance = gov,
                Metadata = new ManifestMetadata
                {
                    ManifestVersion = manifestVersion,
                    ParentManifestVersion = null,
                    ChangeDescription = isHardened ? "Hardened retail posture" : "Baseline lift-and-shift",
                    DecisionTraceIds = [],
                    CreatedUtc = DemoUtc
                }
            };
        string paymentServiceId = isHardened ? "svc-payment-gateway-v2" : "svc-payment-gateway-v1";
        services.Add(new ManifestService
        {
            ServiceId = paymentServiceId,
            ServiceName = "Payment Gateway",
            ServiceType = ServiceType.Api,
            RuntimePlatform = isHardened ? RuntimePlatform.ContainerApps : RuntimePlatform.AppService,
            Purpose = "Tokenizes card data and brokers payment provider calls.",
            Tags = isHardened ? ["edge-hardened", "pci-scope"] : ["pci-scope"],
            RequiredControls = isHardened ? ["WAF", "ManagedIdentity", "PrivateLink"] : ["TLS-1.2"]
        });
        relationships.Add(new ManifestRelationship
        {
            RelationshipId = $"rel-{checkoutServiceId}-calls-{paymentServiceId}",
            SourceId = checkoutServiceId,
            TargetId = paymentServiceId,
            RelationshipType = RelationshipType.Calls,
            Description = "Checkout API invokes the Payment Gateway during order finalization."
        });
        relationships.Add(new ManifestRelationship
        {
            RelationshipId = $"rel-{paymentServiceId}-reads-{ordersDatastoreId}",
            SourceId = paymentServiceId,
            TargetId = ordersDatastoreId,
            RelationshipType = RelationshipType.ReadsFrom,
            Description = "Payment Gateway reads order context for reconciliation."
        });
        return new GoldenManifest
        {
            RunId = runId,
            SystemName = "Contoso Retail Platform",
            Services = services,
            Datastores = datastores,
            Relationships = relationships,
            Governance = gov,
            Metadata = new ManifestMetadata
            {
                ManifestVersion = manifestVersion,
                ParentManifestVersion = null,
                ChangeDescription = isHardened ? "Hardened retail posture" : "Baseline lift-and-shift",
                DecisionTraceIds = [],
                CreatedUtc = DemoUtc
            }
        };
    }

    private async Task EnsureGovernanceAsync(ContosoRetailDemoIds demo, CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        if (await approvalRepository.GetByIdAsync(demo.ApprovalRequest, cancellationToken) is null)
        {
            GovernanceApprovalRequest approval = new()
            {
                ApprovalRequestId = demo.ApprovalRequest,
                RunId = demo.RunHardened,
                ManifestVersion = demo.ManifestHardened,
                SourceEnvironment = GovernanceEnvironment.Dev,
                TargetEnvironment = GovernanceEnvironment.Test,
                Status = GovernanceApprovalStatus.Approved,
                RequestedBy = "demo.architect@contoso.com",
                ReviewedBy = "demo.reviewer@contoso.com",
                RequestComment = "Promote hardened retail manifest to test for integration validation.",
                ReviewComment = "Approved — controls and WAF requirements satisfied in manifest.",
                RequestedUtc = DemoUtc,
                ReviewedUtc = DemoUtc.AddHours(2)
            };
            StampGovernanceScope(scope, approval);
            await approvalRepository.CreateAsync(approval, cancellationToken);
        }

        IReadOnlyList<GovernancePromotionRecord> promos = await promotionRepository.GetByRunIdAsync(demo.RunHardened, cancellationToken);
        if (promos.All(p => p.PromotionRecordId != demo.PromotionRecord))
        {
            GovernancePromotionRecord promotion = new()
            {
                PromotionRecordId = demo.PromotionRecord,
                RunId = demo.RunHardened,
                ManifestVersion = demo.ManifestHardened,
                SourceEnvironment = GovernanceEnvironment.Dev,
                TargetEnvironment = GovernanceEnvironment.Test,
                PromotedBy = "demo.release@contoso.com",
                PromotedUtc = DemoUtc.AddHours(3),
                ApprovalRequestId = demo.ApprovalRequest,
                Notes = "Demo promotion after approval (trusted baseline seed)."
            };
            StampGovernanceScope(scope, promotion);
            await promotionRepository.CreateAsync(promotion, cancellationToken);
        }

        await EnsureActivationAsync(scope, demo.ActivationDev, demo.RunBaseline, demo.ManifestBaseline, GovernanceEnvironment.Dev, cancellationToken);
        await EnsureActivationAsync(scope, demo.ActivationTest, demo.RunHardened, demo.ManifestHardened, GovernanceEnvironment.Test, cancellationToken);
    }

    private async Task EnsureActivationAsync(ScopeContext scope, string activationId, string runId, string manifestVersion, string environment,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<GovernanceEnvironmentActivation> rows = await activationRepository.GetByEnvironmentAsync(environment, cancellationToken);
        if (rows.Any(r => r.ActivationId == activationId))
            return;
        GovernanceEnvironmentActivation activation = new()
        {
            ActivationId = activationId,
            RunId = runId,
            ManifestVersion = manifestVersion,
            Environment = environment,
            IsActive = true,
            ActivatedUtc = DemoUtc
        };
        StampGovernanceScope(scope, activation);
        await activationRepository.CreateAsync(activation, cancellationToken);
    }

    private static void StampGovernanceScope(ScopeContext scope, GovernanceApprovalRequest row)
    {
        if (scope.TenantId == Guid.Empty)
            return;
        row.TenantId = scope.TenantId;
        row.WorkspaceId = scope.WorkspaceId;
        row.ProjectId = scope.ProjectId;
    }

    private static void StampGovernanceScope(ScopeContext scope, GovernancePromotionRecord row)
    {
        if (scope.TenantId == Guid.Empty)
            return;
        row.TenantId = scope.TenantId;
        row.WorkspaceId = scope.WorkspaceId;
        row.ProjectId = scope.ProjectId;
    }

    private static void StampGovernanceScope(ScopeContext scope, GovernanceEnvironmentActivation row)
    {
        if (scope.TenantId == Guid.Empty)
            return;
        row.TenantId = scope.TenantId;
        row.WorkspaceId = scope.WorkspaceId;
        row.ProjectId = scope.ProjectId;
    }

    private async Task EnsureNorthwindProductTourWorkspaceSeedAsync(ScopeContext contosoBaselineScope, CancellationToken cancellationToken)
    {
        if (contosoBaselineScope.TenantId != ScopeIds.DefaultTenant)

            return;

        Guid ws = DemoTourWorkspaceIds.WorkspaceRowId(contosoBaselineScope.TenantId);
        Guid scopeProjectId = DemoTourWorkspaceIds.ProjectScopeRowId(contosoBaselineScope.TenantId);
        ScopeContext workspaceScope =
            new()
            {
                TenantId = contosoBaselineScope.TenantId,
                WorkspaceId = ws,
                ProjectId = scopeProjectId
            };

        using (AmbientScopeContext.Push(workspaceScope))

            await EnsureNorthwindProductTourCommittedScenarioAsync(workspaceScope, cancellationToken);
    }

    private async Task EnsureNorthwindProductTourCommittedScenarioAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        Guid runGuid = DemoTourWorkspaceIds.AuthorityRunId(scope.TenantId);
        if (await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken) is not null)

            return;

        string requestId = DemoTourWorkspaceIds.ArchitectureRequestId(scope.TenantId);
        await EnsureArchitectureRequestNorthwindTourAsync(requestId, cancellationToken);
        DateTime utc = ProductTourWorkspaceSeed.SnapshotUtc;
        string legacyRunId = runGuid.ToString("N");
        string demoSuffix = ProductTourDemoSuffix(scope.TenantId);
        string taskId = $"task-product-tour-topo-{demoSuffix}";
        string resultId = $"result-product-tour-topo-{demoSuffix}";
        RunRecord row = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = runGuid,
            ProjectId = "Contoso Cloud Platform",
            Description = "Northwind Architects — Workspace A Product Tour (synthetic Contoso Cloud Platform review).",
            CreatedUtc = utc,
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
        };

        await _runRepository.SaveAsync(row, cancellationToken);
        AgentTask task = new()
        {
            TaskId = taskId,
            RunId = legacyRunId,
            AgentType = AgentType.Topology,
            Objective = "Demonstrate authoritative capture→evidence→findings→decisions spine for evaluator tour.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = utc,
            CompletedUtc = utc,
            EvidenceBundleRef = null,
            AllowedTools = [],
            AllowedSources = [],
        };

        await _taskRepository.CreateManyAsync([task], cancellationToken);
        AgentResult result = new()
        {
            ResultId = resultId,
            TaskId = taskId,
            RunId = legacyRunId,
            AgentType = AgentType.Topology,
            Claims =
            [
                "Synthetic APIM + ACA + Cosmos + KV topology aligned to seeded evidence attachments.",
                "Northwind engagement shell reviews Contoso modernization boundaries without invoking customer payloads.",
            ],
            EvidenceRefs = ["northwind-tour-overview"],
            Confidence = 0.9,
            Findings = [],
            ProposedChanges = null,
            CreatedUtc = utc,
        };

        await _resultRepository.CreateAsync(result, cancellationToken);
        GoldenManifest manifest = ProductTourWorkspaceSeed.BuildManifest(legacyRunId);
        IReadOnlyList<Finding> findings = ProductTourWorkspaceSeed.BuildFindings(runGuid);
        AuthorityChainKeying chainIds = new(AuthorityDemoChainIds.Manifest(runGuid), AuthorityDemoChainIds.ContextSnapshot(runGuid),
            AuthorityDemoChainIds.GraphSnapshot(runGuid), AuthorityDemoChainIds.FindingsSnapshot(runGuid), AuthorityDemoChainIds.DecisionTrace(runGuid));

        AuthorityCommittedChainSeedCustomization customization = ProductTourWorkspaceSeed.BuildCustomization(runGuid,
            AuthorityDemoChainIds.GraphSnapshot(runGuid), AuthorityDemoChainIds.ContextSnapshot(runGuid), utc);

        AuthorityManifestPersistResult persisted = await _authorityCommittedManifestChainWriter.PersistCommittedChainAsync(scope, runGuid, "Contoso Cloud Platform",
            manifest, chainIds, utc, richFindingsAndGraph: false, cancellationToken, connection: null, transaction: null, committedFindingsOverride: findings,
            seedCustomization: customization);

        await AuthorityCommittedChainDurableAudit.TryLogAsync(_auditService, _scopeContextProvider, _actorContext, logger, runGuid,
            "Contoso Cloud Platform", persisted, "product-tour-demo-seed", richFindingsAndGraph: false, cancellationToken);

        RunRecord? committed = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (committed is not null)
        {
            committed.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed);
            committed.CurrentManifestVersion = ProductTourWorkspaceSeed.ManifestVersionLiteral;
            committed.CompletedUtc = utc;
            committed.ContextSnapshotId = persisted.ContextSnapshotId;
            committed.GraphSnapshotId = persisted.GraphSnapshotId;
            committed.FindingsSnapshotId = persisted.FindingsSnapshotId;
            committed.GoldenManifestId = persisted.GoldenManifestId;
            committed.DecisionTraceId = persisted.DecisionTraceId;
            await _runRepository.UpdateAsync(committed, cancellationToken);
        }

        Guid bundleId = DemoTourWorkspaceIds.ArtifactBundleId(runGuid);
        ArtifactBundle bundle = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            BundleId = bundleId,
            RunId = runGuid,
            ManifestId = persisted.GoldenManifestId,
            CreatedUtc = utc,
            Status = ArtifactBundleStatus.Available,
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactId = DemoTourWorkspaceIds.TourReportArtifactId(runGuid),
                    RunId = runGuid,
                    ManifestId = persisted.GoldenManifestId,
                    CreatedUtc = utc,
                    ArtifactType = ArtifactType.ArchitectureNarrative,
                    Name = "northwind-architecture-review-tour-sample.md",
                    Format = "text/markdown",
                    Content =
                        "# Architecture review tour — synthetic export scaffold\n\n"
                        + "**Reviewer firm:** Northwind Architects (fabricated)\\n\\n"
                        + "**Subject system:** Contoso Cloud Platform (synthetic modernization narrative)\\n\\n"
                        + "Demonstrates how evaluators finalize a workspace and initiate export without mutating seeded authority rows.",
                    ContentHash = "sha256:product-tour-export-seed-v1",
                    Metadata = new Dictionary<string, string> { ["workspace"] = "product-tour" },
                    ContributingDecisionIds = [],
                },
            ],
            Trace = new SynthesisTrace(),
        };

        await _artifactBundleRepository.SaveAsync(bundle, cancellationToken);
        RunRecord? withBundle = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (withBundle is not null)
        {
            withBundle.ArtifactBundleId = bundleId;
            await _runRepository.UpdateAsync(withBundle, cancellationToken);
        }

        await EnsureNorthwindTourExportStubAsync(runGuid, scope.TenantId, cancellationToken);

        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Northwind Product Tour Workspace A seeded ({RunId}).", runGuid);
    }

    private async Task EnsureArchitectureRequestNorthwindTourAsync(string requestId, CancellationToken cancellationToken)
    {
        if (await requestRepository.GetByIdAsync(requestId, cancellationToken) is not null)

            return;

        ArchitectureRequest architectureRequest = new()
        {
            RequestId = requestId,
            Description =
                "Northwind Architects (consultant) conducts a fabricated architecture review engagement for "
                + "the Contoso Cloud Platform modernization backlog — onboarding Product Tour storyline only.",
            SystemName = "Contoso Cloud Platform",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints =
            [
                "Maintain evaluation-mode synthetic content only — no linkage to buyer production subscriptions",
                "Expose Pack A/B rule identifiers for evaluator education",
                "Evidence attachments are illustrative PDF/JSON placeholders",
            ],
        };

        await requestRepository.CreateAsync(architectureRequest, cancellationToken);
    }

    private async Task EnsureNorthwindTourExportStubAsync(Guid runGuid, Guid tenantId, CancellationToken cancellationToken)
    {
        string exportId = DemoTourWorkspaceIds.ExportRecordId(tenantId).ToString("N");

        if (await runExportRecordRepository.GetByIdAsync(exportId, cancellationToken) is not null)

            return;

        RunExportRecord record = new()
        {
            ExportRecordId = exportId,
            RunId = runGuid.ToString("N"),
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "northwind-architecture-review-tour-sample.md",
            TemplateProfile = "trial",
            TemplateProfileDisplayName = "Buyer-safe tour export",
            WasAutoSelected = false,
            ResolutionReason = "Demonstrates evaluator export workflow without invoking paid synthesis.",
            ManifestVersion = ProductTourWorkspaceSeed.ManifestVersionLiteral,
            Notes =
                "Seeded Workspace A artifact — regenerate after tour refresh milestones. dbo.TenantWorkspaces.IsDemoWorkspace=1 excludes fixture from SKU math once billing gates honour the flag.",
            IncludedManifest = true,
            IncludedSummary = true,
            CreatedUtc = ProductTourWorkspaceSeed.SnapshotUtc,
        };

        await runExportRecordRepository.CreateAsync(record, cancellationToken);
    }

    private async Task EnsureMeridianAlpineRegulatedScenarioWorkspaceSeedAsync(ScopeContext contosoBaselineScope, CancellationToken cancellationToken)
    {
        if (contosoBaselineScope.TenantId != ScopeIds.DefaultTenant)
            return;

        Guid ws = DemoRegulatedScenarioWorkspaceIds.WorkspaceRowId(contosoBaselineScope.TenantId);
        Guid scopeProjectId = DemoRegulatedScenarioWorkspaceIds.ProjectScopeRowId(contosoBaselineScope.TenantId);
        ScopeContext workspaceScope =
            new()
            {
                TenantId = contosoBaselineScope.TenantId,
                WorkspaceId = ws,
                ProjectId = scopeProjectId
            };

        using (AmbientScopeContext.Push(workspaceScope))
            await EnsureMeridianAlpineRegulatedCommittedScenarioAsync(workspaceScope, cancellationToken);
    }

    private async Task EnsureMeridianAlpineRegulatedCommittedScenarioAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        Guid runGuid = DemoRegulatedScenarioWorkspaceIds.AuthorityRunId(scope.TenantId);

        if (await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken) is not null)

            return;

        string requestId = DemoRegulatedScenarioWorkspaceIds.ArchitectureRequestId(scope.TenantId);
        await EnsureArchitectureRequestAlpineRegulatedDemoAsync(requestId, cancellationToken);
        DateTime utc = RegulatedScenarioWorkspaceSeed.SnapshotUtc;
        string legacyRunId = runGuid.ToString("N");
        string demoSuffix = ProductTourDemoSuffix(scope.TenantId);
        string taskId = $"task-regulated-demo-topo-{demoSuffix}";
        string resultId = $"result-regulated-demo-topo-{demoSuffix}";
        const string alpineSystemName = "Alpine Patient Risk Scoring Platform";

        RunRecord row = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = runGuid,
            ProjectId = alpineSystemName,
            Description =
                "Meridian Advisory Group (whitelabel) — Workspace B synthetic regulated AI governance review "
                + "for Alpine Health Innovations (patient risk scoring; PHI-free evaluator fixture).",
            CreatedUtc = utc,
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
        };

        await _runRepository.SaveAsync(row, cancellationToken);

        AgentTask task = new()
        {
            TaskId = taskId,
            RunId = legacyRunId,
            AgentType = AgentType.Topology,
            Objective =
                "Synthetic capture of inference, training orchestration, and classified data lake partitions for evaluator governance storyline.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = utc,
            CompletedUtc = utc,
            EvidenceBundleRef = null,
            AllowedTools = [],
            AllowedSources = [],
        };

        await _taskRepository.CreateManyAsync([task], cancellationToken);

        AgentResult result = new()
        {
            ResultId = resultId,
            TaskId = taskId,
            RunId = legacyRunId,
            AgentType = AgentType.Topology,
            Claims =
            [
                "Model serving + AML training subgraph aligned to seeded registry/classification attachments (synthetic tenant).",
                "Demonstrates Responsible AI governance signals without referencing real PHI.",
            ],
            EvidenceRefs = ["meridian-regulated-overview"],
            Confidence = 0.88,
            Findings = [],
            ProposedChanges = null,
            CreatedUtc = utc,
        };

        await _resultRepository.CreateAsync(result, cancellationToken);
        GoldenManifest manifest = RegulatedScenarioWorkspaceSeed.BuildManifest(legacyRunId);
        IReadOnlyList<Finding> findings = RegulatedScenarioWorkspaceSeed.BuildFindings(runGuid);
        AuthorityChainKeying chainIds = new(AuthorityDemoChainIds.Manifest(runGuid), AuthorityDemoChainIds.ContextSnapshot(runGuid),
            AuthorityDemoChainIds.GraphSnapshot(runGuid), AuthorityDemoChainIds.FindingsSnapshot(runGuid), AuthorityDemoChainIds.DecisionTrace(runGuid));

        AuthorityCommittedChainSeedCustomization customization = RegulatedScenarioWorkspaceSeed.BuildCustomization(runGuid,
            AuthorityDemoChainIds.GraphSnapshot(runGuid), AuthorityDemoChainIds.ContextSnapshot(runGuid), utc);

        AuthorityManifestPersistResult persisted = await _authorityCommittedManifestChainWriter.PersistCommittedChainAsync(scope, runGuid,
            alpineSystemName, manifest, chainIds, utc, richFindingsAndGraph: false, cancellationToken, connection: null, transaction: null,
            committedFindingsOverride: findings, seedCustomization: customization);

        await AuthorityCommittedChainDurableAudit.TryLogAsync(_auditService, _scopeContextProvider, _actorContext, logger, runGuid,
            alpineSystemName, persisted, "regulated-scenario-demo-seed", richFindingsAndGraph: false, cancellationToken);

        RunRecord? committed = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (committed is not null)
        {
            committed.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed);
            committed.CurrentManifestVersion = RegulatedScenarioWorkspaceSeed.ManifestVersionLiteral;
            committed.CompletedUtc = utc;
            committed.ContextSnapshotId = persisted.ContextSnapshotId;
            committed.GraphSnapshotId = persisted.GraphSnapshotId;
            committed.FindingsSnapshotId = persisted.FindingsSnapshotId;
            committed.GoldenManifestId = persisted.GoldenManifestId;
            committed.DecisionTraceId = persisted.DecisionTraceId;
            await _runRepository.UpdateAsync(committed, cancellationToken);
        }

        Guid bundleId = DemoRegulatedScenarioWorkspaceIds.ArtifactBundleId(runGuid);

        ArtifactBundle bundle = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            BundleId = bundleId,
            RunId = runGuid,
            ManifestId = persisted.GoldenManifestId,
            CreatedUtc = utc,
            Status = ArtifactBundleStatus.Available,
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactId = DemoRegulatedScenarioWorkspaceIds.RegulatedDeliverableArtifactId(runGuid),
                    RunId = runGuid,
                    ManifestId = persisted.GoldenManifestId,
                    CreatedUtc = utc,
                    ArtifactType = ArtifactType.ArchitectureNarrative,
                    Name = "meridian-alpine-governance-board-sample.md",
                    Format = "text/markdown",
                    Content =
                        "# Architecture review board — synthetic whitelabel sample\n\n"
                        + "**Firm:** " + RegulatedScenarioWorkspaceSeed.WhitelabelFirmDisplayName + " (consultant)\\n"
                        + "**Engagement:** " + RegulatedScenarioWorkspaceSeed.WhitelabelClientEngagementTitle + "\\n"
                        + "**Subject system:** " + alpineSystemName + " — synthetic healthtech modernization (no PHI).\\n"
                        + "**Logo reference (opaque):** `" + RegulatedScenarioWorkspaceSeed.WhitelabelLogoBlobReference + "`\\n\\n"
                        + "Invoke architecture review board export with matching `WhitelabelConfiguration`; "
                        + "`dbo.RunExportRecords.AnalysisRequestJson` mirrors hints for tooling pre-fill.",
                    ContentHash = "sha256:regulated-scenario-whitelabel-seed-v1",
                    Metadata =
                        new Dictionary<string, string>(StringComparer.Ordinal)
                        {
                            ["workspace"] = "regulated-demo",
                            ["whitelabelFirm"] = RegulatedScenarioWorkspaceSeed.WhitelabelFirmDisplayName,
                            ["whitelabelEngagement"] = RegulatedScenarioWorkspaceSeed.WhitelabelClientEngagementTitle,
                        },
                    ContributingDecisionIds = [],
                },
            ],
            Trace = new SynthesisTrace(),
        };

        await _artifactBundleRepository.SaveAsync(bundle, cancellationToken);
        RunRecord? withBundle = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (withBundle is not null)
        {
            withBundle.ArtifactBundleId = bundleId;
            await _runRepository.UpdateAsync(withBundle, cancellationToken);
        }

        await EnsureMeridianAlpineRegulatedExportStubAsync(runGuid, scope.TenantId, cancellationToken);

        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Meridian Alpine regulated Workspace B seeded ({RunId}).", runGuid);
    }

    private async Task EnsureArchitectureRequestAlpineRegulatedDemoAsync(string requestId, CancellationToken cancellationToken)
    {
        if (await requestRepository.GetByIdAsync(requestId, cancellationToken) is not null)

            return;

        ArchitectureRequest architectureRequest = new()
        {
            RequestId = requestId,
            Description =
                "Meridian Advisory Group leads a fabricated AI governance + security architecture review engagement for Alpine Health Innovations' "
                + "Patient Risk Scoring Platform — evaluator Workspace B storyline only.",
            SystemName = "Alpine Patient Risk Scoring Platform",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints =
            [
                "Strictly synthetic regulated narrative — forbid ingest of customer PHI inside evaluator tenants",
                "Surface ai-gov-* and sec-base-* policy identifiers for procurement education",
                "Evidence artifacts are illustrative exports / matrices / questionnaires only",
            ],
        };

        await requestRepository.CreateAsync(architectureRequest, cancellationToken);
    }

    private async Task EnsureMeridianAlpineRegulatedExportStubAsync(Guid runGuid, Guid tenantId, CancellationToken cancellationToken)
    {
        string exportId = DemoRegulatedScenarioWorkspaceIds.ExportRecordId(tenantId).ToString("N");

        if (await runExportRecordRepository.GetByIdAsync(exportId, cancellationToken) is not null)

            return;

        PersistedAnalysisExportRequest persistedHints = BuildWorkspaceBPersistedExportHints();

        RunExportRecord record = new()
        {
            ExportRecordId = exportId,
            RunId = runGuid.ToString("N"),
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "meridian-alpine-governance-board-sample.md",
            TemplateProfile = "regulated",
            TemplateProfileDisplayName = "Regulated review (Evaluator B)",
            WasAutoSelected = false,
            ResolutionReason =
                "Seeded Workspace B whitelabel + regulated profile hints for consulting exports / architecture review board UI pre-fill.",
            ManifestVersion = RegulatedScenarioWorkspaceSeed.ManifestVersionLiteral,
            Notes =
                "Workspace B export stub stores ReviewBoardWhitelabel* properties inside AnalysisRequestJson; logo bytes resolve from opaque LogoBlobReference in product hosts.",
            AnalysisRequestJson = JsonSerializer.Serialize(persistedHints, DemoExportPersistJsonOptions),
            IncludedManifest = true,
            IncludedSummary = true,
            CreatedUtc = RegulatedScenarioWorkspaceSeed.SnapshotUtc,
        };

        await runExportRecordRepository.CreateAsync(record, cancellationToken);
    }

    private static PersistedAnalysisExportRequest BuildWorkspaceBPersistedExportHints()
    {
        PersistedAnalysisExportRequest request =
            new()
            {
                TemplateProfile = "regulated",
                Audience = "regulatory-review-board",
                ExternalDelivery = true,
                ExecutiveFriendly = false,
                RegulatedEnvironment = true,
                NeedDetailedEvidence = true,
                NeedExecutionTraces = false,
                NeedDeterminismOrCompareAppendices = false,
                IncludeEvidence = true,
                IncludeExecutionTraces = true,
                IncludeManifest = true,
                IncludeDiagram = false,
                IncludeSummary = true,
                IncludeDeterminismCheck = false,
                DeterminismIterations = 0,
                IncludeManifestCompare = false,
                CompareManifestVersion = null,
                IncludeAgentResultCompare = false,
                CompareRunId = null,
                ReviewBoardWhitelabelFirmDisplayName = RegulatedScenarioWorkspaceSeed.WhitelabelFirmDisplayName,
                ReviewBoardWhitelabelClientEngagementTitle = RegulatedScenarioWorkspaceSeed.WhitelabelClientEngagementTitle,
                ReviewBoardWhitelabelLogoBlobReference = RegulatedScenarioWorkspaceSeed.WhitelabelLogoBlobReference,
                ReviewBoardWhitelabelFooterAttribution =
                    "Delivered by {FirmDisplayName} on behalf of Alpine Health Innovations (synthetic evaluator tenant)",
            };

        return request;
    }

    private static string ProductTourDemoSuffix(Guid tenantId)
    {
        if (tenantId == ScopeIds.DefaultTenant)
            return "canonical";

        string t = tenantId.ToString("N");

        return t.Length >= 12 ? t[..12] : t;
    }

    /// <summary>
    ///     Trusted-baseline Contoso fixtures on the canonical default tenant stay durable; guest-tenant demo seeds are
    ///     sample data eligible for OS-1b auto-purge.
    /// </summary>
    private static bool ShouldMarkSeededRunAsSample(Guid tenantId) => tenantId != ScopeIds.DefaultTenant;

    /// <summary>
    ///     Optional export <strong>history</strong> row for demos — not wired to consulting DOCX replay (no
    ///     AnalysisRequestJson).
    /// </summary>
    private async Task EnsureExportRecordAsync(ContosoRetailDemoIds demo, CancellationToken cancellationToken)
    {
        if (await runExportRecordRepository.GetByIdAsync(demo.ExportRecord, cancellationToken) is not null)
            return;
        RunExportRecord record = new()
        {
            ExportRecordId = demo.ExportRecord,
            RunId = demo.RunBaseline,
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "contoso-baseline-architecture.md",
            TemplateProfile = "internal",
            TemplateProfileDisplayName = "Internal Technical Review",
            WasAutoSelected = false,
            ResolutionReason = "Demo seed export snapshot.",
            ManifestVersion = demo.ManifestBaseline,
            Notes = "Seeded by ArchLucid trusted baseline demo (export history only).",
            IncludedManifest = true,
            IncludedSummary = true,
            CreatedUtc = DemoUtc
        };
        await runExportRecordRepository.CreateAsync(record, cancellationToken);
    }
}
