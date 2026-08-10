using System.Globalization;
using System.Text;

using ArchLucid.Application.Governance;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.ExecDigest;

/// <inheritdoc cref = "IExecDigestComposer"/>
public sealed class ExecDigestComposer(
    IComplianceDriftTrendService complianceDriftTrendService,
    IAuthorityQueryService authorityQueryService,
    IRunDetailQueryService runDetailQueryService,
    IPilotRunDeltaComputer pilotRunDeltaComputer,
    IGovernanceDigestDecisionNeededComposer governanceDigestDecisionNeededComposer,
    ILogger<ExecDigestComposer> logger) : IExecDigestComposer
{
    private const int MaxListRuns = 200;
    private const int MaxRunDetailLookups = 40;
    private const int RunDetailLookupMaxConcurrent = 6;
    private const int TopRunCount = 3;
    private readonly IAuthorityQueryService _authorityQueryService = authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IComplianceDriftTrendService _complianceDriftTrendService =
        complianceDriftTrendService ?? throw new ArgumentNullException(nameof(complianceDriftTrendService));

    private readonly ILogger<ExecDigestComposer> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IPilotRunDeltaComputer _pilotRunDeltaComputer = pilotRunDeltaComputer ?? throw new ArgumentNullException(nameof(pilotRunDeltaComputer));
    private readonly IRunDetailQueryService _runDetailQueryService = runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    /// <inheritdoc/>
    public async Task<ExecDigestComposition> ComposeAsync(Guid tenantId, DateTime weekStartUtcInclusive, DateTime weekEndUtcExclusive,
        ScopeContext authorityScope, string operatorBaseUrl, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(authorityScope);
        ArgumentNullException.ThrowIfNull(operatorBaseUrl);
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));
        if (weekStartUtcInclusive >= weekEndUtcExclusive)
            throw new ArgumentOutOfRangeException(nameof(weekEndUtcExclusive));
        string baseUrl = NormalizeBaseUrl(operatorBaseUrl);
        string weekLabel = FormatWeekLabel(weekStartUtcInclusive, weekEndUtcExclusive);
        string? complianceMarkdown = await TryBuildComplianceMarkdownAsync(tenantId, weekStartUtcInclusive, weekEndUtcExclusive, cancellationToken);
        string dashboardUrl = $"{baseUrl}/runs";
        (int? manifestCount, List<ExecDigestHighlightedRun> highlights, string? latestRunHex, string? findingsDelta) =
            await TryBuildManifestAndFindingSectionsAsync(authorityScope, weekStartUtcInclusive, weekEndUtcExclusive, cancellationToken);
        string sponsorUrl = string.IsNullOrWhiteSpace(latestRunHex) ? dashboardUrl : $"{baseUrl}/runs/{latestRunHex}";
        string? decisionNeededMarkdown = await governanceDigestDecisionNeededComposer.BuildDecisionNeededMarkdownAsync(
            tenantId,
            authorityScope.WorkspaceId,
            authorityScope.ProjectId,
            cancellationToken);
        return new ExecDigestComposition(
            weekLabel,
            complianceMarkdown,
            manifestCount,
            highlights,
            findingsDelta,
            dashboardUrl,
            sponsorUrl,
            latestRunHex,
            decisionNeededMarkdown);
    }

    private async Task<string?> TryBuildComplianceMarkdownAsync(Guid tenantId, DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken)
    {
        try
        {
            TimeSpan bucket = TimeSpan.FromHours(24);
            IReadOnlyList<ComplianceDriftTrendPoint> points =
                await _complianceDriftTrendService.GetTrendAsync(tenantId, fromUtc, toUtc, bucket, cancellationToken);
            if (points.Count == 0)
                return null;
            StringBuilder sb = new();
            sb.AppendLine("| Day (UTC) | Total changes | Top change types |");
            sb.AppendLine("| --- | ---: | --- |");
            foreach (ComplianceDriftTrendPoint p in points)
            {
                string topTypes = p.ChangesByType.Count == 0
                    ? "—"
                    : string.Join(", ", p.ChangesByType.OrderByDescending(static kv => kv.Value).Take(3).Select(static kv => $"`{kv.Key}`: {kv.Value}"));
                sb.AppendLine($"| {p.BucketUtc:yyyy-MM-dd} | {p.ChangeCount} | {topTypes} |");
            }

            return sb.ToString();
        }
        catch (Exception ex)when (!cancellationToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Exec digest: compliance drift section omitted for tenant {TenantId}.", tenantId);
            return null;
        }
    }

    private async Task<(int? manifestCount, List<ExecDigestHighlightedRun> highlights, string? latestRunHex, string? findingsDelta)>
        TryBuildManifestAndFindingSectionsAsync(ScopeContext authorityScope, DateTime weekStartUtcInclusive, DateTime weekEndUtcExclusive,
            CancellationToken cancellationToken)
    {
        try
        {
            IReadOnlyList<RunSummaryDto> summaries =
                await _authorityQueryService.ListRunsByProjectAsync(authorityScope, "default", MaxListRuns, cancellationToken);
            List<Guid> candidateRunIds = summaries
                .Where(static s => s.HasGoldenManifest)
                .Select(static s => s.RunId)
                .Distinct()
                .Take(MaxRunDetailLookups)
                .ToList();

            // Fan-out rollup detail + pilot score (degree 6) without exhausting the SQL pool; order preserved for stable filtering.
            (Guid RunId, DateTime? CommittedUtc, int Score)?[] scoredSlots =
                await BoundedParallelMap.MapAsync<Guid, (Guid RunId, DateTime? CommittedUtc, int Score)?>(
                    candidateRunIds,
                    RunDetailLookupMaxConcurrent,
                    async (runId, ct) =>
                    {
                        ArchitectureRunDetail? detail =
                            await _runDetailQueryService.GetRunDetailForRollupAsync(runId.ToString("N"), ct);

                        if (detail is null)
                            return null;

                        if (detail.Run.Status is not ArchitectureRunStatus.Committed)
                            return null;

                        DateTime? committedUtc = detail.Manifest?.Metadata.CreatedUtc;

                        if (committedUtc is null)
                            return null;

                        if (committedUtc < weekStartUtcInclusive || committedUtc >= weekEndUtcExclusive)
                            return null;

                        PilotRunDeltas deltas = await _pilotRunDeltaComputer.ComputeAsync(detail, ct);
                        int score = deltas.FindingsBySeverity.Sum(static p => p.Value);

                        return (runId, committedUtc, score);
                    },
                    cancellationToken);

            List<(Guid RunId, DateTime? CommittedUtc, int Score)> scored = scoredSlots
                .Where(static slot => slot is not null)
                .Select(static slot => slot!.Value)
                .ToList();

            int manifestCount = scored.Count;
            List<ExecDigestHighlightedRun> highlights = scored
                .OrderByDescending(static x => x.Score)
                .ThenByDescending(static x => x.CommittedUtc)
                .Take(TopRunCount)
                .Select(static x =>
                    new ExecDigestHighlightedRun(
                        x.RunId.ToString("N"),
                        x.Score,
                        x.CommittedUtc is { } c ? $"Committed {c:yyyy-MM-dd} UTC" : null))
                .ToList();
            string? latestHex = scored
                .OrderByDescending(static x => x.CommittedUtc)
                .Select(static x => x.RunId.ToString("N"))
                .FirstOrDefault();
            string? findingsDelta = TryBuildFindingsDelta(scored);

            return (manifestCount == 0 ? null : manifestCount, highlights, latestHex, findingsDelta);
        }
        catch (Exception ex)when (!cancellationToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Exec digest: manifest/findings sections omitted.");
            return (null, [], null, null);
        }
    }

    /// <summary>
    ///     Builds the earliest→latest findings line from already-computed scores (findings totals) —
    ///     avoids a second pair of rollup fetches for the same runs.
    /// </summary>
    private static string? TryBuildFindingsDelta(IReadOnlyList<(Guid RunId, DateTime? CommittedUtc, int Score)> scored)
    {
        if (scored.Count < 2)
            return null;

        List<(Guid RunId, DateTime? CommittedUtc, int Score)> ordered = scored.OrderBy(static x => x.CommittedUtc).ToList();
        int olderTotal = ordered[0].Score;
        int newerTotal = ordered[^1].Score;

        return $"Findings (total severities) moved from {olderTotal} → {newerTotal} between earliest and latest commits in this UTC window.";
    }

    private static string NormalizeBaseUrl(string operatorBaseUrl)
    {
        return string.IsNullOrWhiteSpace(operatorBaseUrl) ? "http://localhost:3000" : operatorBaseUrl.Trim().TrimEnd('/');
    }

    private static string FormatWeekLabel(DateTime startUtc, DateTime endUtc)
    {
        int isoYear = ISOWeek.GetYear(startUtc.Date);
        int isoWeek = ISOWeek.GetWeekOfYear(startUtc.Date);
        return $"{startUtc:yyyy-MM-dd}–{endUtc.AddTicks(-1):yyyy-MM-dd} UTC (ISO week {isoYear}-W{isoWeek:00})";
    }
}
