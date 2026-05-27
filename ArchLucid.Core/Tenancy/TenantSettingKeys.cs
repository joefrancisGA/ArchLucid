namespace ArchLucid.Core.Tenancy;

/// <summary>Well-known <c>dbo.TenantSettings.SettingKey</c> values.</summary>
public static class TenantSettingKeys
{
    /// <summary>Tenant override for <c>ArchLucid:AgentOutput:QualityGate:Mode</c> (<c>WarnOnly</c> or <c>PilotStrict</c>).</summary>
    public const string AgentOutputQualityGateMode = "AgentOutput.QualityGate.Mode";

    /// <summary>JSON blob for operator-entered realized-value attestation (item 20 hybrid model).</summary>
    public const string RealizedValueAttestation = "RealizedValue.Attestation";
}
