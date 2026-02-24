# OpenCode 支持设计

**日期：** 2025-11-22
**作者：** Bot & Jesse
**状态：** 设计完成，等待实现

## 概述

为 OpenCode.ai 添加完整的 superpowers 支持，使用原生 OpenCode 插件架构，并与现有的 Codex 实现共享核心功能。

## 背景

OpenCode.ai 是一个类似于 Claude Code 和 Codex 的编码代理。之前将 superpowers 移植到 OpenCode 的尝试（PR #93、PR #116）使用了文件复制方法。本设计采用不同的方法：使用他们的 JavaScript/TypeScript 插件系统构建原生 OpenCode 插件，同时与 Codex 实现共享代码。

### 平台之间的关键差异

- **Claude Code**：原生 Anthropic 插件系统 + 基于文件的 skills
- **Codex**：无插件系统 → bootstrap markdown + CLI 脚本
- **OpenCode**：JavaScript/TypeScript 插件，带有事件 hooks 和自定义工具 API

### OpenCode 的 Agent 系统

- **主要 agents**：Build（默认，完全访问）和 Plan（受限，只读）
- **Subagents**：General（研究、搜索、多步骤任务）
- **调用方式**：由主要 agents 自动调度或使用手动 `@mention` 语法
- **配置**：在 `opencode.json` 或 `~/.config/opencode/agent/` 中的自定义 agents

## 架构

### 高级结构

1. **共享核心模块** (`lib/skills-core.js`)
   - 通用的 skill 发现和解析逻辑
   - Codex 和 OpenCode 实现共用

2. **平台特定包装器**
   - Codex：CLI 脚本（`.codex/superpowers-codex`）
   - OpenCode：插件模块（`.opencode/plugin/superpowers.js`）

3. **Skill 目录**
   - 核心：`~/.config/opencode/superpowers/skills/`（或安装位置）
   - 个人：`~/.config/opencode/skills/`（覆盖核心 skills）

### 代码重用策略

从 `.codex/superpowers-codex` 中提取通用功能到共享模块：

```javascript
// lib/skills-core.js
module.exports = {
  extractFrontmatter(filePath),      // 从 YAML 解析 name 和 description
  findSkillsInDir(dir, maxDepth),    // 递归发现 SKILL.md
  findAllSkills(dirs),               // 扫描多个目录
  resolveSkillPath(skillName, dirs), // 处理覆盖（个人 > 核心）
  checkForUpdates(repoDir)           // Git fetch/状态检查
};
```

### Skill Frontmatter 格式

当前格式（无 `when_to_use` 字段）：

```yaml
---
name: skill-name
description: Use when [condition] - [what it does]; [additional context]
---
```

## OpenCode 插件实现

### 自定义工具

**工具 1：`use_skill`**

将特定 skill 的内容加载到对话中（相当于 Claude 的 Skill 工具）。

```javascript
{
  name: 'use_skill',
  description: 'Load and read a specific skill to guide your work',
  schema: z.object({
    skill_name: z.string().describe('Name of skill (e.g., "superpowers:brainstorming")')
  }),
  execute: async ({ skill_name }) => {
    const { skillPath, content, frontmatter } = resolveAndReadSkill(skill_name);
    const skillDir = path.dirname(skillPath);

    return `# ${frontmatter.name}
# ${frontmatter.description}
# Supporting tools and docs are in ${skillDir}
# ============================================

${content}`;
  }
}
```

**工具 2：`find_skills`**

列出所有可用的 skills 及元数据。

```javascript
{
  name: 'find_skills',
  description: 'List all available skills',
  schema: z.object({}),
  execute: async () => {
    const skills = discoverAllSkills();
    return skills.map(s =>
      `${s.namespace}:${s.name}
  ${s.description}
  Directory: ${s.directory}
`).join('\n');
  }
}
```

### 会话启动 Hook

当新会话启动时（`session.started` 事件）：

1. **注入 using-superpowers 内容**
   - using-superpowers skill 的完整内容
   - 建立强制性工作流

2. **自动运行 find_skills**
   - 立即显示所有可用 skills 的完整列表
   - 包含每个 skill 的目录

3. **注入工具映射说明**
   ```markdown
   **OpenCode 工具映射：**
   当 skills 引用你没有的工具时，请替换：
   - `TodoWrite` → `update_plan`
   - 带 subagents 的 `Task` → 使用 OpenCode subagent 系统（@mention）
   - `Skill` 工具 → `use_skill` 自定义工具
   - Read、Write、Edit、Bash → 你的原生工具

   **Skill 目录包含：**
   - 可以用 bash 运行的脚本
   - 可以用 read 工具读取的附加文档
   - 特定于该 skill 的工具
   ```

