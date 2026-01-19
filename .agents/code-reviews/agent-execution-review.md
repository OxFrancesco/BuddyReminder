# Code Review: Agent Execution Foundation

**Date**: 2026-01-19
**Reviewer**: Kiro AI
**Commit**: feat: add agent task execution foundation with Daytona integration

## Stats

- Files Modified: 7
- Files Added: 4
- Files Deleted: 0
- New lines: 1477
- Deleted lines: 1

## Summary

This review covers the implementation of agent task execution with Daytona workspace integration. The code adds infrastructure for spawning OpenCode instances in Daytona sandboxes, managing agent runs, and displaying execution status.

## Issues Found

### CRITICAL Issues

```
severity: critical
file: convex/agent.ts
line: 339, 483
issue: Missing DAYTONA_API_KEY environment variable will cause runtime failures
detail: The code throws an error if DAYTONA_API_KEY is not set, but there's no documentation or .env.example entry for this required variable. Users will encounter runtime errors when trying to spawn agents. The .env.local file doesn't include this variable, and there's no setup documentation.
suggestion: Add DAYTONA_API_KEY to .env.local (or create .env.example), add setup instructions to README.md, and consider adding a more helpful error message that directs users to obtain an API key from https://app.daytona.io/dashboard/keys
```

### HIGH Issues

```
severity: high
file: convex/agent.ts
line: 420
issue: Hardcoded base64 encoding command may fail on non-Linux systems
detail: The command `echo '${base64Config}' | base64 -d` assumes GNU/Linux base64 utility behavior. Daytona sandboxes may use different base images or systems where this command syntax differs or fails.
suggestion: Use the Daytona SDK's native methods for passing configuration if available, or verify the sandbox OS and adjust the command accordingly. Consider using environment variables directly instead of base64 encoding.
```

```
severity: high
file: convex/agent.ts
line: 368-380
issue: No timeout or retry logic for sandbox creation
detail: The sandbox creation and OpenCode installation can hang indefinitely if the Daytona API is slow or unresponsive. There's no timeout mechanism, which could leave agent runs in "pending" state forever.
suggestion: Add timeout logic using Promise.race() or AbortController with a reasonable timeout (e.g., 5 minutes). Update the run status to "failed" with a timeout error message if the operation exceeds the limit.
```

```
severity: high
file: components/agent-modal.tsx
line: 305
issue: Conditional rendering requires convexId but no null check before usage
detail: The modal only renders if `item.convexId` exists, but the taskId is cast to `Id<"items">` without validation. If convexId is null or undefined, this could cause type errors or runtime issues.
suggestion: Add explicit null check: `{showAgentModal && item?.convexId && (<AgentModal taskId={item.convexId} ... />)}` or handle the null case with a user-friendly error message.
```

