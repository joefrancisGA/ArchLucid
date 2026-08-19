namespace ArchLucid.Cli.Tests;

internal static class ShipGateExportMatrixTestFixtures
{
    internal static byte[] ZipStubBody(int size = 64)
    {
        byte[] body = new byte[size];
        body[0] = 0x50;
        body[1] = 0x4B;
        body[2] = 0x03;
        body[3] = 0x04;

        return body;
    }
}
