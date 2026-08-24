using ArchLucid.Contracts.Governance;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.PolicyPacks;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

/// <summary>
///     RC26 package-coverage batch: AWS/GCP retail-price heuristic fallbacks and policy-pack rule-pack id resolution.
/// </summary>
[Trait("Category", "Unit")]
public sealed class RetrievalPackageCoverageBatchRc26Tests
{
    [Theory]
    [InlineData("AmazonEC2", "m5.large", 70)]
    [InlineData("AmazonEC2", "  m5.large  ", 70)]
    [InlineData("AmazonEC2", "t3.micro", 8)]
    [InlineData("amazonec2", "r5.large", 91)]
    [InlineData("AmazonEC2", "m5.24xlarge", 70)]
    [InlineData("AmazonEC2", "t3.2xlarge", 15)]
    public void AwsRetailPricesHeuristicFallback_estimates_known_and_prefixed_instance_types(
        string serviceName,
        string instanceType,
        int expectedMonthlyUsd)
    {
        bool resolved = AwsRetailPricesHeuristicFallback.TryGetMonthlyUsd(
            serviceName,
            instanceType,
            out decimal monthlyUsd);

        resolved.Should().BeTrue();
        monthlyUsd.Should().Be(expectedMonthlyUsd);
    }

    [Theory]
    [InlineData("AmazonS3", "m5.large")]
    [InlineData("AmazonEC2", "x1e.32xlarge")]
    public void AwsRetailPricesHeuristicFallback_declines_unknown_service_or_instance_type(
        string serviceName,
        string instanceType)
    {
        bool resolved = AwsRetailPricesHeuristicFallback.TryGetMonthlyUsd(
            serviceName,
            instanceType,
            out decimal monthlyUsd);

        resolved.Should().BeFalse();
        monthlyUsd.Should().Be(0m);
    }

    [Fact]
    public void AwsRetailPricesHeuristicFallback_rejects_blank_arguments()
    {
        FluentActions
            .Invoking(() => AwsRetailPricesHeuristicFallback.TryGetMonthlyUsd("  ", "m5.large", out _))
            .Should()
            .Throw<ArgumentException>();

        FluentActions
            .Invoking(() => AwsRetailPricesHeuristicFallback.TryGetMonthlyUsd("AmazonEC2", "  ", out _))
            .Should()
            .Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("Compute Engine", "n1-standard-1", 35)]
    [InlineData("compute engine", "  e2-medium  ", 25)]
    [InlineData("Compute Engine", "c2-standard-4", 120)]
    [InlineData("Compute Engine", "n1-standard-16", 70)]
    [InlineData("Compute Engine", "e2-highmem-4", 25)]
    public void GcpRetailPricesHeuristicFallback_estimates_known_and_prefixed_machine_types(
        string serviceName,
        string machineType,
        int expectedMonthlyUsd)
    {
        bool resolved = GcpRetailPricesHeuristicFallback.TryGetMonthlyUsd(
            serviceName,
            machineType,
            out decimal monthlyUsd);

        resolved.Should().BeTrue();
        monthlyUsd.Should().Be(expectedMonthlyUsd);
    }

    [Theory]
    [InlineData("Cloud Storage", "e2-medium")]
    [InlineData("Compute Engine", "m3-ultramem-32")]
    public void GcpRetailPricesHeuristicFallback_declines_unknown_service_or_machine_type(
        string serviceName,
        string machineType)
    {
        bool resolved = GcpRetailPricesHeuristicFallback.TryGetMonthlyUsd(
            serviceName,
            machineType,
            out decimal monthlyUsd);

        resolved.Should().BeFalse();
        monthlyUsd.Should().Be(0m);
    }

    [Fact]
    public void GcpRetailPricesHeuristicFallback_rejects_blank_arguments()
    {
        FluentActions
            .Invoking(() => GcpRetailPricesHeuristicFallback.TryGetMonthlyUsd("  ", "e2-medium", out _))
            .Should()
            .Throw<ArgumentException>();

        FluentActions
            .Invoking(() => GcpRetailPricesHeuristicFallback.TryGetMonthlyUsd("Compute Engine", "  ", out _))
            .Should()
            .Throw<ArgumentException>();
    }

