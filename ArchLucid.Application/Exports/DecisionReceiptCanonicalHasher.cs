using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Exports;

namespace ArchLucid.Application.Exports;

/// <summary>
///     Wave-15 suggestion 150: deterministic SHA-256 over exportable receipt fields.
/// </summary>
public static class DecisionReceiptCanonicalHasher
{
    public static string ComputeSha256Hex(DecisionReceiptDocument receipt)
    {
        ArgumentNullException.ThrowIfNull(receipt);

        object canonical = new
        {
            schemaVersion = receipt.SchemaVersion,
            source = receipt.Source.ToString(),
            draftId = receipt.DraftId?.ToString("D"),
            runId = receipt.RunId?.ToString("D"),
            redirectReason = receipt.RedirectReason,
            intake = receipt.Intake is null
                ? null
                : new
                {
                    receipt.Intake.FreeTextIntent,
                    receipt.Intake.BusinessOutcome,
                    receipt.Intake.SystemName,
                },
            verdict = new
            {
                kind = receipt.Verdict.Kind.ToString(),
                receipt.Verdict.Summary,
            },
            manifestHashSha256 = receipt.ManifestHashSha256,
            manifestVersion = receipt.ManifestVersion,
            costStory = new { receipt.CostStory.Label },
        };

        byte[] utf8 = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(canonical, ContractJson.Default));

        return Convert.ToHexString(SHA256.HashData(utf8));
    }
}
