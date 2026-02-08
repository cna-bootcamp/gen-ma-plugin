# Claude Code Plugin System - Comprehensive Research Report

## Query
Research the official Claude Code plugin system comprehensively, including plugin structure, SKILL.md format, plugin.json schema, skill invocation, plugin installation, hooks system, agent definitions, commands, and best practices.

---

## Executive Summary

Claude Code plugins are extensions that enhance Claude Code with custom functionality including skills (slash commands), specialized agents, hooks (event handlers), and MCP/LSP servers. Plugins follow a standardized directory structure and can be shared across projects and teams. The system uses a prompt-based meta-tool architecture where skills are injected contextually rather than loaded globally.

---

## 1. Plugin Structure

### 1.1 Standard Directory Layout

```
plugin-name/
├── .claude-plugin/           # Metadata directory (REQUIRED)
│   └── plugin.json          # Plugin manifest (REQUIRED)
├── commands/                 # Slash commands (optional, legacy)
├── skills/                   # Agent Skills (optional, recommended)
│   └── skill-name/
│       ├── SKILL.md         # Skill definition (required)
│       ├── scripts/         # Helper scripts
│       ├── references/      # Documentation
│       └── assets/          # Templates, binaries
├── agents/                   # Specialized agents (optional)
│   └── agent-name.md
├── hooks/                    # Event handlers (optional)
│   └── hooks.json
├── .mcp.json                # MCP server configuration (optional)
├── .lsp.json                # LSP server configuration (optional)
├── README.md                # Documentation
├── LICENSE                  # License file
└── CHANGELOG.md             # Version history
```

**CRITICAL RULE**: Only `plugin.json` goes inside `.claude-plugin/`. All other directories (commands/, agents/, skills/, hooks/) must be at the plugin root level.

### 1.2 Skill Directory Structure

Skills use a self-contained directory with `SKILL.md` as the entry point:

```
skills/
└── skill-name/
    ├── SKILL.md              # Main instructions (REQUIRED)
    ├── scripts/              # Executable Python/Bash scripts
    │   ├── helper.py
    │   └── process.sh
    ├── references/           # Markdown documentation loaded on demand
    │   ├── api-docs.md
    │   └── examples.md
    └── assets/               # Templates and binary files
        └── template.html
```

---

## 2. SKILL.md Format

### 2.1 Complete SKILL.md Structure

Every skill requires a `SKILL.md` file with two parts:

1. **YAML Frontmatter** (between `---` markers): Metadata that helps Claude decide when to use the skill
2. **Markdown Content**: Detailed instructions Claude follows when the skill is invoked

### 2.2 SKILL.md Frontmatter Schema

```yaml
---
name: skill-name                    # Optional: defaults to directory name
description: What this skill does   # RECOMMENDED: primary trigger signal
version: 1.0.0                      # Optional: semantic version
argument-hint: [args]               # Optional: autocomplete hint
disable-model-invocation: false     # Optional: prevent Claude auto-invoke
user-invocable: true                # Optional: show in slash menu
allowed-tools: Read, Grep, Bash     # Optional: pre-approved tools
model: opus                         # Optional: override model
context: fork                       # Optional: run in subagent
agent: Explore                      # Optional: subagent type
hooks: {...}                        # Optional: skill-scoped hooks
license: MIT                        # Optional: attribution
---

# Markdown instructions follow...
```

### 2.3 Frontmatter Field Reference

| Field | Type | Required | Description | Default |
|-------|------|----------|-------------|---------|
| `name` | string | No | Skill identifier (max 64 chars, lowercase, hyphens only) | Directory name |
| `description` | string | **Recommended** | What skill does and when to use it (max 1024 chars) | First paragraph |
| `version` | string | No | Semantic version | None |
| `argument-hint` | string | No | Autocomplete hint (e.g., `[issue-number]`) | None |
| `disable-model-invocation` | boolean | No | Only user can invoke (for `/deploy`, `/commit`) | `false` |
| `user-invocable` | boolean | No | Show in slash menu (false = background knowledge) | `true` |
| `allowed-tools` | string | No | Comma-separated pre-approved tools | None |
| `model` | string | No | Model override (haiku, sonnet, opus) | Default |
| `context` | string | No | Set to `fork` to run in subagent | `inline` |
| `agent` | string | No | Subagent type when `context: fork` | `general-purpose` |
| `hooks` | object | No | Skill-scoped hook configuration | None |
| `license` | string | No | License identifier | None |

