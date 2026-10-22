namespace ArchLucid.Core.Requests;

/// <summary>
///     Confirmed brief constraints/capabilities that grounded proposal and recommendation filters must honor.
/// </summary>
public readonly record struct ArchitectureRequestBriefGroundingRules(
    bool RequiresHttps,
    bool RequiresPrivateNetworking,
    bool RequiresEncryptionAtRest)
{
    public bool HasAnyRules =>
        RequiresHttps || RequiresPrivateNetworking || RequiresEncryptionAtRest;

    public static ArchitectureRequestBriefGroundingRules FromConfirmedBriefEntries(
        IEnumerable<string> confirmedConstraints,
        IEnumerable<string> confirmedCapabilities)
    {
        ArgumentNullException.ThrowIfNull(confirmedConstraints);
        ArgumentNullException.ThrowIfNull(confirmedCapabilities);

        return new ArchitectureRequestBriefGroundingRules(
            confirmedConstraints.Any(ControlPhraseMatcher.ConstraintRequiresHttps),
            confirmedConstraints.Any(ControlPhraseMatcher.ConstraintRequiresPrivateNetworking),
            confirmedCapabilities.Any(ControlPhraseMatcher.CapabilityRequiresEncryptionAtRest));
    }
}
