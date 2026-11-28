# Build with a scoped dotnet publish directory as context.
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY . .
USER 65532:65532
ENTRYPOINT ["/usr/share/dotnet/dotnet", "/app/ArchLucid.HistoricalReplay.Worker.dll"]
