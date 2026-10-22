namespace ArchLucid.Contracts.Findings;

/// <summary>
///     How two findings from different committed runs were correlated per ADR 0063.
/// </summary>
public enum FindingCorrelationMethod
{
    /// <summary>No correlation could be established.</summary>
    None = 0,

    /// <summary>Both sides expose the same policy rule id and normalized finding fingerprint.</summary>
    PolicyRuleAndFingerprint = 1,

    /// <summary>
    ///     Category and normalized message align without a shared policy rule fingerprint — possible match only.
    /// </summary>
    MessageCategoryFuzzy = 2,
}