    [Fact]
    public void PolicyPackRulePackIdMapper_rejects_null_pack()
    {
        FluentActions
            .Invoking(() => PolicyPackRulePackIdMapper.TryResolveRulePackId(null!))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("{}")]
    [InlineData("""{ "metadata": { "owner": "platform" } }""")]
    [InlineData("""{ "metadata": { "rulePackId": "   " } }""")]
    public void PolicyPackRulePackIdMapper_returns_null_when_no_rule_pack_id_is_declared(string contentJson)
    {
        string? rulePackId = PolicyPackRulePackIdMapper.TryResolveRulePackId(Pack(contentJson));

        rulePackId.Should().BeNull();
    }

    [Fact]
    public void PolicyPackRulePackIdMapper_prefers_explicit_metadata_rule_pack_id()
    {
        ResolvedPolicyPack pack = Pack("""{ "metadata": { "rulePackId": "  hipaa-v3  ", "vertical": "healthcare" } }""");

        string? rulePackId = PolicyPackRulePackIdMapper.TryResolveRulePackId(pack);

        rulePackId.Should().Be("hipaa-v3");
    }

    [Fact]
    public void PolicyPackRulePackIdMapper_falls_back_to_vertical_template_rules_file()
    {
        string root = CreateTemplatesRoot("healthcare", """{ "rulePackId": "  hipaa-template-v1  " }""");

        try
        {
            ResolvedPolicyPack pack = Pack("""{ "metadata": { "vertical": "  healthcare  " } }""");

            string? rulePackId = PolicyPackRulePackIdMapper.TryResolveRulePackId(pack, root);

            rulePackId.Should().Be("hipaa-template-v1");
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public void PolicyPackRulePackIdMapper_returns_null_when_vertical_template_is_missing_or_malformed()
    {
        string root = CreateTemplatesRoot("finance", "{ this is not valid json ");

        try
        {
            // Malformed rules file: the mapper swallows the JSON error rather than failing indexing.
            PolicyPackRulePackIdMapper
                .TryResolveRulePackId(Pack("""{ "metadata": { "vertical": "finance" } }"""), root)
                .Should()
                .BeNull();

            // Vertical with no template directory at all.
            PolicyPackRulePackIdMapper
                .TryResolveRulePackId(Pack("""{ "metadata": { "vertical": "absent-vertical" } }"""), root)
                .Should()
                .BeNull();
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public void PolicyPackRulePackIdMapper_returns_null_when_pack_content_json_is_malformed()
    {
        string? rulePackId = PolicyPackRulePackIdMapper.TryResolveRulePackId(Pack("{ this is not valid json "));

        rulePackId.Should().BeNull();
    }

    private static ResolvedPolicyPack Pack(string contentJson)
    {
        return new ResolvedPolicyPack
        {
            PolicyPackId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = "probe-pack",
            Version = "1.0.0",
            PackType = "Compliance",
            ContentJson = contentJson,
        };
    }

    private static string CreateTemplatesRoot(string verticalSlug, string complianceRulesJson)
    {
        string root = Path.Combine(Path.GetTempPath(), "archlucid-rc26-policy-packs-" + Guid.NewGuid().ToString("N"));
        string verticalDirectory = Path.Combine(root, verticalSlug);

        Directory.CreateDirectory(verticalDirectory);
        File.WriteAllText(Path.Combine(verticalDirectory, "compliance-rules.json"), complianceRulesJson);

        return root;
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void SimpleTextChunker_returns_empty_for_blank_input(string? text)
    {
        SimpleTextChunker sut = new();

        sut.Chunk(text!).Should().BeEmpty();
    }

    [Fact]
    public void SimpleTextChunker_splits_long_text_with_overlap()
    {
        SimpleTextChunker sut = new();
        string text = string.Concat(new string('a', 25), " ", new string('b', 25));

        IReadOnlyList<string> chunks = sut.Chunk(text, maxChars: 20, overlap: 5);

        chunks.Should().HaveCountGreaterThan(1);
        chunks.Should().OnlyContain(chunk => !string.IsNullOrWhiteSpace(chunk));
    }

    [Fact]
    public async Task FakeEmbeddingService_returns_deterministic_vectors()
    {
        FakeEmbeddingService sut = new();

        float[] single = await sut.EmbedAsync("architecture review", CancellationToken.None);
        IReadOnlyList<float[]> many = await sut.EmbedManyAsync(["alpha", "beta"], CancellationToken.None);

        single.Should().HaveCount(32);
        many.Should().HaveCount(2);
        many[0].Should().HaveCount(32);
        many[1].Should().NotBeEquivalentTo(many[0]);
        (await sut.EmbedAsync("architecture review", CancellationToken.None)).Should().Equal(single);
    }
}
