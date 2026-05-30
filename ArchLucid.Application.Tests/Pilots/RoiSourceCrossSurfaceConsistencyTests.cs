using System.Text;
using System.Text.Json;

using ArchLucid.Application.Pilots;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

/// <summary>
///     ROI source label and freshness consistency across pilot deltas, value report, and proof-packet JSON (improvement #11).
/// </summary>
[Trait("Suite", "Core")]
public sealed class RoiSourceCrossSurfaceConsistencyTests
{
    private static readonly DateTime UtcNow = new(2026, 5, 30, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Pilot_deltas_response_roi_sources_match_value_report_catalog_and_markdown_labels()
    {
        ValueReportSnapshot snapshot = CreateSnapshot(
            tenantBaselineReviewCycleHours: 40m,
            reviewProvenance: ReviewCycleBaselineProvenance.TenantSuppliedAtSignup,
            tenantManualPrepHours: 12m);

        IReadOnlyList<RoiMetricSourceRow> catalogRows = RoiMetricSourceCatalogBuilder.Build(snapshot);

        ArchitectureRun run = BuildCommittedRun();
        PilotRunDeltas deltas = BuildPilotDeltas();

        PilotRunDeltasResponse response = PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
            run,
            BuildManifest(),
            deltas,
            snapshot,
            extractorCollectionTimestampUtc: UtcNow.AddDays(-1),
            scorecardBaselines: null);

        response.RoiMetricSources.Should().BeEquivalentTo(catalogRows);

        StringBuilder markdown = new();
        RoiMetricSourceMarkdownFormatter.AppendMarkdownSection(markdown, catalogRows);
        string md = markdown.ToString();

        md.Should().Contain(nameof(RoiMetricSourceKind.CustomerProvided));
        md.Should().Contain(nameof(RoiMetricSourceKind.BenchmarkAssumption));
        md.Should().NotContain("guaranteed savings");
    }

    [Fact]
    public void Stale_extractor_and_benchmark_only_paths_share_hold_or_warn_disposition_across_surfaces()
    {
        ValueReportSnapshot staleSnapshot = CreateSnapshot(
            tenantBaselineReviewCycleHours: 40m,
            reviewProvenance: ReviewCycleBaselineProvenance.TenantSuppliedAtSignup,
            tenantManualPrepHours: 12m);

        IReadOnlyList<RoiMetricSourceRow> staleSources = RoiMetricSourceCatalogBuilder.Build(staleSnapshot);

        string staleDisposition = RoiMetricSourceFreshnessRules.ResolveDisposition(
            UtcNow.AddDays(-45),
            isDemoTenant: false,
            estimatedUsdSavings: 5000m,
            staleSources,
            UtcNow);

        ArchitectureRun run = BuildCommittedRun();
        PilotRunDeltas staleDeltas = BuildPilotDeltas() with { EstimatedUsdSavings = 5000m };

        PilotRunDeltasResponse staleResponse = PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
            run,
            BuildManifest(),
            staleDeltas,
            staleSnapshot,
            extractorCollectionTimestampUtc: UtcNow.AddDays(-45),
            scorecardBaselines: null);

        staleDisposition.Should().Be("HOLD");
        staleResponse.RoiSourceFreshnessDisposition.Should().Be(staleDisposition);

        ValueReportSnapshot benchmarkSnapshot = CreateSnapshot(
            tenantBaselineReviewCycleHours: null,
            reviewProvenance: ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions,
            tenantManualPrepHours: null);

        IReadOnlyList<RoiMetricSourceRow> benchmarkSources = RoiMetricSourceCatalogBuilder.Build(benchmarkSnapshot);

        string warnDisposition = RoiMetricSourceFreshnessRules.ResolveDisposition(
            UtcNow.AddDays(-1),
            isDemoTenant: false,
            estimatedUsdSavings: 100m,
            benchmarkSources,
            UtcNow);

