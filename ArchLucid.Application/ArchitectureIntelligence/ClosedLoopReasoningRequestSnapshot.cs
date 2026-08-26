using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Immutable copy of inbound closed-loop request inputs for cache lookup and review.
/// </summary>
internal static class ClosedLoopReasoningRequestSnapshot
{
    public static ClosedLoopReasoningRequest Capture(ClosedLoopReasoningRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new ClosedLoopReasoningRequest
        {
            TenantId = request.TenantId,
            RunId = request.RunId,
            WorkspaceId = request.WorkspaceId,
            ProjectId = request.ProjectId,
            SourceTexts = request.SourceTexts
                .Select(source => new ClosedLoopReasoningSourceText
                {
                    FileName = source.FileName,
                    ContentType = source.ContentType,
                    Content = source.Content,
                })
                .ToList(),
            DeclaredPriorities = request.DeclaredPriorities.ToList(),
            FramingAnswers = new Dictionary<string, string>(request.FramingAnswers),
            UseGoldenFixture = request.UseGoldenFixture,
            ContinueFromExistingRun = request.ContinueFromExistingRun,
            PublishToProduct = request.PublishToProduct,
            ReviewTier = request.ReviewTier,
            ModelAliasId = request.ModelAliasId,
        };
    }
}
