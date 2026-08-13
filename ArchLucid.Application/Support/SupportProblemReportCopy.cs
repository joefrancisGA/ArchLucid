namespace ArchLucid.Application.Support;

/// <summary>
///     Canonical Report Problem acknowledgement copy (TB-789). Keep aligned with
///     <c>archlucid-ui/src/lib/report-problem-copy.ts</c>.
/// </summary>
public static class SupportProblemReportCopy
{
    public const string SlaMessage = "We'll respond by the next business day.";

    private const string AcknowledgementTemplate =
        "We received your report (reference {0}). We'll respond by the next business day.";

    public const string WhatToExpectMessage =
        "ArchLucid support will follow up by email. Keep your report reference handy if you contact us again.";

    public const string SettingsSupportPath = "/administration/support";

    public static string FormatAcknowledgement(string referenceId)
    {
        string id = referenceId.Trim();

        if (id.Length == 0)
        {
            id = "—";
        }

        return string.Format(AcknowledgementTemplate, id);
    }
}
