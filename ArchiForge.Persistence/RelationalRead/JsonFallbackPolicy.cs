using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchiForge.Persistence.RelationalRead;

/// <summary>
/// Centralizes the decision to allow, warn on, or reject JSON-column fallback reads
/// when relational child tables are empty.
/// </summary>
/// <remarks>
/// <para><b>Default:</b> <see cref="PersistenceReadMode.AllowJsonFallback"/> — preserves legacy
/// behavior. All persistence code that branches on "relational rows vs JSON column" must route
/// through <see cref="EvaluateFallback"/> so the mode decision is in one place.</para>
/// <para>Wire as singleton in DI; the backfill tooling and repositories share one instance.</para>
/// </remarks>
public sealed class JsonFallbackPolicy
{
    private readonly ILogger _logger;

    public JsonFallbackPolicy()
        : this(PersistenceReadMode.AllowJsonFallback, NullLogger.Instance)
    {
    }

    public JsonFallbackPolicy(PersistenceReadMode mode, ILogger logger)
    {
        Mode = mode;
        _logger = logger ?? NullLogger.Instance;
    }

    public PersistenceReadMode Mode { get; }

    /// <summary>
    /// Backward-compatible property; <c>true</c> when mode is not <see cref="PersistenceReadMode.RequireRelational"/>.
    /// </summary>
    public bool AllowFallback => Mode != PersistenceReadMode.RequireRelational;

    /// <summary>
    /// Evaluates whether the caller should fall back to the JSON column.
    /// </summary>
    /// <param name="relationalRowCount">Rows found in the relational child table.</param>
    /// <param name="sliceName">Diagnostic label (e.g. "ContextSnapshot.CanonicalObjects").</param>
    /// <param name="entityType">Entity type for diagnostics (e.g. "ContextSnapshot").</param>
    /// <param name="entityId">Entity identifier for diagnostics.</param>
    /// <returns><c>true</c> when the caller should load from JSON.</returns>
    /// <exception cref="RelationalDataMissingException">
    /// Thrown when <see cref="Mode"/> is <see cref="PersistenceReadMode.RequireRelational"/>
    /// and <paramref name="relationalRowCount"/> is zero.
    /// </exception>
    public bool EvaluateFallback(int relationalRowCount, string sliceName, string entityType = "", string entityId = "")
    {
        if (relationalRowCount > 0)
            return false;

        switch (Mode)
        {
            case PersistenceReadMode.AllowJsonFallback:
                return true;

            case PersistenceReadMode.WarnOnJsonFallback:
                _logger.LogWarning(
                    "JSON fallback used for {SliceName} (entity {EntityType} '{EntityId}'). " +
                    "Run SqlRelationalBackfillService to populate relational child tables.",
                    sliceName, entityType, entityId);
                return true;

            case PersistenceReadMode.RequireRelational:
                throw new RelationalDataMissingException(entityType, entityId, sliceName);

            default:
                return true;
        }
    }

    /// <summary>
    /// Simplified overload without entity context; kept for callers that only have a slice name.
    /// </summary>
    public bool ShouldFallbackToJson(int relationalRowCount, string sliceName)
    {
        return EvaluateFallback(relationalRowCount, sliceName);
    }
}
