namespace ArchLucid.AzureLabGenerator;

public sealed record AzureLabScenario(
    AzureLabScenarioId Id,
    string Title,
    string ZipFileName,
    string SubscriptionId,
    string Scope,
    string ScriptVersion,
    string CollectionTimestamp,
    int ResourceCount,
    string Readme,
    string DiagramMermaid,
    Func<IReadOnlyList<AzureLabResource>> BuildResources,
    AzureLabPolicyCompliance PolicyCompliance);
