using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Indexes infrastructure declarations in a connector batch by normalized path and file name.
/// </summary>
internal static class InfrastructureDeclarationBatchPathIndex
{
    internal static Dictionary<string, InfrastructureDeclarationReference> Build(
        IEnumerable<InfrastructureDeclarationReference> declarations)
    {
        Dictionary<string, InfrastructureDeclarationReference> index = new(StringComparer.OrdinalIgnoreCase);

        foreach (InfrastructureDeclarationReference declaration in declarations)
        {
            if (string.IsNullOrWhiteSpace(declaration.Name))
            {
                continue;
            }

            RegisterPath(index, declaration.Name, declaration);
            RegisterPath(index, Path.GetFileName(declaration.Name), declaration);
        }

        return index;
    }

    internal static bool TryResolve(
        string relativePath,
        string parentDeclarationName,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> batchByPath,
        out InfrastructureDeclarationReference declaration)
    {
        declaration = null!;

        if (string.IsNullOrWhiteSpace(relativePath))
        {
            return false;
        }

        string trimmedPath = relativePath.Trim().Trim('\'', '"');

        if (TryLookup(batchByPath, trimmedPath, out declaration))
        {
            return true;
        }

        string fileName = Path.GetFileName(trimmedPath.Replace('/', Path.DirectorySeparatorChar));

        if (TryLookup(batchByPath, fileName, out declaration))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(parentDeclarationName))
        {
            return false;
        }

        string parentDirectory = Path.GetDirectoryName(parentDeclarationName.Replace('/', Path.DirectorySeparatorChar)) ?? string.Empty;
        string combined = string.IsNullOrWhiteSpace(parentDirectory)
            ? trimmedPath.Replace('/', Path.DirectorySeparatorChar)
            : Path.Combine(parentDirectory, trimmedPath.Replace('/', Path.DirectorySeparatorChar)).Replace('\\', '/');

        return TryLookup(batchByPath, combined, out declaration)
            || TryLookup(batchByPath, Path.GetFileName(combined), out declaration);
    }

    internal static string NormalizeLookupKey(string declarationName)
    {
        return declarationName.Trim().Replace('\\', '/');
    }

    internal static string GetDirectoryName(string declarationName)
    {
        string normalized = NormalizeLookupKey(declarationName);
        int lastSlash = normalized.LastIndexOf('/');

        if (lastSlash < 0)
        {
            return string.Empty;
        }

        return normalized[..lastSlash];
    }

    private static void RegisterPath(
        Dictionary<string, InfrastructureDeclarationReference> index,
        string path,
        InfrastructureDeclarationReference declaration)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return;
        }

        string normalized = NormalizeLookupKey(path);
        index[normalized] = declaration;
        index[Path.GetFileName(normalized)] = declaration;
    }

    private static bool TryLookup(
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> batchByPath,
        string path,
        out InfrastructureDeclarationReference declaration)
    {
        declaration = null!;

        if (string.IsNullOrWhiteSpace(path))
        {
            return false;
        }

        string normalized = NormalizeLookupKey(path);

        if (batchByPath.TryGetValue(normalized, out declaration!))
        {
            return true;
        }

        string fileName = Path.GetFileName(normalized);

        return batchByPath.TryGetValue(fileName, out declaration!);
    }
}
