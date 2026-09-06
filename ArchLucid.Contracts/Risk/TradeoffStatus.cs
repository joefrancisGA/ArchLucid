namespace ArchLucid.Contracts.Risk;

/// <summary>
/// Conflicting = sacrifice contradicts a stated requirement (the headline conflict).
/// Unacknowledged = real sacrifice with no intake answer accepting it (unvalidated assumption).
/// Acknowledged = matches an intake answer (articulated bet, not flagged).
/// </summary>
public enum TradeoffStatus
{
    Acknowledged = 0,
    Unacknowledged = 1,
    Conflicting = 2,
}
