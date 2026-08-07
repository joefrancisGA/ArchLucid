using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Jobs;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Jobs;

[Trait("Category", "Unit")]
public sealed class BackgroundJobWorkUnitJsonTests
{
    [SkippableFact]
    public void RoundTrip_AnalysisReportDocxWorkUnit_PreservesPayload()
    {
        AnalysisReportDocxWorkUnit original = new(
            new AnalysisReportDocxJobPayload { RunId = "run-1", IncludeDiagram = false },
            "report.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        string json = BackgroundJobWorkUnitJson.Serialize(original);
        BackgroundJobWorkUnit? restored = BackgroundJobWorkUnitJson.Deserialize(json);

        restored.Should().BeOfType<AnalysisReportDocxWorkUnit>();
        AnalysisReportDocxWorkUnit typed = (AnalysisReportDocxWorkUnit)restored;
        typed.Payload.RunId.Should().Be("run-1");
        typed.Payload.IncludeDiagram.Should().BeFalse();
        typed.FileName.Should().Be("report.docx");
        typed.ContentType.Should().Contain("wordprocessingml");
    }

    [SkippableFact]
    public void RoundTrip_ConsultingDocxWorkUnit_PreservesPayload()
    {
        ConsultingDocxWorkUnit original = new(
            new ConsultingDocxJobPayload { RunId = "run-2", TemplateProfile = "exec" },
            "c.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        string json = BackgroundJobWorkUnitJson.Serialize(original);
        BackgroundJobWorkUnit? restored = BackgroundJobWorkUnitJson.Deserialize(json);

        restored.Should().BeOfType<ConsultingDocxWorkUnit>();
        ConsultingDocxWorkUnit typed = (ConsultingDocxWorkUnit)restored;
        typed.Payload.RunId.Should().Be("run-2");
        typed.Payload.TemplateProfile.Should().Be("exec");
        typed.FileName.Should().Be("c.docx");
        typed.ContentType.Should().Contain("wordprocessingml");
    }

    [SkippableFact]
    public void RoundTrip_TenantDeletionWorkUnit_PreservesPayload()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        TenantDeletionWorkUnit original = new(new TenantDeletionJobPayload(tenantId, "u1", "n1", "c1"));

        string json = BackgroundJobWorkUnitJson.Serialize(original);
        BackgroundJobWorkUnit? restored = BackgroundJobWorkUnitJson.Deserialize(json);

        restored.Should().BeOfType<TenantDeletionWorkUnit>();
        TenantDeletionWorkUnit typed = (TenantDeletionWorkUnit)restored!;
        typed.Payload.TenantId.Should().Be(tenantId);
        typed.Payload.RequestedByUserId.Should().Be("u1");
        typed.Payload.RequestedByUserName.Should().Be("n1");
        typed.Payload.CorrelationId.Should().Be("c1");
    }

    [SkippableFact]
    public void RoundTrip_ItsmOutboundCreateWorkUnit_PreservesPayload()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        ItsmOutboundCreateWorkUnit original = new(
            new ItsmOutboundCreateJobPayload(
                tenantId,
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Guid.Parse("22222222-2222-2222-2222-222222222222"),
                "finding-abc",
                ItsmOutboundIssueProvider.ServiceNow,
                "corr-1"));

        string json = BackgroundJobWorkUnitJson.Serialize(original);
        BackgroundJobWorkUnit? restored = BackgroundJobWorkUnitJson.Deserialize(json);

        restored.Should().BeOfType<ItsmOutboundCreateWorkUnit>();
        ItsmOutboundCreateWorkUnit typed = (ItsmOutboundCreateWorkUnit)restored!;
        typed.Payload.TenantId.Should().Be(tenantId);
        typed.Payload.FindingId.Should().Be("finding-abc");
        typed.Payload.Provider.Should().Be(ItsmOutboundIssueProvider.ServiceNow);
    }

    [SkippableFact]
    public void TryDeserialize_malformed_json_returns_null()
    {
        BackgroundJobWorkUnitJson.TryDeserialize("{not-json").Should().BeNull();
    }
}
