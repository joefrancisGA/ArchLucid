using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Asserts an <see cref="ArchitectureReferenceExpectation"/> over a list of declared names. Shared by the
///     assembly-metadata and project-file rules, which differ only in how the declared names are read.
/// </summary>
internal static class ArchitectureReferenceExpectationAssertions
{
    internal static void AssertExpectation(
        IReadOnlyList<string> declaredReferences,
        IReadOnlyList<string> subjectReferences,
        ArchitectureReferenceExpectation expectation,
        string because)
    {
        ArgumentNullException.ThrowIfNull(declaredReferences);
        ArgumentNullException.ThrowIfNull(subjectReferences);

        if (expectation == ArchitectureReferenceExpectation.Required)
        {
            declaredReferences.Should().Contain(subjectReferences, because: because);

            return;
        }

        declaredReferences.Should().NotContain(subjectReferences, because: because);
    }
}
