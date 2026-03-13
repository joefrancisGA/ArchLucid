CREATE TABLE IF NOT EXISTS ArchitectureRequests
(
    RequestId TEXT NOT NULL PRIMARY KEY,
    SystemName TEXT NOT NULL,
    Environment TEXT NOT NULL,
    CloudProvider TEXT NOT NULL,
    RequestJson TEXT NOT NULL,
    CreatedUtc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ArchitectureRuns
(
    RunId TEXT NOT NULL PRIMARY KEY,
    RequestId TEXT NOT NULL,
    Status TEXT NOT NULL,
    CreatedUtc TEXT NOT NULL,
    CompletedUtc TEXT NULL,
    CurrentManifestVersion TEXT NULL
);

CREATE TABLE IF NOT EXISTS AgentTasks
(
    TaskId TEXT NOT NULL PRIMARY KEY,
    RunId TEXT NOT NULL,
    AgentType TEXT NOT NULL,
    Objective TEXT NOT NULL,
    Status TEXT NOT NULL,
    CreatedUtc TEXT NOT NULL,
    CompletedUtc TEXT NULL,
    EvidenceBundleRef TEXT NULL
);

CREATE TABLE IF NOT EXISTS AgentResults
(
    ResultId TEXT NOT NULL PRIMARY KEY,
    TaskId TEXT NOT NULL,
    RunId TEXT NOT NULL,
    AgentType TEXT NOT NULL,
    Confidence REAL NOT NULL,
    ResultJson TEXT NOT NULL,
    CreatedUtc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS GoldenManifestVersions
(
    ManifestVersion TEXT NOT NULL PRIMARY KEY,
    RunId TEXT NOT NULL,
    SystemName TEXT NOT NULL,
    ManifestJson TEXT NOT NULL,
    ParentManifestVersion TEXT NULL,
    CreatedUtc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS EvidenceBundles
(
    EvidenceBundleId TEXT NOT NULL PRIMARY KEY,
    RequestDescription TEXT NOT NULL,
    EvidenceJson TEXT NOT NULL,
    CreatedUtc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS DecisionTraces
(
    TraceId TEXT NOT NULL PRIMARY KEY,
    RunId TEXT NOT NULL,
    EventType TEXT NOT NULL,
    EventDescription TEXT NOT NULL,
    EventJson TEXT NOT NULL,
    CreatedUtc TEXT NOT NULL
);
