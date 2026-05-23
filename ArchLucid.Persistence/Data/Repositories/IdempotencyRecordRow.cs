namespace ArchLucid.Persistence.Data.Repositories;

public sealed class IdempotencyRecordRow
{
    public required string IdempotencyKey { get; init; }

    public required Guid TenantId { get; init; }

    public required int StatusCode { get; init; }

    public required string ResponseBody { get; init; }

    public required DateTime CreatedUtc { get; init; }
}
