namespace ArchLucid.Core.Tenancy;

/// <summary>Well-known <c>dbo.TenantSettings.SettingKey</c> values.</summary>
public static class TenantSettingKeys
{
    /// <summary>Tenant override for <c>ArchLucid:AgentOutput:QualityGate:Mode</c> (<c>WarnOnly</c> or <c>PilotStrict</c>).</summary>
    public const string AgentOutputQualityGateMode = "AgentOutput.QualityGate.Mode";
}
