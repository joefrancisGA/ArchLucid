namespace ArchLucid.Core.Configuration;

/// <summary>Feature flag for incremental re-review after post-execute evidence uploads.</summary>
public sealed class IncrementalReReviewOnEvidenceAddedOptions
{
    public const string SectionName = "ArchLucid:IncrementalReReview:OnEvidenceAdded";

    public bool Enabled
    {
        get;
        set;
    } = true;
}
