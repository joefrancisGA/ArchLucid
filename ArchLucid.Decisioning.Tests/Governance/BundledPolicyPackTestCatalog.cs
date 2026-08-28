using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks.CuratedRules;
using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Tests.GoldenCorpus;

// ArchLucid.Decisioning.Governance.PolicyPacks re-declares shim copies of ComplianceRulePackGovernanceFilter,
// TenantCuratedComplianceRulePackMerger, and PolicyPackRulePriority, so it is aliased rather than imported.
using ContractsCompliance = ArchLucid.Contracts.Compliance;
using DeclarationSignalPolicyKeyMap = ArchLucid.Decisioning.Governance.PolicyPacks.DeclarationSignalPolicyKeyMap;
using DecisioningCompliance = ArchLucid.Decisioning.Compliance.Models;

namespace ArchLucid.Decisioning.Tests.Governance;

/// <summary>
///     Loads bundled platform policy packs from the repo and resolves each one the way
///     <c>PolicyFilteredComplianceRulePackProvider</c> does at runtime.
/// </summary>
/// <remarks>
///     The file-backed catalog must match the DI registration in
///     <c>ServiceCollectionExtensions.Decisioning</c>, which composes a <see cref="MergedComplianceRulePackLoader" />
///     over <c>default-compliance.rules.json</c> <em>and</em> <c>ga-starter-compliance.rules.json</c>. Using only the
///     default pack would model a far smaller rule universe than production and make these assertions meaningless.
/// </remarks>
internal static class BundledPolicyPackTestCatalog
{
    private const string BundledDirectoryRelativePath =
        "ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled";

    private const string ManifestFileName = "bundled-policy-packs-v1.manifest.json";

    private const string DefaultRulePackRelativePath =
        "ArchLucid.Decisioning/Compliance/RulePacks/default-compliance.rules.json";

    private const string GaStarterRulePackRelativePath =
        "ArchLucid.Decisioning/Compliance/RulePacks/ga-starter-compliance.rules.json";

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    /// <summary>Bundled content file names in manifest (seed) order.</summary>
    public static IReadOnlyList<string> ContentFileNames()
    {
        string manifestPath = Path.Combine(BundledDirectory(), ManifestFileName);
        BundledManifest? manifest = JsonSerializer.Deserialize<BundledManifest>(
            File.ReadAllText(manifestPath),
            JsonOptions);

        if (manifest?.ContentFiles is null || manifest.ContentFiles.Count == 0)
            throw new InvalidOperationException($"Bundled manifest has no contentFiles: {manifestPath}");

        return manifest.ContentFiles;
    }

    /// <summary>Reads one bundled pack's content document. A fresh instance per call keeps tests mutation-safe.</summary>
    public static PolicyPackContentDocument ReadContent(string contentFile)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(contentFile);

        string path = Path.Combine(BundledDirectory(), contentFile);

        return JsonSerializer.Deserialize<PolicyPackContentDocument>(File.ReadAllText(path), JsonOptions)
            ?? throw new InvalidOperationException($"Invalid bundled policy pack content JSON: {contentFile}");
    }

    /// <summary>Rule ids available in the merged file-backed catalog before any governance narrowing.</summary>
    public static async Task<IReadOnlySet<string>> MergedCatalogRuleIdsAsync(CancellationToken ct)
    {
        DecisioningCompliance.ComplianceRulePack full = await LoadMergedFilePackAsync(ct);

        return DeclarationSignalPolicyKeyMap.CollectActiveRuleIds(full);
    }

    public static async Task<BundledPolicyPackFixture> LoadAsync(string contentFile, CancellationToken ct)
    {
        PolicyPackContentDocument content = ReadContent(contentFile);
        IReadOnlySet<string> resolved = await ResolveActiveRuleIdsAsync(content, ct);

        return new BundledPolicyPackFixture(contentFile, content, resolved);
    }

    public static async Task<IReadOnlyList<BundledPolicyPackFixture>> LoadAllAsync(CancellationToken ct)
    {
        List<BundledPolicyPackFixture> fixtures = [];

        foreach (string contentFile in ContentFileNames())
            fixtures.Add(await LoadAsync(contentFile, ct));

        return fixtures;
    }

    /// <summary>
    ///     Mirrors <c>PolicyFilteredComplianceRulePackProvider.GetRulePackAsync</c> minus tenant scope resolution,
    ///     then collects the ids the declaration engines gate on.
    /// </summary>
    public static async Task<IReadOnlySet<string>> ResolveActiveRuleIdsAsync(
        PolicyPackContentDocument content,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(content);

        DecisioningCompliance.ComplianceRulePack filePack = await LoadMergedFilePackAsync(ct);

        ContractsCompliance.ComplianceRulePack merged =
            TenantCuratedComplianceRulePackMerger.MergeFilePackWithCuratedFromGovernance(
                (ContractsCompliance.ComplianceRulePack)filePack,
                content);

        ContractsCompliance.ComplianceRulePack filtered = ComplianceRulePackGovernanceFilter.Filter(merged, content);

        return DeclarationSignalPolicyKeyMap.CollectActiveRuleIds(
            (DecisioningCompliance.ComplianceRulePack)filtered);
    }

    /// <summary>Returns a copy of <paramref name="content" /> whose priority floor is widened or narrowed.</summary>
    public static PolicyPackContentDocument WithPriorityFloor(PolicyPackContentDocument content, string priorityFloor)
    {
        ArgumentNullException.ThrowIfNull(content);
        ArgumentException.ThrowIfNullOrWhiteSpace(priorityFloor);

        PolicyPackContentDocument clone = new()
        {
            ComplianceRuleIds = [.. content.ComplianceRuleIds],
            ComplianceRuleKeys = [.. content.ComplianceRuleKeys],
            AlertRuleIds = [.. content.AlertRuleIds],
            CompositeAlertRuleIds = [.. content.CompositeAlertRuleIds],
            AdvisoryDefaults =
                new Dictionary<string, string>(content.AdvisoryDefaults, StringComparer.OrdinalIgnoreCase),
            Metadata = new Dictionary<string, string>(content.Metadata, StringComparer.OrdinalIgnoreCase),
            ElicitationQuestions = [.. content.ElicitationQuestions],
        };

        clone.AdvisoryDefaults[PolicyPackRulePriority.AdvisoryDefaultsKey] = priorityFloor;

        return clone;
    }

    private static async Task<DecisioningCompliance.ComplianceRulePack> LoadMergedFilePackAsync(CancellationToken ct)
    {
        MergedComplianceRulePackLoader loader = new(
        [
            new FileComplianceRulePackLoader(RepoPath(DefaultRulePackRelativePath)),
            new FileComplianceRulePackLoader(RepoPath(GaStarterRulePackRelativePath)),
        ]);

        return await loader.LoadAsync(ct);
    }

    private static string BundledDirectory() => RepoPath(BundledDirectoryRelativePath);

    private static string RepoPath(string relativePath) => Path.Combine(
        GoldenCorpusRepoPaths.FindRepoRoot(),
        relativePath.Replace('/', Path.DirectorySeparatorChar));

    private sealed class BundledManifest
    {
        public List<string>? ContentFiles
        {
            get;
            set;
        }
    }
}
