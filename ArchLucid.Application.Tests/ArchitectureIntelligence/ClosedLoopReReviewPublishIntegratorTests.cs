using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopReReviewPublishIntegratorTests
{
    [Fact]
    public async Task IntegrateAsync_adds_only_new_findings_and_validation_results()
    {
        SpecialistReviewFinding existing = new() { FindingId = "finding-existing", Title = "Existing" };
        SpecialistReviewFinding incremental = new() { FindingId = "finding-new", Title = "New from re-review" };
        List<SpecialistReviewFinding> allFindings = [existing];
        List<EvidenceValidationResult> validationResults = [];
        Dictionary<string, EvidenceValidationResult> validationByFindingId = new(StringComparer.Ordinal);

        IncrementalReReviewResult reReview = new()
        {
            SpecialistResults =
            [
                new SpecialistReviewResult
                {
                    Findings = [existing, incremental],
                },
            ],
        };

        EvidenceValidationResult incrementalValidation = new()
        {
            FindingId = "finding-new",
            OverallPassedIntegrity = true,
        };

        Mock<ISpecialistFindingsSubstantiationService> substantiationService = new();
        substantiationService
            .Setup(service => service.SubstantiateAsync(
                It.Is<IReadOnlyList<SpecialistReviewFinding>>(findings =>
                    findings.Count == 1 && findings[0].FindingId == "finding-new"),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SpecialistFindingsSubstantiationResult
            {
                SubstantiatedFindings = [incremental],
                ValidationResults = [incrementalValidation],
            });

        SpecialistFindingsSubstantiationResult? substantiation = await ClosedLoopReReviewPublishIntegrator.IntegrateAsync(
            reReview,
            allFindings,
            validationResults,
            validationByFindingId,
            substantiationService.Object,
            CancellationToken.None);

        allFindings.Should().HaveCount(2);
        allFindings.Should().ContainSingle(finding => finding.FindingId == "finding-new");
        validationResults.Should().ContainSingle(result => result.FindingId == "finding-new");
        validationByFindingId.Should().ContainKey("finding-new");
        substantiation.Should().NotBeNull();
        substantiation!.ValidationResults.Should().ContainSingle(result => result.FindingId == "finding-new");
    }

    [Fact]
    public async Task IntegrateAsync_returns_null_when_no_incremental_findings()
    {
        List<SpecialistReviewFinding> allFindings = [new() { FindingId = "finding-existing", Title = "Existing" }];
        List<EvidenceValidationResult> validationResults = [];
        Dictionary<string, EvidenceValidationResult> validationByFindingId = new(StringComparer.Ordinal);

        IncrementalReReviewResult reReview = new()
        {
            SpecialistResults =
            [
                new SpecialistReviewResult
                {
                    Findings = [new SpecialistReviewFinding { FindingId = "finding-existing", Title = "Existing" }],
                },
            ],
        };

        Mock<ISpecialistFindingsSubstantiationService> substantiationService = new();

        SpecialistFindingsSubstantiationResult? substantiation = await ClosedLoopReReviewPublishIntegrator.IntegrateAsync(
            reReview,
            allFindings,
            validationResults,
            validationByFindingId,
            substantiationService.Object,
            CancellationToken.None);

        substantiation.Should().BeNull();
        substantiationService.Verify(
            service => service.SubstantiateAsync(It.IsAny<IReadOnlyList<SpecialistReviewFinding>>(), It.IsAny<CancellationToken>()),
            Times.Never);
        allFindings.Should().HaveCount(1);
    }
}
