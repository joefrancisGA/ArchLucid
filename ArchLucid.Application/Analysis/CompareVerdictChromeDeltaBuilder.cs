using System.Globalization;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Builds <see cref="CompareVerdictChromeDelta" /> from paired run details (UI parity with compare-*-delta.ts).
/// </summary>
internal static class CompareVerdictChromeDeltaBuilder
{
    private const string NoPackAssignmentRecorded = "No pack assignment recorded";
    private const string GatePendingLabel = "Gate pending";

    internal static async Task<CompareVerdictChromeDelta> BuildAsync(
        ArchitectureRunDetail leftDetail,
        ArchitectureRunDetail rightDetail,
        IAuthorityQueryService authorityQueryService,
        ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(leftDetail);
        ArgumentNullException.ThrowIfNull(rightDetail);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(tenantEstimatedUsdSavingsResolver);
        ArgumentNullException.ThrowIfNull(scope);

        RunSideMaterial left = await LoadSideMaterialAsync(
            leftDetail,
            authorityQueryService,
            tenantEstimatedUsdSavingsResolver,
            scope,
            cancellationToken).ConfigureAwait(false);
        RunSideMaterial right = await LoadSideMaterialAsync(
            rightDetail,
            authorityQueryService,
            tenantEstimatedUsdSavingsResolver,
            scope,
            cancellationToken).ConfigureAwait(false);

        CompareVerdictChromeDelta delta = new()
        {
            Wk21Line = SendableExportCoverComposer.PolicyPackInfluenceHonestyLine,
            NonSummingLine = SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine,
        };

        delta.GateOutcome = BuildGateOutcome(left, right);
        delta.PackAssignment = BuildPackAssignment(left, right);
        delta.ExecutionMode = BuildExecutionMode(leftDetail.Run, rightDetail.Run);
        delta.RoiHeadline = BuildRoiHeadline(left, right);

        return delta;
    }

    private sealed record RunSideMaterial(
        FeasibilityVerdict? Verdict,
        string PackSummaryLine,
        string? SavingsLabel,
        StructuralExecutionMode ExecutionMode);

    private static async Task<RunSideMaterial> LoadSideMaterialAsync(
        ArchitectureRunDetail detail,
        IAuthorityQueryService authorityQueryService,
        ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArchitectureRun run = detail.Run ?? throw new ArgumentException("Run detail is missing run metadata.", nameof(detail));
        string runId = run.RunId.Trim();
        FeasibilityVerdict? verdict = null;
        string packSummaryLine = NoPackAssignmentRecorded;
        decimal? savingsUsd = null;

        if (Guid.TryParse(runId, out Guid runGuid))
        {
            RunDetailDto? exportDetail = await authorityQueryService
                .GetRunDetailForExportAsync(scope, runGuid, cancellationToken)
                .ConfigureAwait(false);

            verdict = exportDetail?.GoldenManifest?.FeasibilityVerdict;
            packSummaryLine = FormatPackAssignmentSummary(exportDetail?.GoldenManifest);
            savingsUsd = await tenantEstimatedUsdSavingsResolver
                .ResolveFromFindingsSnapshotIdAsync(run.FindingsSnapshotId, cancellationToken)
                .ConfigureAwait(false);
        }

        return new RunSideMaterial(
            verdict,
            packSummaryLine,
            FormatUsdLabel(savingsUsd),
            run.StructuralExecutionMode);
    }

    private static CompareVerdictChromeGateOutcomeDelta? BuildGateOutcome(RunSideMaterial left, RunSideMaterial right)
    {
        if (left.Verdict is null && right.Verdict is null)
        {
            return null;
        }

        string baselineLabel = FormatGateLabel(left.Verdict);
        string targetLabel = FormatGateLabel(right.Verdict);

        return new CompareVerdictChromeGateOutcomeDelta
        {
            BaselineGateLabel = baselineLabel,
            TargetGateLabel = targetLabel,
            Changed = !string.Equals(baselineLabel, targetLabel, StringComparison.Ordinal),
        };
    }

