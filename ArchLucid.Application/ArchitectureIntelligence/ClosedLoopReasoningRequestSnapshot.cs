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
            TenantId = ClosedLoopTenantIdNormalizer.NormalizeOptional(request.TenantId),
            RunId = ClosedLoopRunIdNormalizer.NormalizeOptional(request.RunId),
            WorkspaceId = request.WorkspaceId?.Trim(),
            ProjectId = request.ProjectId?.Trim(),
            SourceTexts = request.SourceTexts
                .Select(ClosedLoopReasoningSourceTextNormalizer.Normalize)
                .ToList(),
            DeclaredPriorities = ClosedLoopDeclaredPrioritiesNormalizer.Normalize(request.DeclaredPriorities),
            FramingAnswers = ClosedLoopFramingAnswersNormalizer.Normalize(request.FramingAnswers),
            UseGoldenFixture = request.UseGoldenFixture,
            ContinueFromExistingRun = request.ContinueFromExistingRun,
            PublishToProduct = request.PublishToProduct,
            ReviewTier = request.ReviewTier,
            ModelAliasId = request.ModelAliasId?.Trim(),
        };
    }
}
