namespace ArchLucid.Cli;

return new CliPilotRunDeltasFetchResult(
            (int)response.StatusCode,
            response.StatusCode == System.Net.HttpStatusCode.NotFound,
            response.IsSuccessStatusCode,
            body);
    }

    public void Dispose()
    {
        if (!_clientDetached)
            Http.Dispose();
    }
}

internal readonly record struct CliPilotRunDeltasFetchResult(
    int StatusCode,
    bool NotFound,
    bool Success,
    string Body);
