namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional per-<see cref="ArchLucid.Contracts.Common.AgentType" /> overrides for <see cref="AgentOutputQualityGateOptions" />
///     warn/reject floors. Null properties fall back to the gate&apos;s global values.
/// </summary>
public sealed class AgentTypeQualityFloors
{
    /// <summary>When set, overrides <see cref="AgentOutputQualityGateOptions.StructuralWarnBelow" />.</summary>
    public double? StructuralWarnBelow
    {
        get;
        set;
    }

    /// <summary>When set, overrides <see cref="AgentOutputQualityGateOptions.StructuralRejectBelow" />.</summary>
    public double? StructuralRejectBelow
    {
        get;
        set;
    }

    /// <summary>When set, overrides <see cref="AgentOutputQualityGateOptions.SemanticWarnBelow" />.</summary>
    public double? SemanticWarnBelow
    {
        get;
        set;
    }

    /// <summary>When set, overrides <see cref="AgentOutputQualityGateOptions.SemanticRejectBelow" />.</summary>
    public double? SemanticRejectBelow
    {
        get;
        set;
    }
}
