using System.ComponentModel.DataAnnotations;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Api.Models;

/// <summary>POST body for <c>/v1/governance/pre-commit/simulate</c> — dry-run gate with extra synthetic findings.</summary>
public sealed class PreCommitSyntheticSimulationRequest
{
    [Required]
    [StringLength(64, MinimumLength = 1)]
    public required string RunId
    {
        get;
        init;
    }

    public FindingSeverity SyntheticSeverity
    {
        get;
        init;
    } = FindingSeverity.Warning;

    [Range(0, 500)]
    public int SyntheticCount
    {
        get;
        init;
    } = 1;
}
