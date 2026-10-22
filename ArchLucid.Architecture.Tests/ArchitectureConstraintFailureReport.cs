using NetArchTest.Rules;

namespace ArchLucid.Architecture.Tests;

/// <summary>Formats NetArchTest failures for FluentAssertions messages.</summary>
internal static class ArchitectureConstraintFailureReport
{
    /// <summary>Comma-separated failing type names, or a placeholder when NetArchTest reported none.</summary>
    internal static string FormatFailingTypeNames(TestResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        IReadOnlyList<string>? names = result.FailingTypeNames;

        return names is null || names.Count == 0
            ? "(none reported)"
            : string.Join(", ", names);
    }
}
