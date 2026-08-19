using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Exports;

/// <summary>Origin surface for an ADR 0052 decision receipt export.</summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DecisionReceiptSource
{
    /// <summary>Admission redirect on a Socratic intake draft.</summary>
    DraftAdmission,

    /// <summary>Committed authority run with an infeasible manifest verdict.</summary>
    CommittedRun,
}
