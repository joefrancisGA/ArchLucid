using System.IO.Hashing;
using System.Text;

namespace ArchLucid.AgentRuntime.Prompts.Variants;

/// <summary>Stable xxHash64 bucketing for prompt variant assignment.</summary>
public static class PromptVariantBucketHasher
{
    /// <summary>Maps <c>tenantId|runId|promptTemplateName</c> to a bucket in <c>0..9999</c>.</summary>
    public static int ComputeBucket(Guid tenantId, Guid runId, string promptTemplateName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(promptTemplateName);

        string payload = $"{tenantId:N}|{runId:N}|{promptTemplateName}";
        byte[] bytes = Encoding.UTF8.GetBytes(payload);
        ulong hash = XxHash64.HashToUInt64(bytes);
        uint bucket = (uint)(hash % 10000);

        return (int)bucket;
    }
}
