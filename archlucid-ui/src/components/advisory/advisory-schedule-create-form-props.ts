export type AdvisoryScheduleCreateFormProps = {
  readonly canEdit: boolean;
  readonly sampleModeBlocked: boolean;
  readonly creating: boolean;
  readonly createSuccess: boolean;
  readonly projectLabel: string;
  readonly onCreate: (input: {
    readonly name: string;
    readonly cronExpression: string;
    readonly runProjectSlug: string;
  }) => Promise<void>;
  readonly runProjectSlug: string;
  readonly formResetKey: number;
};
