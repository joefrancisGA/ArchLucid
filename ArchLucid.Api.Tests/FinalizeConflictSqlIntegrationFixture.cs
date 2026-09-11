using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Pins decision-grade findings on an executed run's SQL findings snapshot so finalize readiness scorecard
///     integration proofs do not depend on simulator output shape.
/// </summary>
internal static class FinalizeConflictSqlIntegrationFixture
{
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
        };
    }
}
