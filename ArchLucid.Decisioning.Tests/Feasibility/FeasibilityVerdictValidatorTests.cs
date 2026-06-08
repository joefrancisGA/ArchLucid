using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Feasibility;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Feasibility;

[Trait("Category", "Unit")]
public sealed class FeasibilityVerdictValidatorTests
{
    private readonly FeasibilityVerdictValidator _validator = new();
    private readonly FeasibilityVerdictBuilder _builder;

    public FeasibilityVerdictValidatorTests()
    {
        _builder = new FeasibilityVerdictBuilder(_validator);
    }

    [Fact]
    public void Validate_WhenVerdictIsNull_ThrowsArgumentNullException()
    {
        Action act = () => _validator.Validate(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Validate_HardInfeasible_WithoutCitation_Throws()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.HardInfeasible,
            Summary = "Impossible by CAP.",
            TransparencyTrail = new TransparencyTrail(),
            Confidence = 100,
        };

        Action act = () => _validator.Validate(verdict);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*at least one citation*");
    }

    [Fact]
    public void Validate_HardInfeasible_WithoutConfidence100_Throws()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.HardInfeasible,
            Summary = "Impossible by CAP.",
            TransparencyTrail = new TransparencyTrail(),
            Confidence = 90,
            HardCitations =
            [
                new FeasibilityHardCitation
                {
                    Kind = FeasibilityCitationKind.NamedTheorem,
                    Reference = "CAP theorem",
                },
            ],
        };

        Action act = () => _validator.Validate(verdict);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*confidence 100*");
    }

    [Fact]
    public void Validate_InvariantContradiction_RequiresTwoInvKeys()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.HardInfeasible,
            Summary = "Over-constrained invariants.",
            TransparencyTrail = new TransparencyTrail(),
            Confidence = 100,
            HardCitations =
            [
                new FeasibilityHardCitation
                {
                    Kind = FeasibilityCitationKind.InvariantContradiction,
                    Reference = "INV-004 conflicts with INV-012 budget posture.",
                    InvariantKeys = ["INV-004"],
                },
            ],
        };

        Action act = () => _validator.Validate(verdict);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*at least 2*");
    }

    [Fact]
    public void Validate_InvariantContradiction_RejectsNonCatalogKey()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.HardInfeasible,
            Summary = "Over-constrained invariants.",
            TransparencyTrail = new TransparencyTrail(),
            Confidence = 100,
            HardCitations =
            [
                new FeasibilityHardCitation
                {
                    Kind = FeasibilityCitationKind.InvariantContradiction,
                    Reference = "Custom invariant pair.",
                    InvariantKeys = ["INV-004", "CUSTOM-001"],
                },
            ],
        };

        Action act = () => _validator.Validate(verdict);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*CUSTOM-001*");
    }

    [Fact]
    public void Validate_SoftInfeasible_WithoutEnvelope_Throws()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.SoftInfeasible,
            Summary = "Probably not at this budget.",
            TransparencyTrail = new TransparencyTrail(),
        };

        Action act = () => _validator.Validate(verdict);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*soft envelope*");
    }

    [Fact]
    public void Validate_SoftInfeasible_WithHardCitations_Throws()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.SoftInfeasible,
            Summary = "Probably not at this budget.",
            TransparencyTrail = new TransparencyTrail(),
            SoftEnvelope = ValidSoftEnvelope(),
            HardCitations =
            [
                new FeasibilityHardCitation
                {
                    Kind = FeasibilityCitationKind.NamedLaw,
                    Reference = "Speed of light",
                },
            ],
        };

        Action act = () => _validator.Validate(verdict);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*must not carry hard citations*");
    }

    [Fact]
    public void Builder_HardInfeasible_WithNamedTheorem_PassesValidation()
    {
        FeasibilityVerdict verdict = _builder.HardInfeasible(
            "Partition tolerance is required but synchronous cross-region writes were asserted.",
            new TransparencyTrail(),
            [
                new FeasibilityHardCitation
                {
                    Kind = FeasibilityCitationKind.NamedTheorem,
                    Reference = "CAP theorem",
                },
            ],
            unsatCoreInvariantKeys: ["INV-004", "INV-012"]);

        verdict.Kind.Should().Be(FeasibilityVerdictKind.HardInfeasible);
        verdict.Confidence.Should().Be(100);
        verdict.UnsatCoreInvariantKeys.Should().BeEquivalentTo("INV-004", "INV-012");
    }

    [Fact]
    public void Builder_FromIntakeRedirect_ProducesSoftInfeasible()
    {
        TransparencyTrail trail = new()
        {
            Asserted =
            [
                new AssertedTrailEntry { Key = "freeTextIntent", Value = "short" },
            ],
        };

        FeasibilityVerdict verdict = _builder.FromIntakeRedirect(
            "I don't understand yet.",
            trail,
            "Intent is below admission minimum length.");

        verdict.Kind.Should().Be(FeasibilityVerdictKind.SoftInfeasible);
        verdict.SoftEnvelope!.SoftAssumption.Should().Contain("admission minimum");
    }

    private static SoftInfeasibilityEnvelope ValidSoftEnvelope() =>
        new()
        {
            ConfidenceLow = 30,
            ConfidenceHigh = 60,
            EnvelopeDescription = "Feasible only below 500 concurrent users on a single region.",
            SoftAssumption = "Budget caps exclude multi-region active-active.",
            CostOfBeingWrong = "Weeks of rework if scale assumptions are wrong.",
        };
}
