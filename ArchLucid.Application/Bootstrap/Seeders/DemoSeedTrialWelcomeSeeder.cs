using System.Threading;

using ArchLucid.Application.Authority;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Bootstrap.Seeders;

public sealed class DemoSeedTrialWelcomeSeeder
{
    private readonly DemoSeedSeederDependencies _deps;
    private readonly DemoSeedPersistenceChain _persistence;

    public DemoSeedTrialWelcomeSeeder(DemoSeedSeederDependencies deps, DemoSeedPersistenceChain persistence)
    {
        _deps = deps ?? throw new ArgumentNullException(nameof(deps));
        _persistence = persistence ?? throw new ArgumentNullException(nameof(persistence));
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _deps.ScopeContextProvider.GetCurrentScope();
        Guid welcomeRunGuid = ContosoRetailDemoIds.TrialWelcomeAuthorityRunId(scope.TenantId);
        string requestId = ContosoRetailDemoIds.TrialWelcomeRequestId(scope.TenantId);
        string manifestVersion = ContosoRetailDemoIds.TrialWelcomeManifestVersion(scope.TenantId);
        (string topoTaskId, string costTaskId, string compTaskId, string topoResultId, string costResultId, string compResultId) =
            ContosoRetailDemoIds.TrialWelcomeAgentKeys(scope.TenantId);

        if (await _deps.RunRepository.GetByIdAsync(scope, welcomeRunGuid, cancellationToken) is RunRecord existingWelcomeRun)
        {
            await DemoSeedSeederSupport.TryRepairSeededRunDescriptionAsync(_deps, existingWelcomeRun, cancellationToken);

            return;
        }

        await EnsureTrialWelcomeRequestAsync(requestId, cancellationToken);
        string runId = welcomeRunGuid.ToString("D");
        RunRecord authorityRow = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = welcomeRunGuid,
            ProjectId = TrialWelcomeWorkspaceSeed.SystemName,
            Description = "Trial welcome sample — ecommerce modernization to Azure.",
            CreatedUtc = TrialWelcomeWorkspaceSeed.SnapshotUtc,
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            IsDemoWelcomeRun = true,
            IsSample = true
        };
        await _persistence.SaveRunAsync(authorityRow, cancellationToken);
        AgentTask topoTask = new()
        {
            TaskId = topoTaskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Objective =
                "Propose Azure landing targets for storefront, BFF, catalog, orders, and payment integration with Front Door and private egress.",
            Status = AgentTaskStatus.Completed,
            CreatedUtc = TrialWelcomeWorkspaceSeed.SnapshotUtc,
            CompletedUtc = TrialWelcomeWorkspaceSeed.SnapshotUtc,
            EvidenceBundleRef = null,
            AllowedTools = DemoSeedSeederSupport.SeedAllowedTools(AgentType.Topology),
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
            CreatedUtc = TrialWelcomeWorkspaceSeed.SnapshotUtc,
            CompletedUtc = TrialWelcomeWorkspaceSeed.SnapshotUtc,
            EvidenceBundleRef = null,
            AllowedTools = DemoSeedSeederSupport.SeedAllowedTools(AgentType.Cost),
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
            CreatedUtc = TrialWelcomeWorkspaceSeed.SnapshotUtc,
            CompletedUtc = TrialWelcomeWorkspaceSeed.SnapshotUtc,
            EvidenceBundleRef = null,
            AllowedTools = DemoSeedSeederSupport.SeedAllowedTools(AgentType.Compliance),
            AllowedSources = []
        };
        await _persistence.SaveTasksAsync([topoTask, costTask, compTask], cancellationToken);
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
            CreatedUtc = TrialWelcomeWorkspaceSeed.SnapshotUtc
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
            CreatedUtc = TrialWelcomeWorkspaceSeed.SnapshotUtc
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
            CreatedUtc = TrialWelcomeWorkspaceSeed.SnapshotUtc
        };
        await _persistence.SaveResultsAsync([topoResult, costResult, compResult], cancellationToken);
        GoldenManifest manifest = TrialWelcomeWorkspaceSeed.BuildManifest(runId, manifestVersion);
        IReadOnlyList<Finding> findings = TrialWelcomeWorkspaceSeed.BuildFindings(welcomeRunGuid);
        AuthorityChainKeying chainKeying = new(AuthorityDemoChainIds.Manifest(welcomeRunGuid), AuthorityDemoChainIds.ContextSnapshot(welcomeRunGuid),
            AuthorityDemoChainIds.GraphSnapshot(welcomeRunGuid), AuthorityDemoChainIds.FindingsSnapshot(welcomeRunGuid),
            AuthorityDemoChainIds.DecisionTrace(welcomeRunGuid));
        AuthorityManifestPersistResult authorityChain = await _persistence.PersistCommittedChainAsync(
            scope,
            welcomeRunGuid,
            TrialWelcomeWorkspaceSeed.SystemName,
            manifest,
            chainKeying,
            TrialWelcomeWorkspaceSeed.SnapshotUtc,
            findings,
            "trial-welcome-seed",
            cancellationToken);

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
            CreatedUtc = TrialWelcomeWorkspaceSeed.SnapshotUtc,
            Status = ArtifactBundleStatus.Available,
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactId = TrialWelcomeSeedIds.AnalysisArtifactId(welcomeRunGuid),
                    RunId = welcomeRunGuid,
                    ManifestId = manifestKey,
                    CreatedUtc = TrialWelcomeWorkspaceSeed.SnapshotUtc,
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
        await _persistence.SaveArtifactBundleAsync(bundle, cancellationToken);
        await _persistence.CommitRunAsync(
            scope,
            welcomeRunGuid,
            authorityChain,
            new DemoSeedRunCommitOptions
            {
                ManifestVersion = manifestVersion,
                CompletedUtc = TrialWelcomeWorkspaceSeed.SnapshotUtc,
                ArtifactBundleId = bundleId,
            },
            cancellationToken);

        if (_deps.Logger.IsEnabled(LogLevel.Information))
            _deps.Logger.LogInformation("Trial welcome run seeded ({RunId}).", welcomeRunGuid);
    }

    private async Task EnsureTrialWelcomeRequestAsync(string requestId, CancellationToken cancellationToken)
    {
        if (await _deps.RequestRepository.GetByIdAsync(requestId, cancellationToken) is not null)
            return;

        ArchitectureRequest request = new()
        {
            RequestId = requestId,
            Description = TrialWelcomeWorkspaceSeed.ArchitectureBriefText,
            SystemName = TrialWelcomeWorkspaceSeed.SystemName,
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints =
            [
                "EU data residency for customer PII",
                "Checkout must stay outside in-scope cardholder database (tokenized processor handoff)",
                "RTO under four hours for transactional order path"
            ]
        };
        await _persistence.EnsureRequestAsync(request, cancellationToken);
    }
}
