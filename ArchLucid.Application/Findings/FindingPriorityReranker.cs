using System.Text.Json;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Findings;

public sealed class FindingPriorityReranker(
    IRunRepository runRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    ITenantRepository tenantRepository,
    IAgentCompletionClient completionClient,
    ILogger<FindingPriorityReranker> logger) : IFindingPriorityReranker
{
    private const string SystemPrompt =
        "You are an enterprise risk advisor. Rank architecture findings from most to least urgent business impact. "
        + "Return ONLY a JSON array of findingId strings in priority order (most urgent first).";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IAgentCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly ILogger<FindingPriorityReranker> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task RerankForRunAsync(string runId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId.Trim(), out Guid runGuid))
            return;

        Persistence.Models.RunRecord? run = await _runRepository.GetByRunIdAdminAsync(runGuid, cancellationToken);

        if (run?.FindingsSnapshotId is not Guid snapshotId)
            return;

        string industryVertical = await ResolveIndustryVerticalAsync(run.TenantId, cancellationToken);
        List<FindingRecordMetadataRow> allRows = await LoadAllFindingRowsAsync(snapshotId, cancellationToken);

        if (allRows.Count == 0)
            return;

        List<(string FindingId, int PriorityRank)> ranks = [];

        foreach (IGrouping<string, FindingRecordMetadataRow> tier in allRows.GroupBy(static row => row.Severity))
        {
            List<FindingRecordMetadataRow> tierRows = tier.ToList();

            if (tierRows.Count == 0)
                continue;

            IReadOnlyList<string> orderedIds = await RankTierAsync(industryVertical, tier.Key, tierRows, cancellationToken);
            int rank = 0;

            foreach (string findingId in orderedIds)
            {
                ranks.Add((findingId, rank));
                rank++;
            }

            foreach (FindingRecordMetadataRow row in tierRows)
            {
                if (orderedIds.Contains(row.FindingId, StringComparer.OrdinalIgnoreCase))
                    continue;

                ranks.Add((row.FindingId, rank));
                rank++;
            }
        }

        await _findingsSnapshotRepository.UpdatePriorityRanksAsync(snapshotId, ranks, cancellationToken);
    }

    private async Task<string> ResolveIndustryVerticalAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
            return "general enterprise";

        if (!string.IsNullOrWhiteSpace(tenant.IndustryVertical))
            return tenant.IndustryVertical.Trim();

        return "general enterprise";
    }

    private async Task<List<FindingRecordMetadataRow>> LoadAllFindingRowsAsync(
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        List<FindingRecordMetadataRow> rows = [];
        int? cursorSort = null;
        Guid? cursorRecord = null;
        int? cursorPriority = null;

        while (true)
        {
            FindingRecordMetadataPage page = await _findingsSnapshotRepository.ListFindingRecordsKeysetAsync(
                snapshotId,
                cursorSort,
                cursorRecord,
                cursorPriority,
                severity: null,
                category: null,
                findingType: null,
                take: 200,
                orderByPriority: false,
                cancellationToken);

            rows.AddRange(page.Items);

            if (!page.HasMore || page.Items.Count == 0)
                break;

            FindingRecordMetadataRow last = page.Items[^1];
            cursorSort = last.SortOrder;
            cursorRecord = last.FindingRecordId;
            cursorPriority = last.PriorityRank;
        }

        return rows;
    }

    private async Task<IReadOnlyList<string>> RankTierAsync(
        string industryVertical,
        string severity,
        IReadOnlyList<FindingRecordMetadataRow> tierRows,
        CancellationToken cancellationToken)
    {
        if (tierRows.Count <= 1)
            return tierRows.Select(static row => row.FindingId).ToArray();

        string userPrompt =
            $"Industry vertical: {industryVertical}\n" +
            $"Severity tier: {severity}\n" +
            $"Findings ({tierRows.Count}):\n" +
            string.Join(
                "\n",
                tierRows.Select(static row => $"- {row.FindingId}: {row.Title} ({row.Category})"));

        try
        {
            string raw = await _completionClient.CompleteJsonAsync(
                SystemPrompt,
                userPrompt,
                maxTokens: null,
                temperature: null,
                cancellationToken: cancellationToken);

            string[]? ids = JsonSerializer.Deserialize<string[]>(raw, JsonOptions);

            if (ids is null || ids.Length == 0)
                return [];

            return ids
                .Where(static id => !string.IsNullOrWhiteSpace(id))
                .Select(static id => id.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Finding priority re-rank failed for severity {Severity}.",
                LogSanitizer.Sanitize(severity));

            return [];
        }
    }
}
