using System.Text.Json;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Pins decision-grade findings on an executed run's SQL findings snapshot so finalize readiness scorecard
///     integration proofs do not depend on simulator output shape.
/// </summary>
internal static class FinalizeConflictSqlIntegrationFixture
{
    internal const string DeferredScorecardProofFindingId = "scorecard-proof-deferred";

    internal const string EvidenceIntegrityProofFindingId = "scorecard-proof-evidence-integrity";

    internal const string IntegrationDevUserId = "dev-user";

    private static readonly Guid EvidenceIntegrityProofPackageId =
        Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static readonly Guid PreCommitProofPolicyPackId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly ScopeContext DefaultScope = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject,
    };

    internal static Task InjectVerifyHypothesisScorecardFindingAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = "scorecard-proof-verify-hypothesis";
                finding.Title = "Exploratory hypothesis still needs evidence before publish.";
                finding.Rationale = "Treat as hypothesis until verified.";
                finding.PolicyRuleId = null;
                finding.EvidenceRefs = [];
            },
            cancellationToken);
    }

    internal static Task InjectDeferredScorecardFindingAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = DeferredScorecardProofFindingId;
                finding.Title = "Ingress hardening deferred until network review completes.";
                finding.Rationale = "Pinned for deterministic deferred scorecard SQL proof.";
                finding.PolicyRuleId = "deferred-scorecard-proof";
                finding.Severity = FindingSeverity.Warning;
            },
            cancellationToken);
    }

    internal static Task InjectContradictionScorecardFindingAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = "scorecard-proof-contradiction";
                finding.Title = "Diagram contradicts narrative on ingress path.";
                finding.Rationale = "Reconcile the contradiction before finalize.";
                finding.PolicyRuleId = "contradiction-scorecard-proof";
            },
            cancellationToken);
    }

    internal static Task InjectCannotDetermineScorecardFindingAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = "scorecard-proof-cannot-determine";
                finding.Title = "Cannot determine whether ingress allows public exposure.";
                finding.Rationale = "Insufficient evidence to confirm the ingress posture.";
                finding.PolicyRuleId = "cannot-determine-scorecard-proof";
                finding.Severity = FindingSeverity.Error;
            },
            cancellationToken);
    }

    internal static Task InjectBlockingScorecardFindingAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = "scorecard-proof-blocking-finding";
                finding.Title = "Public storage account exposes customer data.";
                finding.Rationale = "Policy violation requires disposition before finalize.";
                finding.PolicyRuleId = "blocking-scorecard-proof";
                finding.Severity = FindingSeverity.Critical;
            },
            cancellationToken);
    }

    internal static Task InjectCoverageGapScorecardFindingAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = "scorecard-proof-coverage-gap";
                finding.Title = "Uncovered requirement REQ-SCORECARD-PROOF lacks a design decision.";
                finding.Rationale = "Mandatory requirement still needs an architecture decision.";
                finding.PolicyRuleId = "requirement-coverage-gap";
                finding.Severity = FindingSeverity.Warning;
                finding.EvidenceRefs = ["artifact://scorecard-proof/coverage-gap"];
            },
            cancellationToken);
    }

    internal static Task InjectUnresolvedHighSeverityScorecardFindingAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = "scorecard-proof-unresolved-high-severity";
                finding.Title = "Missing WAF on public ingress path.";
                finding.Rationale = "High-severity control gap still needs disposition or accepted-risk row.";
                finding.PolicyRuleId = "unresolved-high-severity-scorecard-proof";
                finding.Severity = FindingSeverity.Error;
                finding.EvidenceRefs = ["artifact://scorecard-proof/unresolved-high-severity"];
            },
            cancellationToken);
    }

    internal static Task InjectLowConfidenceScorecardFindingAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = "scorecard-proof-low-confidence";
                finding.Title = "Critical subnet CIDR extracted with low model confidence.";
                finding.Rationale = "Re-ingest or caveat before sponsor export.";
                finding.PolicyRuleId = "low-confidence-scorecard-proof";
                finding.Severity = FindingSeverity.Critical;
                finding.ConfidenceLevel = FindingConfidenceLevel.Low;
            },
            cancellationToken);
    }

    internal static async Task InjectUnverifiedAssumptionScorecardFindingsAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        await InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = "scorecard-proof-assumption-1";
                finding.Title = "Assumption: traffic peaks at 2x baseline.";
                finding.Rationale = "Capacity planning assumption still unverified.";
                finding.PolicyRuleId = "assumption-scorecard-proof-1";
                finding.Severity = FindingSeverity.Info;
            },
            cancellationToken).ConfigureAwait(false);

        await InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = "scorecard-proof-assumption-2";
                finding.Title = "Assumption: single region is acceptable.";
                finding.Rationale = "Residency assumption still unverified.";
                finding.PolicyRuleId = "assumption-scorecard-proof-2";
                finding.Severity = FindingSeverity.Info;
            },
            cancellationToken).ConfigureAwait(false);

        await InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = "scorecard-proof-assumption-3";
                finding.Title = "Assumption: vendor SLA covers failover.";
                finding.Rationale = "Vendor assumption still unverified.";
                finding.PolicyRuleId = "assumption-scorecard-proof-3";
                finding.Severity = FindingSeverity.Info;
            },
            cancellationToken).ConfigureAwait(false);
    }

    internal static async Task PinPreCommitGateBlockAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new ArgumentException("Run id must be a GUID.", nameof(runId));

        using IServiceScope serviceScope = factory.Services.CreateScope();
        IServiceProvider services = serviceScope.ServiceProvider;
        IRunRepository runRepository = services.GetRequiredService<IRunRepository>();

        RunRecord? run = await runRepository
            .GetByIdAsync(DefaultScope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            throw new InvalidOperationException("Executed run was not found for pre-commit proof pin.");

        run.PinnedPolicyPackIdsJson = BuildPreCommitProofPinJson();

        await runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);

        await InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = "scorecard-proof-precommit-critical";
                finding.Title = "Critical control gap blocks commit per pinned policy pack.";
                finding.Rationale = "Pinned by FinalizeConflictSqlIntegrationFixture for pre-commit gate proof.";
                finding.Severity = FindingSeverity.Critical;
                finding.PolicyRuleId = "precommit-scorecard-proof";
            },
            cancellationToken).ConfigureAwait(false);
    }

    internal static Task PinSkippedMustTransparencyTrailAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return ReplaceArchitectureRequestForRunAsync(
            factory,
            runId,
            request =>
            {
                request.IntakeTransparencyTrail = new TransparencyTrail
                {
                    Skipped =
                    [
                        new SkippedQuestionTrailEntry
                        {
                            QuestionKey = "scorecard-proof-skipped-must",
                            Tier = ElicitationQuestionTier.Must,
                        },
                    ],
                };
            },
            cancellationToken);
    }

    internal static Task ClearIntakeTransparencyTrailAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return ReplaceArchitectureRequestForRunAsync(
            factory,
            runId,
            request => request.IntakeTransparencyTrail = null,
            cancellationToken);
    }

    internal static Task PinDegradedFindingCoverageAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return PinFindingsSnapshotAsync(
            factory,
            runId,
            snapshot =>
            {
                snapshot.GenerationStatus = FindingsSnapshotGenerationStatus.PartiallyComplete;
                snapshot.EngineFailures =
                [
                    new FindingEngineFailure
                    {
                        EngineType = "cost",
                        Category = "Cost",
                        ErrorMessage = "Pinned for degraded coverage SQL proof.",
                        ExceptionType = nameof(InvalidOperationException),
                        DurationMs = 1,
                        OccurredUtc = DateTime.UtcNow,
                    },
                ];
            },
            cancellationToken);
    }

    internal static Task InjectDecisionGradeProvenanceViolationAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return PinFindingsSnapshotAsync(
            factory,
            runId,
            snapshot =>
            {
                snapshot.Findings.Clear();
                snapshot.Findings.Add(new Finding
                {
                    FindingId = "scorecard-proof-provenance-violation",
                    FindingType = "TopologyGap",
                    Category = "Topology",
                    EngineType = "topology-gap-proof",
                    Severity = FindingSeverity.Warning,
                    Title = "Topology gap without typed-engine provenance.",
                    Rationale = "Pinned for decision-grade provenance SQL proof.",
                    RunIdRef = runId,
                    Trace = new ExplainabilityTrace(),
                });
            },
            cancellationToken);
    }

    internal static Task PinWorkingDeskModeForDevUserAsync(
        ArchLucidApiFactory factory,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);

        using IServiceScope serviceScope = factory.Services.CreateScope();
        IUserSettingsRepository userSettingsRepository =
            serviceScope.ServiceProvider.GetRequiredService<IUserSettingsRepository>();

        return userSettingsRepository.UpsertAsync(
            IntegrationDevUserId,
            UserSettingKeys.WorkspaceMode,
            WorkspaceModeValues.Working,
            cancellationToken);
    }

    internal static Task PinExistentialAssumptionOnRequestAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return ReplaceArchitectureRequestForRunAsync(
            factory,
            runId,
            request =>
            {
                request.Assumptions = ["Recovery RTO is 4 hours for tier-1 workloads"];
            },
            cancellationToken);
    }

    internal static async Task PinRejectedAgentOutputQualityTraceAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new ArgumentException("Run id must be a GUID.", nameof(runId));

        using IServiceScope serviceScope = factory.Services.CreateScope();
        IServiceProvider services = serviceScope.ServiceProvider;
        IRunRepository runRepository = services.GetRequiredService<IRunRepository>();
        ITenantSettingsRepository tenantSettingsRepository =
            services.GetRequiredService<ITenantSettingsRepository>();
        IAgentExecutionTraceRepository traceRepository =
            services.GetRequiredService<IAgentExecutionTraceRepository>();

        RunRecord? run = await runRepository
            .GetByIdAsync(DefaultScope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            throw new InvalidOperationException("Executed run was not found for agent output quality proof pin.");

        run.StructuralExecutionMode = StructuralExecutionMode.Real;

        await runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);

        await tenantSettingsRepository
            .UpsertAsync(
                DefaultScope.TenantId,
                TenantSettingKeys.AgentOutputQualityGateMode,
                AgentOutputQualityGateMode.PilotStrict.ToString(),
                cancellationToken)
            .ConfigureAwait(false);

        AgentExecutionTrace trace = new()
        {
            TraceId = "scorecard-proof-quality-rejected",
            RunId = runId,
            TaskId = "scorecard-proof-quality-task",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
        };

        await traceRepository.CreateAsync(trace, cancellationToken).ConfigureAwait(false);
    }

    internal static async Task PinEvidenceReferentialIntegrityViolationAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new ArgumentException("Run id must be a GUID.", nameof(runId));

        using IServiceScope serviceScope = factory.Services.CreateScope();
        IServiceProvider services = serviceScope.ServiceProvider;
        IRunRepository runRepository = services.GetRequiredService<IRunRepository>();

        RunRecord? run = await runRepository
            .GetByIdAsync(DefaultScope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            throw new InvalidOperationException("Executed run was not found for evidence integrity proof pin.");

        PinnedEvidencePackageRow[] pinRows =
        [
            new("integration-proof", EvidenceIntegrityProofPackageId, DateTime.UtcNow),
        ];

        run.PinnedEvidencePackagePinsJson =
            JsonSerializer.Serialize(pinRows, ContractJson.CamelCaseIgnoreNullCompact);

        await runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);

        await InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = EvidenceIntegrityProofFindingId;
                finding.Title = "Critical finding lacks resolvable evidence linkage.";
                finding.Rationale = "Pinned for evidence referential integrity SQL proof.";
                finding.Severity = FindingSeverity.Critical;
                finding.EvidenceRefs = [];
                finding.EvidencePackageId = null;
            },
            cancellationToken).ConfigureAwait(false);
    }

    internal static async Task PinStructuralExecutionModeMixedAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        await PinStructuralExecutionModeAsync(factory, runId, StructuralExecutionMode.Mixed, cancellationToken)
            .ConfigureAwait(false);
    }

    internal static async Task PinStructuralExecutionModeFallbackAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        await PinStructuralExecutionModeAsync(factory, runId, StructuralExecutionMode.Fallback, cancellationToken)
            .ConfigureAwait(false);
    }

    internal static async Task PinArchitectureVersionContentHashDriftAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new ArgumentException("Run id must be a GUID.", nameof(runId));

        using IServiceScope serviceScope = factory.Services.CreateScope();
        IRunRepository runRepository =
            serviceScope.ServiceProvider.GetRequiredService<IRunRepository>();

        RunRecord? run = await runRepository
            .GetByIdAsync(DefaultScope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            throw new InvalidOperationException("Executed run was not found for architecture version pin proof pin.");

        if (run.PinnedArchitectureVersionContentHashSha256 is not { Length: > 0 } pinnedHash)
        {
            throw new InvalidOperationException(
                "Executed run is missing create-time architecture version content hash pin.");
        }

        byte[] driftedHash = new byte[pinnedHash.Length];
        pinnedHash.CopyTo(driftedHash, 0);
        driftedHash[0] = (byte)(driftedHash[0] == 0xFF ? (byte)0x00 : (byte)0xFF);

        run.PinnedArchitectureVersionContentHashSha256 = driftedHash;

        await runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
    }

    internal static async Task PinPolicyPackPinHashDriftAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new ArgumentException("Run id must be a GUID.", nameof(runId));

        using IServiceScope serviceScope = factory.Services.CreateScope();
        IRunRepository runRepository =
            serviceScope.ServiceProvider.GetRequiredService<IRunRepository>();

        RunRecord? run = await runRepository
            .GetByIdAsync(DefaultScope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            throw new InvalidOperationException("Executed run was not found for policy pack pin proof pin.");

        if (run.PinnedPolicyPackIdsHashSha256 is not { Length: > 0 } pinnedHash)
        {
            throw new InvalidOperationException(
                "Executed run is missing create-time policy pack pin hash.");
        }

        byte[] driftedHash = new byte[pinnedHash.Length];
        pinnedHash.CopyTo(driftedHash, 0);
        driftedHash[0] = (byte)(driftedHash[0] == 0xFF ? (byte)0x00 : (byte)0xFF);

        run.PinnedPolicyPackIdsHashSha256 = driftedHash;

        await runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
    }

    internal static async Task PinEvidencePackagePinHashDriftAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new ArgumentException("Run id must be a GUID.", nameof(runId));

        using IServiceScope serviceScope = factory.Services.CreateScope();
        IRunRepository runRepository =
            serviceScope.ServiceProvider.GetRequiredService<IRunRepository>();

        RunRecord? run = await runRepository
            .GetByIdAsync(DefaultScope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            throw new InvalidOperationException("Executed run was not found for evidence package pin proof pin.");

        PinnedEvidencePackageRow[] pinRows =
        [
            new(RunEvidencePackagePinService.AzureProvider, EvidenceIntegrityProofPackageId, DateTime.UtcNow),
        ];

        (string json, byte[] hash) = RunEvidencePackagePinService.SerializePinnedRows(pinRows);
        run.PinnedEvidencePackagePinsJson = json;
        run.PinnedEvidencePackagePinsHashSha256 = hash;

        byte[] driftedHash = new byte[hash.Length];
        hash.CopyTo(driftedHash, 0);
        driftedHash[0] = (byte)(driftedHash[0] == 0xFF ? (byte)0x00 : (byte)0xFF);

        run.PinnedEvidencePackagePinsHashSha256 = driftedHash;

        await runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
    }

    internal static async Task PinDraftSpawnDocumentHashDriftAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId, out _))
            throw new ArgumentException("Run id must be a GUID.", nameof(runId));

        using IServiceScope serviceScope = factory.Services.CreateScope();
        IServiceProvider services = serviceScope.ServiceProvider;
        IDraftRequestRepository draftRequestRepository =
            services.GetRequiredService<IDraftRequestRepository>();

        DraftRequestDocument originalDocument = new()
        {
            FreeTextIntent = "SQL proof draft spawn hash baseline.",
            SystemName = "finalize-pin-proof",
        };

        byte[] spawnHash = DraftDocumentContentFingerprint.Compute(originalDocument);

        DraftRequestResponse created = await draftRequestRepository
            .CreateAsync(
                DefaultScope.TenantId,
                DefaultScope.WorkspaceId,
                DefaultScope.ProjectId,
                IntegrationDevUserId,
                originalDocument,
                cancellationToken)
            .ConfigureAwait(false);

        DraftRequestDocument mutatedDocument = new()
        {
            FreeTextIntent = "SQL proof draft spawn hash drifted after spawn.",
            SystemName = "finalize-pin-proof",
        };

        DraftRequestResponse? updated = await draftRequestRepository
            .UpdateAsync(
                DefaultScope.TenantId,
                DefaultScope.WorkspaceId,
                DefaultScope.ProjectId,
                created.DraftId,
                DraftRequestStatus.Admitted,
                mutatedDocument,
                redirectReason: null,
                spawnedRunId: runId,
                cancellationToken,
                spawnedDocumentContentHashSha256: spawnHash)
            .ConfigureAwait(false);

        if (updated is null)
        {
            throw new InvalidOperationException(
                "Draft spawn hash proof pin failed to link draft to executed run.");
        }
    }

    private static async Task PinStructuralExecutionModeAsync(
        ArchLucidApiFactory factory,
        string runId,
        StructuralExecutionMode mode,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new ArgumentException("Run id must be a GUID.", nameof(runId));

        using IServiceScope serviceScope = factory.Services.CreateScope();
        IRunRepository runRepository =
            serviceScope.ServiceProvider.GetRequiredService<IRunRepository>();

        RunRecord? run = await runRepository
            .GetByIdAsync(DefaultScope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            throw new InvalidOperationException("Executed run was not found for structural execution mode proof pin.");

        run.StructuralExecutionMode = mode;

        await runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
    }

    internal static async Task PinUnsupportedSemanticSupportFindingAsync(
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new ArgumentException("Run id must be a GUID.", nameof(runId));

        using IServiceScope serviceScope = factory.Services.CreateScope();
        IServiceProvider services = serviceScope.ServiceProvider;
        IRunRepository runRepository = services.GetRequiredService<IRunRepository>();
        ITenantSettingsRepository tenantSettingsRepository =
            services.GetRequiredService<ITenantSettingsRepository>();

        RunRecord? run = await runRepository
            .GetByIdAsync(DefaultScope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            throw new InvalidOperationException("Executed run was not found for unsupported semantic support proof pin.");

        run.StructuralExecutionMode = StructuralExecutionMode.Real;

        await runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);

        await tenantSettingsRepository
            .UpsertAsync(
                DefaultScope.TenantId,
                TenantSettingKeys.AgentOutputQualityGateMode,
                AgentOutputQualityGateMode.PilotStrict.ToString(),
                cancellationToken)
            .ConfigureAwait(false);

        await InjectPinnedScorecardFindingAsync(
            factory,
            runId,
            finding =>
            {
                finding.FindingId = "scorecard-proof-unsupported-semantic";
                finding.Title = "Decision-grade finding with unsupported semantic support band.";
                finding.Rationale = "Pinned for unsupported semantic support SQL proof.";
                finding.Classification = FindingClassification.DecisionGradeFinding;
                finding.SemanticSupportBand = FindingSemanticSupportBand.Unsupported;
            },
            cancellationToken).ConfigureAwait(false);
    }

    private static string BuildPreCommitProofPinJson()
    {
        PinnedPolicyPackRow[] pinRows =
        [
            new PinnedPolicyPackRow(
                PreCommitProofPolicyPackId.ToString("D"),
                "1.0.0",
                BlockCommitOnCritical: true),
        ];

        return JsonSerializer.Serialize(pinRows, ContractJson.CamelCaseIgnoreNullCompact);
    }

    private static async Task InjectPinnedScorecardFindingAsync(
        ArchLucidApiFactory factory,
        string runId,
        Action<Finding> customize,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(customize);

        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new ArgumentException("Run id must be a GUID.", nameof(runId));

        using IServiceScope serviceScope = factory.Services.CreateScope();
        IServiceProvider services = serviceScope.ServiceProvider;
        IRunRepository runRepository = services.GetRequiredService<IRunRepository>();
        IFindingsSnapshotRepository findingsSnapshotRepository =
            services.GetRequiredService<IFindingsSnapshotRepository>();

        RunRecord? run = await runRepository
            .GetByIdAsync(DefaultScope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run?.FindingsSnapshotId is not Guid snapshotId)
            throw new InvalidOperationException("Executed run is missing a findings snapshot id.");

        FindingsSnapshot? snapshot = await findingsSnapshotRepository
            .GetByIdAsync(DefaultScope, snapshotId, cancellationToken)
            .ConfigureAwait(false);

        if (snapshot is null)
            throw new InvalidOperationException("Findings snapshot was not found for the executed run.");

        Finding template = snapshot.Findings.FirstOrDefault() ?? CreateMinimalDecisionGradeFinding(runId);
        Finding injected = CloneFinding(template);
        customize(injected);

        snapshot.Findings.RemoveAll(existing =>
            string.Equals(existing.FindingId, injected.FindingId, StringComparison.OrdinalIgnoreCase));
        snapshot.Findings.Add(injected);

        await findingsSnapshotRepository.SaveAsync(snapshot, cancellationToken).ConfigureAwait(false);
    }

    private static async Task PinFindingsSnapshotAsync(
        ArchLucidApiFactory factory,
        string runId,
        Action<FindingsSnapshot> customize,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(customize);

        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new ArgumentException("Run id must be a GUID.", nameof(runId));

        using IServiceScope serviceScope = factory.Services.CreateScope();
        IServiceProvider services = serviceScope.ServiceProvider;
        IRunRepository runRepository = services.GetRequiredService<IRunRepository>();
        IFindingsSnapshotRepository findingsSnapshotRepository =
            services.GetRequiredService<IFindingsSnapshotRepository>();

        RunRecord? run = await runRepository
            .GetByIdAsync(DefaultScope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run?.FindingsSnapshotId is not Guid snapshotId)
            throw new InvalidOperationException("Executed run is missing a findings snapshot id.");

        FindingsSnapshot? snapshot = await findingsSnapshotRepository
            .GetByIdAsync(DefaultScope, snapshotId, cancellationToken)
            .ConfigureAwait(false);

        if (snapshot is null)
            throw new InvalidOperationException("Findings snapshot was not found for the executed run.");

        customize(snapshot);

        await findingsSnapshotRepository.SaveAsync(snapshot, cancellationToken).ConfigureAwait(false);
    }

    private static async Task ReplaceArchitectureRequestForRunAsync(
        ArchLucidApiFactory factory,
        string runId,
        Action<ArchitectureRequest> customize,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(factory);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(customize);

        if (!Guid.TryParse(runId, out Guid runGuid))
            throw new ArgumentException("Run id must be a GUID.", nameof(runId));

        using IServiceScope serviceScope = factory.Services.CreateScope();
        IServiceProvider services = serviceScope.ServiceProvider;
        IRunRepository runRepository = services.GetRequiredService<IRunRepository>();
        IArchitectureRequestRepository requestRepository =
            services.GetRequiredService<IArchitectureRequestRepository>();

        RunRecord? run = await runRepository
            .GetByIdAsync(DefaultScope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (run is null || string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
            throw new InvalidOperationException("Executed run is missing an architecture request id.");

        ArchitectureRequest? request = await requestRepository
            .GetByIdAsync(run.ArchitectureRequestId, cancellationToken)
            .ConfigureAwait(false);

        if (request is null)
            throw new InvalidOperationException("Architecture request was not found for the executed run.");

        customize(request);

        bool replaced = await requestRepository.ReplaceAsync(request, cancellationToken).ConfigureAwait(false);

        if (!replaced)
            throw new InvalidOperationException("Architecture request replace failed for finalize SQL proof pin.");
    }

    private static Finding CreateMinimalDecisionGradeFinding(string runId)
    {
        return new Finding
        {
            FindingId = "scorecard-proof-template",
            FindingType = "ArchitectureFinding",
            Category = "Security",
            EngineType = "integration-scorecard-proof",
            Severity = FindingSeverity.Warning,
            Title = "Integration scorecard proof template finding.",
            Rationale = "Pinned by FinalizeConflictSqlIntegrationFixture.",
            RunIdRef = runId,
            Trace = new ExplainabilityTrace(),
        };
    }

    private static Finding CloneFinding(Finding source)
    {
        return new Finding
        {
            FindingSchemaVersion = source.FindingSchemaVersion,
            FindingType = source.FindingType,
            Category = source.Category,
            QualityDimension = source.QualityDimension,
            EngineType = source.EngineType,
            Severity = source.Severity,
            Title = source.Title,
            Rationale = source.Rationale,
            RelatedNodeIds = source.RelatedNodeIds.ToList(),
            EvidenceRefs = source.EvidenceRefs.ToList(),
            RecommendedActions = source.RecommendedActions.ToList(),
            Properties = new Dictionary<string, string>(source.Properties),
            Payload = source.Payload,
            PayloadType = source.PayloadType,
            Trace = source.Trace,
            RequestInputRef = source.RequestInputRef,
            RunIdRef = source.RunIdRef,
            AgentExecutionTraceId = source.AgentExecutionTraceId,
            EvidencePackageId = source.EvidencePackageId,
            ModelDeploymentName = source.ModelDeploymentName,
            ModelAlias = source.ModelAlias,
            ModelVersion = source.ModelVersion,
            PromptTemplateId = source.PromptTemplateId,
            PolicyRuleId = source.PolicyRuleId,
            HumanReviewStatus = source.HumanReviewStatus,
            IsMuted = source.IsMuted,
            ConfidenceLevel = source.ConfidenceLevel,
            EnforcementTier = source.EnforcementTier,
            Classification = source.Classification,
            SemanticSupportBand = source.SemanticSupportBand,
        };
    }
}
