using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     TB-2053 — keep rollup/compare <see cref="AgentResult" /> rows free of forensic / topology LOB fields.
/// </summary>
internal static class AgentResultRollupProjection
{
    internal static AgentResult StripHeavyFields(AgentResult source)
    {
        ArgumentNullException.ThrowIfNull(source);

        source.ReasoningTrace = null;
        source.Citations = null;
        source.RetrievalGroundingTrace = null;
        source.ChecklistCoverage = [];
        source.InsightDensityCuration = null;
        source.DegradationReasonCode = null;

        if (source.ProposedChanges is not null)
        {
            source.ProposedChanges.AddedServices = [];
            source.ProposedChanges.AddedDatastores = [];
            source.ProposedChanges.AddedRelationships = [];
        }

        foreach (ArchitectureFinding finding in source.Findings)
        {
            finding.ReasoningTrace = null;
            finding.IacStub = null;
            finding.WhyThisIsNotGeneric = null;
            finding.PrincipalArchitectValue = null;
            finding.DecisionConsequence = null;
            finding.MuteReason = null;
            finding.TrustLabel = null;
            finding.TrustLabelReason = null;
        }

        return source;
    }
}
