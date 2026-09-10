namespace ArchLucid.Contracts.Risk;

/// <summary>Ordering input: consequence leads; reversibility is the tiebreaker (analyzer §1.2).</summary>
public enum ReversibilityClass
{
    Reversible = 0,
    Costly = 1,
    OneWayDoor = 2,
}
