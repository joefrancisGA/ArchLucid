using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;

namespace ArchLucid.Persistence.Coordination.ProductLearning.Planning;

/// <summary>
///     In-memory 59R planning store for development/tests.
///     Does not validate <c>dbo.Runs</c>, pilot signals, or authority artifacts (SQL repository does).
/// </summary>
public sealed partial class InMemoryProductLearningPlanningRepository : IProductLearningPlanningRepository
{
    private readonly List<ProductLearningImprovementPlanArtifactLinkRecord> _artifactLinks = [];

    private readonly List<ProductLearningImprovementPlanRecord> _plans = [];

    private readonly List<ProductLearningImprovementPlanRunLinkRecord> _runLinks = [];

    private readonly List<ProductLearningImprovementPlanSignalLinkRecord> _signalLinks = [];
    private readonly List<ProductLearningImprovementThemeRecord> _themes = [];

    public Task InsertThemeAsync(ProductLearningImprovementThemeRecord theme, CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureTheme(theme);

        string status = ProductLearningPlanningRepositoryValidation.NormalizeThemeStatus(theme.Status);
        Guid themeId = theme.ThemeId == Guid.Empty ? Guid.NewGuid() : theme.ThemeId;
        DateTime createdUtc = theme.CreatedUtc == default ? TimeProvider.System.UtcNowDateTime() : theme.CreatedUtc;

        if (_themes.Any(t =>
                t.TenantId == theme.TenantId &&
                t.WorkspaceId == theme.WorkspaceId &&
                t.ProjectId == theme.ProjectId &&
                string.Equals(t.ThemeKey, theme.ThemeKey, StringComparison.Ordinal)))

            throw new InvalidOperationException("ThemeKey already exists in scope: " + theme.ThemeKey);


        ProductLearningImprovementThemeRecord stored = new()
        {
            ThemeId = themeId,
            TenantId = theme.TenantId,
            WorkspaceId = theme.WorkspaceId,
            ProjectId = theme.ProjectId,
            ThemeKey = theme.ThemeKey,
            SourceAggregateKey = theme.SourceAggregateKey,
            PatternKey = theme.PatternKey,
            Title = theme.Title,
            Summary = theme.Summary,
            AffectedArtifactTypeOrWorkflowArea = theme.AffectedArtifactTypeOrWorkflowArea,
            SeverityBand = theme.SeverityBand,
            EvidenceSignalCount = theme.EvidenceSignalCount,
            DistinctRunCount = theme.DistinctRunCount,
            AverageTrustScore = theme.AverageTrustScore,
            DerivationRuleVersion = theme.DerivationRuleVersion,
            Status = status,
            CreatedUtc = createdUtc,
            CreatedByUserId = theme.CreatedByUserId
        };

        _themes.Add(stored);

        return Task.CompletedTask;
    }

    public Task<ProductLearningImprovementThemeRecord?> GetThemeAsync(
        Guid themeId,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);

        ProductLearningImprovementThemeRecord? found = _themes.FirstOrDefault(t =>
            t.ThemeId == themeId &&
            t.TenantId == scope.TenantId &&
            t.WorkspaceId == scope.WorkspaceId &&
            t.ProjectId == scope.ProjectId);

        return Task.FromResult(found);
    }

    public Task<IReadOnlyList<ProductLearningImprovementThemeRecord>> ListThemesAsync(
        ProductLearningScope scope,
        int take,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);
        ProductLearningPlanningRepositoryValidation.EnsureTake(take);

        List<ProductLearningImprovementThemeRecord> list = _themes
            .Where(t =>
                t.TenantId == scope.TenantId &&
                t.WorkspaceId == scope.WorkspaceId &&
                t.ProjectId == scope.ProjectId)
            .OrderByDescending(static t => t.CreatedUtc)
            .ThenBy(static t => t.ThemeId)
            .Take(take)
            .ToList();

        return Task.FromResult<IReadOnlyList<ProductLearningImprovementThemeRecord>>(list);
    }
}
