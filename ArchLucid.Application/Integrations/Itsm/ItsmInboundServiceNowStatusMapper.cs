using System.Globalization;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Integrations.Itsm;

/// <inheritdoc cref="IItsmInboundStatusMapper" />
public sealed class ItsmInboundServiceNowStatusMapper : IItsmInboundStatusMapper
{
    /// <inheritdoc />
    public (string humanReview, bool mapped) MapToHumanReview(string statusValue, IntegrationsItsmInboundOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        string trimmed = statusValue.Trim();

        if (trimmed.Length is 0)

            return (string.Empty, false);

        if (ItsmInboundHumanReviewMapHelper.TryConfiguredHumanReview(options.ServiceNowStateHumanReviewMap, trimmed, out string? configured, out bool invalidConfiguredValue))
            return (configured!, true);

        if (invalidConfiguredValue)
            return (string.Empty, false);

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out int state) &&
            (state is 6 or 7))

            return (nameof(FindingHumanReviewStatus.Approved), true);

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out int openish) &&
            openish is 1 or 2 or 3)

            return (nameof(FindingHumanReviewStatus.Pending), true);

        if (trimmed.Equals("resolved", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("closed", StringComparison.OrdinalIgnoreCase))

            return (nameof(FindingHumanReviewStatus.Approved), true);

        if (trimmed.Equals("new", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("in progress", StringComparison.OrdinalIgnoreCase))

            return (nameof(FindingHumanReviewStatus.Pending), true);

        return (string.Empty, false);
    }

    /// <inheritdoc />
    public FindingDisposition? TryMapToDisposition(string statusValue, IntegrationsItsmInboundOptions options) =>
        ItsmInboundExternalStatusMapper.TryMapServiceNowStateToDisposition(statusValue, options);
}
