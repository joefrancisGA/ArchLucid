using ArchLucid.Contracts.Compliance;

namespace ArchLucid.Decisioning.Compliance.Models;

/// <summary>Compatibility shim; canonical model is <see cref="ArchLucid.Contracts.Compliance.ComplianceRulePack" />.</summary>
public sealed class ComplianceRulePack
{
    public string RulePackId
    {
        get;
        set;
    } = null!;

    public string Name
    {
        get;
        set;
    } = null!;

    public string Version
    {
        get;
        set;
    } = null!;

    public string RulePackHash
    {
        get;
        set;
    } = null!;

    public string SourcePath
    {
        get;
        set;
    } = null!;

    public List<ComplianceRule> Rules
    {
        get;
        set;
    } = [];

    public static explicit operator ArchLucid.Contracts.Compliance.ComplianceRulePack(ComplianceRulePack source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new ArchLucid.Contracts.Compliance.ComplianceRulePack
        {
            RulePackId = source.RulePackId,
            Name = source.Name,
            Version = source.Version,
            RulePackHash = source.RulePackHash,
            SourcePath = source.SourcePath,
            Rules = source.Rules.Select(
                    rule => new ArchLucid.Contracts.Compliance.ComplianceRule
                    {
                        RuleId = rule.RuleId,
                        ControlId = rule.ControlId,
                        ControlName = rule.ControlName,
                        AppliesToCategory = rule.AppliesToCategory,
                        RequiredNodeType = rule.RequiredNodeType,
                        RequiredEdgeType = rule.RequiredEdgeType,
                        Severity = rule.Severity,
                        Priority = rule.Priority,
                        Description = rule.Description,
                    })
                .ToList(),
        };
    }

    public static explicit operator ComplianceRulePack(ArchLucid.Contracts.Compliance.ComplianceRulePack source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new ComplianceRulePack
        {
            RulePackId = source.RulePackId,
            Name = source.Name,
            Version = source.Version,
            RulePackHash = source.RulePackHash,
            SourcePath = source.SourcePath,
            Rules = source.Rules.Select(
                    rule => new ComplianceRule
                    {
                        RuleId = rule.RuleId,
                        ControlId = rule.ControlId,
                        ControlName = rule.ControlName,
                        AppliesToCategory = rule.AppliesToCategory,
                        RequiredNodeType = rule.RequiredNodeType,
                        RequiredEdgeType = rule.RequiredEdgeType,
                        Severity = rule.Severity,
                        Priority = rule.Priority,
                        Description = rule.Description,
                    })
                .ToList(),
        };
    }
}
