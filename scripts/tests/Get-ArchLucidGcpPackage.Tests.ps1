#Requires -Version 7.0
# Run: Invoke-Pester -Strict 'scripts/tests/Get-ArchLucidGcpPackage.Tests.ps1'
Set-StrictMode -Version Latest

Describe 'Get-ArchLucidGcpPackage.ps1' {

    BeforeAll {
        [string]$script:repoRoot = Split-Path -Parent $PSScriptRoot
        [string]$script:extractorScript = Join-Path $script:repoRoot 'Get-ArchLucidGcpPackage.ps1'
    }

    It 'writes a schema-version-1 ZIP with manifest.json and resources.json in DryRun mode' {
        [string]$zipPath = Join-Path $TestDrive 'gcp-inventory.zip'

        & $script:extractorScript -OutputPath $zipPath -DryRun

        Test-Path -LiteralPath $zipPath | Should -Be $true

        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

        try {
            $entryNames = @($archive.Entries | ForEach-Object { $_.Name })
            $entryNames | Should -Contain 'manifest.json'
            $entryNames | Should -Contain 'resources.json'
            $entryNames | Should -Contain 'README.txt'

            $manifestEntry = $archive.GetEntry('manifest.json')
            $manifestStream = $manifestEntry.Open()
            $reader = New-Object System.IO.StreamReader($manifestStream)

            try {
                $manifestJson = $reader.ReadToEnd() | ConvertFrom-Json
                [int]$manifestJson.schemaVersion | Should -Be 1
                [string]$manifestJson.cloudProvider | Should -Be 'Gcp'
            }
            finally {
                $reader.Dispose()
                $manifestStream.Dispose()
            }
        }
        finally {
            $archive.Dispose()
        }
    }
}
