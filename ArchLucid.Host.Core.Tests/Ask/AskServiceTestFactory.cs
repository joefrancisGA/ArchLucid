using ArchLucid.AgentRuntime;
using ArchLucid.Application.Ask;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Conversation;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Ask;

/// <summary>
///     Builds <see cref="AskService" /> with the post-split collaborator graph so tests do not reconstruct
///     the old 14-parameter constructor.
/// </summary>
internal static class AskServiceTestFactory
{
    public static AskService Create(
        IAgentCompletionClient? llm = null,
        IConversationService? conversationService = null,
        IFindingInspectReadRepository? findingInspectReadRepository = null,
        IAuthorityQueryService? query = null,
        IProvenanceQueryService? provenanceQuery = null,
        IComparisonService? comparison = null,
        IRetrievalQueryService? retrievalQuery = null,
        IRetrievalDocumentBuilder? retrievalDocumentBuilder = null,
        IRetrievalIndexingService? retrievalIndexingService = null,
        IOptionsMonitor<AskComparisonNarrativeOptions>? askComparisonNarrativeOptions = null,
        IConversationContextCompressor? conversationContextCompressor = null,
        IOptionsMonitor<ConversationContextOptions>? conversationContextOptions = null,
        IOptionsMonitor<AskRetrievalOptions>? askRetrievalOptions = null,
        IRunRepository? runRepository = null,
        IManifestHashService? manifestHashService = null)
    {
        IAgentCompletionClient resolvedLlm = llm ?? Mock.Of<IAgentCompletionClient>();
        IConversationService resolvedConversation = conversationService ?? Mock.Of<IConversationService>();
        IFindingInspectReadRepository resolvedFindings =
            findingInspectReadRepository ?? Mock.Of<IFindingInspectReadRepository>();
        IAuthorityQueryService resolvedQuery = query ?? Mock.Of<IAuthorityQueryService>();
        IProvenanceQueryService resolvedProvenance = provenanceQuery ?? Mock.Of<IProvenanceQueryService>();
        IComparisonService resolvedComparison = comparison ?? Mock.Of<IComparisonService>();
        IRetrievalQueryService resolvedRetrieval = retrievalQuery ?? Mock.Of<IRetrievalQueryService>();
        IRetrievalDocumentBuilder resolvedDocumentBuilder =
            retrievalDocumentBuilder ?? Mock.Of<IRetrievalDocumentBuilder>();
        IRetrievalIndexingService resolvedIndexing =
            retrievalIndexingService ?? Mock.Of<IRetrievalIndexingService>();
        IConversationContextCompressor resolvedCompressor =
            conversationContextCompressor ?? Mock.Of<IConversationContextCompressor>();
        IOptionsMonitor<AskComparisonNarrativeOptions> resolvedNarrativeOptions =
            askComparisonNarrativeOptions ?? MonitorOf(new AskComparisonNarrativeOptions());
        IOptionsMonitor<ConversationContextOptions> resolvedContextOptions =
            conversationContextOptions ?? MonitorOf(new ConversationContextOptions());
        IOptionsMonitor<AskRetrievalOptions> resolvedRetrievalOptions =
            askRetrievalOptions ?? MonitorOf(new AskRetrievalOptions());

        AskConversationHistoryBuilder historyBuilder = new(resolvedCompressor, resolvedContextOptions);
        IRunRepository resolvedRunRepository = runRepository ?? AskSealedManifestTestSupport.CreateRunRepository();
        IManifestHashService resolvedManifestHash =
            manifestHashService ?? AskSealedManifestTestSupport.CreateManifestHashService();

        AskContextPreparer contextPreparer = new(
            resolvedQuery,
            resolvedProvenance,
            resolvedComparison,
            resolvedConversation,
            resolvedRetrieval,
            historyBuilder,
            resolvedRetrievalOptions,
            resolvedRunRepository,
            resolvedManifestHash,
            NullLogger<AskContextPreparer>.Instance);
        AskComparisonNarrativeBuilder narrativeBuilder = new(
            resolvedLlm,
            resolvedNarrativeOptions,
            NullLogger<AskComparisonNarrativeBuilder>.Instance);
        AskResponseComposer responseComposer = new(
            resolvedConversation,
            resolvedDocumentBuilder,
            resolvedIndexing,
            NullLogger<AskResponseComposer>.Instance);

        return new AskService(
            resolvedLlm,
            resolvedConversation,
            resolvedFindings,
            resolvedQuery,
            contextPreparer,
            narrativeBuilder,
            responseComposer,
            historyBuilder,
            NullLogger<AskService>.Instance);
    }

    private static IOptionsMonitor<T> MonitorOf<T>(T value)
        where T : class
    {
        Mock<IOptionsMonitor<T>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(value);
        return monitor.Object;
    }
}
