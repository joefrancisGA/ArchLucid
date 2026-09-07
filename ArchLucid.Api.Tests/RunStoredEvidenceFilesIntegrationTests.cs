using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Contracts.Evidence;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Integration tests for <see cref="Controllers.Authority.ReviewStoredEvidenceFilesController" /> (ESI-01 catalog list).
/// </summary>
[Trait("Category", "Integration")]
public sealed class RunStoredEvidenceFilesIntegrationTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ListStoredEvidenceFiles_AfterBulkUpload_ReturnsCatalogMetadata()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-STORED-001")));
        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        using MultipartFormDataContent content = new();
        ByteArrayContent fileContent = new([1, 2, 3, 4]);
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/octet-stream");
        content.Add(fileContent, "files", "handbook.docx");

        HttpResponseMessage uploadResponse =
            await Client.PostAsync($"/v1/architecture/review/{runId}/evidence/bulk", content);
        await uploadResponse.EnsureSuccessForTestAsync();

        BulkUploadResponseDto? uploadBody =
            await uploadResponse.Content.ReadFromJsonAsync<BulkUploadResponseDto>(JsonOptions);
        uploadBody.Should().NotBeNull();
        uploadBody!.EvidenceItemIds.Should().ContainSingle();

        HttpResponseMessage listResponse =
            await Client.GetAsync($"/v1/architecture/review/{runId}/evidence/files");
        await listResponse.EnsureSuccessForTestAsync();

        IReadOnlyList<RunStoredEvidenceFileDto>? files =
            await listResponse.Content.ReadFromJsonAsync<IReadOnlyList<RunStoredEvidenceFileDto>>(JsonOptions);

        files.Should().NotBeNull();
        files!.Should().ContainSingle();
        files[0].EvidenceItemId.Should().Be(uploadBody.EvidenceItemIds[0]);
        files[0].OriginalFileName.Should().Be("handbook.docx");
        files[0].ByteLength.Should().Be(4);
        files[0].ContentType.Should().Be("application/octet-stream");
    }

    [SkippableFact]
    public async Task ListStoredEvidenceFiles_ForRunWithoutUploads_ReturnsEmptyArray()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-STORED-002")));
        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        HttpResponseMessage listResponse =
            await Client.GetAsync($"/v1/architecture/review/{runId}/evidence/files");
        await listResponse.EnsureSuccessForTestAsync();

        IReadOnlyList<RunStoredEvidenceFileDto>? files =
            await listResponse.Content.ReadFromJsonAsync<IReadOnlyList<RunStoredEvidenceFileDto>>(JsonOptions);

        files.Should().NotBeNull();
        files!.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task ListStoredEvidenceFiles_ForMissingRun_ReturnsNotFound()
    {
        Guid missingRunId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        HttpResponseMessage listResponse =
            await Client.GetAsync($"/v1/architecture/review/{missingRunId}/evidence/files");

        listResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task ListStoredEvidenceFiles_ForOtherTenantRun_ReturnsNotFound()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-STORED-003")));
        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        using HttpClient foreignClient = Factory.CreateClient();
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-tenant-id",
            Guid.Parse("77777777-7777-7777-7777-777777777777").ToString("D"));
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-workspace-id",
            ScopeIds.DefaultWorkspace.ToString("D"));
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-project-id",
            ScopeIds.DefaultProject.ToString("D"));

        HttpResponseMessage listResponse =
            await foreignClient.GetAsync($"/v1/architecture/review/{runId}/evidence/files");

        listResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task ListStoredEvidenceFiles_AfterPngAndDocxBulkUpload_ReturnsBothCatalogRows()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-STORED-DUAL-001")));
        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        using MultipartFormDataContent content = new();
        ByteArrayContent pngContent = new([0x89, 0x50, 0x4E, 0x47]);
        pngContent.Headers.ContentType = MediaTypeHeaderValue.Parse("image/png");
        content.Add(pngContent, "files", "diagram.png");

        ByteArrayContent docxContent = new([0x50, 0x4B, 0x03, 0x04]);
        docxContent.Headers.ContentType = MediaTypeHeaderValue.Parse(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        content.Add(docxContent, "files", "brief.docx");

        HttpResponseMessage uploadResponse =
            await Client.PostAsync($"/v1/architecture/review/{runId}/evidence/bulk", content);
        await uploadResponse.EnsureSuccessForTestAsync();

        BulkUploadResponseDto? uploadBody =
            await uploadResponse.Content.ReadFromJsonAsync<BulkUploadResponseDto>(JsonOptions);
        uploadBody.Should().NotBeNull();
        uploadBody!.EvidenceItemIds.Should().HaveCount(2);

        HttpResponseMessage listResponse =
            await Client.GetAsync($"/v1/architecture/review/{runId}/evidence/files");
        await listResponse.EnsureSuccessForTestAsync();

        IReadOnlyList<RunStoredEvidenceFileDto>? files =
            await listResponse.Content.ReadFromJsonAsync<IReadOnlyList<RunStoredEvidenceFileDto>>(JsonOptions);

        files.Should().NotBeNull();
        files!.Should().HaveCount(2);
        files.Select(static file => file.OriginalFileName).Should().BeEquivalentTo(["diagram.png", "brief.docx"]);
        files.Should().OnlyContain(static file => uploadBody.EvidenceItemIds.Contains(file.EvidenceItemId));
        files.Should().Contain(static file => file.ContentType == "image/png");
        files.Should().Contain(static file =>
            file.ContentType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    }

    [SkippableFact]
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-STORED-DL-001")));
        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        byte[] payload = "hello evidence"u8.ToArray();
        using MultipartFormDataContent content = new();
        ByteArrayContent fileContent = new(payload);
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("text/plain");
        content.Add(fileContent, "files", "hello.txt");

        HttpResponseMessage uploadResponse =
            await Client.PostAsync($"/v1/architecture/review/{runId}/evidence/bulk", content);
        await uploadResponse.EnsureSuccessForTestAsync();

        BulkUploadResponseDto? uploadBody =
            await uploadResponse.Content.ReadFromJsonAsync<BulkUploadResponseDto>(JsonOptions);
        string evidenceItemId = uploadBody!.EvidenceItemIds[0];

        HttpResponseMessage downloadResponse = await Client.GetAsync(
            $"/v1/architecture/review/{runId}/evidence/files/{evidenceItemId}");
        await downloadResponse.EnsureSuccessForTestAsync();

        byte[] downloaded = await downloadResponse.Content.ReadAsByteArrayAsync();
        downloaded.Should().Equal(payload);
        downloadResponse.Content.Headers.ContentDisposition?.DispositionType.Should().Be("attachment");
        downloadResponse.Content.Headers.ContentDisposition?.FileName.Should().Be("hello.txt");
    }

    [SkippableFact]
    public async Task DownloadStoredEvidenceFile_WithInlineDisposition_ReturnsInlineContentDisposition()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-STORED-INLINE-001")));
        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        byte[] payload = "preview text"u8.ToArray();
        using MultipartFormDataContent content = new();
        ByteArrayContent fileContent = new(payload);
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("text/plain");
        content.Add(fileContent, "files", "hello.txt");

        HttpResponseMessage uploadResponse =
            await Client.PostAsync($"/v1/architecture/review/{runId}/evidence/bulk", content);
        await uploadResponse.EnsureSuccessForTestAsync();

        BulkUploadResponseDto? uploadBody =
            await uploadResponse.Content.ReadFromJsonAsync<BulkUploadResponseDto>(JsonOptions);
        string evidenceItemId = uploadBody!.EvidenceItemIds[0];

        HttpResponseMessage inlineResponse = await Client.GetAsync(
            $"/v1/architecture/review/{runId}/evidence/files/{evidenceItemId}?disposition=inline");
        await inlineResponse.EnsureSuccessForTestAsync();

        byte[] downloaded = await inlineResponse.Content.ReadAsByteArrayAsync();
        downloaded.Should().Equal(payload);
        inlineResponse.Content.Headers.ContentDisposition?.DispositionType.Should().Be("inline");
        inlineResponse.Content.Headers.ContentDisposition?.FileName.Should().Be("hello.txt");
    }

    private sealed class BulkUploadResponseDto
    {
        public IReadOnlyList<string> EvidenceItemIds
        {
            get;
            set;
        } = [];
    }
}
