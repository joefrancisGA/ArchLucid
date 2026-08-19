using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

/// <summary>
///     RC28c package-coverage batch: agent/finding JSON converters, golden-manifest fingerprints, and review-cycle
///     markdown appendix.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContractsPackageCoverageBatchRc28cTests
{
    [Fact]
    public void AgentResultClaimListJsonConverter_reads_strings_and_structured_objects()
    {
        JsonSerializerOptions options = new() { Converters = { new AgentResultClaimListJsonConverter() } };
        const string json =
            """
            ["plain claim", {"detail":"structured","evidenceRefs":["e1"]}, {"text":"alt","claim":"merged"}]
            """;

        List<string>? claims = JsonSerializer.Deserialize<List<string>>(json, options);

        claims.Should().NotBeNull();
        claims!.Should().Contain("plain claim");
        claims.Should().Contain(c => c.Contains("structured", StringComparison.Ordinal));
        claims.Should().Contain(c => c.Contains("alt", StringComparison.Ordinal) && c.Contains("merged", StringComparison.Ordinal));

        string written = JsonSerializer.Serialize(claims, options);
        written.Should().StartWith("[");
        written.Should().Contain("plain claim");
    }

    [Theory]
    [InlineData("\"low\"", FindingSeverity.Info)]
    [InlineData("\"medium\"", FindingSeverity.Warning)]
    [InlineData("\"high\"", FindingSeverity.Error)]
    [InlineData("\"Warning\"", FindingSeverity.Warning)]
    [InlineData("2", FindingSeverity.Error)]
    public void EvalCorpusFindingSeverityJsonConverter_reads_legacy_labels(string json, FindingSeverity expected)
    {
        JsonSerializerOptions options = new() { Converters = { new EvalCorpusFindingSeverityJsonConverter() } };

        FindingSeverity severity = JsonSerializer.Deserialize<FindingSeverity>(json, options);

        severity.Should().Be(expected);
        JsonSerializer.Serialize(severity, options).Should().Contain(severity.ToString());
    }

    [Fact]
    public void AgentTopologyProposalJsonConverter_empty_array_becomes_null_object_round_trips()
    {
        JsonSerializerOptions options = new() { Converters = { new AgentTopologyProposalJsonConverter() } };

        AgentTopologyProposal? fromEmpty = JsonSerializer.Deserialize<AgentTopologyProposal?>("[]", options);
        fromEmpty.Should().BeNull();

        AgentTopologyProposal? fromNull = JsonSerializer.Deserialize<AgentTopologyProposal?>("null", options);
        fromNull.Should().BeNull();

        AgentTopologyProposal proposal = new()
        {
            ProposalId = "prop-1",
            Warnings = ["review SKU"],
        };
        string written = JsonSerializer.Serialize(proposal, options);
        AgentTopologyProposal? roundTrip = JsonSerializer.Deserialize<AgentTopologyProposal?>(written, options);
        roundTrip.Should().NotBeNull();
        roundTrip!.ProposalId.Should().Be("prop-1");
        roundTrip.Warnings.Should().Contain("review SKU");
    }

    [Fact]
    public void GoldenManifestFingerprint_is_stable_for_same_content_and_differs_with_run_identity()
    {
        GoldenManifest left = new()
        {
            SystemName = "payments",
            RunId = "11111111-1111-1111-1111-111111111111",
            Services = [],
            Datastores = [],
            Relationships = [],
        };
        GoldenManifest right = new()
        {
            SystemName = "payments",
            RunId = "22222222-2222-2222-2222-222222222222",
            Services = [],
            Datastores = [],
            Relationships = [],
        };

        string contentLeft = GoldenManifestFingerprint.ComputeContentSha256Hex(left);
        string contentRight = GoldenManifestFingerprint.ComputeContentSha256Hex(right);
        contentLeft.Should().Be(contentRight);
        contentLeft.Should().MatchRegex("^[0-9A-F]+$");

        GoldenManifestFingerprint.ComputeSha256Hex(left)
            .Should().NotBe(GoldenManifestFingerprint.ComputeSha256Hex(right));
    }

    [Fact]
    public void ValueReportReviewCycleSectionFormatter_AppendMarkdownSection_skips_heading_paragraph()
    {
        ValueReportSnapshot snapshot = new(
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            DateTimeOffset.Parse("2026-07-01T00:00:00Z"),
            DateTimeOffset.Parse("2026-08-01T00:00:00Z"),
            [],
            0,
            0,
            0,
            0,
            0m,
            0m,
            0m,
            0m,
            0m,
            "n/a",
            0m,
            0m,
            0m,
            0m,
            0m,
            null,
            null,
            null,
            null,
            0,
            ReviewCycleBaselineProvenance.NoMeasurementYet,
            null,
            null,
            0,
            0,
            null,
            null);

        System.Text.StringBuilder sb = new();
        ValueReportReviewCycleSectionFormatter.AppendMarkdownSection(sb, snapshot);

        sb.ToString().Should().Contain("## Review-cycle delta");
        sb.ToString().Should().Contain("not yet available");
    }
}
