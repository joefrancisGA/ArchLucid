namespace ArchLucid.Api.Tests;

/// <summary>
///     SQL integration factory with TB-1228 opt-in unsupported semantic finalize hold enabled for parity proofs.
/// </summary>
public sealed class FinalizeConflictSqlIntegrationApiFactory : ArchLucidApiFactory
{
    /// <inheritdoc />
    protected override void ApplySqlCatalogCustomSettings(Dictionary<string, string?> settings)
    {
        base.ApplySqlCatalogCustomSettings(settings);
        settings["ArchLucid:AgentOutput:QualityGate:PilotStrictHoldOnUnsupportedSemanticSupport"] = "true";
    }
}
