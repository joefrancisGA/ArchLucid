using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Indexes Bicep declarations in a connector batch so module paths can resolve to in-batch content.
/// </summary>
internal static class BicepDeclarationBatchIndex
{
    internal static Dictionary<string, InfrastructureDeclarationReference> Build(
        IEnumerable<InfrastructureDeclarationReference> declarations)
    {
        Dictionary<string, InfrastructureDeclarationReference> index = new(StringComparer.OrdinalIgnoreCase);

        foreach (InfrastructureDeclarationReference declaration in declarations)
        {
            if (!string.Equals(declaration.Format?.Trim(), "bicep", StringComparison.OrdinalIgnoreCase))
                continue;

            if (string.IsNullOrWhiteSpace(declaration.Name))
                continue;

            RegisterPath(index, declaration.Name, declaration);
            RegisterPath(index, Path.GetFileName(declaration.Name), declaration);
        }

        return index;
    }

    internal static HashSet<string> CollectReferencedModulePaths(
        IEnumerable<InfrastructureDeclarationReference> declarations,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> batchByPath)
    {
        HashSet<string> referenced = new(StringComparer.OrdinalIgnoreCase);

        foreach (InfrastructureDeclarationReference declaration in declarations)
        {
            if (!string.Equals(declaration.Format?.Trim(), "bicep", StringComparison.OrdinalIgnoreCase))
                continue;

            if (string.IsNullOrWhiteSpace(declaration.Content))
                continue;

            foreach (string modulePath in BicepInfrastructureDeclarationParser.ExtractModulePaths(declaration.Content))
            {
                if (TryResolveKey(modulePath, declaration.Name, batchByPath, out string resolvedKey))
                    referenced.Add(resolvedKey);
            }
        }

        return referenced;
    }

    internal static bool TryResolve(
        string modulePath,
        string parentDeclarationName,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> batchByPath,
        out InfrastructureDeclarationReference moduleDeclaration)
    {
        moduleDeclaration = null!;

        if (string.IsNullOrWhiteSpace(modulePath))
            return false;

        string trimmedPath = modulePath.Trim().Trim('\'', '"');

        if (TryLookup(batchByPath, trimmedPath, out moduleDeclaration))
            return true;

        string fileName = Path.GetFileName(trimmedPath.Replace('/', Path.DirectorySeparatorChar));

        if (TryLookup(batchByPath, fileName, out moduleDeclaration))
            return true;

        if (string.IsNullOrWhiteSpace(parentDeclarationName))
            return false;

        string parentDirectory = Path.GetDirectoryName(parentDeclarationName.Replace('/', Path.DirectorySeparatorChar)) ?? string.Empty;
        string combined = string.IsNullOrWhiteSpace(parentDirectory)
            ? trimmedPath.Replace('/', Path.DirectorySeparatorChar)
            : Path.Combine(parentDirectory, trimmedPath.Replace('/', Path.DirectorySeparatorChar)).Replace('\\', '/');

        return TryLookup(batchByPath, combined, out moduleDeclaration)
            || TryLookup(batchByPath, Path.GetFileName(combined), out moduleDeclaration);
    }

    internal static bool TryResolveKey(
        string modulePath,
        string parentDeclarationName,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> batchByPath,
        out string resolvedKey)
    {
        resolvedKey = string.Empty;

        if (!TryResolve(modulePath, parentDeclarationName, batchByPath, out InfrastructureDeclarationReference moduleDeclaration))
            return false;

        resolvedKey = NormalizeLookupKey(moduleDeclaration.Name);

        return !string.IsNullOrWhiteSpace(resolvedKey);
    }

    internal static string NormalizeLookupKey(string declarationName)
    {
        return declarationName.Trim().Replace('\\', '/');
    }

    private static void RegisterPath(
        Dictionary<string, InfrastructureDeclarationReference> index,
        string path,
        InfrastructureDeclarationReference declaration)
    {
        if (string.IsNullOrWhiteSpace(path))
            return;

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
            return false;

        string normalized = NormalizeLookupKey(path);

        if (batchByPath.TryGetValue(normalized, out declaration!))
            return true;

        string fileName = Path.GetFileName(normalized);

        return batchByPath.TryGetValue(fileName, out declaration!);
    }
}
