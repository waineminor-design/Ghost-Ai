import type { Project } from "@/lib/projects";

// Mock data until the project API exists. Projects owned by
// MOCK_CURRENT_USER_ID appear under "My Projects"; the rest are shared.
export const MOCK_CURRENT_USER_ID = "user_mock_current";

export const MOCK_PROJECTS: Project[] = [
  { id: "proj_payments", name: "Payments Platform", ownerId: MOCK_CURRENT_USER_ID },
  { id: "proj_chat", name: "Realtime Chat Service", ownerId: MOCK_CURRENT_USER_ID },
  { id: "proj_analytics", name: "Analytics Pipeline", ownerId: MOCK_CURRENT_USER_ID },
  { id: "proj_inventory", name: "Inventory Microservices", ownerId: "user_mock_teammate" },
  { id: "proj_auth", name: "Auth Gateway", ownerId: "user_mock_teammate" },
];