    private static CompareVerdictChromePackAssignmentDelta? BuildPackAssignment(RunSideMaterial left, RunSideMaterial right)
    {
        bool bothEmpty =
            left.PackSummaryLine == NoPackAssignmentRecorded
            && right.PackSummaryLine == NoPackAssignmentRecorded;

        if (bothEmpty)
        {
            return null;
        }

        return new CompareVerdictChromePackAssignmentDelta
        {
            BaselineSummaryLine = left.PackSummaryLine,
            TargetSummaryLine = right.PackSummaryLine,
            Changed = !string.Equals(left.PackSummaryLine, right.PackSummaryLine, StringComparison.Ordinal),
        };
    }

    private static CompareVerdictChromeExecutionModeDelta BuildExecutionMode(
        ArchitectureRun leftRun,
        ArchitectureRun rightRun)
    {
        ArgumentNullException.ThrowIfNull(leftRun);
        ArgumentNullException.ThrowIfNull(rightRun);

        string baselineModeLabel = FormatModeLabel(leftRun.StructuralExecutionMode);
        string targetModeLabel = FormatModeLabel(rightRun.StructuralExecutionMode);
        bool changed = !string.Equals(baselineModeLabel, targetModeLabel, StringComparison.Ordinal);

        return new CompareVerdictChromeExecutionModeDelta
        {
            BaselineModeLabel = baselineModeLabel,
            TargetModeLabel = targetModeLabel,
            Changed = changed,
            AdvisoryParagraph = BuildExecutionModeAdvisory(
                baselineModeLabel,
                targetModeLabel,
                changed),
        };
    }

    private static CompareVerdictChromeRoiHeadlineDelta? BuildRoiHeadline(RunSideMaterial left, RunSideMaterial right)
    {
        if (left.SavingsLabel is null && right.SavingsLabel is null)
        {
            return null;
        }

        return new CompareVerdictChromeRoiHeadlineDelta
        {
            BaselineSavingsLabel = left.SavingsLabel,
            TargetSavingsLabel = right.SavingsLabel,
        };
    }

    private static string FormatGateLabel(FeasibilityVerdict? verdict)
    {
        if (verdict is null || !DecisionReceiptComposer.IsExportableVerdict(verdict.Kind))
        {
            return GatePendingLabel;
        }

        return verdict.Kind switch
        {
            FeasibilityVerdictKind.SoftInfeasible => "Soft infeasible",
            FeasibilityVerdictKind.HardInfeasible => "Hard infeasible",
            _ => verdict.Kind.ToString(),
        };
    }

    private static string FormatPackAssignmentSummary(ManifestDocument? manifest)
    {
        if (manifest is null)
        {
            return NoPackAssignmentRecorded;
        }

        CommittedEffectiveGovernanceSnapshotDescriptor? atCommit = manifest.EffectiveGovernanceAtCommit;

        if (atCommit is { HasEffectivePolicy: true, PackAssignments.Count: > 0 })
        {
            return string.Join(
                " · ",
                atCommit.PackAssignments.Select(row =>
                    string.Create(
                        CultureInfo.InvariantCulture,
                        $"{row.PolicyPackId:D}@{row.PolicyPackVersion}")));
        }

        string? ruleSetId = manifest.RuleSetId?.Trim();
        string? ruleSetVersion = manifest.RuleSetVersion?.Trim();

        if (string.IsNullOrWhiteSpace(ruleSetId))
        {
            return NoPackAssignmentRecorded;
        }

        if (string.IsNullOrWhiteSpace(ruleSetVersion))
        {
            return ruleSetId;
        }

        return string.Create(CultureInfo.InvariantCulture, $"{ruleSetId} @ {ruleSetVersion}");
    }

    private static string FormatModeLabel(StructuralExecutionMode mode) =>
        StructuralExecutionModeLabels.ToDisplayLabel(mode);

    private static string? BuildExecutionModeAdvisory(
        string baselineModeLabel,
        string targetModeLabel,
        bool modesDiffer)
    {
        if (!modesDiffer)
        {
            return null;
        }

        return string.Create(
            CultureInfo.InvariantCulture,
            $"Baseline review used {baselineModeLabel} execution and updated used {targetModeLabel} execution — finding and cost deltas may not be directly comparable.");
    }

    private static string? FormatUsdLabel(decimal? amount)
    {
        if (amount is null or <= 0m)
        {
            return null;
        }

        return string.Create(CultureInfo.InvariantCulture, $"${amount:0.00}");
    }
}
