using System.Text.Json;

using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Tests.Governance;

/// <summary>
///     Canonical deterministic policy A/B demo fixture (synthetic — internal demo validation only).
///     Mirrors <c>tests/fixtures/policy-ab-demo/policy-ab-demo-fixture.json</c> and
///     <c>archlucid-ui/src/lib/policy-ab-demo-fixture.ts</c>; keep all three in sync.
///     The fixture proves the policy-to-decision moat deterministically: a stricter policy pack
///     (a) selects one additional compliance rule key and (b) flips the pre-commit gate from allow
///     to block on the same committed findings. It carries no buyer-facing, certification, or
///     benchmark claim.
/// </summary>
internal static class PolicyAbDemoFixture
{
    /// <summary>Demo-only label. Never a buyer-facing or production governance claim.</summary>
    internal const string DemoLabel = "policy-ab-demo (synthetic - internal demo validation only)";

    /// <summary>The single compliance rule key the stricter pack adds over the default pack.</summary>
    internal const string AddedComplianceRuleKey = "demo-ctrl-network-isolation";

    /// <summary>Compliance rule keys selected by the default (allow-path) pack.</summary>
    internal static readonly IReadOnlyList<string> DefaultComplianceRuleKeys =
    [
        "demo-ctrl-encryption-at-rest",
        "demo-ctrl-audit-logging",
    ];

    /// <summary>Compliance rule keys selected by the stricter (block-path) pack — a strict superset.</summary>
    internal static readonly IReadOnlyList<string> StrictComplianceRuleKeys =
    [
        "demo-ctrl-encryption-at-rest",
        "demo-ctrl-audit-logging",
        AddedComplianceRuleKey,
    ];

    /// <summary>
    ///     Source rule pack the governance filter narrows. Includes one rule per selectable key plus a
    ///     deliberately non-selected rule, so filtering is observable rather than a no-op.
    /// </summary>
    internal static ComplianceRulePack BuildSourceRulePack() =>
        new()
        {
            RulePackId = "policy-ab-demo-pack",
            Name = "Policy A/B demo pack (synthetic)",
            Version = "1.0.0",
            Rules =
            [
                DemoRule("demo-ctrl-encryption-at-rest"),
                DemoRule("demo-ctrl-audit-logging"),
                DemoRule(AddedComplianceRuleKey),
                DemoRule("demo-ctrl-not-selected"),
            ],
        };

    /// <summary>Default (allow-path) policy pack content document.</summary>
    internal static PolicyPackContentDocument BuildDefaultContent() =>
        BuildContent(DefaultComplianceRuleKeys);

    /// <summary>Stricter (block-path) policy pack content document.</summary>
    internal static PolicyPackContentDocument BuildStrictContent() =>
        BuildContent(StrictComplianceRuleKeys);

    /// <summary>Default pack content serialized for the governance dry-run service.</summary>
    internal static string DefaultContentJson() =>
        Serialize(BuildDefaultContent());

    /// <summary>Stricter pack content serialized for the governance dry-run service.</summary>
    internal static string StrictContentJson() =>
        Serialize(BuildStrictContent());

    private static PolicyPackContentDocument BuildContent(IReadOnlyList<string> keys)
    {
        // Caller-supplied key lists are fixture constants and never null, but guard defensively.
        ArgumentNullException.ThrowIfNull(keys);

        PolicyPackContentDocument content = new()
        {
            ComplianceRuleKeys = keys.ToList(),
        };

        content.Metadata["governance.demoFixture"] = DemoLabel;

        return content;
    }

    private static ComplianceRule DemoRule(string ruleId) =>
        new()
        {
            RuleId = ruleId,
            ControlId = ruleId,
            ControlName = ruleId,
            AppliesToCategory = "Compliance",
            RequiredNodeType = "Service",
            RequiredEdgeType = "DependsOn",
            Description = $"Demo rule {ruleId} (synthetic).",
        };

    private static string Serialize(PolicyPackContentDocument content) =>
        JsonSerializer.Serialize(content);
}
