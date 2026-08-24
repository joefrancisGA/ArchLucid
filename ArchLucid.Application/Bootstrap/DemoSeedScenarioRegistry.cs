namespace ArchLucid.Application.Bootstrap;

/// <summary>
///     Canonical registry of demo seed scenarios. Mirrors the UI sample registry pattern in
///     <c>archlucid-ui/src/lib/samples/registry.ts</c> for cross-layer slug alignment.
/// </summary>
public static class DemoSeedScenarioRegistry
{
    /// <summary>Retail Checkout trusted baseline (Contoso) — primary SQL demo spine.</summary>
    public const string RetailCheckoutSlug = "retail-checkout-trusted-baseline";

    /// <summary>Northwind product-tour workspace (legacy route id retained for SQL compatibility).</summary>
    public const string NorthwindProductTourSlug = "northwind-product-tour";

    /// <summary>Meridian Alpine regulated-depth workspace — healthcare/claims SQL seed.</summary>
    public const string MeridianAlpineRegulatedSlug = "meridian-alpine-regulated";

    /// <summary>Created architecture package sample (copilot/RAG walkthrough).</summary>
    public const string CreatedPackageSampleSlug = "created-package-sample";

    private static readonly DemoSeedScenarioDefinition[] RegisteredScenarios =
    [
        new(RetailCheckoutSlug, "retail-request", "Retail Checkout request", "customer-intake"),
        new(RetailCheckoutSlug, "retail-run-baseline", "Retail Checkout baseline run", "customer-intake"),
        new(RetailCheckoutSlug, "retail-run-hardened", "Retail Checkout hardened run", "customer-intake"),
        new(RetailCheckoutSlug, "retail-governance", "Retail Checkout governance", "customer-intake"),
        new(RetailCheckoutSlug, "retail-export-record", "Retail Checkout export record", "customer-intake"),
        new(NorthwindProductTourSlug, "northwind-product-tour", "Product tour workspace", null),
        new(MeridianAlpineRegulatedSlug, "meridian-alpine-regulated", "Meridian Alpine regulated workspace", "claims-intake"),
        new(CreatedPackageSampleSlug, "created-package-sample", "Created architecture package sample", "ai-knowledge-assistant")
    ];

    /// <summary>Ordered seed steps for <see cref="DemoSeedService.SeedAsync"/>.</summary>
    public static IReadOnlyList<DemoSeedScenarioDefinition> ListSeedSteps() => RegisteredScenarios;

    public static DemoSeedScenarioDefinition? ResolveByStepName(string stepName)
    {
        if (string.IsNullOrWhiteSpace(stepName))
            return null;

        string normalized = stepName.Trim();

        foreach (DemoSeedScenarioDefinition scenario in RegisteredScenarios)
        {
            if (string.Equals(scenario.StepName, normalized, StringComparison.Ordinal))
                return scenario;
        }

        return null;
    }

    public static DemoSeedScenarioDefinition? ResolveByUiSampleSlug(string uiSampleSlug)
    {
        if (string.IsNullOrWhiteSpace(uiSampleSlug))
            return null;

        string normalized = uiSampleSlug.Trim().ToLowerInvariant();

        foreach (DemoSeedScenarioDefinition scenario in RegisteredScenarios)
        {
            if (scenario.UiSampleSlug is not null &&
                string.Equals(scenario.UiSampleSlug, normalized, StringComparison.Ordinal))
                return scenario;
        }

        return null;
    }

    public static IReadOnlyList<DemoSeedScenarioDefinition> ListByScenarioSlug(string scenarioSlug)
    {
        if (string.IsNullOrWhiteSpace(scenarioSlug))
            return [];

        string normalized = scenarioSlug.Trim().ToLowerInvariant();

        return RegisteredScenarios
            .Where(s => string.Equals(s.Slug, normalized, StringComparison.Ordinal))
            .ToList();
    }
}
