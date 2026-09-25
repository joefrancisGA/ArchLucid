using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

public sealed class InfraEvidenceMermaidModeParseResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public DiagramMode DiagramMode
    {
        get;
        init;
    }

    public string ModeKey
    {
        get;
        init;
    } = string.Empty;

    public DiagramAstCompileOptions? CompileOptions
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}

public static class InfraEvidenceMermaidModeParser
{
    private const string ResourceGroupPrefix = "resourceGroup:";

    public static bool TryParse(
        string? mode,
        string? seedNodeId,
        out InfraEvidenceMermaidModeParseResult result)
    {
        return TryParse(
            mode,
            seedNodeId,
            hiddenExecutiveTierKeys: null,
            out result,
            includePrivateEndpointNodes: false,
            includeRecoveryServices: false,
            includeCrossGroupFanOut: false);
    }

    /// <param name="hiddenExecutiveTierKeys">
    /// Comma-separated <see cref="ExecutiveAlwaysShowTiers" /> keys the viewer unchecked. Unknown keys are ignored;
    /// only Executive mode consumes them.
    /// </param>
    public static bool TryParse(
        string? mode,
        string? seedNodeId,
        string? hiddenExecutiveTierKeys,
        out InfraEvidenceMermaidModeParseResult result,
        bool includePrivateEndpointNodes = false,
        bool includeRecoveryServices = false,
        bool includeCrossGroupFanOut = false)
    {
        if (string.IsNullOrWhiteSpace(mode))
        {
            result = new InfraEvidenceMermaidModeParseResult
            {
                Succeeded = false,
                ErrorMessage = "Mode is required.",
            };

            return false;
        }

        string normalized = mode.Trim();

        if (string.Equals(normalized, "executive", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.Executive, "executive", BuildExecutiveCompileOptions(hiddenExecutiveTierKeys), includePrivateEndpointNodes, includeRecoveryServices, includeCrossGroupFanOut);
            return true;
        }

        if (string.Equals(normalized, "architecture", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.Architecture, "architecture", null, includePrivateEndpointNodes, includeRecoveryServices, includeCrossGroupFanOut);
            return true;
        }

        if (string.Equals(normalized, "network", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.Network, "network", null, includePrivateEndpointNodes, includeRecoveryServices, includeCrossGroupFanOut);
            return true;
        }

        if (string.Equals(normalized, "security", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.Security, "security", null, includePrivateEndpointNodes, includeRecoveryServices, includeCrossGroupFanOut);
            return true;
        }

        if (string.Equals(normalized, "businessContinuity", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.BusinessContinuity, "businessContinuity", null, includePrivateEndpointNodes, includeRecoveryServices: false, includeCrossGroupFanOut);
            return true;
        }

        if (string.Equals(normalized, "identity", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.Identity, "identity", null, includePrivateEndpointNodes, includeRecoveryServices, includeCrossGroupFanOut);
            return true;
        }

        if (string.Equals(normalized, "data", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.Data, "data", null, includePrivateEndpointNodes, includeRecoveryServices, includeCrossGroupFanOut);
            return true;
        }

        if (string.Equals(normalized, "dataFlow", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.DataFlow, "dataFlow", null, includePrivateEndpointNodes, includeRecoveryServices, includeCrossGroupFanOut);
            return true;
        }

        if (string.Equals(normalized, "dataArchitecture", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.DataArchitecture, "dataArchitecture", null, includePrivateEndpointNodes, includeRecoveryServices, includeCrossGroupFanOut);
            return true;
        }

        if (string.Equals(normalized, "full", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.FullSubscription, "full", null, includePrivateEndpointNodes, includeRecoveryServices, includeCrossGroupFanOut);
            return true;
        }

        if (string.Equals(normalized, InventoryDiagramFallbackArtifactKeys.ResourceGroupModeKey, StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.ResourceGroup, InventoryDiagramFallbackArtifactKeys.ResourceGroupModeKey, null, includePrivateEndpointNodes, includeRecoveryServices, includeCrossGroupFanOut);
            return true;
        }

        if (normalized.StartsWith(ResourceGroupPrefix, StringComparison.OrdinalIgnoreCase))
        {
            string resourceGroupName = normalized[ResourceGroupPrefix.Length..].Trim();

            if (string.IsNullOrWhiteSpace(resourceGroupName))
            {
                result = new InfraEvidenceMermaidModeParseResult
                {
                    Succeeded = false,
                    ErrorMessage = "Resource group name is required after resourceGroup:.",
                };

                return false;
            }

            result = Success(
                DiagramMode.ResourceGroup,
                $"resourceGroup:{resourceGroupName}",
                new DiagramAstCompileOptions { ResourceGroupName = resourceGroupName },
                includePrivateEndpointNodes,
                includeRecoveryServices,
                includeCrossGroupFanOut);

            return true;
        }

        if (string.Equals(normalized, "dependencyNeighborhood", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(seedNodeId))
            {
                result = new InfraEvidenceMermaidModeParseResult
                {
                    Succeeded = false,
                    ErrorMessage = "seedNodeId is required for dependencyNeighborhood mode.",
                };

                return false;
            }

            result = Success(
                DiagramMode.DependencyNeighborhood,
                "dependencyNeighborhood",
                new DiagramAstCompileOptions { NeighborhoodSeedNodeId = seedNodeId.Trim() },
                includePrivateEndpointNodes,
                includeRecoveryServices,
                includeCrossGroupFanOut);

            return true;
        }

        if (string.Equals(normalized, "selectedResources", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(seedNodeId))
            {
                result = new InfraEvidenceMermaidModeParseResult
                {
                    Succeeded = false,
                    ErrorMessage = "seedNodeId is required for selectedResources mode.",
                };

                return false;
            }

            result = Success(
                DiagramMode.SelectedResources,
                "selectedResources",
                new DiagramAstCompileOptions
                {
                    SelectedNodeIds = seedNodeId.Split(
                        ',',
                        StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
                },
                includePrivateEndpointNodes,
                includeRecoveryServices,
                includeCrossGroupFanOut);
            return true;
        }

        result = new InfraEvidenceMermaidModeParseResult
        {
            Succeeded = false,
            ErrorMessage =
                "Unsupported mode. Use executive, architecture, network, security, businessContinuity, identity, data, dataFlow, dataArchitecture, full, resourceGroup, resourceGroup:{name}, selectedResources, or dependencyNeighborhood.",
        };

        return false;
    }

    private static DiagramAstCompileOptions? BuildExecutiveCompileOptions(string? hiddenExecutiveTierKeys)
    {
        IReadOnlyList<string> hiddenKeys = ExecutiveAlwaysShowTiers.ParseHiddenKeys(hiddenExecutiveTierKeys);

        if (hiddenKeys.Count == 0)
        {
            return null;
        }

        return new DiagramAstCompileOptions { HiddenExecutiveTierKeys = hiddenKeys };
    }

    private static InfraEvidenceMermaidModeParseResult Success(
        DiagramMode diagramMode,
        string modeKey,
        DiagramAstCompileOptions? compileOptions,
        bool includePrivateEndpointNodes,
        bool includeRecoveryServices,
        bool includeCrossGroupFanOut)
    {
        DiagramAstCompileOptions? resolvedOptions = compileOptions;

        if (includePrivateEndpointNodes || includeRecoveryServices || includeCrossGroupFanOut)
        {
            resolvedOptions = CopyOptions(
                compileOptions,
                includePrivateEndpointNodes,
                includeRecoveryServices,
                includeCrossGroupFanOut);
        }

        return new InfraEvidenceMermaidModeParseResult
        {
            Succeeded = true,
            DiagramMode = diagramMode,
            ModeKey = modeKey,
            CompileOptions = resolvedOptions,
        };
    }

    private static DiagramAstCompileOptions CopyOptions(
        DiagramAstCompileOptions? options,
        bool includePrivateEndpointNodes,
        bool includeRecoveryServices,
        bool includeCrossGroupFanOut)
    {
        return new DiagramAstCompileOptions
        {
            ResourceGroupName = options?.ResourceGroupName,
            SelectedNodeIds = options?.SelectedNodeIds,
            NeighborhoodSeedNodeId = options?.NeighborhoodSeedNodeId,
            NeighborhoodDepth = options?.NeighborhoodDepth ?? 2,
            CollapseToResourceGroupMap = options?.CollapseToResourceGroupMap ?? false,
            CollapseToBackboneKeep = options?.CollapseToBackboneKeep ?? false,
            HiddenExecutiveTierKeys = options?.HiddenExecutiveTierKeys,
            IncludePrivateEndpointNodes = includePrivateEndpointNodes,
            IncludeRecoveryServices = includeRecoveryServices,
            IncludeCrossGroupFanOut = includeCrossGroupFanOut,
            RecoveryServicesCollectionIncomplete = options?.RecoveryServicesCollectionIncomplete ?? false,
        };
    }
}
