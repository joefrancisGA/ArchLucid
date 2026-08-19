using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Compliance;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

using Moq;

namespace ArchLucid.Retrieval.Tests;

/// <summary>
///     RC28b package-coverage batch: token budget math, retail-price heuristics, policy-pack hit formatting, and
///     startup indexer telemetry guard.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalPackageCoverageBatchRc28bTests
{
    [Fact]
    public void TokenAwareContextBudget_EstimateTokenCount_and_truncate()
    {
        TokenAwareContextBudget.EstimateTokenCount("").Should().Be(0);
        TokenAwareContextBudget.EstimateTokenCount("abcd").Should().Be(1);
        FluentActions
            .Invoking(() => TokenAwareContextBudget.EstimateTokenCount("x", charsPerToken: 0))
            .Should()
            .Throw<ArgumentOutOfRangeException>();

        string shortText = TokenAwareContextBudget.TruncateToTokenBudget("hello", out bool shortTruncated, maxEstimatedTokens: 10);
        shortTruncated.Should().BeFalse();
        shortText.Should().Be("hello");

        string longPayload = new('a', 500);
        string truncated = TokenAwareContextBudget.TruncateToTokenBudget(
            longPayload,
            out bool wasTruncated,
            maxEstimatedTokens: 10,
            charsPerToken: 4);
        wasTruncated.Should().BeTrue();
        truncated.Should().Contain("Context truncated");
    }

    [Theory]
    [InlineData("AmazonEC2", "m5.large", true, 70)]
    [InlineData("AmazonEC2", "t3.micro", true, 8)]
    [InlineData("AmazonEC2", "m5.2xlarge", true, 70)]
    [InlineData("AmazonEC2", "t3.2xlarge", true, 15)]
    [InlineData("AmazonS3", "m5.large", false, 0)]
    public void AwsRetailPricesHeuristicFallback_TryGetMonthlyUsd(
        string service,
        string instanceType,
        bool expectedOk,
        decimal expectedUsd)
    {
        bool ok = AwsRetailPricesHeuristicFallback.TryGetMonthlyUsd(service, instanceType, out decimal usd);

        ok.Should().Be(expectedOk);
        usd.Should().Be(expectedUsd);
    }

    [Theory]
    [InlineData("Compute Engine", "n1-standard-1", true, 35)]
    [InlineData("Compute Engine", "e2-medium", true, 25)]
    [InlineData("Compute Engine", "n1-standard-8", true, 70)]
    [InlineData("Compute Engine", "e2-highmem-2", true, 25)]
    [InlineData("Cloud Storage", "n1-standard-1", false, 0)]
    public void GcpRetailPricesHeuristicFallback_TryGetMonthlyUsd(
        string service,
        string machineType,
        bool expectedOk,
        decimal expectedUsd)
    {
        bool ok = GcpRetailPricesHeuristicFallback.TryGetMonthlyUsd(service, machineType, out decimal usd);

        ok.Should().Be(expectedOk);
        usd.Should().Be(expectedUsd);
    }

    [Fact]
    public void CompliancePolicyPackRetrievalPromptFormatter_formats_hits()
    {
        Mock<IRetrievalCitationFormatter> formatter = new();
        formatter.Setup(f => f.Format(It.IsAny<RetrievalHit>())).Returns("cite-1");
        List<RetrievalHit> hits =
        [
            new() { Text = "Require encryption at rest", Score = 0.9 },
        ];

        string block = CompliancePolicyPackRetrievalPromptFormatter.FormatPolicyPackBlock(hits, formatter.Object);

        block.Should().Contain("groundingMissing: false");
        block.Should().Contain("cite-1");
        block.Should().Contain("Require encryption at rest");
    }

    [Fact]
    public void CompliancePolicyPackRetrievalPromptFormatter_BuildPolicyQueryText_rejects_null()
    {
        FluentActions
            .Invoking(() => CompliancePolicyPackRetrievalPromptFormatter.BuildPolicyQueryText(null!))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Fact]
    public void RetrievalCorpusStartupIndexerTelemetry_RecordFailure_ignores_blank()
    {
        FluentActions
            .Invoking(() => RetrievalCorpusStartupIndexerTelemetry.RecordFailure("  "))
            .Should()
            .NotThrow();
        FluentActions
            .Invoking(() => RetrievalCorpusStartupIndexerTelemetry.RecordFailure("policy-packs"))
            .Should()
            .NotThrow();
    }
}
