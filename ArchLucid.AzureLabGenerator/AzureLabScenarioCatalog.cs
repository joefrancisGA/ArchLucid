namespace ArchLucid.AzureLabGenerator;

public sealed class AzureLabScenarioCatalog
{
    private readonly AzureLabInventoryGenerator generator;

    public IReadOnlyList<AzureLabScenario> Scenarios { get; }

    public AzureLabScenarioCatalog(AzureLabInventoryGenerator generator)
    {
        this.generator = generator ?? throw new ArgumentNullException(nameof(generator));
        Scenarios =
        [
        new(
            AzureLabScenarioId.LandingZone,
            "Landing zone, 500 resources",
            "archlucid-lab-landing-zone.zip",
            "55555555-5555-5555-5555-555555555555",
            "/subscriptions/55555555-5555-5555-5555-555555555555/resourceGroups/lz-connectivity",
            "0.0.0-lab-landing-zone",
            "2026-06-21T12:00:00.000Z",
            AzureLabInventoryGenerator.LandingZoneResourceCount,
            "Synthetic lab inventory. Not customer evidence.",
            "graph TD\n  Connectivity[lz-connectivity] --> Identity[lz-identity]\n  Identity --> Apps[lz-app-01 through lz-app-13]",
            generator.BuildLandingZone,
            CreateLandingZonePolicyCompliance()),
        new(
            AzureLabScenarioId.LandingZoneLater,
            "Landing zone, later snapshot",
            "archlucid-lab-landing-zone-later.zip",
            "55555555-5555-5555-5555-555555555555",
            "/subscriptions/55555555-5555-5555-5555-555555555555/resourceGroups/lz-connectivity",
            "0.0.0-lab-landing-zone-later",
            "2026-06-22T12:00:00.000Z",
            AzureLabInventoryGenerator.LandingZoneLaterResourceCount,
            "Synthetic lab inventory. Not customer evidence.\nLater snapshot of the landing zone lab pack.",
            "graph TD\n  Connectivity[lz-connectivity] --> Identity[lz-identity]\n  Identity --> NewApps[lz-app-new]",
            generator.BuildLandingZoneLater,
            CreateLandingZonePolicyCompliance()),
        new(
            AzureLabScenarioId.MessyEstate,
            "Messy estate",
            "archlucid-lab-messy-estate.zip",
            "66666666-6666-6666-6666-666666666666",
            "/subscriptions/66666666-6666-6666-6666-666666666666/resourceGroups/MessyPrimaryRg",
            "0.0.0-lab-messy-estate",
            "2026-06-21T12:30:00.000Z",
            AzureLabInventoryGenerator.MessyEstateResourceCount,
            "Synthetic lab inventory. Not customer evidence.\nExpected to look incomplete.",
            "graph TD\n  Primary[MessyPrimaryRg] --> Secondary[MessySecondaryRg]\n  Primary -. missing target .-> PrivateEndpoint[pe-missing-target-1]",
            generator.BuildMessyEstate,
            new(
                new AzureLabPolicySummary(1, 1, 0),
                [
                    new AzureLabPolicyState(
                        "/subscriptions/66666666-6666-6666-6666-666666666666/resourceGroups/MissingRg/providers/Microsoft.KeyVault/vaults/does-not-exist",
                        "Key Vaults should use private endpoints",
                        "NonCompliant"),
                ])),
        ];
    }

    public AzureLabScenario Get(AzureLabScenarioId scenarioId)
    {
        AzureLabScenario? scenario = Scenarios.FirstOrDefault(candidate => candidate.Id == scenarioId);

        if (scenario is null)
        {
            throw new ArgumentOutOfRangeException(nameof(scenarioId), scenarioId, "Unknown Azure lab scenario.");
        }

        return scenario;
    }

    private static AzureLabPolicyCompliance CreateLandingZonePolicyCompliance()
    {
        return new AzureLabPolicyCompliance(
            new AzureLabPolicySummary(20, 2, 18),
            [
                new AzureLabPolicyState(
                    "/subscriptions/55555555-5555-5555-5555-555555555555/resourceGroups/lz-connectivity/providers/Microsoft.KeyVault/vaults/kv-lz-connectivity-7",
                    "Key Vaults should have soft delete enabled",
                    "NonCompliant"),
                new AzureLabPolicyState(
                    "/subscriptions/55555555-5555-5555-5555-555555555555/resourceGroups/lz-connectivity/providers/Microsoft.Storage/storageAccounts/st-lz-connectivity-8",
                    "Storage accounts should restrict network access",
                    "NonCompliant"),
            ]);
    }
}
