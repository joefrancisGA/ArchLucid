namespace ArchLucid.ContextIngestion.Models;

public class ContextDelta
{
    public string Summary
    {
        get;
        set;
    } = "";

    /// <summary>Items present in the current batch but absent from the previous snapshot slice.</summary>
    public int AddedCount
    {
        get;
        set;
    }

    /// <summary>Items present in the previous snapshot slice but absent from the current batch.</summary>
    public int RemovedCount
    {
        get;
        set;
    }

    /// <summary>Items whose stable key appears in both batches but whose properties differ.</summary>
    public int ModifiedCount
    {
        get;
        set;
    }

    /// <summary>Items whose stable key and properties are identical in both batches.</summary>
    public int UnchangedCount
    {
        get;
        set;
    }
}
