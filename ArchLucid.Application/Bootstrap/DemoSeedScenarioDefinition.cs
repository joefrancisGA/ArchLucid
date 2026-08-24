namespace ArchLucid.Application.Bootstrap;

/// <summary>
///     Metadata for one demo seed scenario. Step names match <see cref="DemoSeedStep"/> keys executed by
///     <see cref="DemoSeedService"/>.
/// </summary>
/// <param name="Slug">Stable scenario slug — aligns with <c>archlucid-ui/src/lib/samples/registry.ts</c> where applicable.</param>
/// <param name="StepName">Load-bearing seed step key (logged on failure).</param>
/// <param name="DisplayName">Operator-facing label for logs and diagnostics.</param>
/// <param name="UiSampleSlug">
///     Matching UI sample slug when this SQL seed backs a registered sample scenario; otherwise <see langword="null"/>.
/// </param>
public readonly record struct DemoSeedScenarioDefinition(
    string Slug,
    string StepName,
    string DisplayName,
    string? UiSampleSlug);
