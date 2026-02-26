# Superpowers

Superpowers 是一个完整的软件开发生工作流，专为你的编码代理设计，基于一组可组合的"技能"和一些确保你的代理使用它们的初始指令构建。

## 工作原理

它从你启动编码代理的那一刻开始。当它看到你正在构建某些东西时，它不会直接跳入尝试编写代码。相反，它会退后一步，询问你真正想要做什么。

一旦从对话中提炼出规范，它会以足够短小的部分向你展示，以便你能够阅读和理解。

在你批准设计之后，你的代理会制定一个足够清晰的实施计划，即使是一个热情但品味不佳、没有判断力、没有项目背景且厌恶测试的初级工程师也能遵循。它强调真正的红/绿 TDD、YAGNI（你不会需要它）和 DRY。

接下来，一旦你说"开始"，它就会启动一个 *subagent-driven-development* 流程，让代理处理每个工程任务，检查和审查他们的工作，然后继续前进。Claude 能够自主工作几个小时而不偏离你制定的计划，这并不罕见。

还有很多其他功能，但这是系统的核心。因为技能是自动触发的，你不需要做任何特别的事情。你的编码代理只需要拥有 Superpowers。

## 赞助

如果 Superpowers 帮助您完成了赚钱的事情，而且您愿意，我将非常感谢您考虑[赞助我的开源工作](https://github.com/sponsors/obra)。

感谢！

- Jesse

## 安装

**注意：** 安装因平台而异。Claude Code 或 Cursor 有内置的插件市场。Codex 和 OpenCode 需要手动设置。

### Claude Code（通过插件市场）

在 Claude Code 中，首先注册市场：

```bash
/plugin marketplace add ShaofeiZi/superpowers-marketplace
```

然后从市场安装插件：

```bash
/plugin install superpowers@superpowers-marketplace
```

### Cursor（通过插件市场）

在 Cursor Agent 聊天中，从市场安装：

```text
/plugin-add superpowers
```

### Codex

告诉 Codex：

```
从 https://raw.githubusercontent.com/ShaofeiZi/superpowers/refs/heads/main/.codex/INSTALL.md 获取并遵循说明
```

**详细文档：** [docs/README.codex.md](docs/README.codex.md)

### OpenCode

告诉 OpenCode：

```
从 https://raw.githubusercontent.com/ShaofeiZi/superpowers/refs/heads/main/.opencode/INSTALL.md 获取并遵循说明
```

**详细文档：** [docs/README.opencode.md](docs/README.opencode.md)

## 验证安装

在你选择的平台中启动一个新会话，并询问应该触发技能的事情（例如，"帮我计划这个功能"或"让我们调试这个问题"）。代理应该自动调用相关的 superpowers 技能。

## 基本工作流

1. **brainstorming** - 在编写代码之前激活。通过问题细化粗略想法，探索替代方案，分部分呈现设计以供验证。保存设计文档。

2. **using-git-worktrees** - 在设计批准后激活。在新分支上创建隔离的工作区，运行项目设置，验证干净的测试基线。

3. **writing-plans** - 在设计批准后激活。将工作分解为小的任务（每个 2-5 分钟）。每个任务都有精确的文件路径、完整的代码、验证步骤。

4. **subagent-driven-development** 或 **executing-plans** - 在有计划时激活。为每个任务调度新的子代理，进行两阶段审查（规范合规，然后代码质量），或在人工检查点分批执行。

5. **test-driven-development** - 在实施期间激活。强制 RED-GREEN-REFACTOR：编写失败的测试，观察它失败，编写最少的代码，观察它通过，提交。删除在测试之前编写的代码。

6. **requesting-code-review** - 在任务之间激活。根据计划进行审查，按严重程度报告问题。关键问题阻止进度。

7. **finishing-a-development-branch** - 在任务完成时激活。验证测试，呈现选项（合并/PR/保留/丢弃），清理工作区。

**代理在任何任务之前检查相关技能。** 强制工作流，不是建议。

## 内容

### 技能库

**测试**
- **test-driven-development** - RED-GREEN-REFACTOR 周期（包括测试反模式参考）

**调试**
- **systematic-debugging** - 4 阶段根本原因流程（包括根本原因追踪、纵深防御、条件等待技术）
- **verification-before-completion** - 确保它真的被修复了

**协作**
- **brainstorming** - 苏格拉底式设计细化
- **writing-plans** - 详细的实施计划
- **executing-plans** - 带检查点的批量执行
- **dispatching-parallel-agents** - 并发子代理工作流
- **requesting-code-review** - 预审检查清单
- **receiving-code-review** - 响应反馈
- **using-git-worktrees** - 并行开发分支
- **finishing-a-development-branch** - 合并/PR 决策工作流
- **subagent-driven-development** - 带两阶段审查的快速迭代（规范合规，然后代码质量）

**元技能**
- **writing-skills** - 按照最佳实践创建新技能（包括测试方法论）
- **using-superpowers** - 技能系统介绍

## 理念

- **测试驱动开发** - 始终先写测试
- **系统化优于临时** - 流程优于猜测
- **降低复杂性** - 简单性作为主要目标
- **证据优于声明** - 在宣布成功之前验证

阅读更多：[Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## 贡献

技能直接存在于此仓库中。贡献方法：

1. Fork 仓库
2. 为你的技能创建分支
3. 按照 `writing-skills` 技能创建和测试新技能
4. 提交 PR

参见 `skills/writing-skills/SKILL.md` 获取完整指南。

## 更新

当你更新插件时，技能会自动更新：

```bash
/plugin update superpowers
```

## 许可证

MIT 许可证 - 详见 LICENSE 文件

## 支持

- **问题**：https://github.com/ShaofeiZi/superpowers/issues
- **市场**：https://github.com/ShaofeiZi/superpowers-marketplace