### 2.4 Critical Frontmatter Validation Rules

**name field:**
- Maximum 64 characters
- Lowercase letters, numbers, hyphens only
- No XML tags
- No reserved words

**description field:**
- Maximum 1024 characters
- Non-empty
- No XML tags
- **MUST be on a single line** (prettier with `proseWrap: true` breaks parsing)

### 2.5 String Substitutions

Skills support dynamic variable replacement:

| Variable | Description | Example |
|----------|-------------|---------|
| `$ARGUMENTS` | All arguments passed to skill | User types `/review file.ts` → `$ARGUMENTS` = `file.ts` |
| `$ARGUMENTS[N]` | Specific argument by index (0-based) | `$ARGUMENTS[0]` = first argument |
| `$N` | Shorthand for `$ARGUMENTS[N]` | `$0`, `$1`, `$2`, etc. |
| `${CLAUDE_SESSION_ID}` | Current session ID | For logging, session-specific files |
| `${CLAUDE_PLUGIN_ROOT}` | Absolute path to plugin directory | For referencing scripts, configs |

### 2.6 Dynamic Context Injection

The `!`command`` syntax executes shell commands before sending to Claude:

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

## Your task
Summarize this pull request...
```

**Execution flow:**
1. Each `!`command`` executes immediately (preprocessing)
2. Command output replaces the placeholder
3. Claude receives the fully-rendered prompt with actual data

### 2.7 Example SKILL.md

```yaml
---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"
allowed-tools: Read, Grep, Glob
model: sonnet
---

When explaining code, always include:

1. **Start with an analogy**: Compare the code to something from everyday life
2. **Draw a diagram**: Use ASCII art to show the flow, structure, or relationships
3. **Walk through the code**: Explain step-by-step what happens
4. **Highlight a gotcha**: What's a common mistake or misconception?

Keep explanations conversational. For complex concepts, use multiple analogies.

## Additional Resources
- For API details, see [references/api-docs.md](references/api-docs.md)
- For examples, see [examples/sample-explanations.md](examples/sample-explanations.md)
```

---

## 3. plugin.json Schema

### 3.1 Complete Schema

```json
{
  "name": "plugin-name",
  "version": "1.2.0",
  "description": "Brief plugin description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://github.com/author"
  },
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "commands": ["./custom/commands/special.md"],
  "agents": "./custom/agents/",
  "skills": "./custom/skills/",
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json",
  "lspServers": "./.lsp.json",
  "outputStyles": "./styles/"
}
```

### 3.2 Field Reference

#### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Unique identifier (kebab-case, no spaces) | `"deployment-tools"` |

#### Metadata Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `version` | string | Semantic version | `"2.1.0"` |
| `description` | string | Brief explanation of plugin purpose | `"Deployment automation tools"` |
| `author` | object | Author information | `{"name": "Dev Team", "email": "dev@company.com"}` |
| `homepage` | string | Documentation URL | `"https://docs.example.com"` |
| `repository` | string | Source code URL | `"https://github.com/user/plugin"` |
| `license` | string | License identifier | `"MIT"`, `"Apache-2.0"` |
| `keywords` | array | Discovery tags | `["deployment", "ci-cd"]` |

#### Component Path Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `commands` | string\|array | Additional command files/directories | `"./custom/cmd.md"` or `["./cmd1.md"]` |
| `agents` | string\|array | Additional agent files | `"./custom/agents/"` |
| `skills` | string\|array | Additional skill directories | `"./custom/skills/"` |
| `hooks` | string\|object | Hook config path or inline config | `"./hooks.json"` |
| `mcpServers` | string\|object | MCP config path or inline config | `"./mcp-config.json"` |
| `lspServers` | string\|object | LSP config path or inline config | `"./.lsp.json"` |
| `outputStyles` | string\|array | Output style files/directories | `"./styles/"` |

### 3.3 Path Behavior Rules

**Important**: Custom paths **supplement** default directories - they don't replace them.

- If `commands/` exists, it's loaded **in addition to** custom command paths
- All paths must be **relative** to plugin root and start with `./`
- Multiple paths can be specified as arrays

### 3.4 Environment Variables

**`${CLAUDE_PLUGIN_ROOT}`**: Absolute path to your plugin directory. Use in hooks, MCP servers, and scripts.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/process.sh"
          }
        ]
      }
    ]
  }
}
```

