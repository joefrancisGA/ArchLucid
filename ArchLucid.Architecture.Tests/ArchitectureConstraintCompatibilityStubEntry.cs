namespace ArchLucid.Architecture.Tests;

/// <summary>
/// One documented compatibility stub in <c>ArchLucid.Decisioning</c> that forwards to a canonical Core port.
/// </summary>
internal sealed class ArchitectureConstraintCompatibilityStubEntry
{
    public ArchitectureConstraintCompatibilityStubEntry(
        string relativeSourcePath,
        string stubInterfaceName,
        string canonicalTypeFullName,
        string removalCriteria,
        bool allowsLegacyTypeBridge = false)
    {
        RelativeSourcePath = relativeSourcePath;
        StubInterfaceName = stubInterfaceName;
        CanonicalTypeFullName = canonicalTypeFullName;
        RemovalCriteria = removalCriteria;
        AllowsLegacyTypeBridge = allowsLegacyTypeBridge;
    }

    /// <summary>Repo-relative path to the stub source file.</summary>
    public string RelativeSourcePath { get; }

    /// <summary>Decisioning-side interface name (e.g. <c>IAlertService</c>).</summary>
    public string StubInterfaceName { get; }

    /// <summary>Canonical port type the stub must inherit (Core or Contracts).</summary>
    public string CanonicalTypeFullName { get; }

    /// <summary>When the stub may be deleted without breaking public contracts.</summary>
    public string RemovalCriteria { get; }

    /// <summary>
    /// When true, the stub may expose Decisioning-specific member signatures that bridge to the canonical port
    /// (explicit interface implementation). Only allowlisted bridging stubs may declare extra members.
    /// </summary>
    public bool AllowsLegacyTypeBridge { get; }
}
