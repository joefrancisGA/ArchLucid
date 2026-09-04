using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Manifest;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Http.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceStickinessHttpMapperTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(501)]
    public void ValidateRegisterMaxRows_rejects_out_of_range(int maxRows)
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateRegisterMaxRows(maxRows);

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public void ValidateCreateRiskException_requires_run_and_finding()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRiskException(
            new CreateRiskExceptionRequest
            {
                RunId = Guid.Empty,
                FindingId = " ",
                OwnerUserId = "owner",
                Rationale = "rationale",
                ExpiresAtUtc = DateTime.UtcNow.AddDays(30),
            });

        validation.Should().NotBeNull();
        validation!.Message.Should().Contain("runId");
    }

    [Fact]
    public void ValidateCreateRiskException_rejects_overlong_finding_id()
    {
        string overlongFindingId = new string('f', GovernanceRequestValidationRules.FindingIdMaxLength + 1);

        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateCreateRiskException(
            new CreateRiskExceptionRequest
            {
                RunId = Guid.NewGuid(),
                FindingId = overlongFindingId,
                OwnerUserId = "owner",
                Rationale = "accepted risk rationale",
                ExpiresAtUtc = DateTime.UtcNow.AddDays(30),
            });

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceRequestValidationRules.FindingIdMaxLength.ToString());
    }

    [Fact]
    public void ValidateDecisionRegisterFilters_rejects_inverted_confidence_range()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateDecisionRegisterFilters(
            category: null,
            recordedAfterUtc: null,
            recordedBeforeUtc: null,
            minConfidence: 0.9,
            maxConfidence: 0.1,
            buyerConfidenceSource: null);

        validation.Should().NotBeNull();
        validation!.Message.Should().Contain("minConfidence");
    }

    [Fact]
    public void ValidateBuyerConfidenceSource_accepts_known_values()
    {
        GovernanceStickinessHttpMapper.ValidateBuyerConfidenceSource(BuyerDecisionConfidenceSource.EvidenceBacked)
            .Should()
            .BeNull();
    }

    [Fact]
    public void ValidateBuyerConfidenceSource_accepts_padded_known_label()
    {
        GovernanceStickinessHttpMapper.ValidateBuyerConfidenceSource($" {BuyerDecisionConfidenceSource.EvidenceBacked} ")
            .Should()
            .BeNull();
    }

    [Theory]
    [InlineData(-0.1)]
    [InlineData(1.1)]
    public void ValidateDecisionRegisterFilters_rejects_out_of_range_confidence_bounds(double value)
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateDecisionRegisterFilters(
            category: null,
            recordedAfterUtc: null,
            recordedBeforeUtc: null,
            minConfidence: value < 0 ? value : null,
            maxConfidence: value > 1 ? value : null,
            buyerConfidenceSource: null);

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public void ValidateDecisionRegisterFilters_rejects_recorded_after_before_1970()
    {
        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateDecisionRegisterFilters(
            category: null,
            recordedAfterUtc: new DateTimeOffset(1969, 12, 31, 23, 59, 59, TimeSpan.Zero),
            recordedBeforeUtc: null,
            minConfidence: null,
            maxConfidence: null,
            buyerConfidenceSource: null);

        validation.Should().NotBeNull();
        validation!.Message.Should().Contain("recordedAfterUtc");
    }

    [Fact]
    public void ValidateDecisionRegisterFilters_rejects_overlong_category()
    {
        string overlongCategory = new string('c', GovernanceRequestValidationRules.DecisionRegisterCategoryMaxLength + 1);

        GovernanceHttpValidation? validation = GovernanceStickinessHttpMapper.ValidateDecisionRegisterFilters(
            category: overlongCategory,
            recordedAfterUtc: null,
            recordedBeforeUtc: null,
            minConfidence: null,
            maxConfidence: null,
            buyerConfidenceSource: null);

        validation.Should().NotBeNull();
        validation!.ProblemType.Should().Be(ProblemTypes.ValidationFailed);
        validation.Message.Should().Contain(GovernanceRequestValidationRules.DecisionRegisterCategoryMaxLength.ToString());
    }
}
