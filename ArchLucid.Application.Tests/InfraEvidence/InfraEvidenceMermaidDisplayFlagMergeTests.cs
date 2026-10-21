using System.Reflection;

using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InfraEvidenceMermaidDisplayFlagMergeTests
{
    private const string SeedNodeId =
        "/subscriptions/sub/resourceGroups/rg-network/providers/Microsoft.Network/virtualNetworks/resource-0";

    private static readonly MethodInfo MergeDisplayCompileOptions =
        typeof(InfraEvidenceSnapshotMermaidService).GetMethod(
            "MergeDisplayCompileOptions",
            BindingFlags.Static | BindingFlags.NonPublic)
        ?? throw new InvalidOperationException("MergeDisplayCompileOptions was not found.");

    public static IEnumerable<object[]> DiagramModeAndDisplayFlagCases()
    {
        foreach (string mode in ReachableDiagramModes)
        {
            foreach (DisplayFlag flag in Enum.GetValues<DisplayFlag>())
            {
                yield return new object[] { mode, flag };
            }
        }
    }

    [Theory]
    [MemberData(nameof(DiagramModeAndDisplayFlagCases))]
    public void MergeDisplayCompileOptions_preserves_each_display_flag_for_every_diagram_mode(string mode, DisplayFlag flag)
    {
        (bool includePrivateEndpointNodes, bool includeRecoveryServices, bool includeCrossGroupFanOut, bool includeAvdAssets, bool includeNetworkDetails) =
            BuildQueryFlags(flag);

        bool parsed = InfraEvidenceMermaidModeParser.TryParse(
            mode,
            SeedNodeId,
            hiddenExecutiveTierKeys: null,
            out InfraEvidenceMermaidModeParseResult parseResult,
            includePrivateEndpointNodes,
            includeRecoveryServices,
            includeCrossGroupFanOut,
            includeAvdAssets);

        parsed.Should().BeTrue($"mode '{mode}' should parse for display-flag merge coverage");

        DiagramAstCompileOptions? merged = InvokeMerge(
            parseResult.CompileOptions,
            includePrivateEndpointNodes,
            includeRecoveryServices,
            includeCrossGroupFanOut,
            includeAvdAssets,
            includeNetworkDetails);

        merged.Should().NotBeNull();

        switch (flag)
        {
            case DisplayFlag.PrivateEndpointNodes:
                merged!.IncludePrivateEndpointNodes.Should().BeTrue();
                break;
            case DisplayFlag.RecoveryServices:
                merged!.IncludeRecoveryServices.Should().BeTrue();
                break;
            case DisplayFlag.CrossGroupFanOut:
                merged!.IncludeCrossGroupFanOut.Should().BeTrue();
                break;
            case DisplayFlag.AvdAssets:
                merged!.IncludeAvdAssets.Should().BeTrue();
                break;
            case DisplayFlag.NetworkDetails:
                merged!.IncludeNetworkDetails.Should().BeTrue();
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(flag), flag, "Unhandled display flag.");
        }
    }

    private static DiagramAstCompileOptions? InvokeMerge(
        DiagramAstCompileOptions? options,
        bool includePrivateEndpointNodes,
        bool includeRecoveryServices,
        bool includeCrossGroupFanOut,
        bool includeAvdAssets,
        bool includeNetworkDetails)
    {
        object? merged = MergeDisplayCompileOptions.Invoke(
            null,
            [
                options,
                null,
                includePrivateEndpointNodes,
                includeRecoveryServices,
                includeCrossGroupFanOut,
                includeAvdAssets,
                includeNetworkDetails,
            ]);

        return merged as DiagramAstCompileOptions;
    }

    private static (bool Pe, bool Rs, bool Cg, bool Avd, bool Nd) BuildQueryFlags(DisplayFlag target)
    {
        bool decoyPrivateEndpoint = target == DisplayFlag.CrossGroupFanOut;
        bool decoyCrossGroup = target != DisplayFlag.CrossGroupFanOut;

        bool includePrivateEndpointNodes = target == DisplayFlag.PrivateEndpointNodes || decoyPrivateEndpoint;
        bool includeRecoveryServices = target == DisplayFlag.RecoveryServices;
        bool includeCrossGroupFanOut = target == DisplayFlag.CrossGroupFanOut || decoyCrossGroup;
        bool includeAvdAssets = target == DisplayFlag.AvdAssets;

        if (target == DisplayFlag.AvdAssets)
        {
            includeCrossGroupFanOut = true;
        }
        bool includeNetworkDetails = target == DisplayFlag.NetworkDetails;

        if (target == DisplayFlag.RecoveryServices)
        {
            includeCrossGroupFanOut = true;
        }

        return (includePrivateEndpointNodes, includeRecoveryServices, includeCrossGroupFanOut, includeAvdAssets, includeNetworkDetails);
    }

    private static readonly string[] ReachableDiagramModes =
    [
        "executive",
        "architecture",
        "network",
        "security",
        "businessContinuity",
        "identity",
        "data",
        "dataFlow",
        "dataArchitecture",
        "avd",
        "full",
        "resourceGroup",
        "resourceGroup:rg-network",
        "dependencyNeighborhood",
        "selectedResources",
    ];

    public enum DisplayFlag
    {
        PrivateEndpointNodes,
        RecoveryServices,
        CrossGroupFanOut,
        AvdAssets,
        NetworkDetails,
    }
}
