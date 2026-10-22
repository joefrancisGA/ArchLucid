namespace ArchLucid.Contracts.Risk;

using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

/// <summary>
/// Conflicting = sacrifice contradicts a stated requirement (the headline conflict).
/// Unacknowledged = real sacrifice with no intake answer accepting it (unvalidated assumption).
/// Acknowledged = matches an intake answer (articulated bet, not flagged).
/// </summary>
[JsonConverter(typeof(DefinedEnumJsonConverter<TradeoffStatus>))]
public enum TradeoffStatus
{
    Acknowledged = 0,
    Unacknowledged = 1,
    Conflicting = 2,
}
