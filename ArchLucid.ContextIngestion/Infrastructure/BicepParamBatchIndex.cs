using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Pairs in-batch <c>.bicepparam</c> declarations with their referenced Bicep files.
/// </summary>
internal static class BicepParamBatchIndex
{
    internal static Dictionary<string, IReadOnlyDictionary<string, string>> Build(
        IEnumerable<InfrastructureDeclarationReference> declarations,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> batchByPath)
    {
        Dictionary<string, IReadOnlyDictionary<string, string>> parametersByBicepPath =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (InfrastructureDeclarationReference declaration in declarations)
        {
            if (!string.Equals(declaration.Format?.Trim(), "bicep-param", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(declaration.Content))
            {
                continue;
            }

            if (!BicepParamFileParser.TryParse(declaration.Content, out string? bicepRelativePath, out Dictionary<string, string> parameters))
            {
                continue;
            }

            if (!InfrastructureDeclarationBatchPathIndex.TryResolve(
                    bicepRelativePath!,
                    declaration.Name,
                    batchByPath,
                    out InfrastructureDeclarationReference bicepDeclaration))
            {
                continue;
            }

            string bicepKey = InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(bicepDeclaration.Name);
            parametersByBicepPath[bicepKey] = parameters;
        }

        return parametersByBicepPath;
    }
}
