namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

/// <summary>Archived successful graph output for observation, never an active checkpoint or lease.</summary>
public sealed record AuthorityGraphCheckpointPredecessor(
    string InputVersion, long Fence, int Attempts, string ResultReference, DateTime SupersededUtc);
