using ArchLucid.Core.Scoping;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Persistence.Coordination.Compare;

/// <summary>
///     <see cref="IAuthorityCompareService" /> implementation: manifest diff across requirements, topology, security,
///     cost, issues, assumptions, warnings, and decisions.
/// </summary>
/// <remarks>
///     Run comparison uses <see cref="IAuthorityQueryService.GetRunSummaryAsync" />; manifest comparison uses
///     <see cref="IGoldenManifestRepository.GetByIdAsync" />.
///     String-set diffs use case-insensitive equality; run-level <see cref="AddRunDiff" /> uses ordinal comparison.
/// </remarks>
public sealed partial class AuthorityCompareService(
    IGoldenManifestRepository manifestRepository,
    IAuthorityQueryService queryService)
    : IAuthorityCompareService
{
    /// <inheritdoc />
    public async Task<ManifestComparisonResult?> CompareManifestsAsync(
        ScopeContext scope,
        Guid leftManifestId,
        Guid rightManifestId,
        CancellationToken ct)
    {
        ManifestDocument? left = await manifestRepository.GetByIdAsync(scope, leftManifestId, ct);
        ManifestDocument? right = await manifestRepository.GetByIdAsync(scope, rightManifestId, ct);

        if (left is null || right is null)
            return null;

        if (left.TenantId != right.TenantId ||
            left.WorkspaceId != right.WorkspaceId ||
            left.ProjectId != right.ProjectId)
            throw new InvalidOperationException(
                $"Cannot compare manifests across different scopes. " +
                $"Left scope: {left.TenantId}/{left.WorkspaceId}/{left.ProjectId}, " +
                $"Right scope: {right.TenantId}/{right.WorkspaceId}/{right.ProjectId}.");

        ManifestComparisonResult result = new()
        {
            LeftManifestId = left.ManifestId,
            RightManifestId = right.ManifestId,
            LeftManifestHash = left.ManifestHash,
            RightManifestHash = right.ManifestHash
        };

        CompareRequirements(left, right, result);
        CompareTopology(left, right, result);
        CompareSecurity(left, right, result);
        CompareCost(left, right, result);
        CompareIssues(left, right, result);
        CompareAssumptions(left, right, result);
        CompareWarnings(left, right, result);
        CompareDecisions(left, right, result);

        return result;
    }

    /// <inheritdoc />
    public async Task<RunComparisonResult?> CompareRunsAsync(
        ScopeContext scope,
        Guid leftRunId,
        Guid rightRunId,
        CancellationToken ct)
    {
        RunSummaryDto? leftRun = await queryService.GetRunSummaryAsync(scope, leftRunId, ct);
        RunSummaryDto? rightRun = await queryService.GetRunSummaryAsync(scope, rightRunId, ct);

        if (leftRun is null || rightRun is null)
            return null;

        RunComparisonResult result = new()
        {
            LeftRunId = leftRunId, RightRunId = rightRunId, LeftRun = leftRun, RightRun = rightRun
        };

        AddRunDiff(result.RunLevelDiffs, "Run", "ProjectId", leftRun.ProjectId, rightRun.ProjectId);
        AddRunDiff(result.RunLevelDiffs, "Run", "Description", leftRun.Description, rightRun.Description);
        AddRunDiff(
            result.RunLevelDiffs,
            "Run",
            "GoldenManifestId",
            leftRun.GoldenManifestId?.ToString(),
            rightRun.GoldenManifestId?.ToString());

        if (leftRun.GoldenManifestId.HasValue && rightRun.GoldenManifestId.HasValue)

            result.ManifestComparison = await CompareManifestsAsync(
                scope,
                leftRun.GoldenManifestId.Value,
                rightRun.GoldenManifestId.Value,
                ct);


        return result;
    }

    /// <inheritdoc />
    public void AddRunDiff(
        IList<DiffItem> diffs,
        string section,
        string key,
        string? beforeValue,
        string? afterValue)
    {
        if (!string.Equals(beforeValue, afterValue, StringComparison.Ordinal))

            diffs.Add(new DiffItem
            {
                Section = section,
                Key = key,
                DiffKind = DiffKind.Changed,
                BeforeValue = beforeValue,
                AfterValue = afterValue
            });
    }
}
