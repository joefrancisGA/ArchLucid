using ArchLucid.Core.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Governance;

public sealed partial class ArchitectureRiskRegisterReader
{
    private static IReadOnlyList<ArchitectureRiskRegisterEntry> ProjectListRows(IEnumerable<RiskRegisterRow> rows)
    {
        DateTimeOffset now = TimeProvider.System.UtcNowDateTime();
        List<ArchitectureRiskRegisterEntry> result = [];

        foreach (RiskRegisterRow row in rows)
        {
            FindingDisposition? disposition = ParseDisposition(row.Disposition);
            DateTimeOffset created = new DateTimeOffset(DateTime.SpecifyKind(row.CreatedUtc, DateTimeKind.Utc));
            int agingDays = Math.Max(0, (int)(now - created).TotalDays);
            DateTimeOffset? revisit = row.RevisitDueUtc is null
                ? null
                : new DateTimeOffset(DateTime.SpecifyKind(row.RevisitDueUtc.Value, DateTimeKind.Utc));
            DateTimeOffset? lastReviewed = row.LastReviewedUtc is null
                ? null
                : new DateTimeOffset(DateTime.SpecifyKind(row.LastReviewedUtc.Value, DateTimeKind.Utc));
            DateTimeOffset? waiverExpires = row.WaiverExpiresAtUtc is null
                ? null
                : new DateTimeOffset(DateTime.SpecifyKind(row.WaiverExpiresAtUtc.Value, DateTimeKind.Utc));

            bool isStale = ArchitectureRiskRegisterStaleEvaluator.IsStale(
                disposition,
                revisit,
                waiverExpires,
                now);

            string statusLabel = BuildStatusLabel(disposition, waiverExpires, isStale);
            string runHex = row.RunId?.ToString("N") ?? string.Empty;
            string evidenceHref = string.IsNullOrEmpty(runHex)
                ? string.Empty
                : $"/reviews/{runHex}/findings/{Uri.EscapeDataString(row.FindingId)}";

            result.Add(
                new ArchitectureRiskRegisterEntry
                {
                    FindingId = row.FindingId,
                    RunId = row.RunId,
                    ManifestId = row.ManifestId,
                    Title = row.Title,
                    Severity = row.Severity,
                    Category = row.Category,
                    StatusLabel = statusLabel,
                    OwnerUserId = row.OwnerUserId,
                    AssignedToUserId = row.AssignedToUserId,
                    LatestDisposition = disposition,
                    RevisitDueUtc = revisit,
                    RemediationDueUtc = row.RemediationDueUtc is null
                        ? null
                        : new DateTimeOffset(DateTime.SpecifyKind(row.RemediationDueUtc.Value, DateTimeKind.Utc)),
                    LastReviewedUtc = lastReviewed,
                    AgingDays = agingDays,
                    WaiverExpiresAtUtc = waiverExpires,
                    IsStale = isStale,
                    EvidenceHref = evidenceHref,
                    HumanReviewStatus = ArchitectureRiskRegisterHumanReviewLabel.ParseOrDefault(row.HumanReviewStatus),
                    ItsmLinkedTicketsSummary = row.ItsmLinkedTicketsSummary,
                    SystemName = row.SystemName,
                    ResourceId = row.ResourceId,
                });
        }

        return result;
    }

    private static FindingDisposition? ParseDisposition(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        return Enum.TryParse(raw, true, out FindingDisposition disposition) ? disposition : null;
    }

    private static string BuildStatusLabel(
        FindingDisposition? disposition,
        DateTimeOffset? waiverExpires,
        bool isStale)
    {
        if (isStale)
            return "Stale — decision needed";

        if (waiverExpires.HasValue)
            return $"Waived until {waiverExpires.Value:u}";

        if (disposition is null)
            return "Open — not dispositioned";

        return disposition.Value.ToString();
    }

    private sealed class RiskRegisterRow
    {
        public string FindingId
        {
            get;
            init;
        } = string.Empty;

        public Guid? RunId
        {
            get;
            init;
        }

        public Guid? ManifestId
        {
            get;
            init;
        }

        public string Title
        {
            get;
            init;
        } = string.Empty;

        public string Severity
        {
            get;
            init;
        } = string.Empty;

        public string Category
        {
            get;
            init;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public string? Disposition
        {
            get;
            init;
        }

        public DateTime? RevisitDueUtc
        {
            get;
            init;
        }

        public string? EvidenceRequestText
        {
            get;
            init;
        }

        public DateTime? LastReviewedUtc
        {
            get;
            init;
        }

        public string? OwnerUserId
        {
            get;
            init;
        }

        public string? AssignedToUserId
        {
            get;
            init;
        }

        public DateTime? RemediationDueUtc
        {
            get;
            init;
        }

        public DateTime? WaiverExpiresAtUtc
        {
            get;
            init;
        }

        public string? HumanReviewStatus
        {
            get;
            init;
        }

        public string? ItsmLinkedTicketsSummary
        {
            get;
            init;
        }

        public string? SystemName
        {
            get;
            init;
        }

        public string? ResourceId
        {
            get;
            init;
        }
    }
}
