namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Handlebars model for <c>run-summary-one-pager.md.hbs</c>.</summary>
public sealed class RunSummaryOnePagerDocumentModel
{
    public string RunId
    {
        get;
        init;
    } = "";

    public string? SystemName
    {
        get;
        init;
    }

    public string SystemNameDisplay
    {
        get;
        init;
    } = "";

    public string RunIdDisplay
    {
        get;
        init;
    } = "";

    public string SealedFindingsSection
    {
        get;
        init;
    } = "";

    public bool AgentFindingsCountsStored
    {
        get;
        init;
    } = true;

    public string AgentFindingsNotStoredCopy
    {
        get;
        init;
    } = "";

    public int CriticalCount
    {
        get;
        init;
    }

    public int HighCount
    {
        get;
        init;
    }

    public int MediumCount
    {
        get;
        init;
    }

    public int LowCount
    {
        get;
        init;
    }

    public int MutedFindingCount
    {
        get;
        init;
    }

    public string SeverityCountsFootnote
    {
        get;
        init;
    } = "";

    public string TopFindingsEmptyCopy
    {
        get;
        init;
    } = "";

    public string SponsorReport
    {
        get;
        init;
    } = "";

    public IReadOnlyList<string> TopFindingTitles
    {
        get;
        init;
    } = [];

    public bool IsDemoTenant
    {
        get;
        init;
    }

    public string? ActiveTrialExportNotice
    {
        get;
        init;
    }

    public bool IsSimulatorMode
    {
        get;
        init;
    }

    public bool HasSealedSnapshot
    {
        get;
        init;
    }

    public string? FindingsSnapshotId
    {
        get;
        init;
    }

    public int SealedFindingCount
    {
        get;
        init;
    }

    public string? SimulatorRehearsalTitle
    {
        get;
        init;
    }

    public string? SimulatorRehearsalBody
    {
        get;
        init;
    }

    public string? CareerExportHonestyPlainText
    {
        get;
        init;
    }

    public string? SendableExportCoverPlainText
    {
        get;
        init;
    }

    public string? ArchitectRestatementMarkdown
    {
        get;
        init;
    }

}
