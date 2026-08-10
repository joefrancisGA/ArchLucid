namespace ArchLucid.ReviewApiHarness;

/// <summary>DevelopmentBypass / ApiKey test-actor headers for governance segregation of duties.</summary>
public static class HarnessActorHeaders
{
    public const string ActorNameHeader = "X-ArchLucid-Test-Actor-Name";

    public const string ActorIdHeader = "X-ArchLucid-Test-Actor-Id";

    public static IReadOnlyDictionary<string, string> Create(string actorName, string actorId)
    {
        if (string.IsNullOrWhiteSpace(actorName))
            throw new ArgumentException("Actor name is required.", nameof(actorName));

        if (string.IsNullOrWhiteSpace(actorId))
            throw new ArgumentException("Actor id is required.", nameof(actorId));

        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [ActorNameHeader] = actorName.Trim(),
            [ActorIdHeader] = actorId.Trim()
        };
    }
}
