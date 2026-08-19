/** Scope for `listRunsByProjectPaged` TanStack Query keys (TB-562). */
export type RunsByProjectPagedParams = {
  readonly projectId: string;
  readonly page: number;
  readonly pageSize: number;
};
