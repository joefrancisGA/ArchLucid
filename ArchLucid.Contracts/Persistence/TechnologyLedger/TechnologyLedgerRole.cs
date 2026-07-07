namespace ArchLucid.Contracts.Persistence.TechnologyLedger;

/// <summary>
///     Identifies the architectural role a <see cref="TechnologyLedgerEntry" /> fills for an architecture run.
///     A second <see cref="Chosen" />-status entry for the same run and role with a different
///     <see cref="TechnologyLedgerEntry.ProviderFamily" /> is a technology consistency violation.
/// </summary>
public enum TechnologyLedgerRole
{
    /// <summary>The overall target cloud platform for the run (or <c>None</c> for a cloud-neutral posture).</summary>
    CloudPlatform = 0,

    /// <summary>The identity/authentication provider relied on by the architecture (e.g. Entra ID, IAM, Cognito).</summary>
    IdentityProvider = 1,

    /// <summary>The system's primary relational or document datastore.</summary>
    PrimaryDatastore = 2,

    /// <summary>The primary messaging/eventing broker (queue, topic, or event bus).</summary>
    Messaging = 3,

    /// <summary>The primary compute runtime hosting the workload (e.g. container platform, serverless, VM).</summary>
    ComputeRuntime = 4,

    /// <summary>The target deployment region.</summary>
    Region = 5,

    /// <summary>The infrastructure-as-code target/tooling used to provision the architecture.</summary>
    IacTarget = 6,

    /// <summary>Any technology choice that does not map to one of the other named roles.</summary>
    Other = 7,
}
