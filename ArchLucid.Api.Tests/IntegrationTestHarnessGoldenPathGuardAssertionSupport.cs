using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>FluentAssertions helpers for golden-path guard failures (catalog <see cref="IntegrationTestHarnessGoldenPathGuardCatalog.FixHint" />).</summary>
internal static class IntegrationTestHarnessGoldenPathGuardAssertionSupport
{
    internal static void AssertHarnessGuardEmpty(
        IReadOnlyList<string> violations,
        int guardFactNumber,
        string because)
    {
        string? fixHint = IntegrationTestHarnessGoldenPathGuardCatalog.Facts
            .FirstOrDefault(f => f.Number == guardFactNumber)
            ?.FixHint;

        string message = fixHint is null ? because : $"{because} Fix: {fixHint}.";
        violations.Should().BeEmpty(message);
    }
}
