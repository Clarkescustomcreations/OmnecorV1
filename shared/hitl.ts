export interface CriticalAction {
  id: string;
  toolName: string;
  args: any;
  status: "pending" | "approved" | "rejected";
  timestamp: string;
}
