using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Findings.PortfolioRecurrence;

public sealed class RecurrenceAccumulator(Finding representativeFinding)
{
    public Finding RepresentativeFinding { get; } = representativeFinding;

    public HashSet<string> SystemNames { get; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed class RecurrenceMatchResult
{
    public required Dictionary<string, RecurrenceAccumulator> RecurrenceByIdentity { get; init; }

    public required Dictionary<string, HashSet<string>> IdentitiesBySystem { get; init; }

    public required int ScannedSystemCount { get; init; }
}
