using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Analysis;

public sealed partial class EndToEndReplayComparisonService
{
    private static List<ArchitectureFinding> CollectFindings(ArchitectureRunDetail detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        List<ArchitectureFinding> findings = [];

        foreach (AgentResult result in detail.Results)
            findings.AddRange(result.Findings);

        return findings;
    }

    private static RunMetadataDiffResult BuildRunDiff(
        ArchitectureRun leftRun,
        ArchitectureRun rightRun,
        ReviewRunEngineProvenance? leftEngineProvenance,
        ReviewRunEngineProvenance? rightEngineProvenance)
    {
        RunMetadataDiffResult result = new();
        AddIfChanged(result.ChangedFields, "RequestId", leftRun.RequestId, rightRun.RequestId);
        AddIfChanged(result.ChangedFields, "Status", leftRun.Status, rightRun.Status);
        AddIfChanged(result.ChangedFields, "CurrentManifestVersion", leftRun.CurrentManifestVersion, rightRun.CurrentManifestVersion);
        AddIfChanged(result.ChangedFields, "CompletedUtc", leftRun.CompletedUtc, rightRun.CompletedUtc);
        AddIfChanged(result.ChangedFields, "StructuralExecutionMode", leftRun.StructuralExecutionMode, rightRun.StructuralExecutionMode);
        AddIfChanged(
            result.ChangedFields,
            "ModelAliasId",
            leftEngineProvenance?.ModelAliasId,
            rightEngineProvenance?.ModelAliasId);
        result.RequestIdsDiffer = !string.Equals(leftRun.RequestId, rightRun.RequestId, StringComparison.OrdinalIgnoreCase);
        result.ManifestVersionsDiffer = !string.Equals(leftRun.CurrentManifestVersion, rightRun.CurrentManifestVersion, StringComparison.OrdinalIgnoreCase);
        result.StatusDiffers = !Equals(leftRun.Status, rightRun.Status);
        result.CompletionStateDiffers = !EqualityComparer<DateTime?>.Default.Equals(leftRun.CompletedUtc, rightRun.CompletedUtc);
        result.ExecutionModesDiffer = leftRun.StructuralExecutionMode != rightRun.StructuralExecutionMode;
        result.ModelAliasIdsDiffer = !string.Equals(
            leftEngineProvenance?.ModelAliasId,
            rightEngineProvenance?.ModelAliasId,
            StringComparison.OrdinalIgnoreCase);
        result.SharedNonRealExecutionMode =
            !result.ExecutionModesDiffer
            && leftRun.StructuralExecutionMode != StructuralExecutionMode.Real;
        return result;
    }

    private static void AddIfChanged<T>(List<string> target, string fieldName, T left, T right)
    {
        if (!EqualityComparer<T>.Default.Equals(left, right))
            target.Add(fieldName);
    }
}
