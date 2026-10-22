using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance.Coverage;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CoverageAssignmentValidatorTests
{
    private readonly CoverageAssignmentValidator _validator = new();

    [Fact]
    public void RecommendedButExcluded_without_exclusion_reason_fails()
    {
        CoverageAssignment assignment = CreateValidAssignment();
        assignment.SelectionState = CoverageSelectionState.RecommendedButExcluded;
        assignment.ExclusionReason = null;

        CoverageAssignmentValidationResult result = _validator.Validate(assignment, null);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error => error.Contains("ExclusionReason", StringComparison.Ordinal));
    }

    [Fact]
    public void RecommendedButExcluded_with_exclusion_reason_passes()
    {
        CoverageAssignment assignment = CreateValidAssignment();
        assignment.SelectionState = CoverageSelectionState.RecommendedButExcluded;
        assignment.ExclusionReason = "Not relevant for this workload.";

        CoverageAssignmentValidationResult result = _validator.Validate(assignment, null);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Non_excluded_state_rejects_exclusion_reason()
    {
        CoverageAssignment assignment = CreateValidAssignment();
        assignment.SelectionState = CoverageSelectionState.RecommendedAndSelected;
        assignment.ExclusionReason = "Should not be here";

        CoverageAssignmentValidationResult result = _validator.Validate(assignment, null);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void ContextualRecommended_requires_confidence()
    {
        CoverageAssignment assignment = CreateValidAssignment();
        assignment.CoverageType = CoverageType.ContextualRecommended;
        assignment.RecommendationConfidence = null;
        assignment.RecommendationTrigger = "pii-present";
        assignment.RecommendationRationale = "Handles regulated data.";

        CoverageAssignmentValidationResult result = _validator.Validate(assignment, null);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void ContextualRecommended_with_confidence_passes()
    {
        CoverageAssignment assignment = CreateValidAssignment();
        assignment.CoverageType = CoverageType.ContextualRecommended;
        assignment.RecommendationConfidence = RecommendationConfidence.High;
        assignment.RecommendationTrigger = "pii-present";
        assignment.RecommendationRationale = "Handles regulated data.";

        CoverageAssignmentValidationResult result = _validator.Validate(assignment, null);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Non_contextual_rejects_recommendation_confidence()
    {
        CoverageAssignment assignment = CreateValidAssignment();
        assignment.RecommendationConfidence = RecommendationConfidence.Low;

        CoverageAssignmentValidationResult result = _validator.Validate(assignment, null);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void ProviderNeutralBaseline_requires_pack_quality_dimension()
    {
        CoverageAssignment assignment = CreateValidAssignment();
        assignment.CoverageType = CoverageType.ProviderNeutralBaseline;
        assignment.SelectionState = CoverageSelectionState.AlwaysActive;
        PolicyPack pack = CreatePack(qualityDimension: null);

        CoverageAssignmentValidationResult result = _validator.Validate(assignment, pack);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void ProviderNeutralBaseline_with_pack_quality_dimension_passes()
    {
        CoverageAssignment assignment = CreateValidAssignment();
        assignment.CoverageType = CoverageType.ProviderNeutralBaseline;
        assignment.SelectionState = CoverageSelectionState.AlwaysActive;
        PolicyPack pack = CreatePack(QualityDimension.Security);

        CoverageAssignmentValidationResult result = _validator.Validate(assignment, pack);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void PlatformOverlay_rejects_pack_with_quality_dimension()
    {
        CoverageAssignment assignment = CreateValidAssignment();
        assignment.CoverageType = CoverageType.PlatformOverlay;
        PolicyPack pack = CreatePack(QualityDimension.Security);

        CoverageAssignmentValidationResult result = _validator.Validate(assignment, pack);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Missing_policy_pack_version_fails()
    {
        CoverageAssignment assignment = CreateValidAssignment();
        assignment.PolicyPackVersion = "  ";

        CoverageAssignmentValidationResult result = _validator.Validate(assignment, null);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Missing_evaluation_version_fails()
    {
        CoverageAssignment assignment = CreateValidAssignment();
        assignment.EvaluationVersion = string.Empty;

        CoverageAssignmentValidationResult result = _validator.Validate(assignment, null);

        result.IsValid.Should().BeFalse();
    }

    private static CoverageAssignment CreateValidAssignment() => new()
    {
        CoverageAssignmentId = Guid.NewGuid(),
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        PolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        PolicyPackVersion = "1.0.0",
        CoverageType = CoverageType.AdditionalOptional,
        SelectionState = CoverageSelectionState.OptionalAndNotSelected,
        ActorUserId = "operator@test",
        CreatedUtc = DateTime.UtcNow,
        EvaluationVersion = "coverage-v1",
    };

    private static PolicyPack CreatePack(QualityDimension? qualityDimension) => new()
    {
        PolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        Name = "Test pack",
        Description = "Test",
        QualityDimension = qualityDimension,
    };
}
