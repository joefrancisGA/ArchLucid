using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.Configuration;

namespace ArchLucid.AgentRuntime.Batch;

/// <summary>HTTP transport for Azure OpenAI Batch API file upload, job create/poll, and output download.</summary>
public interface IAzureOpenAiBatchTransport
{
    Task<string> UploadBatchInputFileAsync(byte[] jsonlBytes, CancellationToken cancellationToken);

    Task<string> CreateBatchJobAsync(string inputFileId, CancellationToken cancellationToken);

    Task<string> GetBatchStatusAsync(string batchJobId, CancellationToken cancellationToken);

    Task<string?> GetBatchOutputFileIdAsync(string batchJobId, CancellationToken cancellationToken);

    Task<string> DownloadFileContentAsync(string fileId, CancellationToken cancellationToken);
}
