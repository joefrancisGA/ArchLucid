using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Every public <c>*Tests</c> fixture in a <c>*.Tests</c> project must declare <c>[Trait("Suite", ...)]</c> or
///     <c>[Trait("Category", ...)]</c> at class scope so CI filters (<see cref="docs/library/TEST_EXECUTION_MODEL.md" />)
///     stay intentional (docs/library/TEST_EXECUTION_MODEL.md).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TestClassTraitCategorizationArchitectureTests
{
    [Fact]
    public void All_public_test_classes_declare_Suite_or_Category_trait_at_class_scope()
    {
        string repositoryRoot = TestClassTraitConventionScanner.FindRepositoryRoot();
        IReadOnlyList<string> violations = TestClassTraitConventionScanner.FindUncategorizedTestClasses(repositoryRoot);

        violations.Should().BeEmpty(
            "Add [Trait(\"Suite\", \"...\")] and/or [Trait(\"Category\", \"...\")] on each public *Tests class "
            + "(see docs/library/TEST_EXECUTION_MODEL.md). Uncategorized types:{0}{1}",
            Environment.NewLine,
            violations.Count == 0
                ? "(none)"
                : string.Join(Environment.NewLine, violations.OrderBy(static v => v, StringComparer.Ordinal)));
    }
}
