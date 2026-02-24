---
name: using-git-worktrees
description: 当开始需要与当前工作区隔离的功能工作时使用，或在执行实施计划之前使用 - 创建具有智能目录选择和安全验证的隔离 git worktree
---

# 使用 Git Worktrees

## 概述

Git worktree 创建共享同一仓库的隔离工作区，允许同时在多个分支上工作而无需切换。

**核心原则：** 系统化目录选择 + 安全验证 = 可靠的隔离。

**开始时声明：** "我正在使用 using-git-worktrees 技能来设置隔离的工作区。"

## 目录选择流程

按此优先级顺序遵循：

### 1. 检查现有目录

```bash
# 按优先级检查
ls -d .worktrees 2>/dev/null     # 首选（隐藏）
ls -d worktrees 2>/dev/null      # 备选
```

**如果找到：** 使用该目录。如果两者都存在，`.worktrees` 优先。

### 2. 检查 CLAUDE.md

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
```

**如果指定了偏好：** 无需询问直接使用。

### 3. 询问用户

如果不存在目录且没有 CLAUDE.md 偏好：

```
未找到 worktree 目录。我应该在哪里创建 worktree？

1. .worktrees/（项目本地，隐藏）
2. ~/.config/superpowers/worktrees/<project-name>/（全局位置）

你更偏好哪个？
```

## 安全验证

### 对于项目本地目录（.worktrees 或 worktrees）

**在创建 worktree 之前必须验证目录被忽略：**

```bash
# 检查目录是否被忽略（尊重本地、全局和系统 gitignore）
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**如果没有被忽略：**

根据 Jesse 的规则"立即修复损坏的东西"：
1. 添加适当的行到 .gitignore
2. 提交更改
3. 继续创建 worktree

**为什么关键：** 防止意外将 worktree 内容提交到仓库。

### 对于全局目录（~/.config/superpowers/worktrees）

不需要 .gitignore 验证 - 完全在项目之外。

## 创建步骤

### 1. 检测项目名称

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. 创建 Worktree

```bash
# 确定完整路径
case $LOCATION in
  .worktrees|worktrees)
    path="$LOCATION/$BRANCH_NAME"
    ;;
  ~/.config/superpowers/worktrees/*)
    path="~/.config/superpowers/worktrees/$project/$BRANCH_NAME"
    ;;
esac

# 使用新分支创建 worktree
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. 运行项目设置

自动检测并运行适当的设置：

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 4. 验证干净的基线

运行测试以确保 worktree 起点干净：

```bash
# 示例 - 使用项目适当的命令
npm test
cargo test
pytest
go test ./...
```

**如果测试失败：** 报告失败，询问是继续还是调查。

**如果测试通过：** 报告准备好了。

### 5. 报告位置

```
Worktree 准备在 <full-path>
测试通过（<N> 个测试，0 个失败）
准备好实施 <feature-name>
```

## 快速参考

| 情况 | 行动 |
|-----------|--------|
| `.worktrees/` 存在 | 使用它（验证被忽略） |
| `worktrees/` 存在 | 使用它（验证被忽略） |
| 两者都存在 | 使用 `.worktrees/` |
| 两者都不存在 | 检查 CLAUDE.md → 询问用户 |
| 目录没有被忽略 | 添加到 .gitignore + 提交 |
| 基线测试期间测试失败 | 报告失败 + 询问 |
| 没有 package.json/Cargo.toml | 跳过依赖安装 |

## 常见错误

### 跳过忽略验证

- **问题：** Worktree 内容被跟踪，污染 git 状态
- **修复：** 在创建项目本地 worktree 之前始终使用 `git check-ignore`

### 假设目录位置

- **问题：** 造成不一致，违反项目约定
- **修复：** 遵循优先级：现有 > CLAUDE.md > 询问

### 带着失败的测试继续

- **问题：** 无法区分新 bug 和预先存在的问题
- **修复：** 报告失败，获得明确许可继续

### 硬编码设置命令

- **问题：** 在使用不同工具的项目上失败
- **修复：** 从项目文件自动检测（package.json 等）

## 示例工作流

```
你：我正在使用 using-git-worktrees 技能来设置隔离的工作区。

[检查 .worktrees/ - 存在]
[验证被忽略 - git check-ignore 确认 .worktrees/ 被忽略]
[创建 worktree: git worktree add .worktrees/auth -b feature/auth]
[运行 npm install]
[运行 npm test - 47 个通过]

Worktree 准备在 /Users/jesse/myproject/.worktrees/auth
测试通过（47 个测试，0 个失败）
准备好实施 auth 功能
```

## 红旗

**永远不要：**
- 在未验证被忽略的情况下创建 worktree（项目本地）
- 跳过基线测试验证
- 在不询问的情况下带着失败的测试继续
- 当不明确时假设目录位置
- 跳过 CLAUDE.md 检查

**始终：**
- 遵循目录优先级：现有 > CLAUDE.md > 询问
- 验证项目本地的目录被忽略
- 自动检测并运行项目设置
- 验证干净的测试基线

## 集成

**被调用：**
- **brainstorming**（阶段 4）- 当设计被批准并跟随实施时必需
- **subagent-driven-development** - 在执行任何任务之前必需
- **executing-plans** - 在执行任何任务之前必需
- 任何需要隔离工作区的技能

**配合使用：**
- **finishing-a-development-branch** - 工作完成后清理必需
