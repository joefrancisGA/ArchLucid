namespace ArchLucid.Persistence.Coordination.Projection;

/// <summary>Discriminator values for <c>dbo.PostCommitProjectionOutbox.WorkType</c> (TB-309).</summary>
public static class PostCommitProjectionWorkTypes
{
    public const string ProvenanceSnapshotMaterialization = "ProvenanceSnapshotMaterialization";

    public const string ReviewCompletedEvent = "ReviewCompletedEvent";

    public const string SampleRunPurgeForTenant = "SampleRunPurgeForTenant";

    public const string FindingPriorityRerank = "FindingPriorityRerank";

    public const string IacStubGeneration = "IacStubGeneration";

    public const string DecisionEngineV2NodeMaterialization = "DecisionEngineV2NodeMaterialization";
}
