# OpenCode 版 Superpowers

使用 Superpowers 与 [OpenCode.ai](https://opencode.ai) 的完整指南。

## 快速安装

告诉 OpenCode：

```
Clone https://github.com/obra/superpowers to ~/.config/opencode/superpowers, then create directory ~/.config/opencode/plugins, then symlink ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js to ~/.config/opencode/plugins/superpowers.js, then symlink ~/.config/opencode/superpowers/skills to ~/.config/opencode/skills/superpowers, then restart opencode.
```

## 手动安装

### 前提条件

- 已安装 [OpenCode.ai](https://opencode.ai)
- 已安装 Git

### macOS / Linux

```bash
# 1. 安装 Superpowers（或更新现有）
if [ -d ~/.config/opencode/superpowers ]; then
  cd ~/.config/opencode/superpowers && git pull
else
  git clone https://github.com/obra/superpowers.git ~/.config/opencode/superpowers
fi

# 2. 创建目录
mkdir -p ~/.config/opencode/plugins ~/.config/opencode/skills

# 3. 如果存在，删除旧的符号链接/目录
rm -f ~/.config/opencode/plugins/superpowers.js
rm -rf ~/.config/opencode/skills/superpowers

# 4. 创建符号链接
ln -s ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js ~/.config/opencode/plugins/superpowers.js
ln -s ~/.config/opencode/superpowers/skills ~/.config/opencode/skills/superpowers

# 5. 重启 OpenCode
```

#### 验证安装

```bash
ls -l ~/.config/opencode/plugins/superpowers.js
ls -l ~/.config/opencode/skills/superpowers
```

两者都应该显示指向 superpowers 目录的符号链接。

### Windows

**前提条件：**
- 已安装 Git
- 已启用 **开发者模式** 或拥有 **管理员权限**
  - Windows 10：设置 → 更新和安全 → 面向开发者
  - Windows 11：设置 → 系统 → 面向开发者

选择您的 shell：[命令提示符](#命令提示符) | [PowerShell](#powershell) | [Git Bash](#git-bash)

#### 命令提示符

以管理员身份运行，或启用开发者模式：

```cmd
:: 1. 安装 Superpowers
git clone https://github.com/obra/superpowers.git "%USERPROFILE%\.config\opencode\superpowers"

:: 2. 创建目录
mkdir "%USERPROFILE%\.config\opencode\plugins" 2>nul
mkdir "%USERPROFILE%\.config\opencode\skills" 2>nul

:: 3. 删除现有链接（安全重装）
del "%USERPROFILE%\.config\opencode\plugins\superpowers.js" 2>nul
rmdir "%USERPROFILE%\.config\opencode\skills\superpowers" 2>nul

:: 4. 创建插件符号链接（需要开发者模式或管理员）
mklink "%USERPROFILE%\.config\opencode\plugins\superpowers.js" "%USERPROFILE%\.config\opencode\superpowers\.opencode\plugins\superpowers.js"

:: 5. 创建 skills 目录联接（无需特殊权限）
mklink /J "%USERPROFILE%\.config\opencode\skills\superpowers" "%USERPROFILE%\.config\opencode\superpowers\skills"

:: 6. 重启 OpenCode
```

#### PowerShell

以管理员身份运行，或启用开发者模式：

```powershell
# 1. 安装 Superpowers
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.config\opencode\superpowers"

# 2. 创建目录
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\plugins"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.config\opencode\skills"

# 3. 删除现有链接（安全重装）
Remove-Item "$env:USERPROFILE\.config\opencode\plugins\superpowers.js" -Force -ErrorAction SilentlyContinue
Remove-Item "$env:USERPROFILE\.config\opencode\skills\superpowers" -Force -ErrorAction SilentlyContinue

# 4. 创建插件符号链接（需要开发者模式或管理员）
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.config\opencode\plugins\superpowers.js" -Target "$env:USERPROFILE\.config\opencode\superpowers\.opencode\plugins\superpowers.js"

# 5. 创建 skills 目录联接（无需特殊权限）
New-Item -ItemType Junction -Path "$env:USERPROFILE\.config\opencode\skills\superpowers" -Target "$env:USERPROFILE\.config\opencode\superpowers\skills"

# 6. 重启 OpenCode
```

#### Git Bash

注意：Git Bash 的原生 `ln` 命令复制文件而不是创建符号链接。请改用 `cmd //c mklink`（`//c` 是 Git Bash 的 `/c` 语法）。

```bash
# 1. 安装 Superpowers
git clone https://github.com/obra/superpowers.git ~/.config/opencode/superpowers

# 2. 创建目录
mkdir -p ~/.config/opencode/plugins ~/.config/opencode/skills

# 3. 删除现有链接（安全重装）
rm -f ~/.config/opencode/plugins/superpowers.js 2>/dev/null
rm -rf ~/.config/opencode/skills/superpowers 2>/dev/null

# 4. 创建插件符号链接（需要开发者模式或管理员）
cmd //c "mklink \"$(cygpath -w ~/.config/opencode/plugins/superpowers.js)\" \"$(cygpath -w ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js)\""

# 5. 创建 skills 目录联接（无需特殊权限）
cmd //c "mklink /J \"$(cygpath -w ~/.config/opencode/skills/superpowers)\" \"$(cygpath -w ~/.config/opencode/superpowers/skills)\""

# 6. 重启 OpenCode
```

#### WSL 用户

如果在 WSL 中运行 OpenCode，请改用 [macOS / Linux](#macos--linux) 说明。

#### 验证安装

**命令提示符：**
```cmd
dir /AL "%USERPROFILE%\.config\opencode\plugins"
dir /AL "%USERPROFILE%\.config\opencode\skills"
```

**PowerShell：**
```powershell
Get-ChildItem "$env:USERPROFILE\.config\opencode\plugins" | Where-Object { $_.LinkType }
Get-ChildItem "$env:USERPROFILE\.config\opencode\skills" | Where-Object { $_.LinkType }
```

在输出中查找 `<SYMLINK>` 或 `<JUNCTION>`。

#### Windows 故障排除

**"您没有足够的权限"错误：**
- 在 Windows 设置中启用开发者模式，或
- 右键单击终端 → "以管理员身份运行"

**"当该文件已存在时无法创建文件"：**
- 先运行删除命令（第 3 步），然后重试

**git clone 后符号链接不工作：**
- 运行 `git config --global core.symlinks true` 然后重新克隆

## 使用方法

### 查找 Skills

使用 OpenCode 原生的 `skill` 工具列出所有可用的 skills：

```
use skill tool to list skills
```

### 加载 Skill

使用 OpenCode 原生的 `skill` 工具加载特定的 skill：

```
use skill tool to load superpowers/brainstorming
```

### 个人 Skills

在 `~/.config/opencode/skills/` 中创建您自己的 skills：

```bash
mkdir -p ~/.config/opencode/skills/my-skill
```

创建 `~/.config/opencode/skills/my-skill/SKILL.md`：

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### 项目 Skills

在您的 OpenCode 项目中创建项目特定的 skills：

```bash
# 在您的 OpenCode 项目中
mkdir -p .opencode/skills/my-project-skill
```

创建 `.opencode/skills/my-project-skill/SKILL.md`：

```markdown
---
name: my-project-skill
description: Use when [condition] - [what it does]
---

# My Project Skill

[Your skill content here]
```

## Skill 位置

OpenCode 从以下位置发现 skills：

1. **项目 skills**（`.opencode/skills/`）- 最高优先级
2. **个人 skills**（`~/.config/opencode/skills/`）
3. **Superpowers skills**（`~/.config/opencode/skills/superpowers/`）- 通过符号链接

## 功能特性

### 自动上下文注入

插件通过 `experimental.chat.system.transform` 钩子自动注入 superpowers 上下文。这会在每个请求中将 "using-superpowers" skill 内容添加到系统提示中。

### 原生 Skills 集成

Superpowers 使用 OpenCode 原生的 `skill` 工具进行 skill 发现和加载。Skills 被符号链接到 `~/.config/opencode/skills/superpowers/`，以便与您的个人和项目 skills 并列显示。

### 工具映射

为 Claude Code 编写的 skills 会自动适配 OpenCode。引导程序提供映射说明：

- `TodoWrite` → `update_plan`
- 带 subagents 的 `Task` → OpenCode 的 `@mention` 系统
- `Skill` 工具 → OpenCode 原生的 `skill` 工具
- 文件操作 → OpenCode 原生工具

## 架构

### 插件结构

**位置：** `~/.config/opencode/superpowers/.opencode/plugins/superpowers.js`

**组件：**
- 用于引导程序注入的 `experimental.chat.system.transform` 钩子
- 读取并注入 "using-superpowers" skill 内容

### Skills

**位置：** `~/.config/opencode/skills/superpowers/`（符号链接到 `~/.config/opencode/superpowers/skills/`）

Skills 通过 OpenCode 原生的 skill 系统被发现。每个 skill 都有一个包含 YAML frontmatter 的 `SKILL.md` 文件。

## 更新

```bash
cd ~/.config/opencode/superpowers
git pull
```

重启 OpenCode 以加载更新。

## 故障排除

### 插件不加载

1. 检查插件是否存在：`ls ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js`
2. 检查符号链接/目录联接：`ls -l ~/.config/opencode/plugins/`（macOS/Linux）或 `dir /AL %USERPROFILE%\.config\opencode\plugins`（Windows）
3. 检查 OpenCode 日志：`opencode run "test" --print-logs --log-level DEBUG`
4. 在日志中查找插件加载消息

### Skills 找不到

1. 验证 skills 符号链接：`ls -l ~/.config/opencode/skills/superpowers`（应该指向 superpowers/skills/）
2. 使用 OpenCode 的 `skill` 工具列出可用的 skills
3. 检查 skill 结构：每个 skill 需要一个带有有效 frontmatter 的 `SKILL.md` 文件

### Windows：找不到模块错误

如果在 Windows 上看到 `Cannot find module` 错误：
- **原因：** Git Bash `ln -sf` 复制文件而不是创建符号链接
- **修复：** 改用 `mklink /J` 目录联接（请参阅 Windows 安装步骤）

### 引导程序不显示

1. 验证 using-superpowers skill 存在：`ls ~/.config/opencode/superpowers/skills/using-superpowers/SKILL.md`
2. 检查 OpenCode 版本是否支持 `experimental.chat.system.transform` 钩子
3. 更改插件后重启 OpenCode

## 获取帮助

- 报告问题：https://github.com/obra/superpowers/issues
- 主文档：https://github.com/obra/superpowers
- OpenCode 文档：https://opencode.ai/docs/

## 测试

验证您的安装：

```bash
# 检查插件是否加载
opencode run --print-logs "hello" 2>&1 | grep -i superpowers

# 检查 skills 是否可被发现
opencode run "use skill tool to list all skills" 2>&1 | grep -i superpowers

# 检查引导程序注入
opencode run "what superpowers do you have?"
```

代理应该提到有超能力并且能够列出 `superpowers/` 中的 skills。
