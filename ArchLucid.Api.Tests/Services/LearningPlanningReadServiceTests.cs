using ArchLucid.Api.Services;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;
using ArchLucid.Persistence.Coordination.ProductLearning.Planning;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Services;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LearningPlanningReadServiceTests
{
    [SkippableFact]
    public async Task GetThemesAsync_maps_repository_rows()
    {
        InMemoryProductLearningPlanningRepository repository = new();
        ProductLearningScope scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        await repository.InsertThemeAsync(
            new ProductLearningImprovementThemeRecord
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                ThemeKey = "theme-a",
                SourceAggregateKey = "src",
                PatternKey = "pattern",
                Title = "Title",
                Summary = "Summary",
                AffectedArtifactTypeOrWorkflowArea = "workflow",
                SeverityBand = "medium",
                EvidenceSignalCount = 2,
                DistinctRunCount = 1,
                AverageTrustScore = 0.8,
                DerivationRuleVersion = "v1",
                Status = ProductLearningImprovementThemeStatusValues.Proposed,
                CreatedByUserId = "tester"
            },
            CancellationToken.None);

        LearningPlanningReadService service = new(repository);

        ArchLucid.Api.Models.Learning.LearningThemesListResponse response =
            await service.GetThemesAsync(scope, maxThemes: 10, CancellationToken.None);

        response.Themes.Should().HaveCount(1);
        response.Themes[0].ThemeKey.Should().Be("theme-a");
    }
}
