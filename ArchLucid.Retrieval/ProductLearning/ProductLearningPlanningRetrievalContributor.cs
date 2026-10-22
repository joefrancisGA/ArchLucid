using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.ProductLearning;

/// <summary>Indexes tenant-scoped pilot signals and retrieves semantic priors at materialize (TB-879).</summary>
public sealed class ProductLearningPlanningRetrievalContributor(
    IRetrievalIndexingService indexingService,
    IRetrievalQueryService retrievalQueryService,
    IOptionsMonitor<ProductLearningPlanningRetrievalOptions> optionsMonitor) : IProductLearningPlanningRetrievalContributor
{
    private const int MaxRetrievalCitations = 8;

    private const int RetrievalTopK = 6;

    private readonly IRetrievalIndexingService _indexingService =
        indexingService ?? throw new ArgumentNullException(nameof(indexingService));

    private readonly IRetrievalQueryService _retrievalQueryService =
        retrievalQueryService ?? throw new ArgumentNullException(nameof(retrievalQueryService));

    private readonly IOptionsMonitor<ProductLearningPlanningRetrievalOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    /// <inheritdoc />
    public async Task IndexPilotSignalsAsync(
        ProductLearningScope scope,
        IReadOnlyList<ProductLearningPilotSignalRecord> signals,
        CancellationToken cancellationToken)
    {
        if (!_optionsMonitor.CurrentValue.Enabled || signals.Count == 0)
            return;

        List<RetrievalDocument> documents = [];

        foreach (ProductLearningPilotSignalRecord signal in signals)
        {
            if (signal.TenantId != scope.TenantId
                || signal.WorkspaceId != scope.WorkspaceId
                || signal.ProjectId != scope.ProjectId)
            {
                continue;
            }

            string content = BuildSignalContent(signal);

            documents.Add(
                new RetrievalDocument
                {
                    DocumentId = $"pilot-feedback:{signal.SignalId:N}",
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    CorpusKind = CorpusKind.PilotFeedback,
                    SourceType = nameof(CorpusKind.PilotFeedback),
                    SourceId = signal.SignalId.ToString("N"),
                    Title = signal.SubjectType,
                    Content = content,
                    ContentHash = ComputeContentHash(content),
                });
        }

        if (documents.Count == 0)
            return;

        await _indexingService.IndexDocumentsAsync(documents, cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<PlanningRetrievalCitation>> RetrievePriorsForOpportunityAsync(
        ProductLearningScope scope,
        ImprovementOpportunity opportunity,
        CancellationToken cancellationToken)
    {
        if (!_optionsMonitor.CurrentValue.Enabled)
            return [];

        string queryText = $"{opportunity.Title} {opportunity.Summary}".Trim();

        if (string.IsNullOrWhiteSpace(queryText))
            return [];

        RetrievalQuery query = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            QueryText = queryText,
            TopK = RetrievalTopK,
            SkipQueryExpansion = true,
            SkipReranking = true,
        };

        IReadOnlyList<RetrievalHit> hits = await _retrievalQueryService
            .SearchAsync(query, cancellationToken)
            .ConfigureAwait(false);

        List<PlanningRetrievalCitation> citations = [];

        foreach (RetrievalHit hit in hits)
        {
            if (!string.Equals(hit.CorpusKind, nameof(CorpusKind.PilotFeedback), StringComparison.OrdinalIgnoreCase))
                continue;

            if (!Guid.TryParse(hit.SourceId, out Guid signalId))
                continue;

            citations.Add(
                new PlanningRetrievalCitation
                {
                    SignalId = signalId,
                    ThemeKey = opportunity.SourceAggregateKey,
                    Snippet = Truncate(hit.Text, 240),
                });

            if (citations.Count >= MaxRetrievalCitations)
                break;
        }

        return citations;
    }

    private static string BuildSignalContent(ProductLearningPilotSignalRecord signal)
    {
        StringBuilder builder = new();

        builder.Append(signal.SubjectType);
        builder.Append(' ');
        builder.Append(signal.Disposition);

        if (!string.IsNullOrWhiteSpace(signal.PatternKey))
        {
            builder.Append(' ');
            builder.Append(signal.PatternKey);
        }

        if (!string.IsNullOrWhiteSpace(signal.CommentShort))
        {
            builder.Append(' ');
            builder.Append(signal.CommentShort);
        }

        return builder.ToString().Trim();
    }

    private static string ComputeContentHash(string content)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(content));

        return Convert.ToHexString(hash);
    }

    private static string Truncate(string text, int maxLength)
    {
        string trimmed = text.Trim();

        if (trimmed.Length <= maxLength)
            return trimmed;

        return trimmed[..maxLength];
    }
}
