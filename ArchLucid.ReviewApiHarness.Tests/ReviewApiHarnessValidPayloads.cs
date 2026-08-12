using System.Text.Json;

using Gen = ArchLucid.Api.Client.Generated;

using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

/// <summary>Contract-valid JSON bodies for harness HTTP mocks (validated against bundled OpenAPI snapshot).</summary>
internal static class ReviewApiHarnessValidPayloads
{
    internal const string RunId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

    internal const string ManifestVersion = "manifest-ver-harness-1";

    internal const string ApprovalRequestId = "approval-req-harness-1";

    internal const string ProjectId = "33333333-3333-3333-3333-333333333333";

    private static readonly ResponseValidationPipeline Pipeline = new(
        OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath()));

    internal static string CreateArchitectureRunResponse()
    {
        string json = $$"""
                        {
                          "run": {
                            "runId": "{{RunId}}",
                            "requestId": "req-harness-1",
                            "status": "Created",
                            "structuralExecutionMode": "Real",
                            "createdUtc": "2026-08-10T12:00:00Z",
                            "taskIds": [],
                            "isPinned": false,
                            "isDeadLettered": false,
                            "realModeFellBackToSimulator": false
                          }
                        }
                        """;

        AssertValid("CreateArchitectureRunResponse", typeof(Gen.CreateArchitectureRunResponse), json);

        return json;
    }

    internal static string RunDetailWithStatus(string status)
    {
        string json = $$"""
                        {
                          "run": {
                            "runId": "{{RunId}}",
                            "projectId": "{{ProjectId}}",
                            "legacyRunStatus": "{{status}}",
                            "structuralExecutionMode": "Real",
                            "createdUtc": "2026-08-10T12:00:00Z",
                            "isPinned": false,
                            "isDeadLettered": false,
                            "realModeFellBackToSimulator": false
                          }
                        }
                        """;

        AssertValid("RunDetailDto", typeof(Gen.RunDetailDto), json);

        return json;
    }

    internal static string RunDetailReadyForCommit() => RunDetailWithStatus("ReadyForCommit");

    internal static string RunDetailCreated() => RunDetailWithStatus("Created");

    internal static string RunFindingsListResponse()
    {
        string json = $$"""
                        {
                          "runId": "{{RunId}}",
                          "orderBy": "sortOrder",
                          "items": [],
                          "hasMore": false
                        }
                        """;

        AssertValid("RunFindingsListResponse", typeof(Gen.RunFindingsListResponse), json);

        return json;
    }

    internal static string CommitRunResponse()
    {
        string json = $$"""
                        {
                          "manifest": {
                            "runId": "{{RunId}}",
                            "systemName": "ReviewApiHarness",
                            "services": [],
                            "datastores": [],
                            "relationships": [],
                            "governance": {
                              "complianceTags": [],
                              "policyConstraints": [],
                              "requiredControls": []
                            },
                            "metadata": {
                              "manifestVersion": "{{ManifestVersion}}"
                            }
                          }
                        }
                        """;

        AssertValid("CommitRunResponse", typeof(Gen.CommitRunResponse), json);

        return json;
    }

    internal static string GovernanceApprovalRequest()
    {
        string json = $$"""
                        {
                          "approvalRequestId": "{{ApprovalRequestId}}",
                          "manifestVersion": "{{ManifestVersion}}",
                          "requestedBy": "Developer",
                          "requestedUtc": "2026-08-10T12:05:00Z"
                        }
                        """;

        AssertValid("GovernanceApprovalRequest", typeof(Gen.GovernanceApprovalRequest), json);

        return json;
    }

    internal static string CursorPagedAuditEvents()
    {
        string json = """
                      {
                        "items": [],
                        "hasMore": false,
                        "requestedTake": 100
                      }
                      """;

        AssertValid("CursorPagedResponseOfAuditEvent", typeof(Gen.CursorPagedResponseOfAuditEvent), json);

        return json;
    }

    internal static string CursorPagedRunListItems()
    {
        string json = $$"""
                        {
                          "items": [
                            {
                              "runId": "{{RunId}}",
                              "requestId": "req-harness-1",
                              "status": "Committed",
                              "createdUtc": "2026-08-10T12:00:00Z",
                              "systemName": "ReviewApiHarness",
                              "hasGoldenManifest": true,
                              "currentManifestVersion": "{{ManifestVersion}}"
                            }
                          ],
                          "hasMore": false,
                          "requestedTake": 50
                        }
                        """;

        AssertValid("CursorPagedResponseOfRunListItemResponse", typeof(Gen.CursorPagedResponseOfRunListItemResponse), json);

        return json;
    }

    private static void AssertValid(string schemaName, Type dtoType, string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);
        ResponseValidationResult result = Pipeline.ValidateJson(schemaName, dtoType, document.RootElement);
        result.Passed.Should().BeTrue(string.Join("; ", result.Errors));
    }
}
