import { logger, task } from "@trigger.dev/sdk";

export interface SpecGeneratorPayload {
  projectId: string;
  userId: string;
}

// Placeholder: logs and returns its input. Spec generation comes in a
// later feature; callers trigger it by id ("spec-generator").
export const specGenerator = task({
  id: "spec-generator",
  run: async (payload: SpecGeneratorPayload) => {
    logger.log("spec-generator received payload", { ...payload });
    return payload;
  },
});