        PilotRunDeltasResponse warnResponse = PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
            run,
            BuildManifest(),
            BuildPilotDeltas() with { EstimatedUsdSavings = 100m },
            benchmarkSnapshot,
            extractorCollectionTimestampUtc: UtcNow.AddDays(-1),
            scorecardBaselines: null);

        warnDisposition.Should().Be("WARN");
        warnResponse.RoiSourceFreshnessDisposition.Should().Be(warnDisposition);
    }

    [Fact]
    public void Proof_packet_json_round_trip_preserves_roi_source_kinds_and_freshness_disposition()
    {
        ValueReportSnapshot snapshot = CreateSnapshot(
            tenantBaselineReviewCycleHours: null,
            reviewProvenance: ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions,
            tenantManualPrepHours: null);

        IReadOnlyList<RoiMetricSourceRow> catalogRows = RoiMetricSourceCatalogBuilder.Build(snapshot);
        ArchitectureRun run = BuildCommittedRun();
        PilotRunDeltas deltas = BuildPilotDeltas() with { EstimatedUsdSavings = 100m };

        PilotRunDeltasResponse response = PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
            run,
            BuildManifest(),
            deltas,
            snapshot,
            extractorCollectionTimestampUtc: UtcNow.AddDays(-1),
            scorecardBaselines: null);

        string deltasJson = JsonSerializer.Serialize(
            new
            {
                estimatedUsdSavings = response.EstimatedUsdSavings,
                roiMetricSources = response.RoiMetricSources.Select(row => new
                {
                    metricKey = row.MetricKey,
                    label = row.DisplayLabel,
                    value = row.ValueSummary,
                    sourceKind = row.SourceKind.ToString(),
                    citation = row.CitationDetail,
                }),
                proofPackageCompleteness = new { agentOutputPilotStrictEvidenceSatisfied = true },
            });

        IReadOnlyList<RoiMetricSourceRow> parsed = ParseProofPacketRoiSources(deltasJson);

        parsed.Should().HaveCount(catalogRows.Count);

        foreach (RoiMetricSourceRow expected in catalogRows)
        {
            RoiMetricSourceRow actual = parsed.Single(r => r.MetricKey == expected.MetricKey);
            actual.SourceKind.Should().Be(expected.SourceKind);
            actual.DisplayLabel.Should().Be(expected.DisplayLabel);
        }

        string disposition = RoiMetricSourceFreshnessRules.ResolveDisposition(
            UtcNow.AddDays(-1),
            isDemoTenant: false,
            estimatedUsdSavings: 100m,
            parsed,
            UtcNow);

        disposition.Should().Be(response.RoiSourceFreshnessDisposition);
    }

    private static IReadOnlyList<RoiMetricSourceRow> ParseProofPacketRoiSources(string deltasJson)
    {
        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        if (!root.TryGetProperty("roiMetricSources", out JsonElement sources)
            || sources.ValueKind != JsonValueKind.Array)
            return [];

        List<RoiMetricSourceRow> rows = [];

        foreach (JsonElement row in sources.EnumerateArray())
        {
            string? metricKey = row.TryGetProperty("metricKey", out JsonElement keyEl) ? keyEl.GetString() : null;
            string? label = row.TryGetProperty("label", out JsonElement labelEl) ? labelEl.GetString() : null;
            string? value = row.TryGetProperty("value", out JsonElement valueEl) ? valueEl.GetString() : null;
            string? citation = row.TryGetProperty("citation", out JsonElement citeEl) ? citeEl.GetString() : null;

            if (string.IsNullOrWhiteSpace(metricKey) || string.IsNullOrWhiteSpace(label))
                continue;

            RoiMetricSourceKind kind = RoiMetricSourceKind.BenchmarkAssumption;

            if (row.TryGetProperty("sourceKind", out JsonElement kindEl))
            {
                string? kindText = kindEl.GetString();

                if (!string.IsNullOrWhiteSpace(kindText)
                    && Enum.TryParse(kindText, ignoreCase: true, out RoiMetricSourceKind parsed))
                    kind = parsed;
            }

            rows.Add(new RoiMetricSourceRow(metricKey, label, value ?? string.Empty, kind, citation ?? string.Empty));
        }

        return rows;
    }

    private static ArchitectureRun BuildCommittedRun() =>
        new()
        {
            RunId = "r1",
            RequestId = "req1",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            CurrentManifestVersion = "v2",
            StructuralExecutionMode = StructuralExecutionMode.Simulator,
        };

    private static GoldenManifest BuildManifest() =>
        new()
        {
            RunId = "r1",
            SystemName = "test-system",
            Metadata = new ManifestMetadata
            {
                CreatedUtc = new DateTime(2026, 4, 1, 0, 5, 0, DateTimeKind.Utc),
                ManifestVersion = "v2",
            },
        };

    private static PilotRunDeltas BuildPilotDeltas() =>
        new()
        {
            RunCreatedUtc = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            ManifestCommittedUtc = new DateTime(2026, 4, 1, 0, 5, 0, DateTimeKind.Utc),
            FindingsBySeverity = [new KeyValuePair<string, int>("Warning", 1)],
            AuditRowCount = 2,
            LlmCallCount = 1,
            LlmCallCountResolved = true,
            IsDemoTenant = false,
        };

    private static ValueReportSnapshot CreateSnapshot(
        decimal? tenantBaselineReviewCycleHours,
        ReviewCycleBaselineProvenance reviewProvenance,
        decimal? tenantManualPrepHours) =>
        new(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            DateTimeOffset.Parse("2026-04-01T00:00:00Z"),
            DateTimeOffset.Parse("2026-05-01T00:00:00Z"),
            [],
            3,
            2,
            1,
            0,
            10m,
            2m,
            1m,
            13m,
            4.5m,
            "Per-run estimate from ValueReportComputationOptions — not invoice truth.",
            12000m,
            900m,
            25000m,
            -13900m,
            -55.6m,
            tenantBaselineReviewCycleHours,
            tenantBaselineReviewCycleHours is null ? null : "signup",
            tenantBaselineReviewCycleHours is null ? null : DateTimeOffset.Parse("2026-03-01T00:00:00Z"),
            null,
            0,
            reviewProvenance,
            null,
            null,
            0,
            0,
            tenantManualPrepHours,
            null);
}