---

## 4. Skill Invocation

### 4.1 Invocation Mechanism

Skills operate through a **prompt-based meta-tool architecture**:

1. A meta-tool named `Skill` appears in Claude's tools array alongside Read, Write, Bash
2. Available skills are formatted into text descriptions within the Skill tool's prompt
3. Claude's language model makes selection decisions through native reasoning
4. **No embeddings, classifiers, or ML-based intent detection occur**

### 4.2 Tool Call Pattern

When Claude invokes a skill:

```json
{
  "type": "tool_use",
  "name": "Skill",
  "input": {
    "command": "skill-name",
    "arguments": "optional user arguments"
  }
}
```

System response includes:
- Base path to skill directory
- Full `SKILL.md` content
- Access to bundled scripts relative to that directory

### 4.3 Context Injection Strategy

Skills inject **two distinct user messages** per invocation:

1. **Metadata Message** (`isMeta: false`):
   - Visible XML-formatted status indicator
   - Shows which skill loaded
   - Appears in UI

2. **Skill Prompt Message** (`isMeta: true`):
   - Full instruction set sent to API
   - Hidden from UI
   - Contains complete SKILL.md content

This dual-message design solves transparency-versus-clarity: users see what's happening without being overwhelmed by internal AI instructions.

### 4.4 Invocation Control

| Frontmatter | User Can Invoke | Claude Can Invoke | When Loaded Into Context |
|-------------|-----------------|-------------------|--------------------------|
| (default) | Yes | Yes | Description always in context, full skill loads when invoked |
| `disable-model-invocation: true` | Yes | No | Description not in context, full skill loads when you invoke |
| `user-invocable: false` | No | Yes | Description always in context, full skill loads when invoked |

**Use Cases:**

- `disable-model-invocation: true`: For workflows with side effects (`/deploy`, `/commit`, `/send-slack-message`)
- `user-invocable: false`: For background knowledge that isn't actionable as a command

### 4.5 Token Budget

The system regenerates available skills for each API request, subject to a **15,000-character token budget** (configurable via `SLASH_COMMAND_TOOL_CHAR_BUDGET` environment variable).

Run `/context` to check for warnings about excluded skills.

### 4.6 Progressive Disclosure Pattern

Effective skill design follows **progressive disclosure**:

1. **Show minimal metadata** for discovery (name + description in tool prompt)
2. **Load comprehensive SKILL.md** content only after selection
3. **Reference supplementary resources** on demand (scripts/, references/, assets/)

This prevents context bloat while maintaining robust capabilities.

---

## 5. Plugin Installation

### 5.1 Installation Methods

#### Local Development
```bash
claude --plugin-dir ./my-plugin
```

Loads plugin directly without installation. Useful during development.

#### CLI Installation
```bash
# Install from marketplace
claude plugin install plugin-name@marketplace-name

# Install to specific scope
claude plugin install plugin-name --scope project
claude plugin install plugin-name --scope local
```

#### Marketplace Installation

1. Add marketplace:
   ```bash
   /plugin marketplace add user-or-org/repo-name
   ```

2. Browse and install via `/plugin` menu

### 5.2 Installation Scopes

| Scope | Settings File | Use Case |
|-------|---------------|----------|
| `user` | `~/.claude/settings.json` | Personal plugins across all projects (default) |
| `project` | `.claude/settings.json` | Team plugins shared via version control |
| `local` | `.claude/settings.local.json` | Project-specific, gitignored |
| `managed` | `managed-settings.json` | Managed plugins (read-only, update only) |

### 5.3 Plugin Caching

**Important**: Claude Code copies plugins to a cache directory for security verification.

**For marketplace plugins:**
- Path specified in `source` field is copied recursively
- Example: `"source": "./plugins/my-plugin"` copies entire `./plugins` directory

