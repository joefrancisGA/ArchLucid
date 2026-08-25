using System.Text.Json;

using ArchLucid.Application.Pilots;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BuyerProofPackDeltasJsonFormatterTests
{
    private static readonly DateTime UtcNow = new(2026, 5, 30, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Serialize_uses_camelCase_names_that_pass_commit_guard()
    {
        PilotRunDeltasResponse response = BuildCommittedResponse(extractorCollectionTimestampUtc: UtcNow.AddDays(-1));

        string json = BuyerProofPackDeltasJsonFormatter.Serialize(response);

        bool ok = BuyerProofPackCommitGuard.TryValidateDeltasJson(json, out _, out string? error);

        ok.Should().BeTrue(error);
        json.Should().Contain("\"proofPackageCompleteness\"");
        json.Should().NotContain("\"ProofPackageCompleteness\"");
    }

    [Fact]
    public void Serialize_with_stale_extractor_matches_api_hold_freshness_disposition()
    {
        ValueReportSnapshot snapshot = CreateSnapshot();
        ArchitectureRun run = BuildCommittedRun();
        PilotRunDeltas deltas = new()
        {
            RunCreatedUtc = run.CreatedUtc,
            ManifestCommittedUtc = UtcNow.AddDays(-10),
            FindingsBySeverity = [new KeyValuePair<string, int>("Warning", 1)],
            EstimatedUsdSavings = 5000m,
            IsDemoTenant = false,
        };

        DateTime staleExtractorUtc = UtcNow.AddDays(-45);

        PilotRunDeltasResponse response = PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
            run,
            BuildManifest(),
            deltas,
            snapshot,
            staleExtractorUtc,
            scorecardBaselines: null,
            freshnessEvaluationUtc: UtcNow);

        string json = BuyerProofPackDeltasJsonFormatter.Serialize(response);

        using JsonDocument doc = JsonDocument.Parse(json);
        string disposition = doc.RootElement.GetProperty("roiSourceFreshnessDisposition").GetString()!;

        disposition.Should().Be("HOLD");
        response.RoiSourceFreshnessDisposition.Should().Be("HOLD");
    }

    [Fact]
    public void Default_pascalCase_serialization_fails_commit_guard()
    {
        PilotRunDeltasResponse response = BuildCommittedResponse(extractorCollectionTimestampUtc: UtcNow.AddDays(-1));

        string json = JsonSerializer.Serialize(response);

        bool ok = BuyerProofPackCommitGuard.TryValidateDeltasJson(json, out _, out _);

        ok.Should().BeFalse();
    }

    private static PilotRunDeltasResponse BuildCommittedResponse(DateTime? extractorCollectionTimestampUtc) =>
        PilotRunDeltasResponseMapper.ToResponseWithProofPackage(
            BuildCommittedRun(),
            BuildManifest(),
            new PilotRunDeltas
            {
                RunCreatedUtc = UtcNow.AddDays(-10),
                ManifestCommittedUtc = UtcNow.AddDays(-9),
                FindingsBySeverity = [new KeyValuePair<string, int>("Warning", 1)],
                IsDemoTenant = false,
            },
            CreateSnapshot(),
            extractorCollectionTimestampUtc,
            scorecardBaselines: null,
            freshnessEvaluationUtc: UtcNow);

    private static ArchitectureRun BuildCommittedRun() =>
        new()
        {
            RunId = "r1",
            RequestId = "req1",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = UtcNow.AddDays(-10),
            CurrentManifestVersion = "v2",
        };

    private static GoldenManifest BuildManifest() =>
        new()
        {
            RunId = "r1",
            SystemName = "test-system",
            Metadata = new ManifestMetadata
            {
                CreatedUtc = UtcNow.AddDays(-9),
                ManifestVersion = "v2",
            },
        };

    private static ValueReportSnapshot CreateSnapshot() =>
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
            40m,
            "signup",
            DateTimeOffset.Parse("2026-03-01T00:00:00Z"),
            null,
            0,
            ReviewCycleBaselineProvenance.TenantSuppliedAtSignup,
            null,
            null,
            0,
            0,
            12m,
            null);
}
