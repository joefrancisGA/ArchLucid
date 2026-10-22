using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Applies Quick start L0 MUST projection before run persistence (TB-2283).
/// </summary>
public static class QuickStartIntakeRequestEnricher
{
    /// <summary>
    ///     True when the request originated from the Quick start wizard tab.
    /// </summary>
    public static bool RequiresL0MustSet(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return string.Equals(request.RequestSource?.Trim(), "wizard", StringComparison.OrdinalIgnoreCase)
               && string.Equals(
                   request.WizardPresetUsed?.Trim(),
                   QuickStartWizardPresetValues.QuickReview,
                   StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Projects intake answers onto architecture request fields when the Quick start gate applies.
    /// </summary>
    public static void EnrichIfQuickStart(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!RequiresL0MustSet(request))
            return;

        UniversalIntakeAnswerProjector.ApplyToRequest(request);
    }
}