**For plugins with `.claude-plugin/plugin.json`:**
- Implicit root directory (containing `.claude-plugin/`) is copied recursively

**Path Traversal Limitations:**
- Plugins cannot reference files outside their copied directory
- Paths like `../shared-utils` will not work after installation

**Workarounds:**

1. **Use symlinks** (honored during copy):
   ```bash
   ln -s /path/to/shared-utils ./shared-utils
   ```

2. **Restructure marketplace** to include all required files:
   ```json
   {
     "name": "my-plugin",
     "source": "./",
     "commands": ["./plugins/my-plugin/commands/"],
     "strict": false
   }
   ```

---

## 6. Hooks System

### 6.1 Hook Configuration

**Location**: `hooks/hooks.json` in plugin root, or inline in `plugin.json`

**Format**: JSON configuration with event matchers and actions

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format-code.sh"
          }
        ]
      }
    ]
  }
}
```

### 6.2 Available Events

| Event | When Triggered |
|-------|----------------|
| `PreToolUse` | Before Claude uses any tool |
| `PostToolUse` | After Claude successfully uses any tool |
| `PostToolUseFailure` | After Claude tool execution fails |
| `PermissionRequest` | When a permission dialog is shown |
| `UserPromptSubmit` | When user submits a prompt |
| `Notification` | When Claude Code sends notifications |
| `Stop` | When Claude attempts to stop |
| `SubagentStart` | When a subagent is started |
| `SubagentStop` | When a subagent attempts to stop |
| `SessionStart` | At the beginning of sessions |
| `SessionEnd` | At the end of sessions |
| `PreCompact` | Before conversation history is compacted |

### 6.3 Hook Types

| Type | Description | Example Use Case |
|------|-------------|------------------|
| `command` | Execute shell commands or scripts | Run linters, formatters, deploy scripts |
| `prompt` | Evaluate a prompt with an LLM | Use `$ARGUMENTS` placeholder for context |
| `agent` | Run an agentic verifier with tools | Complex verification tasks |

### 6.4 Hook Input

Commands receive hook input as JSON on stdin. Use `jq` to extract fields:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npm run lint:fix"
          }
        ]
      }
    ]
  }
}
```

---

## 7. Agent Definitions

### 7.1 Agent Structure

**Location**: `agents/` directory in plugin root

**File format**: Markdown files describing agent capabilities

```markdown
---
description: What this agent specializes in
capabilities: ["task1", "task2", "task3"]
---

# Agent Name

Detailed description of the agent's role, expertise, and when Claude should invoke it.

## Capabilities
- Specific task the agent excels at
- Another specialized capability
- When to use this agent vs others

## Context and examples
Provide examples of when this agent should be used and what kinds of problems it solves.
```

### 7.2 Agent Integration

- Agents appear in the `/agents` interface
- Claude can invoke agents automatically based on task context
- Agents can be invoked manually by users
- Plugin agents work alongside built-in Claude agents

### 7.3 Agent Types (Built-in)

| Agent | Specialization | Tools |
|-------|----------------|-------|
| `Explore` | Read-only codebase exploration | Read, Grep, Glob, LSP |
| `Plan` | Strategic planning and design | Limited tools |
| `general-purpose` | Default agent | Standard toolkit |

Custom agents can reference built-in types or define their own configurations.

---

## 8. Commands (Legacy)

**Note**: Commands have been merged into skills. Both `.claude/commands/review.md` and `.claude/skills/review/SKILL.md` create `/review` and work the same way.

**Recommendation**: Use `skills/` for new development as it supports:
- Directory for supporting files
- Frontmatter control over invocation
- Ability for Claude to load automatically

Existing `commands/` files continue to work without changes.

---

## 9. MCP Servers

### 9.1 Configuration

**Location**: `.mcp.json` in plugin root, or inline in `plugin.json`

**Format**: Standard MCP server configuration

```json
{
  "mcpServers": {
    "plugin-database": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": {
        "DB_PATH": "${CLAUDE_PLUGIN_ROOT}/data"
      }
    },
    "plugin-api-client": {
      "command": "npx",
      "args": ["@company/mcp-server", "--plugin-mode"],
      "cwd": "${CLAUDE_PLUGIN_ROOT}"
    }
  }
}
```

