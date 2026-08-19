using System.Text;

using ArchLucid.Decisioning.Compliance.Models;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.CuratedRules;

/// <summary>
///     Maps sample curated-rule entries to <see cref="ComplianceRule" /> for the compliance finding engine.
/// </summary>
/// <remarks>
///     <para><see cref="ComplianceRule.ControlId"/> defaults to the curated rule <c>id</c> (stable string key).</para>
///     <para>
///         <see cref="ComplianceRule.AppliesToCategory"/> is fixed to <c>TenantCurated</c> so downstream diagnostics can
///         distinguish authored rows from file-pack catalog rules.
///     </para>
///     <para>
///         <see cref="ComplianceRule.RequiredNodeType"/> and <see cref="ComplianceRule.RequiredEdgeType"/> default to
///         empty strings — the file-pack catalog uses these for structural checks; tenant prose rules typically do not.
///     </para>
///     <para>
///         Extended fields (<c>remediationGuidance</c>, <c>evidenceHints</c>, <c>frameworkMappings</c>) are appended to
///         <see cref="ComplianceRule.Description"/> because <see cref="ComplianceRule"/> has no extension bag today.
///     </para>
/// </remarks>
internal static class CuratedComplianceRuleMapper
{
    internal const string TenantCuratedCategory = "TenantCurated";

    /// <summary>Maps one curated JSON rule when <paramref name="entry" /> has a non-empty <c>id</c>; otherwise <c>null</c>.</summary>
    public static ComplianceRule? TryMapToComplianceRule(CuratedRulesRuleEntry entry)
    {
        if (entry is null) throw new ArgumentNullException(nameof(entry));
        if (string.IsNullOrWhiteSpace(entry.Id))
            return null;

        string ruleId = entry.Id.Trim();
        string title = string.IsNullOrWhiteSpace(entry.Title) ? ruleId : entry.Title.Trim();
        string descriptionBase = entry.Description?.Trim() ?? string.Empty;
        string severity = string.IsNullOrWhiteSpace(entry.Severity) ? "Medium" : entry.Severity.Trim();
        string priority = string.IsNullOrWhiteSpace(entry.Priority)
            ? PolicyPackRulePriority.Default
            : PolicyPackPriorityFloor.NormalizeTier(entry.Priority);
        StringBuilder description = new(descriptionBase);

        if (!string.IsNullOrWhiteSpace(entry.RemediationGuidance))
        {
            description.Append("\n\nRemediation: ");
            description.Append(entry.RemediationGuidance.Trim());
        }

        if (entry.EvidenceHints is { Count: > 0 } hints)
        {
            description.Append("\n\nEvidence hints:");
            foreach (string hint in hints.Where(s => !string.IsNullOrWhiteSpace(s)))
            {
                description.Append("\n- ");
                description.Append(hint.Trim());
            }
        }

        if (entry.FrameworkMappings is { Count: > 0 } maps)
        {
            description.Append("\n\nFramework mappings:");
            foreach (CuratedRulesFrameworkMappingEntry m in maps)
            {
                if (m is null || string.IsNullOrWhiteSpace(m.Framework))
                    continue;
                description.Append("\n- ");
                description.Append(m.Framework.Trim());
                if (!string.IsNullOrWhiteSpace(m.Control))
                {
                    description.Append(" — control: ");
                    description.Append(m.Control.Trim());
                }

                if (!string.IsNullOrWhiteSpace(m.Requirement))
                {
                    description.Append(" — requirement: ");
                    description.Append(m.Requirement.Trim());
                }
            }
        }

        return new ComplianceRule
        {
            RuleId = ruleId,
            ControlId = ruleId,
            ControlName = title,
            AppliesToCategory = TenantCuratedCategory,
            RequiredNodeType = string.Empty,
            RequiredEdgeType = string.Empty,
            Severity = severity,
            Priority = priority,
            Description = description.ToString(),
        };
    }
}
