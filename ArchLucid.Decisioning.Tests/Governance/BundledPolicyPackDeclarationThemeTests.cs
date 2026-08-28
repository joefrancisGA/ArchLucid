using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;

using FluentAssertions;

using DeclarationSignalPolicyGate = ArchLucid.Decisioning.Governance.PolicyPacks.DeclarationSignalPolicyGate;
using DeclarationSignalPolicyKeyMap = ArchLucid.Decisioning.Governance.PolicyPacks.DeclarationSignalPolicyKeyMap;

namespace ArchLucid.Decisioning.Tests.Governance;

/// <summary>
///     PP-01: which declaration themes each buyer-common bundled pack actually enables, measured through the
///     production merge-then-filter path. These assertions bound the "different packs move declaration rows" claim.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BundledPolicyPackDeclarationThemeTests
{
    private const string DataProtection = "data-protection";
    private const string Encryption = "encryption";
    private const string NetworkIsolation = "network-isolation";
    private const string TransportSecurity = "transport-security";
    private const string WorkloadIsolation = "workload-isolation";

    private static readonly string[] AllThemes =
    [
        DataProtection,
        Encryption,
        NetworkIsolation,
        TransportSecurity,
        WorkloadIsolation,
    ];

    /// <summary>
    ///     Theme-mapped ids that the merged file catalog does not yet carry, so they cannot enable a theme at
    ///     runtime. Shrinking this set is the point of extending <c>ga-starter-compliance.rules.json</c>; the
    ///     assertion is a subset check so adding catalog rules never breaks the build, while mapping a brand-new
    ///     phantom id does.
    /// </summary>
    private static readonly string[] KnownUnbackedMappedRuleIds =
    [
        "aks-015",
        "aks-021",
        "cis-az-012",
        "cis-az-018",
        "cis-az-019",
        "cis-az-025",
        "cis-az-027",
        "hipaa-017",
        "hipaa-022",
        "hipaa-024",
        "iso27001-025",
        "soc2-018",
    ];

    [Fact]
    public async Task Theme_map_never_cites_a_rule_id_outside_the_documented_unbacked_set()
    {
        IReadOnlySet<string> catalog = await BundledPolicyPackTestCatalog.MergedCatalogRuleIdsAsync(
            CancellationToken.None);

        List<string> unbacked = DeclarationSignalPolicyKeyMap.MappedRuleIds
            .Where(ruleId => !catalog.Contains(ruleId))
            .OrderBy(static ruleId => ruleId, StringComparer.Ordinal)
            .ToList();

        unbacked.Should().BeSubsetOf(
            KnownUnbackedMappedRuleIds,
            "a newly mapped id must exist in default-compliance/ga-starter rules or it can never enable a theme");
    }

    [Fact]
    public async Task Every_bundled_pack_resolves_at_least_one_declared_rule()
    {
        IReadOnlyList<BundledPolicyPackFixture> fixtures =
            await BundledPolicyPackTestCatalog.LoadAllAsync(CancellationToken.None);

        fixtures.Should().NotBeEmpty();

        List<string> emptyPacks = fixtures
            .Where(fixture => fixture.Content.ComplianceRuleKeys.Count > 0 && fixture.ResolvedRuleIds.Count == 0)
            .Select(fixture => fixture.ContentFile)
            .ToList();

        emptyPacks.Should().BeEmpty(
            "an empty resolved pack makes DeclarationSignalPolicyGate fail closed, silencing every declaration finding");
    }

    [Fact]
    public async Task Resolved_rules_never_exceed_the_declared_key_set()
    {
        IReadOnlyList<BundledPolicyPackFixture> fixtures =
            await BundledPolicyPackTestCatalog.LoadAllAsync(CancellationToken.None);

        foreach (BundledPolicyPackFixture fixture in fixtures)
        {
            if (fixture.Content.ComplianceRuleKeys.Count == 0)
                continue;

            HashSet<string> declared = fixture.Content.ComplianceRuleKeys.ToHashSet(StringComparer.OrdinalIgnoreCase);

            fixture.ResolvedRuleIds.Should().OnlyContain(
                ruleId => declared.Contains(ruleId),
                $"{fixture.ContentFile} must not widen governance beyond its declared keys");
        }
    }

    [Fact]
    public async Task Security_baseline_and_kubernetes_packs_emit_declaration_rows_at_the_shipped_pilot_floor()
    {
        // sec-base-006 and aks/eks/gke-002 are the P0-tier controls that survive priorityFloor: P0.
        IReadOnlySet<string> securityBaseline = await ResolveShippedAsync("security-architecture-baseline.json");

        EnabledThemes(securityBaseline).Should().Contain(DataProtection);
        DeclarationSignalPolicyGate.TryGetPolicyRuleId(DataProtection, securityBaseline).Should().Be("sec-base-006");

        foreach (string contentFile in new[]
                 {
                     "aks-production-baseline.json",
                     "eks-production-baseline.json",
                     "gke-production-baseline.json",
                 })
        {
            IReadOnlySet<string> active = await ResolveShippedAsync(contentFile);

            EnabledThemes(active).Should().Contain(
                WorkloadIsolation,
                $"{contentFile} ships a P0 API-server reachability control");
        }
    }

    [Fact]
    public async Task Soc2_and_cis_azure_move_different_declaration_rows_once_the_floor_admits_their_controls()
    {
        IReadOnlySet<string> soc2 = await ResolveAtFloorAsync("soc2-tsc-architecture.json", PolicyPackRulePriority.P1);
        IReadOnlySet<string> cisAzure =
            await ResolveAtFloorAsync("cis-azure-foundations.json", PolicyPackRulePriority.P1);

        IReadOnlyList<string> soc2Themes = EnabledThemes(soc2);
        IReadOnlyList<string> cisThemes = EnabledThemes(cisAzure);

        soc2Themes.Should().BeEquivalentTo([Encryption, TransportSecurity]);
        cisThemes.Should().BeEquivalentTo([DataProtection]);

        // The buyer-visible delta: same architecture, different assigned pack, different declaration rows + citations.
        DeclarationSignalPolicyGate.TryGetPolicyRuleId(TransportSecurity, soc2).Should().Be("soc2-004");
        DeclarationSignalPolicyGate.TryGetPolicyRuleId(DataProtection, cisAzure).Should().Be("cis-az-006");
    }

    [Fact]
    public async Task Frameworks_whose_p0_tier_is_identity_only_stay_silent_at_the_pilot_floor()
    {
        // Honest silence, not a bug: these packs' P0 controls are identity/administrative (CIS Azure P0 is
        // cis-az-001..005 — MFA, guest users, Conditional Access, consent), which the declaration classifier
        // does not evaluate. Mapping them would emit a false PolicyRuleId attribution.
        foreach (string contentFile in new[]
                 {
                     "cis-azure-foundations.json",
                     "hipaa-architecture.json",
                     "iso27001-architecture.json",
                     "zero-trust-architecture.json",
                 })
        {
            IReadOnlySet<string> active = await ResolveShippedAsync(contentFile);

            DeclarationSignalPolicyKeyMap.TenantUsesDeclarationVocabulary(active).Should().BeTrue(
                $"{contentFile} still speaks declaration vocabulary through its prefix family");
            EnabledThemes(active).Should().BeEmpty($"{contentFile} has no declaration-governing P0 control");
        }
    }

    [Fact]
    public async Task Non_declaration_pack_keeps_fail_open_semantics()
    {
        IReadOnlySet<string> active = await ResolveShippedAsync("cost-optimization.json");

        active.Should().NotBeEmpty();
        DeclarationSignalPolicyKeyMap.TenantUsesDeclarationVocabulary(active).Should().BeFalse(
            "cost-opt ids are outside the declaration prefix family");

        // Documented semantics: a pack that says nothing about declarations must not suppress security signal.
        EnabledThemes(active).Should().BeEquivalentTo(AllThemes);
    }

    [Fact]
    public void Unassigned_or_empty_governance_still_fails_closed()
    {
        HashSet<string> empty = new(StringComparer.OrdinalIgnoreCase);

        foreach (string theme in AllThemes)
            DeclarationSignalPolicyGate.ShouldEmitTheme(theme, empty).Should().BeFalse();
    }

    private static IReadOnlyList<string> EnabledThemes(IReadOnlySet<string> activeRuleIds) =>
        AllThemes
            .Where(theme => DeclarationSignalPolicyGate.ShouldEmitTheme(theme, activeRuleIds))
            .ToList();

    /// <summary>Resolves using the pack's own <c>priorityFloor</c> (bundled packs ship <c>P0</c>).</summary>
    private static async Task<IReadOnlySet<string>> ResolveShippedAsync(string contentFile) =>
        await BundledPolicyPackTestCatalog.ResolveActiveRuleIdsAsync(
            BundledPolicyPackTestCatalog.ReadContent(contentFile),
            CancellationToken.None);

    private static async Task<IReadOnlySet<string>> ResolveAtFloorAsync(string contentFile, string priorityFloor)
    {
        PolicyPackContentDocument content = BundledPolicyPackTestCatalog.ReadContent(contentFile);

        return await BundledPolicyPackTestCatalog.ResolveActiveRuleIdsAsync(
            BundledPolicyPackTestCatalog.WithPriorityFloor(content, priorityFloor),
            CancellationToken.None);
    }
}
