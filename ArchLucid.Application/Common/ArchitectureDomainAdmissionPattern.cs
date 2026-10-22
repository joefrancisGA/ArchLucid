using System.Text.RegularExpressions;

namespace ArchLucid.Application.Common;

/// <summary>
/// Shared architecture-domain heuristic for draft admission and create-run safety precheck.
/// <c>apis?</c> admits plural <c>APIs</c>; <c>\bapi\b</c> alone rejects the greenfield wizard preset.
/// </summary>
public static class ArchitectureDomainAdmissionPattern
{
    public const string Pattern =
        @"(?i)\b(architecture|system|database|apis?|service|cloud|azure|aws|gcp|security|compliance|tenant|scale|latency|throughput|auth|identity)\b";

    public static readonly Regex Regex = new(Pattern, RegexOptions.Compiled);

    public static bool IsMatch(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        return Regex.IsMatch(text);
    }
}