### 9.2 Integration Behavior

- Plugin MCP servers start automatically when plugin is enabled
- Servers appear as standard MCP tools in Claude's toolkit
- Server capabilities integrate seamlessly with Claude's existing tools
- Plugin servers can be configured independently of user MCP servers

---

## 10. LSP Servers

### 10.1 Configuration

**Location**: `.lsp.json` in plugin root, or inline in `plugin.json`

**Format**: JSON mapping language server names to configurations

```json
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": {
      ".go": "go"
    }
  }
}
```

### 10.2 Required Fields

| Field | Description |
|-------|-------------|
| `command` | The LSP binary to execute (must be in PATH) |
| `extensionToLanguage` | Maps file extensions to language identifiers |

### 10.3 Optional Fields

| Field | Description |
|-------|-------------|
| `args` | Command-line arguments for the LSP server |
| `transport` | Communication transport: `stdio` (default) or `socket` |
| `env` | Environment variables to set when starting the server |
| `initializationOptions` | Options passed during server initialization |
| `settings` | Settings passed via `workspace/didChangeConfiguration` |
| `workspaceFolder` | Workspace folder path for the server |
| `startupTimeout` | Max time to wait for server startup (milliseconds) |
| `shutdownTimeout` | Max time to wait for graceful shutdown (milliseconds) |
| `restartOnCrash` | Whether to automatically restart if server crashes |
| `maxRestarts` | Maximum number of restart attempts before giving up |

### 10.4 Important Note

**You must install the language server binary separately.** LSP plugins configure how Claude Code connects to a language server, but they don't include the server itself.

**Available Official LSP Plugins:**

| Plugin | Language Server | Install Command |
|--------|----------------|-----------------|
| `pyright-lsp` | Pyright (Python) | `pip install pyright` or `npm install -g pyright` |
| `typescript-lsp` | TypeScript Language Server | `npm install -g typescript-language-server typescript` |
| `rust-lsp` | rust-analyzer | See rust-analyzer installation guide |

---

## 11. Best Practices

### 11.1 Plugin Development

1. **Start standalone, then package**: Begin in `.claude/` for quick iteration, convert to plugin when ready to share
2. **Use semantic versioning**: `MAJOR.MINOR.PATCH` format in `plugin.json`
3. **Document thoroughly**: Include comprehensive README.md with installation and usage instructions
4. **Test with `--plugin-dir`**: Use local loading during development
5. **Validate before distribution**: Use `claude plugin validate` or `/plugin validate`

### 11.2 Skill Design

1. **Write specific descriptions**: Include keywords users would naturally say
2. **Follow progressive disclosure**: Keep SKILL.md focused, move details to separate files
3. **Keep skills under 500 lines**: Move detailed reference material to supporting files
4. **Use clear naming**: Lowercase, hyphens, max 64 characters
5. **Control invocation appropriately**: Use `disable-model-invocation` for side-effect workflows
6. **Pre-approve necessary tools**: Use `allowed-tools` to specify required tools
7. **Test both invocation methods**: Try manual `/skill-name` and let Claude auto-invoke

### 11.3 Hook Best Practices

1. **Make scripts executable**: `chmod +x script.sh`
2. **Use `${CLAUDE_PLUGIN_ROOT}`**: For all plugin-relative paths
3. **Include proper shebang**: `#!/bin/bash` or `#!/usr/bin/env bash`
4. **Test manually first**: `./scripts/your-script.sh` before using in hook
5. **Use specific matchers**: `"Write|Edit"` instead of overly broad patterns

### 11.4 Security

1. **Principle of least privilege**: Only include tools skills actually need
2. **Use tool wildcards cautiously**: `Bash(git *)` restricts to git subcommands
3. **Avoid broad permission grants**: Don't grant unnecessary tool access
4. **Validate user input**: Sanitize `$ARGUMENTS` in scripts
5. **Document security considerations**: Explain what access your plugin needs

### 11.5 Performance

1. **Respect token budget**: Keep skill descriptions concise
2. **Use progressive disclosure**: Load details only when needed
3. **Optimize script execution**: Cache expensive operations
4. **Consider subagent isolation**: Use `context: fork` for resource-intensive tasks

