using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class AuditEvidenceFreshnessClassifierTests
{
    [Fact]
    public void Classify_missing_timestamp_returns_unknown()
    {
        AuditEvidenceFreshnessPolicy policy = AuditEvidenceFreshnessParser.Parse("30d");
        DateTime referenceUtc = new(2026, 9, 5, 0, 0, 0, DateTimeKind.Utc);

        AuditEvidenceFreshnessStatus status =
            AuditEvidenceFreshnessClassifier.Classify(null, referenceUtc, policy);

        status.Should().Be(AuditEvidenceFreshnessStatus.Unknown);
    }

    [Fact]
    public void Classify_recent_evidence_is_current_or_fresh()
    {
        AuditEvidenceFreshnessPolicy policy = AuditEvidenceFreshnessParser.Parse("30d");
        DateTime referenceUtc = new(2026, 9, 5, 0, 0, 0, DateTimeKind.Utc);
        DateTime collectedUtc = referenceUtc.AddHours(-6);

        AuditEvidenceFreshnessStatus status =
            AuditEvidenceFreshnessClassifier.Classify(collectedUtc, referenceUtc, policy);

        status.Should().BeOneOf(
            AuditEvidenceFreshnessStatus.Current,
            AuditEvidenceFreshnessStatus.Fresh);
    }

    [Fact]
    public void Classify_past_stale_threshold_returns_stale()
    {
        AuditEvidenceFreshnessPolicy policy = AuditEvidenceFreshnessParser.Parse("30d");
        DateTime referenceUtc = new(2026, 9, 5, 0, 0, 0, DateTimeKind.Utc);
        DateTime collectedUtc = referenceUtc.AddDays(-45);

        AuditEvidenceFreshnessStatus status =
            AuditEvidenceFreshnessClassifier.Classify(collectedUtc, referenceUtc, policy);

        status.Should().Be(AuditEvidenceFreshnessStatus.Stale);
    }

    [Fact]
    public void Classify_past_expire_threshold_returns_expired()
    {
        AuditEvidenceFreshnessPolicy policy = AuditEvidenceFreshnessParser.Parse("30d");
        DateTime referenceUtc = new(2026, 9, 5, 0, 0, 0, DateTimeKind.Utc);
        DateTime collectedUtc = referenceUtc.AddDays(-90);

        AuditEvidenceFreshnessStatus status =
            AuditEvidenceFreshnessClassifier.Classify(collectedUtc, referenceUtc, policy);

        status.Should().Be(AuditEvidenceFreshnessStatus.Expired);
    }
}
