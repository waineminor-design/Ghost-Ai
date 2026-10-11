import { logger, task } from "@trigger.dev/sdk";

export interface DesignAgentPayload {
  projectId: string;
  prompt: string;
  userId: string;
}

// Placeholder: logs and returns its input. AI design generation comes
// in a later feature; callers trigger it by id ("design-agent").
export const designAgent = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload) => {
    logger.log("design-agent received payload", { ...payload });
    return payload;
  },
});