---

## 12. CLI Commands Reference

### Plugin Management

```bash
# Install plugin
claude plugin install <plugin> [--scope user|project|local]

# Uninstall plugin
claude plugin uninstall <plugin> [--scope user|project|local]

# Enable plugin
claude plugin enable <plugin> [--scope user|project|local]

# Disable plugin
claude plugin disable <plugin> [--scope user|project|local]

# Update plugin
claude plugin update <plugin> [--scope user|project|local|managed]

# Load plugin for testing
claude --plugin-dir ./my-plugin

# Load multiple plugins
claude --plugin-dir ./plugin-one --plugin-dir ./plugin-two
```

### Marketplace Management

```bash
# Add marketplace
/plugin marketplace add user-or-org/repo-name

# Browse and install via interactive menu
/plugin
```

---

## 13. Debugging and Troubleshooting

### 13.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Plugin not loading | Invalid `plugin.json` | Validate JSON syntax with `claude plugin validate` |
| Commands not appearing | Wrong directory structure | Ensure `commands/` at root, not in `.claude-plugin/` |
| Hooks not firing | Script not executable | Run `chmod +x script.sh` |
| MCP server fails | Missing `${CLAUDE_PLUGIN_ROOT}` | Use variable for all plugin paths |
| Path errors | Absolute paths used | All paths must be relative and start with `./` |
| LSP `Executable not found` | Language server not installed | Install the binary (e.g., `npm install -g typescript-language-server`) |
| Skill not triggering | Description doesn't match intent | Include keywords users would naturally say |
| Skill triggers too often | Description too broad | Make description more specific |
| Description parsing fails | Multi-line description | Keep description on a single line (prettier breaks it) |

### 13.2 Debugging Commands

```bash
# Show plugin loading details
claude --debug

# Check context and excluded skills
/context

# Validate plugin manifest
claude plugin validate

# Interactive plugin validation
/plugin validate
```

### 13.3 Debug Output

Debug mode shows:
- Which plugins are being loaded
- Any errors in plugin manifests
- Command, agent, and hook registration
- MCP server initialization
- Tool and skill availability

### 13.4 Error Message Examples

**Manifest validation:**
- `Invalid JSON syntax: Unexpected token } in JSON at position 142`
- `Plugin has an invalid manifest file. Validation errors: name: Required`
- `Plugin has a corrupt manifest file. JSON parse error: ...`

**Plugin loading:**
- `Warning: No commands found in plugin my-plugin custom directory: ./cmds`
- `Plugin directory not found at path: ./plugins/my-plugin`
- `Plugin my-plugin has conflicting manifests`

---

## 14. Real-World Example: AI Model Textbook Writer Plugin

### 14.1 Plugin Structure

```
ai-model-textbook-writer/
├── .claude-plugin/
│   └── plugin.json
└── skills/
    └── ai-model-textbook-writer/
        ├── SKILL.md
        ├── references/
        │   ├── textbook-structure.md
        │   ├── writing-style.md
        │   └── example-prompts.md
        └── examples/
            └── textbook-template.md
```

### 14.2 plugin.json

```json
{
  "name": "ai-model-textbook-writer",
  "version": "1.1.0",
  "description": "AI모델 학습교재 작성기 - AI/ML 모델 기술 교육용 교재를 체계적으로 생성하는 플러그인",
  "author": "유니콘주식회사",
  "license": "MIT",
  "repository": "",
  "skills": [
    {
      "name": "ai-model-textbook-writer",
      "path": "skills/ai-model-textbook-writer"
    }
  ],
  "commands": [],
  "agents": [],
  "hooks": []
}
```

### 14.3 SKILL.md Frontmatter

```yaml
---
name: ai-model-textbook-writer
description: This skill should be used when the user asks to "AI모델 교재 만들어줘", "AI모델 학습 자료 작성해줘", "AI모델 튜토리얼 만들어줘", "aid: AI모델 교재", "create AI model textbook", "write AI model tutorial", or needs guidance on creating AI/ML model educational materials with practical code examples. Specialized for Korean technical education content following the develop-agent textbook pattern.
version: 1.1.0
---
```