4. **检查更新**（非阻塞）
   - 带超时的快速 git fetch
   - 如有可用更新则通知

### 插件结构

```javascript
// .opencode/plugin/superpowers.js
const skillsCore = require('../../lib/skills-core');
const path = require('path');
const fs = require('fs');
const { z } = require('zod');

export const SuperpowersPlugin = async ({ client, directory, $ }) => {
  const superpowersDir = path.join(process.env.HOME, '.config/opencode/superpowers');
  const personalDir = path.join(process.env.HOME, '.config/opencode/skills');

  return {
    'session.started': async () => {
      const usingSuperpowers = await readSkill('using-superpowers');
      const skillsList = await findAllSkills();
      const toolMapping = getToolMappingInstructions();

      return {
        context: `${usingSuperpowers}\n\n${skillsList}\n\n${toolMapping}`
      };
    },

    tools: [
      {
        name: 'use_skill',
        description: 'Load and read a specific skill',
        schema: z.object({
          skill_name: z.string()
        }),
        execute: async ({ skill_name }) => {
          // 使用 skillsCore 实现
        }
      },
      {
        name: 'find_skills',
        description: 'List all available skills',
        schema: z.object({}),
        execute: async () => {
          // 使用 skillsCore 实现
        }
      }
    ]
  };
};
```

## 文件结构

```
superpowers/
├── lib/
│   └── skills-core.js           # 新建：共享 skill 逻辑
├── .codex/
│   ├── superpowers-codex        # 更新：使用 skills-core
│   ├── superpowers-bootstrap.md
│   └── INSTALL.md
├── .opencode/
│   ├── plugin/
│   │   └── superpowers.js       # 新建：OpenCode 插件
│   └── INSTALL.md               # 新建：安装指南
└── skills/                       # 保持不变
```

## 实现计划

### 阶段 1：重构共享核心

1. 创建 `lib/skills-core.js`
   - 从 `.codex/superpowers-codex` 提取 frontmatter 解析
   - 提取 skill 发现逻辑
   - 提取路径解析（带覆盖）
   - 更新为只使用 `name` 和 `description`（无 `when_to_use`）

2. 更新 `.codex/superpowers-codex` 使用共享核心
   - 从 `../lib/skills-core.js` 导入
   - 移除重复代码
   - 保留 CLI 包装器逻辑

3. 测试 Codex 实现仍然可用
   - 验证 bootstrap 命令
   - 验证 use-skill 命令
   - 验证 find-skills 命令

### 阶段 2：构建 OpenCode 插件

1. 创建 `.opencode/plugin/superpowers.js`
   - 从 `../../lib/skills-core.js` 导入共享核心
   - 实现插件函数
   - 定义自定义工具（use_skill、find_skills）
   - 实现 session.started hook

2. 创建 `.opencode/INSTALL.md`
   - 安装说明
   - 目录设置
   - 配置指导

3. 测试 OpenCode 实现
   - 验证会话启动 bootstrap
   - 验证 use_skill 工具可用
   - 验证 find_skills 工具可用
   - 验证 skill 目录可访问

### 阶段 3：文档和优化

1. 在 README 中添加 OpenCode 支持
2. 在主文档中添加 OpenCode 安装说明
3. 更新 RELEASE-NOTES
4. 测试 Codex 和 OpenCode 都能正常工作

## 下一步

1. **创建隔离的工作区**（使用 git worktrees）
   - 分支：`feature/opencode-support`

2. **在适用的情况下遵循 TDD**
   - 测试共享核心函数
   - 测试 skill 发现和解析
   - 两个平台的集成测试

3. **增量实现**
   - 阶段 1：重构共享核心 + 更新 Codex
   - 验证 Codex 仍然可用后再继续
   - 阶段 2：构建 OpenCode 插件
   - 阶段 3：文档和优化

4. **测试策略**
   - 使用真实 OpenCode 安装进行手动测试
   - 验证 skill 加载、目录、脚本工作
   - 并排测试 Codex 和 OpenCode
   - 验证工具映射正确工作

5. **PR 和合并**
   - 创建包含完整实现的 PR
   - 在干净环境中测试
   - 合并到 main

## 优势

- **代码重用**：skill 发现/解析的单一事实来源
- **可维护性**：bug 修复适用于两个平台
- **可扩展性**：易于添加未来平台（Cursor、Windsurf 等）
- **原生集成**：正确使用 OpenCode 的插件系统
- **一致性**：所有平台上的相同 skill 体验
