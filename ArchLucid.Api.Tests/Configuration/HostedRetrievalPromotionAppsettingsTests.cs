using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests.Configuration;

[Trait("Category", "Unit")]

/// <summary>
///     Locks TB-684 hosted retrieval/judge promotion posture after the appsettings.Advanced.json layer (loaded last in
///     <see cref="ArchLucid.Api.Program" />).
/// </summary>
public sealed class HostedRetrievalPromotionAppsettingsTests
{
    private static string AdvancedJsonPath =>
        Path.Combine(AppContext.BaseDirectory, "appsettings.Advanced.json");

    private static string StagingJsonPath =>
        Path.Combine(AppContext.BaseDirectory, "appsettings.Staging.json");

    private static string ProductionJsonPath =>
        Path.Combine(AppContext.BaseDirectory, "appsettings.Production.json");

    private static IConfiguration BuildHostedConfiguration(string environmentJsonPath)
    {
        return new ConfigurationBuilder()
            .AddJsonFile(environmentJsonPath, optional: false, reloadOnChange: false)
            .AddJsonFile(AdvancedJsonPath, optional: false, reloadOnChange: false)
            .Build();
    }

    [SkippableFact]
    public void Staging_appsettings_promotes_semantic_reranking_and_advanced_retrieval()
    {
        Skip.IfNot(File.Exists(StagingJsonPath), $"Expected {StagingJsonPath}.");
        Skip.IfNot(File.Exists(AdvancedJsonPath), $"Expected {AdvancedJsonPath}.");

        IConfiguration configuration = BuildHostedConfiguration(StagingJsonPath);

        RetrievalRerankingOptions reranking = configuration
            .GetSection(RetrievalRerankingOptions.SectionPath)
            .Get<RetrievalRerankingOptions>() ?? new RetrievalRerankingOptions();

        reranking.Enabled.Should().BeTrue();

        AdvancedRetrievalOptions advanced = configuration
            .GetSection(AdvancedRetrievalOptions.SectionPath)
            .Get<AdvancedRetrievalOptions>() ?? new AdvancedRetrievalOptions();

        advanced.Enabled.Should().BeTrue();
        advanced.EnableQueryRewrite.Should().BeTrue();
        // HyDE stays off in Staging to avoid an extra LLM round-trip on the Ask expand path (rewrite + GraphRAG remain on).
        advanced.EnableHyde.Should().BeFalse();
        advanced.EnableGraphRag.Should().BeTrue();

        AskRetrievalOptions askRetrieval = configuration
            .GetSection(AskRetrievalOptions.SectionPath)
            .Get<AskRetrievalOptions>() ?? new AskRetrievalOptions();

        askRetrieval.SkipExpensiveStages.Should().BeTrue();
    }

    [SkippableFact]
    public void Staging_appsettings_promotes_llm_semantic_judge()
    {
        Skip.IfNot(File.Exists(StagingJsonPath), $"Expected {StagingJsonPath}.");
        Skip.IfNot(File.Exists(AdvancedJsonPath), $"Expected {AdvancedJsonPath}.");

        IConfiguration configuration = BuildHostedConfiguration(StagingJsonPath);

        AgentOutputLlmSemanticJudgeOptions? judge = configuration
            .GetSection(AgentOutputLlmSemanticJudgeOptions.SectionPath)
            .Get<AgentOutputLlmSemanticJudgeOptions>();

        judge.Should().NotBeNull();
        judge!.Enabled.Should().BeTrue();
    }

    [SkippableFact]
    public void Production_appsettings_promotes_reranking_and_judge_but_defers_advanced_retrieval()
    {
        Skip.IfNot(File.Exists(ProductionJsonPath), $"Expected {ProductionJsonPath}.");
        Skip.IfNot(File.Exists(AdvancedJsonPath), $"Expected {AdvancedJsonPath}.");

        IConfiguration configuration = BuildHostedConfiguration(ProductionJsonPath);

        RetrievalRerankingOptions reranking = configuration
            .GetSection(RetrievalRerankingOptions.SectionPath)
            .Get<RetrievalRerankingOptions>() ?? new RetrievalRerankingOptions();

        reranking.Enabled.Should().BeTrue();

        AdvancedRetrievalOptions advanced = configuration
            .GetSection(AdvancedRetrievalOptions.SectionPath)
            .Get<AdvancedRetrievalOptions>() ?? new AdvancedRetrievalOptions();

        advanced.Enabled.Should().BeFalse();

        AskRetrievalOptions askRetrieval = configuration
            .GetSection(AskRetrievalOptions.SectionPath)
            .Get<AskRetrievalOptions>() ?? new AskRetrievalOptions();

        askRetrieval.SkipExpensiveStages.Should().BeFalse();

        AgentOutputLlmSemanticJudgeOptions? judge = configuration
            .GetSection(AgentOutputLlmSemanticJudgeOptions.SectionPath)
            .Get<AgentOutputLlmSemanticJudgeOptions>();

        judge.Should().NotBeNull();
        judge!.Enabled.Should().BeTrue();
    }
}