### 14.4 Key Features

1. **Progressive disclosure**: Main SKILL.md (~237 lines) with references to detailed guides
2. **Supporting files**: Separate markdown files for structure, style, and example prompts
3. **Template system**: Example textbook template in examples/ directory
4. **Phase-based workflow**: Phase 0 → 1 → 2 → 3 → 4 (requirements → structure → content → review)
5. **Validation checklist**: Built-in verification steps before completion

---

## 15. Distribution and Sharing

### 15.1 Distribution Methods

| Method | Audience | Implementation |
|--------|----------|----------------|
| **Project skills** | Team members | Commit `.claude/skills/` to version control |
| **Plugins** | Team or community | Create plugin with `.claude-plugin/plugin.json` |
| **Marketplace** | Wide distribution | Create marketplace repository |
| **Managed settings** | Organization-wide | Deploy through enterprise IAM |

### 15.2 Version Management

Follow semantic versioning:

- **MAJOR**: Breaking changes (incompatible API changes)
- **MINOR**: New features (backward-compatible additions)
- **PATCH**: Bug fixes (backward-compatible fixes)

Best practices:
- Start at `1.0.0` for first stable release
- Update version in `plugin.json` before distributing changes
- Document changes in `CHANGELOG.md`
- Use pre-release versions like `2.0.0-beta.1` for testing

### 15.3 Marketplace Creation

Create `marketplace.json` in your repository:

```json
{
  "name": "my-marketplace",
  "description": "Collection of productivity plugins",
  "plugins": [
    {
      "name": "plugin-one",
      "source": "./plugins/plugin-one",
      "description": "First plugin",
      "version": "1.0.0"
    }
  ]
}
```

Users add your marketplace:
```bash
/plugin marketplace add username/repo-name
```

---

## Sources

### Official Documentation
- [Create plugins - Claude Code Docs](https://code.claude.com/docs/en/plugins)
- [Plugins reference - Claude Code Docs](https://code.claude.com/docs/en/plugins-reference)
- [Extend Claude with skills - Claude Code Docs](https://code.claude.com/docs/en/skills)
- [How to create custom Skills | Claude Help Center](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills)
- [claude-code/plugins/README.md at main · anthropics/claude-code](https://github.com/anthropics/claude-code/blob/main/plugins/README.md)

### Technical Deep Dives
- [Inside Claude Code Skills: Structure, prompts, invocation | Mikhail Shilkov](https://mikhail.io/2025/10/claude-code-skills/)
- [Claude Agent Skills: A First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)
- [Skill authoring best practices - Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

### Community Resources
- [GitHub - anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
- [Claude Code Plugins & Agent Skills - Community Registry](https://claude-plugins.dev/)
- [GitHub - travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills)
- [Oh-My-ClaudeCode GitHub Repository](https://github.com/Yeachan-Heo/oh-my-claudecode)

### Additional Resources
- [Customize Claude Code with plugins | Claude Blog](https://claude.com/blog/claude-code-plugins)
- [How to Build Your Own Claude Code Plugin (Complete Guide) | Agnost AI Blog](https://agnost.ai/blog/claude-code-plugins-guide/)
- [Building My First Claude Code Plugin | alexop.dev](https://alexop.dev/posts/building-my-first-claude-code-plugin/)

---

## Conclusion

The Claude Code plugin system provides a powerful, extensible architecture for customizing Claude's capabilities through:

1. **Skills**: Prompt-based instructions that extend what Claude can do
2. **Agents**: Specialized subagents for specific tasks
3. **Hooks**: Event-driven automation for workflow enhancement
4. **MCP/LSP Servers**: Integration with external tools and language intelligence

The system follows a **progressive disclosure** philosophy where skills are discovered through minimal metadata but can access comprehensive resources on demand. This keeps the main context efficient while maintaining powerful extensibility.

Key architectural principles:
- **Prompt-based meta-tools** (no executable routing logic)
- **Contextual injection** (skills loaded only when relevant)
- **Principle of least privilege** (minimal tool permissions)
- **Progressive disclosure** (show less, load more on demand)

The plugin ecosystem supports everything from simple slash commands to complex multi-phase workflows with bundled scripts, templates, and documentation.
