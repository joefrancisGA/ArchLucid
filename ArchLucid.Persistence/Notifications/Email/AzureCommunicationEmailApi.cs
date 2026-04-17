using System.Collections.Concurrent;

using Azure;
using Azure.Communication.Email;
using Azure.Core;
using Azure.Identity;

namespace ArchLucid.Persistence.Notifications.Email;

/// <summary>Default ACS transport using managed identity (or dev DefaultAzureCredential chain).</summary>
public sealed class AzureCommunicationEmailApi : IAzureCommunicationEmailApi
{
    private readonly ConcurrentDictionary<string, EmailClient> _clients = new(StringComparer.OrdinalIgnoreCase);

    /// <inheritdoc />
    public async Task<string> SendAsync(
        string endpoint,
        string? managedIdentityClientId,
        string fromAddress,
        string toAddress,
        string subject,
        string? plainText,
        string html,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(endpoint);
        ArgumentException.ThrowIfNullOrWhiteSpace(fromAddress);
        ArgumentException.ThrowIfNullOrWhiteSpace(toAddress);

        EmailClient client = _clients.GetOrAdd(
            BuildCacheKey(endpoint, managedIdentityClientId),
            key =>
            {
                (string ep, string? mi) = ParseCacheKey(key);
                Uri uri = new(ep);
                TokenCredential credential = string.IsNullOrWhiteSpace(mi)
                    ? new DefaultAzureCredential()
                    : new DefaultAzureCredential(
                        new DefaultAzureCredentialOptions { ManagedIdentityClientId = mi.Trim() });

                return new EmailClient(uri, credential);
            });

        EmailSendOperation operation = await client.SendAsync(
                WaitUntil.Completed,
                fromAddress.Trim(),
                toAddress.Trim(),
                subject,
                html,
                plainText ?? string.Empty,
                cancellationToken)
            .ConfigureAwait(false);

        return operation.Id;
    }

    private static string BuildCacheKey(string endpoint, string? managedIdentityClientId)
    {
        return $"{endpoint.Trim()}|{managedIdentityClientId?.Trim() ?? string.Empty}";
    }

    private static (string Endpoint, string? Mi) ParseCacheKey(string key)
    {
        int idx = key.LastIndexOf('|');

        if (idx < 0)
        {
            return (key, null);
        }

        string endpoint = key[..idx];
        string mi = key[(idx + 1)..];

        return (endpoint, string.IsNullOrWhiteSpace(mi) ? null : mi);
    }
}
