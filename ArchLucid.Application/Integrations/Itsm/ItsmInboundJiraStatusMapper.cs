using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Integrations.Itsm;

/// <inheritdoc cref="IItsmInboundStatusMapper" />
public sealed class ItsmInboundJiraStatusMapper : IItsmInboundStatusMapper
{
    /// <inheritdoc />
    public (string humanReview, bool mapped) MapToHumanReview(string statusValue, IntegrationsItsmInboundOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        string s = statusValue.Trim();

        if (s.Length is 0)

            return (string.Empty, false);

        if (ItsmInboundHumanReviewMapHelper.TryConfiguredHumanReview(options.JiraStatusHumanReviewMap, s, out string? configured, out bool invalidConfiguredValue))
            return (configured!, true);

        if (invalidConfiguredValue)
            return (string.Empty, false);

        if (s.Equals("Done", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Closed", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Resolved", StringComparison.OrdinalIgnoreCase))

            return (nameof(FindingHumanReviewStatus.Approved), true);

        if (s.Equals("To Do", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Open", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("In Progress", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("In Development", StringComparison.OrdinalIgnoreCase))

            return (nameof(FindingHumanReviewStatus.Pending), true);

        return (string.Empty, false);
    }

    /// <inheritdoc />
    public FindingDisposition? TryMapToDisposition(string statusValue, IntegrationsItsmInboundOptions options) =>
        ItsmInboundExternalStatusMapper.TryMapJiraStatusToDisposition(statusValue, options);
}
