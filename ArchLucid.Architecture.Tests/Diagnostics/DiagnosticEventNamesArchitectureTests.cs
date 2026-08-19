using System.Reflection;

using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests.Diagnostics;

/// <summary>
///     Guards ADR 0053 diagnostic event taxonomy constants (TB-332).
/// </summary>
[Trait("Suite", "Core")]
public sealed class DiagnosticEventNamesArchitectureTests
{
    [Fact]
    public void DiagnosticEventNames_constants_are_non_empty_lowercase_dot_separated()
    {
        IEnumerable<string> values = typeof(DiagnosticEventNames)
            .GetNestedTypes(BindingFlags.Public | BindingFlags.Static)
            .SelectMany(t => t.GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy))
            .Where(f => f is { IsLiteral: true, IsInitOnly: false } && f.FieldType == typeof(string))
            .Select(f => (string)f.GetRawConstantValue()!);

        values.Should().NotBeEmpty();

        foreach (string value in values)
        {
            value.Should().NotBeNullOrWhiteSpace();
            value.Should().MatchRegex("^[a-z0-9]+(?:\\.[a-z0-9]+)+$");
        }
    }
}
