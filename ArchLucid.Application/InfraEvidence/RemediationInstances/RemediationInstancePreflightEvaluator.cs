using System.Text.Json;

using ArchLucid.Application.InfraEvidence.RemediationPatterns;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationInstances;

public static class RemediationInstancePreflightEvaluator
{
    public static RemediationInstancePreflightResult Evaluate(
        ScopeContext scope,
        RemediationInstanceRecord instance,
        RemediationPatternVersionRecord patternVersion,
        RemediationPatternMatchResultRecord? activeMatch,
        bool hasActiveException,
        AzureInventorySnapshotDetailReadModel? snapshotDetail)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(instance);
        ArgumentNullException.ThrowIfNull(patternVersion);

        List<string> blockers = [];

        if (activeMatch is null)
        {
            blockers.Add("No active remediation pattern match exists for the finding.");
        }
        else if (activeMatch.MatchKind == RemediationPatternMatchKind.Conflict)
        {
            blockers.Add("Remediation pattern match conflict must be resolved before preflight.");
        }
        else if (!RemediationInstanceGuard.IsStrongMatch(activeMatch.MatchKind))
        {
            blockers.Add("Only ExactMatch or ProbableMatch patterns may be used for remediation instances.");
        }

        if (!RemediationPatternFactoryGuard.TryValidateForFactoryUse(patternVersion, out string? factoryRejection))
            blockers.Add(factoryRejection!);

        if (!hasActiveException)
            blockers.Add("An active operational security exception is required before remediation preflight.");

        if (!RemediationInstanceGuard.TryParsePatternContent(patternVersion, out RemediationPatternVersionContent? content, out string? parseError))
        {
            blockers.Add(parseError!);
        }
        else if (content is not null
                 && (instance.AutomationLevel is RemediationAutomationLevel.SemiAutomated
                     or RemediationAutomationLevel.Automated)
                 && !RemediationInstanceGuard.HasRollbackDefinition(content))
        {
            blockers.Add("Rollback definition is required for SemiAutomated or Automated remediation patterns.");
        }

        bool productionTagged = DetectProductionTag(snapshotDetail, instance.CloudResourceId);

        bool passed = blockers.Count == 0;

        return new RemediationInstancePreflightResult
        {
            Passed = passed,
            Blockers = blockers,
            ProductionTagged = productionTagged,
            ResultJson = JsonSerializer.Serialize(new
            {
                passed,
                blockers,
                productionTagged,
                snapshotId = snapshotDetail?.Header.SnapshotId,
            }),
        };
    }

    private static bool DetectProductionTag(
        AzureInventorySnapshotDetailReadModel? snapshotDetail,
        Guid? cloudResourceId)
    {
        if (snapshotDetail is null || cloudResourceId is null || cloudResourceId == Guid.Empty)
            return false;

        AzureInventoryResourceRecord? resource = snapshotDetail.Resources
            .FirstOrDefault(row => row.CloudResourceId == cloudResourceId);

        if (resource is null)
            return false;

        IEnumerable<AzureInventoryTagReadModel> tags = snapshotDetail.Tags
            .Where(tag => tag.ResourceRowId == resource.ResourceRowId);

        return tags.Any(tag =>
            string.Equals(tag.TagKey, "environment", StringComparison.OrdinalIgnoreCase)
                && string.Equals(tag.TagValue, "production", StringComparison.OrdinalIgnoreCase)
            || string.Equals(tag.TagKey, "production", StringComparison.OrdinalIgnoreCase)
                && string.Equals(tag.TagValue, "true", StringComparison.OrdinalIgnoreCase));
    }
}

public sealed class RemediationInstancePreflightResult
{
    public bool Passed
    {
        get;
        init;
    }

    public IReadOnlyList<string> Blockers
    {
        get;
        init;
    } = [];

    public bool ProductionTagged
    {
        get;
        init;
    }

    public string ResultJson
    {
        get;
        init;
    } = string.Empty;
}
