using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
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
}
