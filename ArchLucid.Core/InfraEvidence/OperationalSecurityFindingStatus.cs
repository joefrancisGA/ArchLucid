namespace ArchLucid.Core.InfraEvidence;

/// <summary>Lifecycle status for an operational security finding (third finding stream).</summary>
public enum OperationalSecurityFindingStatus
{
    Open = 0,
    Recurred = 1,
    Closed = 2,
    Exception = 3,
    AwaitingVerification = 4,
}
