namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Lifecycle for operator-reviewed inferred connection proposals (SN-RT-10).
/// </summary>
public enum OperatorInferredConnectionStatus
{
    Proposed = 0,
    Confirmed = 1,
    Dismissed = 2,
}
