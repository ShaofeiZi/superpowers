# Superpowers 发布说明

## v4.3.1 (2026-02-21)

### 新增功能

**Cursor 支持**

Superpowers 现已支持 Cursor 的插件系统。包含 `.cursor-plugin/plugin.json` 清单文件和 README 中 Cursor 特定的安装说明。SessionStart hook 输出现在包含一个 `additional_context` 字段，以及现有的 `hookSpecificOutput.additionalContext` 字段，以实现 Cursor hook 兼容性。

### 修复

**Windows：恢复混合包装器以确保 hook 可靠执行 (#518, #504, #491, #487, #466, #440)**

Claude Code 在 Windows 上的 `.sh` 自动检测会在 hook 命令前添加 `bash`，导致执行失败。修复方法：

- 将 `session-start.sh` 重命名为 `session-start`（无扩展名），以避免自动检测干扰
- 恢复 `run-hook.cmd` 混合包装器，支持多位置 bash 发现（标准 Git for Windows 路径，然后是 PATH 回退）
- 如果未找到 bash 则静默退出，而不是报错
- 在 Unix 上，包装器通过 `exec bash` 直接运行脚本
- 使用 POSIX 安全的 `dirname "$0"` 路径解析（适用于 dash/sh，不仅仅是 bash）

这修复了以下问题：Windows 上路径包含空格时 SessionStart 失败、缺少 WSL、`set -euo pipefail` 在 MSYS 上的脆弱性，以及反斜杠损坏问题。

## v4.3.0 (2026-02-12)

此修复应该显著提高 superpowers skills 的合规性，并减少 Claude 无意中进入其原生计划模式的机会。

### 更改

**Brainstorming skill 现在强制执行其工作流程，而不是描述它**

模型会跳过设计阶段，直接跳转到实现技能（如 frontend-design），或者将整个头脑风暴过程压缩成单个文本块。该 skill 现在使用硬门控、强制检查清单和 graphviz 流程图来强制合规：

- `<HARD-GATE>`：在设计被呈现并获得用户批准之前，禁止使用任何实现技能、代码或脚手架
- 明确的检查清单（6 项），必须作为任务创建并按顺序完成
- Graphviz 流程图，`writing-plans` 是唯一有效的终止状态
- 警告"这太简单不需要设计"的反模式——这是模型用来跳过流程的典型理由
- 根据部分复杂度调整设计部分大小，而不是项目复杂度

**Using-superpowers 工作流图拦截 EnterPlanMode**

在 skill 流程图中添加了 `EnterPlanMode` 拦截。当模型即将进入 Claude 的原生计划模式时，它会检查是否发生了头脑风暴，并通过头脑风暴 skill 进行路由。计划模式永远不会进入。

### 修复

**SessionStart hook 现在同步运行**

在 hooks.json 中将 `async: true` 改为 `async: false`。当异步时，hook 可能在模型的第一次交互之前未能完成，意味着 using-superpowers 指令不在第一次消息的上下文中。

## v4.2.0 (2026-02-05)

### 破坏性更改

**Codex：用原生 skill 发现替换 bootstrap CLI**

`superpowers-codex` bootstrap CLI、Windows `.cmd` 包装器和相关的 bootstrap 内容文件已被移除。Codex 现在通过 `~/.agents/skills/superpowers/` 符号链接使用原生 skill 发现，因此旧的 `use_skill`/`find_skills` CLI 工具不再需要。

安装现在只需要克隆 + 符号链接（在 INSTALL.md 中有文档）。不需要 Node.js 依赖。旧的 `~/.codex/skills/` 路径已被弃用。

### 修复

**Windows：修复 Claude Code 2.1.x hook 执行 (#331)**

Claude Code 2.1.x 更改了在 Windows 上的 hook 执行方式：它现在自动检测命令中的 `.sh` 文件并添加 `bash` 前缀。这破坏了混合包装器模式，因为 `bash "run-hook.cmd" session-start.sh` 尝试将 `.cmd` 文件作为 bash 脚本执行。

修复：hooks.json 现在直接调用 session-start.sh。Claude Code 2.1.x 自动处理 bash 调用。还添加了 .gitattributes 来强制 shell 脚本使用 LF 行尾（修复 Windows 检出时的 CRLF 问题）。

**Windows：SessionStart hook 异步运行以防止终端冻结 (#404, #413, #414, #419)**

同步的 SessionStart hook 阻塞了 Windows 上的 TUI 进入原始模式，冻结了所有键盘输入。异步运行 hook 可以防止冻结，同时仍然注入 superpowers 上下文。

**Windows：修复 O(n^2) `escape_for_json` 性能**

使用 `${input:$i:1}` 的逐字符循环在 bash 中由于子字符串复制开销是 O(n^2)。在 Windows Git Bash 上这需要 60 多秒。替换为 bash 参数替换（`${s//old/new}`），它将每个模式作为单个 C 级传递运行——在 macOS 上快 7 倍，在 Windows 上显著更快。

**Codex：修复 Windows/PowerShell 调用 (#285, #243)**

- Windows 不尊重 shebang，因此直接调用无扩展名的 `superpowers-codex` 脚本会触发"打开方式"对话框。所有调用现在都添加 `node` 前缀。
- 修复 Windows 上的 `~/` 路径展开——PowerShell 在作为参数传递给 `node` 时不会展开 `~`。改用 `$HOME`，它在 bash 和 PowerShell 中都能正确展开。

**Codex：修复安装程序中的路径解析**

使用 `fileURLToPath()` 而不是手动 URL 路径名解析，以正确处理所有平台上包含空格和特殊字符的路径。

**Codex：修复 writing-skills 中的过时 skills 路径**

将过时的 `~/.codex/skills/` 引用更新为 `~/.agents/skills/` 以支持原生发现。

### 改进

**在实现之前必须使用 worktree 隔离**

将 `using-git-worktrees` 添加为 `subagent-driven-development` 和 `executing-plans` 的必需 skill。实现工作流现在明确要求在开始工作之前设置隔离的 worktree，防止直接在 main 上工作。

**主分支保护软化为需要明确同意**

不再完全禁止在 main 分支上工作，skills 现在允许在获得用户明确同意的情况下进行。更灵活，同时仍确保用户意识到其含义。

**简化安装验证**

从验证步骤中移除了 `/help` 命令检查和特定斜杠命令列表。Skills 主要通过描述你想做什么来调用，而不是运行特定命令。

**Codex：澄清 bootstrap 中的 subagent 工具映射**

改进了 Codex 工具如何映射到用于 subagent 工作流的 Claude Code 等价物的文档。

### 测试

- 为 subagent-driven-development 添加了 worktree 需求测试
- 为主分支红色警告添加了测试
- 修复了 skill 识别测试断言中的大小写敏感性

---

## v4.1.1 (2026-01-23)

### 修复

**OpenCode：按照官方文档标准化使用 `plugins/` 目录 (#343)**

OpenCode 的官方文档使用 `~/.config/opencode/plugins/`（复数）。我们之前的文档使用 `plugin/`（单数）。虽然 OpenCode 接受两种形式，但我们已按照官方约定进行标准化以避免混淆。

更改：
- 将仓库中的 `.opencode/plugin/` 重命名为 `.opencode/plugins/`
- 更新了所有平台的安装文档（INSTALL.md、README.opencode.md）
- 更新了测试脚本以匹配

**OpenCode：修复符号链接说明 (#339, #342)**

- 在 `ln -s` 之前添加了显式的 `rm`（修复重新安装时的"文件已存在"错误）
- 添加了缺失的 skills 符号链接步骤，该步骤之前在 INSTALL.md 中缺失
- 将过时的 `use_skill`/`find_skills` 更新为原生的 `skill` 工具引用

---

## v4.1.0 (2026-01-23)

### 破坏性更改

**OpenCode：切换到原生 skills 系统**

Superpowers for OpenCode 现在使用 OpenCode 原生的 `skill` 工具，而不是自定义的 `use_skill`/`find_skills` 工具。这是一个更干净的集成，与 OpenCode 内置的 skill 发现配合工作。

**需要迁移：** Skills 必须符号链接到 `~/.config/opencode/skills/superpowers/`（请参阅更新的安装文档）。

### 修复

**OpenCode：修复会话开始时的 agent 重置 (#226)**

之前使用 `session.prompt({ noReply: true })` 的 bootstrap 注入方法导致 OpenCode 在第一条消息时将选定的 agent 重置为"build"。现在使用 `experimental.chat.system.transform` hook，它直接修改系统提示而没有副作用。

**OpenCode：修复 Windows 安装 (#232)**

- 移除了对 `skills-core.js` 的依赖（消除了当文件被复制而不是符号链接时损坏的相对导入问题）
- 为 cmd.exe、PowerShell 和 Git Bash 添加了全面的 Windows 安装文档
- 记录了每个平台正确的符号链接与 junction 使用方式

**Claude Code：修复 Claude Code 2.1.x 的 Windows hook 执行**

Claude Code 2.1.x 更改了在 Windows 上的 hook 执行方式：它现在自动检测命令中的 `.sh` 文件并添加 `bash` 前缀。这破坏了混合包装器模式，因为 `bash "run-hook.cmd" session-start.sh` 尝试将 .cmd 文件作为 bash 脚本执行。

修复：hooks.json 现在直接调用 session-start.sh。Claude Code 2.1.x 自动处理 bash 调用。还添加了 .gitattributes 来强制 shell 脚本使用 LF 行尾（修复 Windows 检出时的 CRLF 问题）。

---

## v4.0.3 (2025-12-26)

### 改进

**强化了 using-superpowers skill 以处理显式的 skill 请求**

解决了一个失败模式，即即使用户明确按名称请求 skill（例如"subagent-driven-development，请"），Claude 也会跳过调用它。Claude 会认为"我知道那是什么意思"并直接开始工作，而不是加载 skill。

更改：
- 更新"The Rule"为"调用相关或请求的 skills"而不是"检查 skills"——强调主动调用而不是被动检查
- 添加了"在任何响应或行动之前"——原来的措辞只提到"响应"，但 Claude 有时会在回复之前采取行动
- 添加了调用错误的 skill 是可以的保证——减少犹豫
- 添加了新的红色警告："我知道那是什么意思"→ 知道概念 ≠ 使用 skill

**添加了显式 skill 请求测试**

新的测试套件位于 `tests/explicit-skill-requests/`，验证 Claude 在用户按名称请求时正确调用 skills。包括单轮和多轮测试场景。

## v4.0.2 (2025-12-23)

### 修复

**斜杠命令现在仅限用户**

在所有三个斜杠命令（`/brainstorm`、`/execute-plan`、`/write-plan`）中添加了 `disable-model-invocation: true`。Claude 无法再通过 Skill 工具调用这些命令——它们仅限于手动用户调用。

底层的 skills（`superpowers:brainstorming`、`superpowers:executing-plans`、`superpowers:writing-plans`）仍然可供 Claude 自主调用。这一更改防止了当 Claude 调用一个只是重定向到 skill 的命令时产生的混淆。

## v4.0.1 (2025-12-23)

### 修复

**澄清了如何在 Claude Code 中访问 skills**

修复了一个令人困惑的模式，即 Claude 会通过 Skill 工具调用一个 skill，然后尝试单独读取 skill 文件。`using-superpowers` skill 现在明确指出 Skill 工具直接加载 skill 内容——无需读取文件。

- 在 `using-superpowers` 中添加了"如何访问 Skills"部分
- 将"读取 skill"改为"调用 skill"
- 更新斜杠命令以使用完全限定的 skill 名称（例如 `superpowers:brainstorming`）

**在 receiving-code-review 中添加了 GitHub 线程回复指南**（h/t @ralphbean）

添加了关于在原始线程中回复内联审查评论的说明，而不是作为顶级 PR 评论。

**在 writing-skills 中添加了自动化优于文档的指南**（h/t @EthanJStark）

添加了指导：机械约束应该自动化，而不是文档化——将 skills 用于判断。

## v4.0.0 (2025-12-17)

### 新功能

**subagent-driven-development 中的两阶段代码审查**

Subagent 工作流现在在每个任务后使用两个独立的审查阶段：

1. **规范合规审查** - 怀疑的审查者验证实现与规范完全匹配。捕获缺失的需求和过度构建。不会信任实现者的报告——读取实际代码。

2. **代码质量审查** - 仅在规范合规通过后运行。审查代码清洁度、测试覆盖率、可维护性。

这捕获了代码写得很好但不符合请求的常见失败模式。审查是循环的，不是一次性的：如果审查者发现问题，实现者修复它们，然后审查者再次检查。

其他 subagent 工作流改进：
- Controller 向 worker 提供完整任务文本（而不是文件引用）
- Worker 可以在工作之前和工作期间提出澄清问题
- 报告完成前的自检清单
- 计划在开始时读取一次，提取到 TodoWrite

新的提示模板位于 `skills/subagent-driven-development/`：
- `implementer-prompt.md` - 包含自检清单，鼓励提问
- `spec-reviewer-prompt.md` - 对需求的怀疑性验证
- `code-quality-reviewer-prompt.md` - 标准代码审查

**调试技术与工具合并**

`systematic-debugging` 现在捆绑了支持技术和工具：
- `root-cause-tracing.md` - 通过调用堆栈向后追踪 bug
- `defense-in-depth.md` - 在多层添加验证
- `condition-based-waiting.md` - 用条件轮询替换任意超时
- `find-polluter.sh` - 二分查找脚本，找到哪个测试造成了污染
- `condition-based-waiting-example.ts` - 来自真实调试会话的完整实现

**测试反模式参考**

`test-driven-development` 现在包含 `testing-anti-patterns.md`，涵盖：
- 测试 mock 行为而不是真实行为
- 向生产类添加仅测试的方法
- 在不理解依赖的情况下进行 mock
- 隐藏结构假设的不完整 mock

**Skill 测试基础设施**

三个新的测试框架用于验证 skill 行为：

`tests/skill-triggering/` - 验证 skills 从朴素提示中触发，无需显式命名。测试 6 个 skills 以确保仅描述就足够。

`tests/claude-code/` - 使用 `claude -p` 进行集成测试的头部测试。通过会话转录（JSONL）分析验证 skill 使用情况。包括用于成本跟踪的 `analyze-token-usage.py`。

`tests/subagent-driven-dev/` - 端到端工作流验证，包含两个完整的测试项目：
- `go-fractals/` - 具有 Sierpinski/Mandelbrot 的 CLI 工具（10 个任务）
- `svelte-todo/` - 具有 localStorage 和 Playwright 的 CRUD 应用（12 个任务）

### 主要更改

**DOT 流程图作为可执行规范**

使用 DOT/GraphViz 流程图作为权威流程定义重写了关键 skills。散文成为支持内容。

**描述陷阱**（在 `writing-skills` 中记录）：发现当描述包含工作流摘要时，skill 描述会覆盖流程图内容。Claude 遵循简短描述而不是阅读详细的流程图。修复：描述必须是仅触发性的（"当 X 时使用"），没有流程细节。

**using-superpowers 中的 skill 优先级**

当多个 skills 适用时，处理 skills（brainstorming、调试）现在明确排在实现 skills 之前。"构建 X"首先触发头脑风暴，然后是域 skills。

**brainstorming 触发强化**

描述改为祈使句："你必须在任何创造性工作之前使用此技能——创建功能、构建组件、添加功能或修改行为。"

### 破坏性更改

**Skill 整合** - 六个独立 skills 合并：
- `root-cause-tracing`、`defense-in-depth`、`condition-based-waiting` → 捆绑在 `systematic-debugging/`
- `testing-skills-with-subagents` → 捆绑在 `writing-skills/`
- `testing-anti-patterns` → 捆绑在 `test-driven-development/`
- `sharing-skills` 已移除（过时）

### 其他改进

- **render-graphs.js** - 从 skills 中提取 DOT 图表并渲染到 SVG 的工具
- **using-superpowers 中的合理化表格** - 可扫描格式，包括新条目："我需要更多上下文"、"让我先探索"、"这感觉很有成效"
- **docs/testing.md** - 使用 Claude Code 集成测试测试 skills 的指南

---

## v3.6.2 (2025-12-03)

### 修复

- **Linux 兼容性**：修复了混合 hook 包装器（`run-hook.cmd`）以使用符合 POSIX 的语法
  - 在第 16 行将 bash 特定的 `${BASH_SOURCE[0]:-$0}` 替换为标准的 `$0`
  - 解决了 Ubuntu/Debian 系统上 `/bin/sh` 是 dash 时的"错误替换"错误
  - 修复 #141

---

## v3.5.1 (2025-11-24)

### 更改

- **OpenCode Bootstrap 重构**：从 `chat.message` hook 切换到 `session.created` 事件进行 bootstrap 注入
  - Bootstrap 现在通过 `session.prompt()` 和 `noReply: true` 在会话创建时注入
  - 明确告诉模型 using-superpowers 已经加载，以防止冗余的 skill 加载
  - 将 bootstrap 内容生成整合到共享的 `getBootstrapContent()` 帮助函数中
  - 更清洁的单一实现方法（移除了回退模式）

---

## v3.5.0 (2025-11-23)

### 新增功能

- **OpenCode 支持**：OpenCode.ai 的原生 JavaScript 插件
  - 自定义工具：`use_skill` 和 `find_skills`
  - 消息插入模式，用于在上下文压缩时保持 skill 持久化
  - 通过 chat.message hook 自动上下文注入
  - 在 session.compacted 事件上自动重新注入
  - 三层 skill 优先级：项目 > 个人 > superpowers
  - 项目本地 skills 支持（`.opencode/skills/`）
  - 共享核心模块（`lib/skills-core.js`）用于与 Codex 的代码重用
  - 具有适当隔离的自动化测试套件（`tests/opencode/`）
  - 平台特定文档（`docs/README.opencode.md`、`docs/README.codex.md`）

### 更改

- **重构 Codex 实现**：现在使用共享的 `lib/skills-core.js` ES 模块
  - 消除了 Codex 和 OpenCode 之间的代码重复
  - skill 发现和解析的单一事实来源
  - Codex 通过 Node.js 互操作成功加载 ES 模块

- **改进文档**：重写 README 以清晰解释问题和解决方案
  - 移除了重复部分和冲突信息
  - 添加了完整工作流描述（头脑风暴 → 计划 → 执行 → 完成）
  - 简化了平台安装说明
  - 强调 skill 检查协议而不是自动激活声明

---

## v3.4.1 (2025-10-31)

### 改进

- 优化了 superpowers bootstrap 以消除冗余的 skill 执行。`using-superpowers` skill 内容现在直接在会话上下文中提供，并明确指导仅对其他 skills 使用 Skill 工具。这减少了开销，并防止了 agents 尽管在会话开始时已经拥有内容却手动执行 `using-superpowers` 的令人困惑的循环。

## v3.4.0 (2025-10-30)

### 改进

- 简化了 `brainstorming` skill 以回归原始的对话愿景。移除了繁重的 6 阶段流程和正式检查清单，转而采用自然对话：一次问一个问题，然后以 200-300 字的部分呈现设计并进行验证。保留了文档和实现交接功能。

## v3.3.1 (2025-10-28)

### 改进

- 更新了 `brainstorming` skill，要求自主探索后再提问，鼓励基于推荐做决定，并防止 agents 将优先级排序委派回给人类。
- 按照 Strunk 的"风格要素"原则改进了 `brainstorming` skill 的写作清晰度（省略不必要的词、转换否定为肯定、改善平行结构）。

### Bug 修复

- 澄清了 `writing-skills` 指导，使其指向正确的 agent 特定的个人 skill 目录（Claude Code 使用 `~/.claude/skills`，Codex 使用 `~/.codex/skills`）。

## v3.3.0 (2025-10-28)

### 新功能

**实验性 Codex 支持**
- 添加了具有 bootstrap/use-skill/find-skills 命令的统一 `superpowers-codex` 脚本
- 跨平台 Node.js 实现（适用于 Windows、macOS、Linux）
- 命名空间 skills：superpowers skills 使用 `superpowers:skill-name`，个人 skills 使用 `skill-name`
- 个人 skills 在名称匹配时覆盖 superpowers skills
- 清晰的 skill 显示：显示名称/描述而不带原始 frontmatter
- 有用的上下文：显示每个 skill 的支持文件目录
- Codex 的工具映射：TodoWrite→update_plan、subagents→手动回退等
- Bootstrap 集成，带有用于自动启动的最小 AGENTS.md
- 专门针对 Codex 的完整安装指南和 bootstrap 说明

**与 Claude Code 集成的关键区别：**
- 单一统一脚本而不是单独的工具
- Codex 特定等价物的工具替换系统
- 简化的 subagent 处理（手动工作而不是委托）
- 更新了术语："Superpowers skills"而不是"Core skills"

### 添加的文件
- `.codex/INSTALL.md` - Codex 用户的安装指南
- `.codex/superpowers-bootstrap.md` - 带有 Codex 适配的 bootstrap 说明
- `.codex/superpowers-codex` - 具有所有功能的统一 Node.js 可执行文件

**注意：** Codex 支持是实验性的。该集成提供了核心 superpowers 功能，但可能需要根据用户反馈进行改进。

## v3.2.3 (2025-10-23)

### 改进

**更新了 using-superpowers skill 以使用 Skill 工具而不是 Read 工具**
- 将 skill 调用说明从 Read 工具改为 Skill 工具
- 更新了描述："使用 Read 工具"→"使用 Skill 工具"
- 更新了第 3 步："使用 Read 工具"→"使用 Skill 工具读取和运行"
- 更新了合理化列表："读取当前版本"→"运行当前版本"

Skill 工具是在 Claude Code 中调用 skills 的正确机制。此更新修正了 bootstrap 说明，以引导 agents 使用正确的工具。

### 修改的文件
- 更新了：`skills/using-superpowers/SKILL.md` - 将工具引用从 Read 改为 Skill

## v3.2.2 (2025-10-21)

### 改进

**强化了 using-superpowers skill 以防止 agent 合理化**
- 添加了带有绝对语言的 EXTREMELY-IMPORTANT 块，关于强制性的 skill 检查
  - "即使有 1% 的机会适用，你必须阅读它"
  - "你没有选择。你不能通过合理化逃脱。"
- 添加了 MANDATORY FIRST RESPONSE PROTOCOL 检查清单
  - agents 必须在任何响应之前完成的 5 步流程
  - 明确"没有这个就回复 = 失败"的后果
- 添加了常见合理化部分，包含 8 种特定的回避模式
  - "这只是一个简单的问题"→ 错误
  - "我可以快速检查文件"→ 错误
  - "让我先收集信息"→ 错误
  - 加上在 agent 行为中观察到的另外 5 种常见模式

这些更改解决了 agent 尽管有明确说明但仍围绕 skill 使用进行合理化的行为。有力的语言和先发制人的论点旨在使不遵守更加困难。

### 修改的文件
- 更新了：`skills/using-superpowers/SKILL.md` - 添加了三层 enforcement 以防止 skill 跳过合理化

## v3.2.1 (2025-10-20)

### 新功能

**代码审查 agent 现在包含在插件中**
- 在插件的 `agents/` 目录中添加了 `superpowers:code-reviewer` agent
- Agent 提供针对计划和编码标准的系统性代码审查
- 之前需要用户拥有个人 agent 配置
- 所有 skill 引用更新为使用命名空间的 `superpowers:code-reviewer`
- 修复 #55

### 修改的文件
- 新增：`agents/code-reviewer.md` - 带有审查清单和输出格式的 Agent 定义
- 更新了：`skills/requesting-code-review/SKILL.md` - 引用 `superpowers:code-reviewer`
- 更新了：`skills/subagent-driven-development/SKILL.md` - 引用 `superpowers:code-reviewer`

## v3.2.0 (2025-10-18)

### 新功能

**Brainstorming 工作流中的设计文档**
- 在 brainstorming skill 中添加了第 4 阶段：设计文档
- 设计文档现在在实现之前写入 `docs/plans/YYYY-MM-DD-<topic>-design.md`
- 恢复了原始 brainstorming 命令在 skill 转换过程中丢失的功能
- 在 worktree 设置和实现规划之前编写文档
- 用 subagent 测试以验证在时间压力下的合规性

### 破坏性更改

**Skill 引用命名空间标准化**
- 所有内部 skill 引用现在使用 `superpowers:` 命名空间前缀
- 更新格式：`superpowers:test-driven-development`（之前只是 `test-driven-development`）
- 影响所有 REQUIRED SUB-SKILL、REOMMENDED SUB-SKILL 和 REQUIRED BACKGROUND 引用
- 与使用 Skill 工具调用 skills 的方式保持一致
- 更新的文件：brainstorming、executing-plans、subagent-driven-development、systematic-debugging、testing-skills-with-subagents、writing-plans、writing-skills

### 改进

**设计与实现计划命名**
- 设计文档使用 `-design.md` 后缀以防止文件名冲突
- 实现计划继续使用现有的 `YYYY-MM-DD-<feature-name>.md` 格式
- 两者都存储在 `docs/plans/` 目录中，命名清晰区分

## v3.1.1 (2025-10-17)

### Bug 修复

- **修复了 README 中的命令语法** (#44) - 更新了所有命令引用以使用正确的命名空间语法（`/superpowers:brainstorm` 而不是 `/brainstorm`）。插件提供的命令由 Claude Code 自动命名空间化以避免插件之间的冲突。

## v3.1.0 (2025-10-17)

### 破坏性更改

**Skill 名称标准化为小写**
- 所有 skill frontmatter `name:` 字段现在使用与目录名匹配的小写 kebab-case
- 示例：`brainstorming`、`test-driven-development`、`using-git-worktrees`
- 所有 skill 公告和交叉引用都更新为小写格式
- 这确保了目录名、frontmatter 和文档之间的命名一致

### 新功能

**增强的 brainstorming skill**
- 添加了显示阶段、活动和工具使用的快速参考表
- 添加了用于跟踪进度的可复制工作流检查清单
- 添加了关于何时返回早期阶段的决策流程图
- 添加了全面的 AskUserQuestion 工具指导，带有具体示例
- 添加了"问题模式"部分，解释何时使用结构化与开放式问题
- 将关键原则重构为可扫描的表格

**Anthropic 最佳实践集成**
- 添加了 `skills/willing-skills/anthropic-best-practices.md` - 官方 Anthropic skill 创作指南
- 在 writing-skills SKILL.md 中引用以获得全面指导
- 提供了渐进式披露、工作流和评估的模式

### 改进

**Skill 交叉引用清晰度**
- 所有 skill 引用现在使用明确的 requirement 标记：
  - `**REQUIRED BACKGROUND:**` - 你必须理解的先决条件
  - `**REQUIRED SUB-SKILL:**` - 必须在工作流中使用的 skills
  - `**Complementary skills:**` - 可选但有帮助的相关 skills
- 移除了旧的路径格式（`skills/collaboration/X` → 只是 `X`）
- 更新了带有分类关系的集成部分（必需 vs 补充）
- 更新了交叉引用文档和最佳实践

**与 Anthropic 最佳实践对齐**
- 修复了描述语法和语气（完全第三人称）
- 添加了扫描用的快速参考表
- 添加了 Claude 可以复制和跟踪的工作流检查清单
- 适当使用流程图处理非显而易见的决策点
- 改进了可扫描的表格格式
- 所有 skills 都远低于 500 行建议

### Bug 修复

- **重新添加了缺失的命令重定向** - 恢复了 v3.0 迁移中意外移除的 `commands/brainstorm.md` 和 `commands/write-plan.md`
- 修复了 `defense-in-depth` 名称不匹配（之前是 `Defense-in-Depth-Validation`）
- 修复了 `receiving-code-review` 名称不匹配（之前是 `Code-Review-Reception`）
- 修复了 `commands/brainstorm.md` 对正确 skill 名称的引用
- 移除了对不存在的相关 skills 的引用

### 文档

**writing-skills 改进**
- 更新了交叉引用指导，带有明确的 requirement 标记
- 添加了对 Anthropic 官方最佳实践的引用
- 改进了显示正确 skill 引用格式的示例

## v3.0.1 (2025-10-16)

### 更改

我们现在使用 Anthropic 的第一方 skills 系统！

## v2.0.2 (2025-10-12)

### Bug 修复

- **修复了当本地 skills 仓库领先于上游时的错误警告** - 初始化脚本在本地仓库有领先于上游的提交时错误地警告"有新 skills 可用"。逻辑现在正确区分三种 git 状态：本地落后（应该更新）、本地领先（不警告）、已分叉（应该警告）。

## v2.0.1 (2025-10-12)

### Bug 修复

- **修复了插件上下文中的 session-start hook 执行** (#8, PR #9) - hook 静默失败并显示"插件 hook 错误"，阻止 skills 上下文加载。修复方法：
  - 在 Claude Code 执行上下文中 BASH_SOURCE 未绑定时使用 `${BASH_SOURCE[0]:-$0}` 回退
  - 添加 `|| true` 以在过滤状态标志时优雅地处理空 grep 结果

---

# Superpowers v2.0.0 发布说明

## 概述

Superpowers v2.0 通过重大架构转变使 skills 更容易访问、维护和社区驱动。

头条变化是 **skills 仓库分离**：所有 skills、脚本和文档已从插件移至专用仓库（[obra/superpowers-skills](https://github.com/obra/superpowers-skills)）。这将 superpowers 从单一插件转变为管理本地克隆 skills 仓库的轻量级 shim。Skills 在会话开始时自动更新。用户通过标准 git 工作流分叉并贡献改进。Skills 库独立于插件版本。

除了基础设施，本次发布还添加了九个专注于解决问题、研究和架构的新 skills。我们用祈使语气和更清晰的结构重写了核心 **using-skills** 文档，使 Claude 更容易理解何时以及如何使用 skills。**find-skills** 现在输出可以直接粘贴到 Read 工具中的路径，消除了 skills 发现工作流中的摩擦。

用户体验无缝运作：插件自动处理克隆、分叉和更新。贡献者发现新架构使改进和共享 skills 变得轻而易举。本次发布为 skills 作为社区资源快速发展奠定了基础。

### 破坏性更改

**Skills 仓库分离**

**最大变化：** Skills 不再存在于插件中。它们已移至 [obra/superpowers-skills](https://github.com/obra/superpowers-skills) 的单独仓库。

**这对你意味着什么：**

- **首次安装：** 插件自动克隆 skills 到 `~/.config/superpowers/skills/`
- **分叉：** 在设置期间，如果安装了 `gh`，系统会询问是否创建 skills 仓库的分叉
- **更新：** Skills 在会话开始时自动更新（尽可能快进）
- **贡献：** 在分支上工作，在本地提交，向上游提交 PR
- **不再有覆盖：** 旧的两层系统（个人/核心）被单一仓库分支工作流取代

**迁移：**

如果你有现有安装：
1. 你的旧 `~/.config/superpowers/.git` 将备份到 `~/.config/superpowers/.git.bak`
2. 旧 skills 将备份到 `~/.config/superpowers/skills.bak`
3. 将在 `~/.config/superpowers/skills/` 创建 obra/superpowers-skills 的新克隆

### 移除的功能

- **个人 superpowers 叠加系统** - 被 git 分支工作流取代
- **setup-personal-superpowers hook** - 被 initialize-skills.sh 取代

## 新功能

### Skills 仓库基础设施

**自动克隆和设置** (`lib/initialize-skills.sh`)
- 首次运行时克隆 obra/superpowers-skills
- 如果安装了 GitHub CLI 则提供创建分叉
- 正确设置 upstream/origin 远程
- 处理从旧安装迁移

**自动更新**
- 每次会话开始时从跟踪远程获取
- 尽可能自动合并快进
- 在需要手动同步时通知（分支已分叉）
- 使用 pulling-updates-from-skills-repository skill 进行手动同步

### 新 Skills

**解决问题 Skills** (`skills/problem-solving/`)
- **collision-zone-thinking** - 强制无关概念融合以获得突发洞察
- **inversion-exercise** - 翻转假设以揭示隐藏约束
- **meta-pattern-recognition** - 发现跨领域的通用原则
- **scale-game** - 在极端情况下测试以暴露基本真理
- **simplification-cascades** - 找到消除多个组件的洞察
- **when-stuck** - 分配到正确的解决问题技术

**研究 Skills** (`skills/research/`)
- **tracing-knowledge-lineages** - 理解想法如何随着时间演变

**架构 Skills** (`skills/architecture/`)
- **preserving-productive-tensions** - 保持多个有效方法而不是强制过早解决

### Skills 改进

**using-skills（之前是 getting-started）**
- 从 getting-started 重命名为 using-skills
- 用祈使语气完全重写 (v4.0.0)
- 前置关键规则
- 为所有工作流添加"为什么"解释
- 引用中始终包含 /SKILL.md 后缀
- 更清晰地区分刚性规则和灵活模式

**writing-skills**
- 交叉引用指导从 using-skills 移出
- 添加了 token 效率部分（字数目标）
- 改进了 CSO（Claude 搜索优化）指导

**sharing-skills**
- 更新为新的分支和 PR 工作流 (v2.0.0)
- 移除了个人/核心分割引用

**pulling-updates-from-skills-repository**（新增）
- 与上游同步的完整工作流
- 取代旧的"updating-skills" skill

### 工具改进

**find-skills**
- 现在输出带有 /SKILL.md 后缀的完整路径
- 使路径可以直接与 Read 工具一起使用
- 更新了帮助文本

**skill-run**
- 从 scripts/ 移至 skills/using-skills/
- 改进了文档

### 插件基础设施

**会话开始 Hook**
- 现在从 skills 仓库位置加载
- 在会话开始时显示完整 skills 列表
- 打印 skills 位置信息
- 显示更新状态（更新成功/落后于上游）
- 将"skills 落后"警告移至输出末尾

**环境变量**
- `SUPERPOWERS_SKILLS_ROOT` 设置为 `~/.config/superpowers/skills`
- 在所有路径中一致使用

### Bug 修复

- 修复了分叉时重复添加 upstream 远程的问题
- 修复了 find-skills 输出中双"skills/"前缀的问题
- 从 session-start 中移除了过时的 setup-personal-superpowers 调用
- 修复了整个 hooks 和命令中的路径引用

### 文档

### README
- 为新的 skills 仓库架构更新
- 突出显示 superpowers-skills 仓库链接
- 更新了自动更新描述
- 修复了 skill 名称和引用
- 更新了 Meta skills 列表

### 测试文档
- 添加了全面的测试检查清单 (`docs/TESTING-CHECKLIST.md`)
- 创建了用于测试的本地市场配置
- 记录了手动测试场景

### 技术细节

### 文件更改

**新增：**
- `lib/initialize-skills.sh` - Skills 仓库初始化和自动更新
- `docs/TESTING-CHECKLIST.md` - 手动测试场景
- `.claude-plugin/marketplace.json` - 本地测试配置

**移除：**
- `skills/` 目录（82 个文件）- 现在在 obra/superpowers-skills
- `scripts/` 目录 - 现在在 obra/superpowers-skills/skills/using-skills/
- `hooks/setup-personal-superpowers.sh` - 过时

**修改：**
- `hooks/session-start.sh` - 使用来自 ~/.config/superpowers/skills 的 skills
- `commands/brainstorm.md` - 更新路径到 SUPERPOWERS_SKILLS_ROOT
- `commands/write-plan.md` - 更新路径到 SUPERPOWERS_SKILLS_ROOT
- `commands/execute-plan.md` - 更新路径到 SUPERPOWERS_SKILLS_ROOT
- `README.md` - 为新架构完全重写

### 提交历史

此版本包括：
- 20+ 次用于 skills 仓库分离的提交
- PR #1: Amplifier 启发的问题解决和研究 skills
- PR #2: 个人 superpowers 叠加系统（后来被取代）
- 多次 skill 改进和文档改进

## 升级说明

### 全新安装

```bash
# 在 Claude Code 中
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

插件自动处理一切。

### 从 v1.x 升级

1. **备份你的个人 skills**（如果有的话）：
   ```bash
   cp -r ~/.config/superpowers/skills ~/superpowers-skills-backup
   ```

2. **更新插件：**
   ```bash
   /plugin update superpowers
   ```

3. **在下次会话开始时：**
   - 旧安装将自动备份
   - 将克隆新的 skills 仓库
   - 如果你有 GitHub CLI，系统会询问是否创建分叉

4. **迁移个人 skills**（如果有的话）：
   - 在你的本地 skills 仓库中创建一个分支
   - 从备份中复制你的个人 skills
   - 提交并推送到你的分叉
   - 考虑通过 PR 贡献回来

## 下一步

### 对于用户
- 探索新的解决问题 skills
- 尝试基于分支的工作流来改进 skills
- 为社区贡献 skills

### 对于贡献者
- Skills 仓库现在位于 https://github.com/obra/superpowers-skills
- 分叉 → 分支 → PR 工作流
- 参阅 skills/meta/writing-skills/SKILL.md 了解文档的 TDD 方法

## 已知问题

目前没有。

## 致谢

- 问题解决 skills 受到 Amplifier 模式的启发
- 社区贡献和反馈
- 对 skill 有效性的广泛测试和迭代

---

**完整变更日志：** https://github.com/obra/superpowers/compare/dd013f6...main
**Skills 仓库：** https://github.com/obra/superpowers-skills
**问题：** https://github.com/obra/superpowers/issues