```
severity: high
file: convex/agent.ts
line: 372-378
issue: No cleanup on partial failure during sandbox setup
detail: If OpenCode installation fails after sandbox creation, the sandbox is left running and consuming resources. The error handler at line 445 doesn't clean up the sandbox.
suggestion: Add cleanup logic in the catch block to delete the sandbox if it was created: `if (sandboxId) { await daytonaFetch(\`/sandboxes/\${sandboxId}\`, apiKey, { method: 'DELETE' }); }`
```

### MEDIUM Issues

```
severity: medium
file: convex/agent.ts
line: 15-29
issue: No error response body parsing for non-JSON responses
detail: The daytonaFetch helper assumes all error responses are text, but some API errors may return JSON with structured error details. This could result in less helpful error messages.
suggestion: Try to parse JSON first, fall back to text: `const errorBody = response.headers.get('content-type')?.includes('json') ? await response.json() : await response.text();`
```

```
severity: medium
file: app/agent.tsx
line: 35-42
issue: No error feedback to user when stopping sandbox fails
detail: The catch block logs to console but doesn't show any UI feedback to the user. Users won't know if the stop operation failed.
suggestion: Add error state management and display an error message in the UI, similar to how AgentModal handles errors.
```

```
severity: medium
file: components/items-list.tsx
line: 36-37
issue: Potential performance issue with activeAgentCount calculation
detail: The query runs on every render and calculates length. For users with many agent runs, this could be inefficient.
suggestion: Consider adding a dedicated Convex query that returns just the count, or memoize the calculation: `const activeAgentCount = useMemo(() => activeAgentRuns?.length ?? 0, [activeAgentRuns]);`
```

```
severity: medium
file: convex/agent.ts
line: 408-415
issue: System prompt doesn't include preview URL pattern for services
detail: The reference implementation in docs/opencode/src/index.ts includes a preview URL pattern in the system prompt so OpenCode knows how to construct URLs for services. This implementation omits that, which could confuse the agent.
suggestion: Add preview URL pattern to system prompt: `const previewUrlPattern = previewUrl.replace(/3000/, '{PORT}'); systemPrompt.push(\`When running services on localhost, they will be accessible as: \${previewUrlPattern}\`);`
```

```
severity: medium
file: convex/agent.ts
line: 427-435
issue: No verification that OpenCode web server started successfully
detail: The code starts OpenCode asynchronously but doesn't verify it's running before returning. Users might click "Open OpenCode" before the server is ready.
suggestion: Add a polling mechanism to check if the OpenCode web server is responding (e.g., HTTP GET to previewUrl with retries), or add a delay before marking as "running".
```

```
severity: medium
file: app/modal.tsx
line: 305-315
issue: AgentModal can be opened for tasks without taskSpec
detail: The code allows opening AgentModal for any task type item, but taskGoal comes from taskSpec?.goal which may be undefined. This could result in agents running without clear goals.
suggestion: Add validation: `{showAgentModal && item?.type === 'task' && item?.taskSpec?.goal && (<AgentModal ... />)}` or provide a fallback goal using the title.
```

### LOW Issues

```
severity: low
file: components/ui/icon-symbol.tsx
line: 21-38
issue: Icon mapping uses inconsistent naming conventions
detail: Some icons use full names ('cpu', 'terminal') while others use SF Symbol names ('bolt.fill', 'play.fill'). This inconsistency could confuse developers.
suggestion: Document the naming convention in a comment. Consider standardizing on either SF Symbol names or semantic names throughout.
```

```
severity: low
file: app/agent.tsx
line: 88
issue: Hardcoded rotation transform for back arrow
detail: The transform: [{ rotate: '180deg' }] is hardcoded inline. This could be extracted to a style constant for reusability.
suggestion: Add to styles: `backArrowIcon: { transform: [{ rotate: '180deg' }] }` and apply it to the IconSymbol.
```

```
severity: low
file: convex/agent.ts
line: 382
issue: Magic string for session ID generation
detail: The session ID uses a hardcoded prefix 'opencode-session-' which could conflict if multiple sessions are created simultaneously.
suggestion: Use a more unique identifier: `const sessionId = \`opencode-\${sandboxId}-\${Date.now()}\`;` to ensure uniqueness per sandbox.
```

```
severity: low
file: components/agent-modal.tsx
line: 91-95
issue: Error handling doesn't distinguish between different error types
detail: All errors are treated the same way. Network errors, authentication errors, and API errors should potentially be handled differently.
suggestion: Add error type checking and provide more specific error messages: "Network error - check your connection", "Authentication failed - check API key", etc.
```

```
severity: low
file: app/_layout.tsx
line: (not shown in diff)
issue: Missing route registration for /agent screen
detail: The new agent.tsx screen needs to be properly registered in the router configuration. Verify that Expo Router auto-discovery is working correctly.
suggestion: Verify the route is accessible by testing navigation. If issues occur, check that the file is in the correct location and named properly for Expo Router.
```

## Security Considerations

1. **API Key Exposure**: The DAYTONA_API_KEY is stored in environment variables on the Convex backend, which is correct. However, ensure the Convex deployment environment has this variable set securely and it's not logged or exposed in error messages.

2. **Sandbox Isolation**: The implementation correctly uses Daytona sandboxes for isolation, but there's no validation of the taskGoal content. Malicious users could potentially inject commands. Consider sanitizing or validating the taskGoal before passing it to the system prompt.

3. **Resource Exhaustion**: There's no limit on how many sandboxes a user can spawn. Consider adding rate limiting or a maximum concurrent sandbox limit per user to prevent abuse.

4. **Unauthorized Access**: The code properly checks user authentication and ownership, which is good. The authorization checks in `getAgentRunsForTask` and `updateAgentRun` are correctly implemented.

## Performance Considerations

1. **Query Optimization**: The `getActiveAgentRuns` query fetches all runs and filters in memory. For users with many historical runs, this could be slow. Consider adding a status index and filtering at the database level.

2. **Polling**: The UI likely polls for agent run updates. Ensure polling intervals are reasonable (e.g., 5-10 seconds) to avoid overwhelming the backend.

3. **Sandbox Cleanup**: Completed sandboxes should be cleaned up promptly to avoid resource waste. Consider adding a scheduled cleanup job for orphaned sandboxes.

## Code Quality Observations

**Positive**:
- Good separation of concerns between UI components and backend logic
- Proper use of TypeScript types and interfaces
- Consistent error handling patterns
- Good use of Convex's mutation/query/action patterns
- UI components follow existing design patterns in the codebase

**Areas for Improvement**:
- Missing JSDoc comments for complex functions
- Some magic numbers (ports, timeouts) should be constants
- Error messages could be more user-friendly
- Missing unit tests for critical backend logic

## Recommendations

1. **Immediate**: Add DAYTONA_API_KEY to environment configuration and documentation
2. **High Priority**: Add timeout and cleanup logic for sandbox operations
3. **Medium Priority**: Improve error handling and user feedback
4. **Low Priority**: Refactor magic strings and improve code documentation

## Conclusion

The implementation provides a solid foundation for agent task execution with Daytona integration. The critical issue around missing environment variable documentation must be addressed immediately. The high-priority issues around error handling and resource cleanup should be addressed before production use. Overall, the code follows good patterns and integrates well with the existing codebase architecture.

**Overall Risk Level**: MEDIUM (due to missing env var documentation and lack of timeout/cleanup logic)

**Recommendation**: Address critical and high-severity issues before merging to production. The feature is safe for development/staging environments with proper environment configuration.
