using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Application.Jobs;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Mapping;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConsultingDocxJobPayloadMapperTests
{
    [Fact]
    public void ToPayload_maps_all_export_request_fields_to_job_payload()
    {
        ConsultingDocxExportRequest request = new()
        {
            TemplateProfile = "sponsor",
            Audience = "CIO",
            ExternalDelivery = true,
            ExecutiveFriendly = true,
            RegulatedEnvironment = false,
            NeedDetailedEvidence = true,
            NeedExecutionTraces = true,
            NeedDeterminismOrCompareAppendices = true,
            IncludeEvidence = true,
            IncludeExecutionTraces = true,
            IncludeManifest = true,
            IncludeDiagram = true,
            IncludeSummary = true,
            IncludeDeterminismCheck = true,
            DeterminismIterations = 5,
            IncludeManifestCompare = true,
            CompareManifestVersion = "v2",
            IncludeAgentResultCompare = true,
            CompareRunId = "run-compare",
            ReviewBoardWhitelabelFirmDisplayName = "Firm",
            ReviewBoardWhitelabelClientEngagementTitle = "Engagement",
            ReviewBoardWhitelabelLogoBase64 = "bG9nbw==",
        };

        ConsultingDocxJobPayload payload = ConsultingDocxJobPayloadMapper.ToPayload("run-123", request);

        payload.RunId.Should().Be("run-123");
        payload.TemplateProfile.Should().Be(request.TemplateProfile);
        payload.Audience.Should().Be(request.Audience);
        payload.ExternalDelivery.Should().Be(request.ExternalDelivery);
        payload.ExecutiveFriendly.Should().Be(request.ExecutiveFriendly);
        payload.RegulatedEnvironment.Should().Be(request.RegulatedEnvironment);
        payload.NeedDetailedEvidence.Should().Be(request.NeedDetailedEvidence);
        payload.NeedExecutionTraces.Should().Be(request.NeedExecutionTraces);
        payload.NeedDeterminismOrCompareAppendices.Should().Be(request.NeedDeterminismOrCompareAppendices);
        payload.IncludeEvidence.Should().Be(request.IncludeEvidence);
        payload.IncludeExecutionTraces.Should().Be(request.IncludeExecutionTraces);
        payload.IncludeManifest.Should().Be(request.IncludeManifest);
        payload.IncludeDiagram.Should().Be(request.IncludeDiagram);
        payload.IncludeSummary.Should().Be(request.IncludeSummary);
        payload.IncludeDeterminismCheck.Should().Be(request.IncludeDeterminismCheck);
        payload.DeterminismIterations.Should().Be(request.DeterminismIterations);
        payload.IncludeManifestCompare.Should().Be(request.IncludeManifestCompare);
        payload.CompareManifestVersion.Should().Be(request.CompareManifestVersion);
        payload.IncludeAgentResultCompare.Should().Be(request.IncludeAgentResultCompare);
        payload.CompareRunId.Should().Be(request.CompareRunId);
        payload.ReviewBoardWhitelabelFirmDisplayName.Should().Be(request.ReviewBoardWhitelabelFirmDisplayName);
        payload.ReviewBoardWhitelabelClientEngagementTitle.Should()
            .Be(request.ReviewBoardWhitelabelClientEngagementTitle);
        payload.ReviewBoardWhitelabelLogoBase64.Should().Be(request.ReviewBoardWhitelabelLogoBase64);
    }

    [Fact]
    public void ToPayload_throws_when_request_is_null()
    {
        Action act = () => ConsultingDocxJobPayloadMapper.ToPayload("run-123", null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
