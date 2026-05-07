namespace ArchLucid.Persistence.Caching;

/// <summary>
///     Wire-friendly payload for HybridCache serialization of hot-path entities. Negative cache uses
///     <see cref="HasValue" /> <see langword="false" />.
/// </summary>
public sealed record HotPathWireEnvelope(bool HasValue, byte[]? Payload);
