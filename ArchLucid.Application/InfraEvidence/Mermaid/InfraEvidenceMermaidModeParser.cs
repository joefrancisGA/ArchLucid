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
            result = Success(DiagramMode.Executive, "executive", null);
            return true;
        }

        if (string.Equals(normalized, "network", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.Network, "network", null);
            return true;
        }

        if (string.Equals(normalized, "identity", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.Identity, "identity", null);
            return true;
        }

        if (string.Equals(normalized, "data", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.Data, "data", null);
            return true;
        }

        if (string.Equals(normalized, "full", StringComparison.OrdinalIgnoreCase))
        {
            result = Success(DiagramMode.FullSubscription, "full", null);
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
                new DiagramAstCompileOptions { ResourceGroupName = resourceGroupName });

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
                new DiagramAstCompileOptions { NeighborhoodSeedNodeId = seedNodeId.Trim() });

            return true;
        }

        result = new InfraEvidenceMermaidModeParseResult
        {
            Succeeded = false,
            ErrorMessage =
                "Unsupported mode. Use executive, network, identity, data, full, resourceGroup:{name}, or dependencyNeighborhood.",
        };

        return false;
    }

    private static InfraEvidenceMermaidModeParseResult Success(
        DiagramMode diagramMode,
        string modeKey,
        DiagramAstCompileOptions? compileOptions)
    {
        return new InfraEvidenceMermaidModeParseResult
        {
            Succeeded = true,
            DiagramMode = diagramMode,
            ModeKey = modeKey,
            CompileOptions = compileOptions,
        };
    }
}
