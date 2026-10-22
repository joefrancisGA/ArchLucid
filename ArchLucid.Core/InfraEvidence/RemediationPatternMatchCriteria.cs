using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>Structured match fields consumed by IE-11 deterministic matcher.</summary>
public sealed class RemediationPatternMatchCriteria
{
    public CloudProvider? Provider
    {
        get;
        init;
    }

    public string? ResourceType
    {
        get;
        init;
    }

    public string? ControlId
    {
        get;
        init;
    }

    public string? SeverityMin
    {
        get;
        init;
    }

    public Dictionary<string, string> PropertyEquals
    {
        get;
        init;
    } = new(StringComparer.Ordinal);
}
