namespace ArchLucid.Core.Tenancy;

/// <summary>Well-known <c>dbo.TenantSettings.SettingKey</c> values.</summary>
public static class TenantSettingKeys
{
    /// <summary>Tenant override for <c>ArchLucid:AgentOutput:QualityGate:Mode</c> (<c>WarnOnly</c> or <c>PilotStrict</c>).</summary>
    public const string AgentOutputQualityGateMode = "AgentOutput.QualityGate.Mode";

    /// <summary>JSON blob for operator-entered realized-value attestation (item 20 hybrid model).</summary>
    public const string RealizedValueAttestation = "RealizedValue.Attestation";

    /// <summary>
    ///     Tenant opt-in for manifest-derived fine-tuning export (<c>Disabled</c>, <c>Enabled</c>, <c>Withdrawn</c>).
    /// </summary>
    public const string FineTuningManifestConsent = "FineTuning.ManifestConsent";

    /// <summary>Workspace-owner-selected completed review opened from the operator home explore path.</summary>
    public const string FeaturedCompletedSampleRunId = "Homepage.FeaturedCompletedSampleRunId";

    /// <summary>Workspace default governed model execution profile (<c>Economy</c>, <c>Balanced</c>, <c>HighAssurance</c>).</summary>
    public const string DefaultModelExecutionProfile = "ModelGovernance.DefaultExecutionProfile";

    /// <summary>JSON allowed engine alias ids + default alias id for per-review selection (TB-2110).</summary>
    public const string WorkspaceAllowedEngineAliases = "ModelGovernance.AllowedEngineAliases";

    /// <summary>Workspace-admin acknowledgment before external-subprocessor engine use (TB-2109).</summary>
    public const string ExternalSubprocessorEngineAcknowledged = "ModelGovernance.ExternalSubprocessorEngineAcknowledged";
}
