using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Indexes in-batch <c>simple-terraform</c> declarations so local module sources resolve to .tf content.
/// </summary>
internal static class SimpleTerraformModuleBatchIndex
{
    internal const int MaxModuleRecursionDepth = 3;

    internal static Dictionary<string, InfrastructureDeclarationReference> Build(
        IEnumerable<InfrastructureDeclarationReference> declarations)
    {
        Dictionary<string, InfrastructureDeclarationReference> index = new(StringComparer.OrdinalIgnoreCase);

        foreach (InfrastructureDeclarationReference declaration in declarations)
        {
            if (!string.Equals(declaration.Format?.Trim(), "simple-terraform", StringComparison.OrdinalIgnoreCase))
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
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> terraformBatchByPath,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> fullBatchByPath)
    {
        HashSet<string> referenced = new(StringComparer.OrdinalIgnoreCase);

        foreach (InfrastructureDeclarationReference declaration in declarations)
        {
            if (!string.Equals(declaration.Format?.Trim(), "simple-terraform", StringComparison.OrdinalIgnoreCase))
                continue;

            if (string.IsNullOrWhiteSpace(declaration.Content))
                continue;

            foreach (string moduleSource in ExtractModuleSourcePaths(declaration.Content))
            {
                if (IsRemoteModuleSource(moduleSource))
                    continue;

                if (TryResolveModule(
                        moduleSource,
                        declaration.Name,
                        terraformBatchByPath,
                        fullBatchByPath,
                        out InfrastructureDeclarationReference moduleDeclaration))
                {
                    referenced.Add(InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(moduleDeclaration.Name));
                }
            }
        }

        return referenced;
    }

    internal static IEnumerable<string> ExtractModuleSourcePaths(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            yield break;

        foreach (SimpleTerraformResourceBlockParser.SimpleTerraformModuleBlock moduleBlock in
                 SimpleTerraformResourceBlockParser.ExtractModuleBlocks(content))
        {
            if (!string.IsNullOrWhiteSpace(moduleBlock.Source))
                yield return moduleBlock.Source;
        }
    }

    internal static bool TryResolveModule(
        string moduleSource,
        string parentDeclarationName,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> terraformBatchByPath,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> fullBatchByPath,
        out InfrastructureDeclarationReference moduleDeclaration)
    {
        moduleDeclaration = null!;

        if (string.IsNullOrWhiteSpace(moduleSource) || IsRemoteModuleSource(moduleSource))
            return false;

        string normalizedDirectory = NormalizeModuleDirectory(moduleSource, parentDeclarationName);

        if (string.IsNullOrWhiteSpace(normalizedDirectory))
            return false;

        string mainTfPath = normalizedDirectory.EndsWith(".tf", StringComparison.OrdinalIgnoreCase)
            ? normalizedDirectory
            : $"{normalizedDirectory.TrimEnd('/')}/main.tf";

        if (InfrastructureDeclarationBatchPathIndex.TryResolve(
                mainTfPath,
                parentDeclarationName,
                fullBatchByPath,
                out moduleDeclaration)
            && IsSimpleTerraform(moduleDeclaration))
            return true;

        if (InfrastructureDeclarationBatchPathIndex.TryResolve(
                normalizedDirectory,
                parentDeclarationName,
                fullBatchByPath,
                out moduleDeclaration)
            && IsSimpleTerraform(moduleDeclaration))
            return true;

        return TryLookupTerraformByDirectoryPrefix(terraformBatchByPath, normalizedDirectory, out moduleDeclaration);
    }

    internal static bool IsRemoteModuleSource(string source)
    {
        if (string.IsNullOrWhiteSpace(source))
            return true;

        string trimmed = source.Trim().Trim('\'', '"');

        if (trimmed.StartsWith("git::", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("git@", StringComparison.OrdinalIgnoreCase))
            return true;

        if (trimmed.Contains("registry.terraform.io/", StringComparison.OrdinalIgnoreCase))
            return true;

        if (trimmed.StartsWith("hashicorp/", StringComparison.OrdinalIgnoreCase))
            return true;

        if (trimmed.StartsWith("./", StringComparison.Ordinal)
            || trimmed.StartsWith("../", StringComparison.Ordinal)
            || trimmed.StartsWith("/", StringComparison.Ordinal))
            return false;

        return trimmed.Contains('/', StringComparison.Ordinal);
    }

    private static string NormalizeModuleDirectory(string moduleSource, string parentDeclarationName)
    {
        string trimmed = moduleSource.Trim().Trim('\'', '"');
        trimmed = CanonicalInfrastructurePropertyBag.StripTrailingSlashSlashComment(trimmed);
        trimmed = CanonicalInfrastructurePropertyBag.StripTrailingBlockComment(trimmed);
        trimmed = CanonicalInfrastructurePropertyBag.UnquoteInfrastructureScalar(trimmed);

        if (trimmed.StartsWith("./", StringComparison.Ordinal))
            trimmed = trimmed[2..];

        string parentDirectory = InfrastructureDeclarationBatchPathIndex.GetDirectoryName(parentDeclarationName);

        if (string.IsNullOrWhiteSpace(parentDirectory))
            return InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(trimmed);

        return InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(
            Path.Combine(parentDirectory, trimmed).Replace('\\', '/'));
    }

    private static bool TryLookupTerraformByDirectoryPrefix(
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> terraformBatchByPath,
        string normalizedDirectory,
        out InfrastructureDeclarationReference moduleDeclaration)
    {
        moduleDeclaration = null!;
        string prefix = $"{normalizedDirectory.TrimEnd('/')}/";

        foreach (KeyValuePair<string, InfrastructureDeclarationReference> entry in terraformBatchByPath)
        {
            string key = InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(entry.Key);

            if (!key.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                continue;

            if (!key.EndsWith(".tf", StringComparison.OrdinalIgnoreCase))
                continue;

            moduleDeclaration = entry.Value;

            return true;
        }

        return false;
    }

    private static void RegisterPath(
        Dictionary<string, InfrastructureDeclarationReference> index,
        string path,
        InfrastructureDeclarationReference declaration)
    {
        if (string.IsNullOrWhiteSpace(path))
            return;

        string normalized = InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(path);
        index[normalized] = declaration;
        index[Path.GetFileName(normalized)] = declaration;
    }

    private static bool IsSimpleTerraform(InfrastructureDeclarationReference declaration)
    {
        return string.Equals(declaration.Format?.Trim(), "simple-terraform", StringComparison.OrdinalIgnoreCase);
    }
}
