namespace ArchLucid.Application.Runs;
/// <summary>
///     Optional HTTP idempotency for create-run (via
///     <see cref = "Orchestration.IArchitectureRunCreateOrchestrator.CreateRunAsync"/>; scope + hashed key + request
///     fingerprint).
/// </summary>
public sealed record CreateRunIdempotencyState(Guid TenantId, Guid WorkspaceId, Guid ProjectId, byte[] IdempotencyKeyHash, byte[] RequestFingerprint)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(IdempotencyKeyHash, RequestFingerprint);
    private static byte __ValidatePrimaryConstructorArguments(System.Byte[] idempotencyKeyHash, System.Byte[] requestFingerprint)
    {
        ArgumentNullException.ThrowIfNull(idempotencyKeyHash);
        ArgumentNullException.ThrowIfNull(requestFingerprint);
        return (byte)0;
    }
}