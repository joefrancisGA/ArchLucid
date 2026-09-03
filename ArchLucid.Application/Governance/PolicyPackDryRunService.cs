using ArchLucid.Application.Governance.PolicyPackDryRun.Stages;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IPolicyPackDryRunService"/>
public sealed class PolicyPackDryRunService(
    IPolicyPackDryRunLoadStage loadStage,
    IPolicyPackDryRunRedactAuditStage redactAuditStage,
    IScopeContextProvider scopeContextProvider,
    IPolicyPackRepository policyPackRepository) : IPolicyPackDryRunService
{
    private readonly IPolicyPackDryRunLoadStage _loadStage = loadStage ?? throw new ArgumentNullException(nameof(loadStage));
    private readonly IPolicyPackDryRunRedactAuditStage _redactAuditStage = redactAuditStage ?? throw new ArgumentNullException(nameof(redactAuditStage));
    private readonly IPolicyPackRepository _policyPackRepository = policyPackRepository ?? throw new ArgumentNullException(nameof(policyPackRepository));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<PolicyPackDryRunResponse> EvaluateAsync(
        Guid policyPackId, IReadOnlyDictionary<string, string> proposedThresholds,
        IReadOnlyList<string> evaluateAgainstRunIds, int? pageSize, int? page,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(proposedThresholds);
        ArgumentNullException.ThrowIfNull(evaluateAgainstRunIds);
        await EnsurePolicyPackInScopeAsync(policyPackId, cancellationToken);

        int clampedPageSize = pageSize is null ? IPolicyPackDryRunService.DefaultPageSize : Math.Clamp(pageSize.Value, 1, IPolicyPackDryRunService.MaxPageSize);
        List<string> cleanedRunIds = DeduplicateRunIds(evaluateAgainstRunIds);
        Dictionary<string, double> parsedThresholds = _redactAuditStage.ParseThresholds(proposedThresholds);
        string redactedThresholdsJson = _redactAuditStage.RedactProposedThresholdsJson(proposedThresholds);
        List<PolicyPackDryRunRunItem> allItems = [];
        foreach (string runId in cleanedRunIds)
        {
            cancellationToken.ThrowIfCancellationRequested();
            allItems.Add(await _loadStage.EvaluateSingleRunAsync(runId, parsedThresholds, cancellationToken));
        }

        PolicyPackDryRunDeltaCounts deltaCounts = TallyDeltaCounts(allItems);
        int clampedPage = ClampPage(page, allItems.Count, clampedPageSize);
        int skip = (clampedPage - 1) * clampedPageSize;
        PolicyPackDryRunResponse response = new()
        {
            PolicyPackId = policyPackId,
            EvaluatedUtc = TimeProvider.System.UtcNowDateTime(),
            Page = clampedPage,
            PageSize = clampedPageSize,
            TotalRequestedRuns = cleanedRunIds.Count,
            ReturnedRuns = Math.Min(clampedPageSize, allItems.Count - skip),
            ProposedThresholdsRedactedJson = redactedThresholdsJson,
            DeltaCounts = deltaCounts,
            Items = allItems.Skip(skip).Take(clampedPageSize).ToList(),
        };
        await _redactAuditStage.TryLogAuditAsync(policyPackId, redactedThresholdsJson, cleanedRunIds, deltaCounts, cancellationToken);
        return response;
    }

    private static List<string> DeduplicateRunIds(IReadOnlyList<string> evaluateAgainstRunIds)
    {
        List<string> cleanedRunIds = new(Math.Min(evaluateAgainstRunIds.Count, IPolicyPackDryRunService.MaxEvaluatedRuns));
        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);
        foreach (string runIdRaw in evaluateAgainstRunIds)
        {
            if (string.IsNullOrWhiteSpace(runIdRaw)) continue;
            string runId = runIdRaw.Trim();
            if (!seen.Add(runId)) continue;
            cleanedRunIds.Add(runId);
            if (cleanedRunIds.Count >= IPolicyPackDryRunService.MaxEvaluatedRuns) break;
        }
        return cleanedRunIds;
    }

    private static int ClampPage(int? page, int totalItems, int pageSize)
    {
        if (totalItems == 0) return 1;
        int maxPage = (int)Math.Ceiling(totalItems / (double)pageSize);
        return Math.Clamp(page.GetValueOrDefault(1), 1, Math.Max(1, maxPage));
    }

    private static PolicyPackDryRunDeltaCounts TallyDeltaCounts(IReadOnlyList<PolicyPackDryRunRunItem> items) => new()
    {
        Evaluated = items.Count,
        WouldBlock = items.Count(i => i is { RunMissing: false, WouldBlock: true }),
        WouldAllow = items.Count(i => i is { RunMissing: false, WouldBlock: false }),
        RunMissing = items.Count(i => i.RunMissing),
    };

    private async Task EnsurePolicyPackInScopeAsync(Guid policyPackId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        PolicyPack? pack = await _policyPackRepository.GetByIdAsync(policyPackId, cancellationToken);
        if (pack is null || pack.IsDeleted || pack.TenantId != scope.TenantId || pack.WorkspaceId != scope.WorkspaceId || pack.ProjectId != scope.ProjectId)
            throw new PolicyPackNotFoundException(policyPackId);
    }
}
