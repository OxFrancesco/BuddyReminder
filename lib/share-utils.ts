import { LocalItem } from "@/db/types";

export function formatItemAsMarkdown(item: LocalItem): string {
  const lines: string[] = [];
  
  // Title
  lines.push(`# ${item.title}`);
  lines.push("");
  
  // Type
  lines.push(`**Type:** ${item.type}`);
  lines.push("");
  
  // Body
  if (item.body) {
    lines.push(item.body);
    lines.push("");
  }
  
  // Task-specific fields
  if (item.type === "task" && item.taskSpec) {
    lines.push("## Task Details");
    lines.push("");
    lines.push(`**Goal:** ${item.taskSpec.goal}`);
    
    if (item.taskSpec.inputs?.length) {
      lines.push("");
      lines.push("**Inputs:**");
      item.taskSpec.inputs.forEach(input => lines.push(`- ${input}`));
    }
    
    if (item.taskSpec.constraints?.length) {
      lines.push("");
      lines.push("**Constraints:**");
      item.taskSpec.constraints.forEach(constraint => lines.push(`- ${constraint}`));
    }
    
    if (item.taskSpec.allowedTools?.length) {
      lines.push("");
      lines.push("**Allowed Tools:**");
      item.taskSpec.allowedTools.forEach(tool => lines.push(`- ${tool}`));
    }
    
    if (item.taskSpec.workspacePointers?.length) {
      lines.push("");
      lines.push("**Workspace Pointers:**");
      item.taskSpec.workspacePointers.forEach(pointer => lines.push(`- ${pointer}`));
    }
  }
  
  // Reminder-specific fields
  if (item.type === "reminder" && item.triggerAt) {
    lines.push(`**Scheduled:** ${new Date(item.triggerAt).toLocaleString()}`);
    if (item.repeatRule) {
      lines.push(`**Repeat:** ${item.repeatRule}`);
    }
  }
  
  return lines.join("\n");
}
