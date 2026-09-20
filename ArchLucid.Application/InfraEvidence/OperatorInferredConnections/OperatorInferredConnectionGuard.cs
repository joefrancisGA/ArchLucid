using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Application.InfraEvidence.OperatorInferredConnections;

internal static class OperatorInferredConnectionGuard
{
    public static byte[] ComputeProposalPayloadHash(OperatorInferredConnectionProposalSeed seed)
    {
        ArgumentNullException.ThrowIfNull(seed);

        string payload = string.Join(
            '|',
            seed.SnapshotId.ToString("D"),
            seed.Source.ToString(),
            seed.RuleName ?? string.Empty,
            seed.FromArmId ?? string.Empty,
            seed.FromLabel ?? string.Empty,
            seed.ToHost ?? string.Empty,
            seed.ToCatalog ?? string.Empty,
            seed.SettingName ?? string.Empty,
            seed.SourceFileFormat ?? string.Empty,
            seed.QuestionText ?? string.Empty);

        return SHA256.HashData(Encoding.UTF8.GetBytes(payload));
    }
}

internal sealed class OperatorInferredConnectionProposalSeed
{
    public Guid SnapshotId
    {
        get;
        init;
    }

    public Core.InfraEvidence.OperatorInferredConnectionSource Source
    {
        get;
        init;
    }

    public string? RuleName
    {
        get;
        init;
    }

    public string? FromArmId
    {
        get;
        init;
    }

    public string? FromLabel
    {
        get;
        init;
    }

    public string? ToHost
    {
        get;
        init;
    }

    public string? ToCatalog
    {
        get;
        init;
    }

    public string? SettingName
    {
        get;
        init;
    }

    public string? SourceFileFormat
    {
        get;
        init;
    }

    public string? QuestionText
    {
        get;
        init;
    }
}
