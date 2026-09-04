using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class PolicyPackCategoryCoverageValidatorTests
{
    [Fact]
    public void GetMissingCategoryViolations_treats_successful_security_engine_type_as_security_coverage()
    {
        FindingAnalysisContext context = new()
        {
            EnabledPolicyPackIds = ["tenant-security-pack"],
            RequiredFindingCategories = ["Security"],
        };

        IReadOnlyList<string> violations = PolicyPackCategoryCoverageValidator.GetMissingCategoryViolations(
            context,
            findings: [],
            successfulEngineTypes: new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "azure-inventory-security-baseline" });

        violations.Should().BeEmpty();
    }
}
