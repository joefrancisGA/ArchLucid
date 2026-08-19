using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Alerts.Delivery;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.TechnologyLedger;
using ArchLucid.Persistence.BlobStore;

using FluentAssertions;

namespace ArchLucid.Core.Tests;

/// <summary>
///     RC28d package-coverage batch: alert routing metadata, explanation confidence callouts, blob tenant paths,
///     and technology-ledger prompt formatting.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePackageCoverageBatchRc28dTests
{
    [Fact]
    public void AlertRoutingCriteriaMetadata_Parse_reads_arrays_and_tolerates_bad_json()
    {
        AlertRoutingCriteria empty = AlertRoutingCriteriaMetadata.Parse(null);
        empty.Severities.Should().BeEmpty();

        AlertRoutingCriteria parsed = AlertRoutingCriteriaMetadata.Parse(
            """
            {
              "routingCriteria": {
                "severities": [" High ", "", "high", 1],
                "findingTypes": ["Cost"],
                "tags": ["sponsor"]
              },
              "other": true
            }
            """);

        parsed.Severities.Should().Equal("High", "high");
        parsed.FindingTypes.Should().ContainSingle("Cost");
        parsed.Tags.Should().ContainSingle("sponsor");

        AlertRoutingCriteriaMetadata.Parse("{ not-json").Severities.Should().BeEmpty();
        AlertRoutingCriteriaMetadata.Parse("""{"routingCriteria":"nope"}""").Severities.Should().BeEmpty();
    }

    [Fact]
    public void AlertRoutingCriteriaMetadata_MergeIntoMetadata_writes_and_clears_criteria()
    {
        string withCriteria = AlertRoutingCriteriaMetadata.MergeIntoMetadata(
            """{"keep":1}""",
            new AlertRoutingCriteria
            {
                Severities = [" Critical ", "critical", " "],
                FindingTypes = ["Security"],
                Tags = ["ops"],
            });

        using (JsonDocument doc = JsonDocument.Parse(withCriteria))
        {
            doc.RootElement.GetProperty("keep").GetInt32().Should().Be(1);
            JsonElement criteria = doc.RootElement.GetProperty("routingCriteria");
            criteria.GetProperty("severities").EnumerateArray().Select(e => e.GetString()).Should().Equal("Critical");
            criteria.GetProperty("findingTypes").EnumerateArray().Select(e => e.GetString()).Should().Equal("Security");
        }

        string cleared = AlertRoutingCriteriaMetadata.MergeIntoMetadata(withCriteria, new AlertRoutingCriteria());
        cleared.Should().Contain("keep");
        cleared.Should().NotContain("routingCriteria");

        AlertRoutingCriteriaMetadata.MergeIntoMetadata(null, null).Should().Be("{}");
    }

    [Theory]
    [InlineData(null, "PASS")]
    [InlineData(0.4, "HOLD")]
    [InlineData(0.6, "WARN")]
    [InlineData(0.9, "PASS")]
    public void RunExplanationConfidenceCalloutBuilder_ResolveDisposition_matrix(
        double? ratio,
        string expected)
    {
        RunExplanationConfidenceSignals? signals = ratio is null
            ? null
            : new RunExplanationConfidenceSignals(ratio, false, null, 2);

        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be(expected);
    }

    [Fact]
    public void RunExplanationConfidenceCalloutBuilder_FromAggregateJson_and_limitations()
    {
        RunExplanationConfidenceCalloutBuilder.FromAggregateJson(null).Should().BeNull();
        RunExplanationConfidenceCalloutBuilder.FromAggregateJson("  ").Should().BeNull();

        RunExplanationConfidenceSignals? parsed = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.55,
              "usedDeterministicFallback": true,
              "faithfulnessWarning": " weak citations ",
              "citations": [{"id":"c1"},{"id":"c2"}]
            }
            """);

        parsed.Should().NotBeNull();
        parsed!.FaithfulnessSupportRatio.Should().Be(0.55);
        parsed.DeterministicFallbackUsed.Should().BeTrue();
        parsed.FaithfulnessWarning.Should().Be("weak citations");
        parsed.CitationCount.Should().Be(2);

        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(parsed).Should().Be("HOLD");
        string? line = RunExplanationConfidenceCalloutBuilder.BuildLimitationsLine(parsed);
        line.Should().Contain("HOLD");
        line.Should().Contain("weak citations");

        string? export = RunExplanationConfidenceCalloutBuilder.BuildExportCallout(parsed);
        export.Should().NotBeNull();
        export!.Should().NotContain("**");

        RunExplanationSummary summary = new()
        {
            Explanation = new ExplanationResult { RawText = "ok" },
            ThemeSummaries = [],
            OverallAssessment = "stable",
            RiskPosture = "moderate",
            FaithfulnessSupportRatio = 0.95,
            DeterministicFallbackUsed = false,
            FaithfulnessWarning = null,
            Citations = [],
        };
        RunExplanationConfidenceSignals fromSummary = RunExplanationConfidenceCalloutBuilder.FromSummary(summary);
        fromSummary.CitationCount.Should().Be(0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(fromSummary).Should().Be("WARN");
        RunExplanationConfidenceCalloutBuilder.BuildLimitationsLine(null).Should().BeNull();
    }

    [Fact]
    public void ArtifactBlobTenantPaths_guards_and_prefix_paths()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid manifestId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        Guid artifactId = Guid.Parse("55555555-5555-5555-5555-555555555555");

        ArtifactBlobTenantPaths.TenantPrefixDirectorySegment(tenantId)
            .Should()
            .Be("11111111-1111-1111-1111-111111111111/");

        FluentActions
            .Invoking(() => ArtifactBlobTenantPaths.ThrowIfBlobRelativePathUnsafe(" "))
            .Should()
            .Throw<ArgumentException>();
        FluentActions
            .Invoking(() => ArtifactBlobTenantPaths.ThrowIfBlobRelativePathUnsafe("../x"))
            .Should()
            .Throw<InvalidOperationException>();
        FluentActions
            .Invoking(() => ArtifactBlobTenantPaths.ThrowIfBlobRelativePathUnsafe("/abs"))
            .Should()
            .Throw<InvalidOperationException>();

        string relative = ArtifactBlobTenantPaths.FormatArtifactContentRelativePath(
            workspaceId,
            projectId,
            manifestId,
            artifactId,
            "payload.bin");
        relative.Should().Contain("/artifacts/");
        relative.Should().EndWith("/payload.bin");

        FluentActions
            .Invoking(() => ArtifactBlobTenantPaths.FormatArtifactContentRelativePath(
                workspaceId, projectId, manifestId, artifactId, "a/b"))
            .Should()
            .Throw<InvalidOperationException>();

        string dedup = ArtifactBlobTenantPaths.FormatDedupArtifactContentRelativePath(
            new string('a', 64));
        dedup.Should().Be($"dedup/{new string('a', 64)}/payload.txt");

        FluentActions
            .Invoking(() => ArtifactBlobTenantPaths.FormatDedupArtifactContentRelativePath("abc"))
            .Should()
            .Throw<ArgumentException>();

        FixedScopeProvider scope = new(new ScopeContext
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        });

        string prefixed = ArtifactBlobTenantPaths.PrefixWithTenant(scope, "workspace/file.txt");
        prefixed.Should().StartWith(ArtifactBlobTenantPaths.TenantPrefixDirectorySegment(tenantId));

        FluentActions
            .Invoking(() => ArtifactBlobTenantPaths.PrefixWithTenant(scope, $"{tenantId:D}/double"))
            .Should()
            .Throw<InvalidOperationException>();

        ArtifactBlobTenantPaths.EnsureReadBlobNameMatchesTenant(scope, prefixed);
        FluentActions
            .Invoking(() => ArtifactBlobTenantPaths.EnsureReadBlobNameMatchesTenant(scope, "other/tenant"))
            .Should()
            .Throw<InvalidOperationException>();
    }

    [Fact]
    public void TechnologyLedgerPromptFormatter_formats_sorts_and_truncates()
    {
        TechnologyLedgerPromptFormatter.FormatTechnologyLedgerContext([]).Should().BeEmpty();

        List<TechnologyLedgerEntry> entries =
        [
            new()
            {
                Role = TechnologyLedgerRole.PrimaryDatastore,
                TechnologyName = "Azure SQL",
                ProviderFamily = CloudProvider.Azure,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.Evidence,
                EvidenceRef = "ev-1",
                CreatedUtc = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc),
            },
            new()
            {
                Role = TechnologyLedgerRole.ComputeRuntime,
                TechnologyName = "App Service",
                ProviderFamily = CloudProvider.Azure,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.AgentProposed,
                CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            },
        ];

        string formatted = TechnologyLedgerPromptFormatter.FormatTechnologyLedgerContext(entries);
        formatted.Should().Contain("Technology Ledger");
        formatted.Should().Contain("ComputeRuntime: App Service");
        formatted.Should().Contain("PrimaryDatastore: Azure SQL");
        formatted.Should().Contain("EvidenceRef=ev-1");
        formatted.IndexOf("PrimaryDatastore:", StringComparison.Ordinal)
            .Should()
            .BeLessThan(formatted.IndexOf("ComputeRuntime:", StringComparison.Ordinal));

        List<TechnologyLedgerEntry> many = Enumerable.Range(0, 40)
            .Select(i => new TechnologyLedgerEntry
            {
                Role = TechnologyLedgerRole.ComputeRuntime,
                TechnologyName = $"tech-{i}",
                ProviderFamily = CloudProvider.Azure,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.AgentProposed,
                CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddMinutes(i),
            })
            .ToList();

        StringBuilder sb = new();
        TechnologyLedgerPromptFormatter.AppendTechnologyLedgerContext(sb, many);
        sb.ToString().Should().Contain("truncated: showing 32 of 40");
    }

    private sealed class FixedScopeProvider : IScopeContextProvider
    {
        private readonly ScopeContext _scope;

        public FixedScopeProvider(ScopeContext scope) => _scope = scope;

        public ScopeContext GetCurrentScope() => _scope;
    }
}
