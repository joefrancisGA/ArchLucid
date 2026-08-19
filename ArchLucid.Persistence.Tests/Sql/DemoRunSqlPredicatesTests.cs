using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Sql;

[Trait("Category", "Unit")]
public sealed class DemoRunSqlPredicatesTests
{
    [Fact]
    public void ExcludeShowcaseDemoRuns_includes_alias_and_canonical_ids()
    {
        string predicate = DemoRunSqlPredicates.ExcludeShowcaseDemoRuns("r");

        predicate.Should().Contain("r.IsDemoWelcomeRun = 0");
        predicate.Should().Contain("r.IsPublicShowcase = 0");
        predicate.Should().Contain("r.IsSample = 0");
        predicate.Should().Contain("request-contoso-demo");
        predicate.Should().Contain("@CanonicalShowcaseRunBaselineId");
        predicate.Should().Contain("@CanonicalShowcaseRunHardenedId");
    }

    [Fact]
    public void ExcludeShowcaseDemoRuns_rejects_blank_alias()
    {
        Action act = () => DemoRunSqlPredicates.ExcludeShowcaseDemoRuns("  ");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Canonical_showcase_run_ids_are_stable_guids()
    {
        DemoRunSqlPredicates.CanonicalShowcaseRunBaselineId.Should().NotBe(Guid.Empty);
        DemoRunSqlPredicates.CanonicalShowcaseRunHardenedId.Should().NotBe(Guid.Empty);
        DemoRunSqlPredicates.CanonicalShowcaseRunBaselineId.Should().NotBe(
            DemoRunSqlPredicates.CanonicalShowcaseRunHardenedId);
    }
}
