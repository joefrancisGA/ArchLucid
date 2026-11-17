/** SecureNow and ArchLucid cloud connections hub — federation save vs inventory capture. */
export const CLOUD_CONNECTIONS_READER_PULL_HONESTY_LINE =
  "Saving cloud connection settings does not run a Reader pull or upload by itself. A successful capture still needs scope, federation, and a completed inventory read or upload." as const;