# Skill 编写最佳实践

> 了解如何编写 Claude 能够成功发现和使用的高效 Skills。

好的 Skills 是简洁的、结构良好的，并经过真实使用测试。本指南提供了实际的编写决策，以帮助您编写 Claude 能够有效发现和使用的 Skills。

有关 Skills 工作原理的概念背景，请参阅 [Skills 概述](/en/docs/agents-and-tools/agent-skills/overview)。

## 核心原则

### 简洁是关键

[上下文窗口](https://platform.claude.com/docs/en/build-with-claude/context-windows) 是公共资源。您的 Skill 与 Claude 需要知道的其他所有内容共享上下文窗口，包括：

* 系统提示
* 对话历史
* 其他 Skills 的元数据
* 您的实际请求

您的 Skill 中的每个 token 并不都有即时成本。在启动时，只有所有 Skills 的元数据（名称和描述）会被预先加载。Claude 只在 Skill 变得相关时才读取 SKILL.md，并且只在需要时读取其他文件。然而，在 SKILL.md 中保持简洁仍然很重要：一旦 Claude 加载了它，每个 token 都会与对话历史和其他上下文竞争。

**默认假设**：Claude 已经非常聪明

只添加 Claude 没有的上下文。挑战每一条信息：

* "Claude 真的需要这个解释吗？"
* "我可以假设 Claude 知道这个吗？"
* "这个段落是否值得它的 token 成本？"

**好的示例：简洁**（约 50 个 token）：

````markdown  theme={null}
## 提取 PDF 文本

使用 pdfplumber 进行文本提取：

```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
````

**糟糕的示例：太冗长**（约 150 个 token）：

```markdown  theme={null}
## 提取 PDF 文本

PDF（可移植文档格式）是一种常见的文件格式，包含文本、图像和其他内容。要从 PDF 中提取文本，您需要一个库。有许多可用于 PDF 处理的库，但我们推荐 pdfplumber，因为它易于使用且在大多数情况下都能很好地处理。首先，您需要使用 pip 安装它。然后您可以使用下面的代码...
```

简洁版本假设 Claude 知道什么是 PDF 以及库如何工作。

### 设置适当的自由度

将特异性级别与任务的脆弱性和可变性相匹配。

**高自由度**（基于文本的指令）：

当满足以下条件时使用：

* 多种方法都有效
* 决策取决于上下文
* 启发式方法指导方法

示例：

```markdown  theme={null}
## 代码审查流程

1. 分析代码结构和组织
2. 检查潜在的 bug 或边缘情况
3. 为可读性和可维护性提出改进建议
4. 验证是否遵守项目约定
```

**中等自由度**（伪代码或带参数的脚本）：

当满足以下条件时使用：

* 存在首选模式
* 一些变化是可以接受的
* 配置影响行为

示例：

````markdown  theme={null}
## 生成报告

使用此模板并根据需要进行自定义：

```python
def generate_report(data, format="markdown", include_charts=True):
    # 处理数据
    # 以指定格式生成输出
    # 可视化包含图表
```
````

**低自由度**（特定脚本，几乎没有参数）：

当满足以下条件时使用：

* 操作脆弱且容易出错
* 一致性至关重要
* 必须遵循特定顺序

示例：

````markdown  theme={null}
## 数据库迁移

精确运行此脚本：

```bash
python scripts/migrate.py --verify --backup
```

不要修改命令或添加额外的标志。
````

**类比**：将 Claude 视为探索路径的机器人：

* **两侧都是悬崖的狭窄桥梁**：只有一种安全的前进方式。提供具体的护栏和精确的指令（低自由度）。示例：必须按精确顺序运行的数据库迁移。
* **没有危险的开阔场地**：多条路径通向成功。给出总体方向并信任 Claude 找到最佳路线（高自由度）。示例：代码审查，其中上下文决定了最佳方法。

### 使用您计划使用的所有模型进行测试

Skills 作为模型的附加物发挥作用，因此有效性取决于底层模型。使用您计划与之配合的所有模型测试您的 Skill。

**按模型的测试考虑因素**：

* **Claude Haiku**（快速、经济）：Skill 是否提供了足够的指导？
* **Claude Sonnet**（平衡）：Skill 是否清晰高效？
* **Claude Opus**（强大推理）：Skill 是否避免了过度解释？

对 Opus 完美有效的内容可能对 Haiku 需要更多细节。如果您的 Skill 跨多个模型使用，请针对所有模型都能很好地工作的指令为目标。

## Skill 结构

<Note>
  **YAML Frontmatter**：SKILL.md frontmatter 支持两个字段：

  * `name` - Skill 的人类可读名称（最多 64 个字符）
  * `description` - 描述 Skill 做什么以及何时使用的一行描述（最多 1024 个字符）

  有关完整的 Skill 结构详细信息，请参阅 [Skills 概述](/en/docs/agents-and-tools/agent-skills/overview#skill-structure)。
</Note>

### 命名约定

使用一致的命名模式使 Skills 更容易引用和讨论。我们建议对 Skill 名称使用 **动名词形式**（动词 + -ing），因为这清楚地描述了 Skill 提供的活动或能力。

**好的命名示例（动名词形式）**：

* "Processing PDFs"
* "Analyzing spreadsheets"
* "Managing databases"
* "Testing code"
* "Writing documentation"

**可接受的替代方案**：

* 名词短语："PDF Processing"、"Spreadsheet Analysis"
* 行动导向："Process PDFs"、"Analyze Spreadsheets"

**避免**：

* 模糊的名称："Helper"、"Utils"、"Tools"
* 过于通用："Documents"、"Data"、"Files"
* 技能集合中的模式不一致

一致的命名使以下方面更容易：

* 在文档和对话中引用 Skills
* 一眼就能理解 Skill 的作用
* 组织和搜索多个 Skills
* 维护专业、一致的技能库

### 编写有效的描述

`description` 字段支持 Skill 发现，应该包括 Skill 做什么以及何时使用它。

<Warning>
  **始终用第三人称编写**。描述被注入到系统提示中，不一致的观点可能导致发现问题的。

  * **好**："处理 Excel 文件并生成报告"
  * **避免**："我可以帮助您处理 Excel 文件"
  * **避免**："您可以使用它来处理 Excel 文件"
</Warning>

**要具体并包含关键术语**。包括 Skill 做什么以及何时使用的特定触发器/上下文。

每个 Skill 只有一个描述字段。描述对技能选择至关重要：Claude 可能从 100 多个可用 Skills 中选择正确的 Skill。您的描述必须为 Claude 提供足够的细节来知道何时选择此 Skill，而 SKILL.md 的其余部分提供实现细节。

有效的示例：

**PDF 处理 skill：**

```yaml  theme={null}
description: 从 PDF 文件提取文本和表格，填写表单，合并文档。在处理 PDF 文件或用户提及 PDF、表单或文档提取时使用。
```

**Excel 分析 skill：**

```yaml  theme={null}
description: 分析 Excel 电子表格，创建数据透视表，生成图表。在分析 Excel 文件、电子表格、表格数据或 .xlsx 文件时使用。
```

**Git 提交助手 skill：**

```yaml  theme={null}
description: 通过分析 git diff 生成描述性提交消息。在用户请求帮助编写提交消息或审查暂存的更改时使用。
```

避免如下模糊的描述：

```yaml  theme={null}
description: 帮助处理文档
```

```yaml  theme={null}
description: 处理数据
```

```yaml  theme={null}
description: 对文件做些什么
```

### 渐进式披露模式

SKILL.md 作为一个概述，根据需要指向详细材料，就像入职指南中的目录一样。关于渐进式披露如何工作的解释，请参阅概述中的 [Skills 如何工作](/en/docs/agents-and-tools/agent-skills/overview#how-skills-work)。

**实践指导**：

* 为获得最佳性能，保持 SKILL.md 正文在 500 行以下
* 当接近此限制时，将内容拆分为单独的文件
* 使用以下模式有效地组织指令、代码和资源

#### 视觉概述：从简单到复杂

一个基本的 Skill 从一个只包含元数据和指令的 SKILL.md 文件开始：

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=87782ff239b297d9a9e8e1b72ed72db9" alt="Simple SKILL.md file showing YAML frontmatter and markdown body" data-og-width="2048" width="2048" data-og-height="1153" height="1153" data-path="images/agent-skills-simple-file.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=c61cc33b6f5855809907f7fda94cd80e 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=90d2c0c1c76b36e8d485f49e0810dbfd 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=ad17d231ac7b0bea7e5b4d58fb4aeabb 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=f5d0a7a3c668435bb0aee9a3a8f8c329 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=0e927c1af9de5799cfe557d12249f6e6 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=46bbb1a51dd4c8202a470ac8c80a893d 2500w" />

随着您的 Skill 增长，您可以捆绑 Claude 只在需要时加载的其他内容：

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=a5e0aa41e3d53985a7e3e43668a33ea3" alt="Bundling additional reference files like reference.md and forms.md." data-og-width="2048" width="2048" data-og-height="1327" height="1327" data-path="images/agent-skills-bundling-content.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=f8a0e73783e99b4a643d79eac86b70a2 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=dc510a2a9d3f14359416b706f067904a 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=82cd6286c966303f7dd914c28170e385 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=56f3be36c77e4fe4b523df209a6824c6 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=d22b5161b2075656417d56f41a74f3dd 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=3dd4bdd6850ffcc96c6c45fcb0acd6eb 2500w" />

完整的 Skill 目录结构可能如下所示：

```
pdf/
├── SKILL.md              # 主指令（触发时加载）
├── FORMS.md              # 表单填写指南（按需加载）
├── reference.md          # API 参考（按需加载）
├── examples.md           # 用法示例（按需加载）
└── scripts/
    ├── analyze_form.py   # 实用脚本（执行，不加载）
    ├── fill_form.py      # 表单填写脚本
    └── validate.py       # 验证脚本
```

#### 模式 1：带参考的高级指南

````markdown  theme={null}
---
name: PDF Processing
description: 从 PDF 文件提取文本和表格，填写表单，合并文档。在处理 PDF 文件或用户提及 PDF、表单或文档提取时使用。
---

# PDF 处理

## 快速开始

使用 pdfplumber 提取文本：
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

## 高级功能

**表单填写**：有关完整指南请参阅 [FORMS.md](FORMS.md)
**API 参考**：有关所有方法请参阅 [REFERENCE.md](REFERENCE.md)
**示例**：有关常见模式请参阅 [EXAMPLES.md](EXAMPLES.md)
````

Claude 只在需要时加载 FORMS.md、REFERENCE.md 或 EXAMPLES.md。

#### 模式 2：按领域组织

对于具有多个领域的 Skills，按领域组织内容以避免加载无关的上下文。当用户询问销售指标时，Claude 只需要阅读销售相关的模式，而不是财务或营销数据。这保持 token 使用量低且上下文集中。

```
bigquery-skill/
├── SKILL.md (概述和导航)
└── reference/
    ├── finance.md (收入、计费指标)
    ├── sales.md (机会、管道)
    ├── product.md (API 使用、功能)
    ├── marketing.md (活动、归因)
```

````markdown SKILL.md theme={null}
# BigQuery 数据分析

## 可用数据集

**财务**：收入、ARR、计费 → 参阅 [reference/finance.md](reference/finance.md)
**销售**：机会、管道、账户 → 参阅 [reference/sales.md](reference/sales.md)
**产品**：API 使用、功能、采用 → 参阅 [reference/product.md](reference/product.md)
**营销**：活动、归因、邮件 → 参阅 [reference/marketing.md](reference/marketing.md)

## 快速搜索

使用 grep 查找特定指标：

```bash
grep -i "revenue" reference/finance.md
grep -i "pipeline" reference/sales.md
grep -i "api usage" reference/product.md
```
````

#### 模式 3：条件详情

显示基本内容，链接到高级内容：

```markdown  theme={null}
# DOCX 处理

## 创建文档

使用 docx-js 创建新文档。参阅 [DOCX-JS.md](DOCX-JS.md)。

## 编辑文档

对于简单编辑，直接修改 XML。

**对于修订跟踪**：参阅 [REDLINING.md](REDLINING.md)
**对于 OOXML 详情**：参阅 [OOXML.md](OOXML.md)
```

只有当用户需要这些功能时，Claude 才会读取 REDLINING.md 或 OOXML.md。

### 避免深度嵌套的引用

当从其他被引用的文件中引用文件时，Claude 可能会部分读取文件。当遇到嵌套引用时，Claude 可能会使用 `head -100` 等命令预览内容而不是读取整个文件，导致信息不完整。

**保持引用从 SKILL.md 向下一层深**。所有引用文件应该直接从 SKILL.md 链接，以确保 Claude 在需要时读取完整文件。

**糟糕的示例：太深**：

```markdown  theme={null}
# SKILL.md
See [advanced.md](advanced.md)...

# advanced.md
See [details.md](details.md)...

# details.md
Here's the actual information...
```

**好的示例：一层深**：

```markdown  theme={null}
# SKILL.md

**基本用法**：[SKILL.md 中的指令]
**高级功能**：参阅 [advanced.md](advanced.md)
**API 参考**：参阅 [reference.md](reference.md)
**示例**：参阅 [examples.md](examples.md)
```

### 使用目录结构化更长的引用文件

对于超过 100 行的引用文件，在顶部包含目录。这确保 Claude 即使在使用部分读取预览时也能看到可用信息的完整范围。

**示例**：

```markdown  theme={null}
# API 参考

## 目录
- 身份验证和设置
- 核心方法（创建、读取、更新、删除）
- 高级功能（批量操作、webhooks）
- 错误处理模式
- 代码示例

## 身份验证和设置
...

## 核心方法
...
```

然后 Claude 可以读取完整文件或根据需要跳转到特定部分。

有关这种基于文件系统的架构如何实现渐进式披露的详细信息，请参阅下面高级部分的[运行时环境](#runtime-environment)部分。

## 工作流程和反馈循环

### 为复杂任务使用工作流程

将复杂操作分解为清晰的顺序步骤。对于特别复杂的工作流程，提供一个清单，Claude 可以复制到其响应中并在进度中勾选。

**示例 1：研究综合工作流程**（适用于没有代码的 Skills）：

````markdown  theme={null}
## 研究综合工作流程

复制此清单并跟踪您的进度：

```
研究进度：
- [ ] 步骤 1：阅读所有源文档
- [ ] 步骤 2：识别关键主题
- [ ] 步骤 3：交叉引用声明
- [ ] 步骤 4：创建结构化摘要
- [ ] 步骤 5：验证引用
```

**步骤 1：阅读所有源文档**

查看 `sources/` 目录中的每个文档。注意主要论点和支持证据。

**步骤 2：识别关键主题**

寻找跨来源的模式。哪些主题反复出现？来源在哪里同意或不同意？

**步骤 3：交叉引用声明**

对于每个主要声明，验证它是否出现在源材料中。指出哪个来源支持每个观点。

**步骤 4：创建结构化摘要**

按主题组织发现。包括：
- 主要论点
- 来自来源的支持证据
- 冲突观点（如果有）

**步骤 5：验证引用**

检查每个声明是否引用了正确的源文档。如果引用不完整，返回步骤 3。
````

此示例展示如何将工作流程应用于不需要代码的分析任务。清单模式适用于任何复杂的多步骤流程。

**示例 2：PDF 表单填写工作流程**（适用于有代码的 Skills）：

````markdown  theme={null}
## PDF 表单填写工作流程

复制此清单并在完成项目时勾选：

```
任务进度：
- [ ] 步骤 1：分析表单（运行 analyze_form.py）
- [ ] 步骤 2：创建字段映射（编辑 fields.json）
- [ ] 步骤 3：验证映射（运行 validate_fields.py）
- [ ] 步骤 4：填写表单（运行 fill_form.py）
- [ ] 步骤 5：验证输出（运行 verify_output.py）
```

**步骤 1：分析表单**

运行：`python scripts/analyze_form.py input.pdf`

这会提取表单字段及其位置，保存到 `fields.json`。

**步骤 2：创建字段映射**

编辑 `fields.json` 为每个字段添加值。

**步骤 3：验证映射**

运行：`python scripts/validate_fields.py fields.json`

在继续之前修复任何验证错误。

**步骤 4：填写表单**

运行：`python scripts/fill_form.py input.pdf fields.json output.pdf`

**步骤 5：验证输出**

运行：`python scripts/verify_output.py output.pdf`

如果验证失败，返回步骤 2。
````

清晰的步骤防止 Claude 跳过关键验证。清单帮助您和 Claude 跟踪多步骤工作流程的进度。

### 实现反馈循环

**常见模式**：运行验证器 → 修复错误 → 重复

此模式大大提高输出质量。

**示例 1：样式指南合规性**（适用于没有代码的 Skills）：

```markdown  theme={null}
## 内容审查流程

1. 按照 STYLE_GUIDE.md 中的指南起草您的内容
2. 根据清单进行审查：
   - 检查术语一致性
   - 验证示例是否符合标准格式
   - 确认所有必需部分都存在
3. 如果发现问题：
   - 记录每个问题及其具体部分引用
   - 修改内容
   - 再次审查清单
4. 只有在满足所有要求时才继续
5. 最终确定并保存文档
```

这展示了使用参考文档而不是脚本的验证循环模式。"验证器"是 STYLE_GUIDE.md，Claude 通过阅读和比较来执行检查。

**示例 2：文档编辑流程**（适用于有代码的 Skills）：

```markdown  theme={null}
## 文档编辑流程

1. 对 `word/document.xml` 进行编辑
2. **立即验证**：`python ooxml/scripts/validate.py unpacked_dir/`
3. 如果验证失败：
   - 仔细查看错误消息
   - 修复 XML 中的问题
   - 再次运行验证
4. **只有在验证通过时才继续**
5. 重新打包：`python ooxml/scripts/pack.py unpacked_dir/ output.docx`
6. 测试输出文档
```

验证循环可以及早发现错误。

## 内容指南

### 避免时间敏感的信息

不要包含会过时的信息：

**糟糕的示例：时间敏感**（会变错）：

```markdown  theme={null}
If you're doing this before August 2025, use the old API.
After August 2025, use the new API.
```

**好的示例**（使用"旧模式"部分）：

```markdown  theme={null}
## 当前方法

使用 v2 API 端点：`api.example.com/v2/messages`

## 旧模式

<details>
<summary>Legacy v1 API (deprecated 2025-08)</summary>

v1 API 使用：`api.example.com/v1/messages`

此端点不再支持。
</details>
```

旧模式部分提供了历史背景，而不会使主要内容混乱。

### 使用一致的术语

选择一个术语并在整个 Skill 中使用：

**好 - 一致**：

* 始终使用 "API 端点"
* 始终使用 "字段"
* 始终使用 "提取"

**糟糕 - 不一致**：

* 混用 "API 端点"、"URL"、"API 路由"、"路径"
* 混用 "字段"、"框"、"元素"、"控件"
* 混用 "提取"、"拉取"、"获取"、"检索"

一致性帮助 Claude 理解和遵循指令。

## 常见模式

### 模板模式

为输出格式提供模板。根据您的需要匹配严格程度。

**对于严格要求**（如 API 响应或数据格式）：

````markdown  theme={null}
## 报告结构

始终使用此精确模板结构：

```markdown
# [分析标题]

## 执行摘要
[关键发现的一段概述]

## 关键发现
- 发现 1 及支持数据
- 发现 2 及支持数据
- 发现 3 及支持数据

## 建议
1. 具体可操作的建议
2. 具体可操作的建议
```
````

**对于灵活指导**（当适应有用时）：

````markdown  theme={null}
## 报告结构

这是一个合理的默认格式，但根据您的分析使用最佳判断：

```markdown
# [分析标题]

## 执行摘要
[概述]

## 关键发现
[根据您发现的内容调整部分]

## 建议
[根据具体上下文调整]
```
````

根据具体分析类型需要调整部分。
````

### 示例模式

对于输出质量取决于看到示例的 Skills，提供输入/输出对，就像常规提示中一样：

````markdown  theme={null}
## 提交消息格式

按以下示例生成提交消息：

**示例 1：**
输入：Added user authentication with JWT tokens
输出：
```
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
```

**示例 2：**
输入：Fixed bug where dates displayed incorrectly in reports
输出：
```
fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation
```

**示例 3：**
输入：Updated dependencies and refactored error handling
输出：
```
chore: update dependencies and refactor error handling

- Upgrade lodash to 4.17.21
- Standardize error response format across endpoints
```

遵循此风格：type(scope)：简要描述，然后详细解释。
````

示例帮助 Claude 比仅靠描述更清楚地理解所需的风格和详细程度。

### 条件工作流程模式

通过决策点引导 Claude：

```markdown  theme={null}
## 文档修改工作流程

1. 确定修改类型：

   **创建新内容？** → 遵循下面的"创建工作流程"
   **编辑现有内容？** → 遵循下面的"编辑工作流程"

2. 创建工作流程：
   - 使用 docx-js 库
   - 从头构建文档
   - 导出为 .docx 格式

3. 编辑工作流程：
   - 解压现有文档
   - 直接修改 XML
   - 每次更改后验证
   - 完成后重新打包
```

<Tip>
  如果工作流程因许多步骤而变得很大或复杂，请考虑将它们推入单独的文件，并告诉 Claude 根据手头任务读取适当的文件。
</Tip>

## 评估和迭代

### 首先构建评估

**在编写详细文档之前创建评估。** 这确保您的 Skill 解决真实问题而不是记录想象的问题。

**评估驱动开发：**

1. **识别差距**：在没有 Skill 的情况下对代表性任务运行 Claude。记录具体失败或缺失的上下文
2. **创建评估**：构建三个测试这些差距的场景
3. **建立基线**：在没有 Skill 的情况下测量 Claude 的性能
4. **编写最小指令**：创建足够的内容来解决差距并通过评估
5. **迭代**：执行评估，与基线比较，然后改进

这种方法确保您解决的是实际问题，而不是可能永远不会出现的预期需求。

**评估结构**：

```json  theme={null}
{
  "skills": ["pdf-processing"],
  "query": "Extract all text from this PDF file and save it to output.txt",
  "files": ["test-files/document.pdf"],
  "expected_behavior": [
    "Successfully reads the PDF file using an appropriate PDF processing library or command-line tool",
    "Extracts text content from all pages in the document without missing any pages",
    "Saves the extracted text to a file named output.txt in a clear, readable format"
  ]
}
```

<Note>
  此示例演示了带有简单测试标准的数据驱动评估。我们目前不提供运行这些评估的内置方式。用户可以创建自己的评估系统。评估是衡量 Skill 有效性的真实来源。
</Note>

### 与 Claude 迭代开发 Skills

最有效的 Skill 开发过程涉及 Claude 本身。与一个 Claude 实例（"Claude A"）合作，创建将被其他实例（"Claude B"）使用的 Skill。Claude A 帮助您设计和改进指令，而 Claude B 在真实任务中测试它们。这是因为 Claude 模型既了解如何编写有效的 agent 指令，也了解 agents 需要什么信息。

**创建新的 Skill：**

1. **在没有 Skill 的情况下完成一项任务**：使用正常提示与 Claude A 一起完成一个问题的研究。在您工作时，您会自然地提供上下文、解释偏好和分享程序性知识。注意您反复提供什么信息。

2. **识别可重用的模式**：完成任务后，识别您提供的对类似未来任务有用的上下文。

   **示例**：如果您研究过 BigQuery 分析，您可能提供了表名、字段定义、过滤规则（如"始终排除测试账户"）和常见查询模式。

3. **请 Claude A 创建一个 Skill**："创建一个捕获我们刚刚使用的 BigQuery 分析模式的 Skill。包括表模式、命名约定和关于过滤测试账户的规则。"

   <Tip>
     Claude 模型原生理解 Skill 格式和结构。您不需要特殊的系统提示或"编写 skills"的 skill 来让 Claude 帮助创建 Skills。只需请 Claude 创建一个 Skill，它就会生成带有适当 frontmatter 和正文内容的正确结构的 SKILL.md。
   </Tip>

4. **审查简洁性**：检查 Claude A 是否添加了不必要的解释。请问："删除关于胜率含义的解释 - Claude 已经知道那件事。"

5. **改进信息架构**：请 Claude A 更有效地组织内容。例如："这样组织，以便表模式在单独的参考文件中。我们稍后可能会添加更多表。"

6. **在类似任务上测试**：将 Skill 与 Claude B（加载了 Skill 的新实例）在相关用例上一起使用。观察 Claude B 是否找到正确的信息、正确应用规则并成功完成任务。

7. **根据观察迭代**：如果 Claude B 挣扎或遗漏了什么，请返回给 Claude A 并具体说明："当 Claude 使用此 Skill 时，它忘记为 Q4 按日期过滤。我们是否应该添加一个关于日期过滤模式的章节？"

**迭代现有 Skills：**

改进 Skills 时，相同的层次模式继续。您可以在以下两者之间交替：

* **与 Claude A 合作**（帮助改进 Skill 的专家）
* **与 Claude B 测试**（使用 Skill 执行工作的 agent）
* **观察 Claude B 的行为**并将见解带回给 Claude A

1. **在真实工作流程中使用 Skill**：给 Claude B（加载了 Skill）实际任务，而不是测试场景

2. **观察 Claude B 的行为**：注意它在哪些方面挣扎、成功或做出意外选择

   **观察示例**："当我请 Claude B 编写区域销售报告时，它写了查询但忘记过滤掉测试账户，尽管 Skill 提到了这一规则。"

3. **返回给 Claude A 进行改进**：分享当前的 SKILL.md 并描述您观察到的内容。请问："我注意到当我请 Claude B 编写区域报告时，它忘记了过滤测试账户。Skill 提到了过滤，但可能不够突出？"

4. **审查 Claude A 的建议**：Claude A 可能建议重新组织使规则更突出，使用更强的语言如"必须过滤"而不是"始终过滤"，或重构工作流程部分。

5. **应用并测试更改**：使用 Claude A 的改进更新 Skill，然后在类似请求上再次测试

6. **根据使用情况继续**：当您遇到新场景时继续这种观察-改进-测试循环。每次迭代都基于真实的 agent 行为而不是假设来改进 Skill。

**收集团队反馈：**

1. 与队友分享 Skills 并观察他们的使用情况
2. 请问：Skill 是否在预期时激活？指令清楚吗？缺少什么？
3. 纳入反馈以解决您自己使用模式中的盲点

**为什么这种方法有效**：Claude A 了解 agent 需求，您提供领域专业知识，Claude B 通过真实使用揭示差距，迭代改进基于观察到的行为而不是假设来改进 Skills。

### 观察 Claude 如何导航 Skills

在迭代 Skills 时，请注意 Claude 在实践中实际上是如何使用它们的。注意以下方面：

* **意外的探索路径**：Claude 是否以您没想到的顺序读取文件？这可能表明您的结构不如您想象的那么直观
* **错失的联系**：Claude 是否无法遵循对重要文件的引用？您的链接可能需要更明确或更突出
* **过度依赖某些部分**：如果 Claude 反复读取同一文件，请考虑该内容是否应该在主 SKILL.md 中
* **被忽略的内容**：如果 Claude 从不访问捆绑的文件，它可能是不必要的或在主指令中信号不好

根据这些观察而不是假设进行迭代。您的 Skill 元数据中的 'name' 和 'description' 特别关键。Claude 在决定是否响应当前任务触发 Skill 时使用这些。确保它们清楚地描述了 Skill 做什么以及何时使用。

## 要避免的反模式

### 避免 Windows 风格的路径

始终在文件路径中使用正斜杠，即使在 Windows 上：

* ✓ **好**：`scripts/helper.py`、`reference/guide.md`
* ✗ **避免**：`scripts\helper.py`、`reference\guide.md`

Unix 风格的路径在所有平台上都能工作，而 Windows 风格的路径在 Unix 系统上会导致错误。

### 避免提供太多选项

除非必要，否则不要呈现多种方法：

````markdown  theme={null}
**糟糕的示例：选择太多**（令人困惑）：
"You can use pypdf, or pdfplumber, or PyMuPDF, or pdf2image, or..."

**好的示例：提供默认值**（带有出路）：
"Use pdfplumber for text extraction:
```python
import pdfplumber
```

For scanned PDFs requiring OCR, use pdf2image with pytesseract instead."
````

## 高级：带可执行代码的 Skills

下面的部分重点介绍包含可执行脚本的 Skills。如果您的 Skill 只使用 markdown 指令，请跳至[有效 Skills 清单](#有效-skills-清单)。

### 解决，不要放弃

为 Skills 编写脚本时，处理错误条件而不是交给 Claude。

**好的示例：显式处理错误**：

```python  theme={null}
def process_file(path):
    """Process a file, creating it if it doesn't exist."""
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        # 创建文件而不是失败
        print(f"File {path} not found, creating default")
        with open(path, 'w') as f:
            f.write('')
        return ''
    except PermissionError:
        # 提供替代方案而不是失败
        print(f"Cannot access {path}, using default")
        return ''
```

**糟糕的示例：交给 Claude**：

```python  theme={null}
def process_file(path):
    # 只是失败让 Claude 去弄清楚
    return open(path).read()
```

配置参数也应该被证明和记录，以避免"巫毒常数"（Ousterhout 定律）。如果您不知道正确的值，Claude 怎么能确定它？

**好的示例：自文档化**：

```python  theme={null}
# HTTP 请求通常在 30 秒内完成
# 较长的超时考虑了慢速连接
REQUEST_TIMEOUT = 30

# 三次重试平衡可靠性与速度
# 大多数间歇性失败在第二次重试时解决
MAX_RETRIES = 3
```

**糟糕的示例：魔法数字**：

```python  theme={null}
TIMEOUT = 47  # 为什么是 47？
RETRIES = 5   # 为什么是 5？
```

### 提供实用脚本

即使 Claude 可以写脚本，预制脚本也有优势：

**实用脚本的好处**：

* 比生成的代码更可靠
* 节省 token（不需要在上下文中包含代码）
* 节省时间（不需要生成代码）
* 确保使用的一致性

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=4bbc45f2c2e0bee9f2f0d5da669bad00" alt="Bundling executable scripts alongside instruction files" data-og-width="2048" width="2048" data-og-height="1154" height="1154" data-path="images/agent-skills-executable-scripts.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=9a04e6535a8467bfeea492e517de389f 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=e49333ad90141af17c0d7651cca7216b 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=954265a5df52223d6572b6214168c428 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=2ff7a2d8f2a83ee8af132b29f10150fd 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=48ab96245e04077f4d15e9170e081cfb 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=0301a6c8b3ee879497cc5b5483177c90 2500w" />

上图显示了可执行脚本如何与指令文件一起工作。指令文件（forms.md）引用脚本，Claude 可以执行它而无需将其内容加载到上下文中。

**重要区别**：在您的指令中明确说明 Claude 是否应该：

* **执行脚本**（最常见）："运行 `analyze_form.py` 提取字段"
* **将其作为参考阅读**（对于复杂逻辑）："有关字段提取算法请参阅 `analyze_form.py`"

对于大多数实用脚本，执行是首选，因为它更可靠、更高效。关于脚本执行如何工作的详细信息，请参阅下面的[运行时环境](#runtime-environment)部分。

**示例**：

````markdown  theme={null}
## 实用脚本

**analyze_form.py**：从 PDF 提取所有表单字段

```bash
python scripts/analyze_form.py input.pdf > fields.json
```

输出格式：
```json
{
  "field_name": {"type": "text", "x": 100, "y": 200},
  "signature": {"type": "sig", "x": 150, "y": 500}
}
```

**validate_boxes.py**：检查重叠的边界框

```bash
python scripts/validate_boxes.py fields.json
# 返回："OK" 或列出冲突
```

**fill_form.py**：将字段值应用到 PDF

```bash
python scripts/fill_form.py input.pdf fields.json output.pdf
```
````

### 使用视觉分析

当输入可以呈现为图像时，让 Claude 分析它们：

````markdown  theme={null}
## 表单布局分析

1. 将 PDF 转换为图像：
   ```bash
   python scripts/pdf_to_images.py form.pdf
   ```

2. 分析每个页面图像以识别表单字段
3. Claude 可以直观地看到字段位置和类型
````

<Note>
  在此示例中，您需要编写 `pdf_to_images.py` 脚本。
</Note>

Claude 的视觉能力帮助理解布局和结构。

### 创建可验证的中间输出

当 Claude 执行复杂、开放式任务时，它可能会犯错。"计划-验证-执行"模式通过让 Claude 首先以结构化格式创建计划，然后在执行之前用脚本验证该计划来及早发现错误。

**示例**：想象请 Claude 根据电子表格更新 PDF 中的 50 个表单字段。没有验证，Claude 可能会引用不存在的字段、创建冲突值、遗漏必需字段或不正确地应用更新。

**解决方案**：使用上面显示的工作流模式（PDF 表单填写），但在应用更改之前添加一个中间的 `changes.json` 文件进行验证。工作流变为：分析 → **创建计划文件** → **验证计划** → 执行 → 验证。

**为什么这种模式有效：**
* **及早发现错误**：验证在应用更改之前发现问题
* **机器可验证**：脚本提供客观验证
* **可逆计划**：Claude 可以在不接触原始文件的情况下迭代计划
* **清晰调试**：错误消息指向具体问题

**何时使用**：批量操作、破坏性更改、复杂验证规则、高风险操作。

**实现提示**：使验证脚本冗长，提供具体错误消息，如"未找到字段 'signature\_date'。可用字段：customer\_name, order\_total, signature\_date\_signed"，以帮助 Claude 修复问题。

### 包依赖

Skills 在具有平台特定限制的代码执行环境中运行：

* **claude.ai**：可以从 npm 和 PyPI 安装包，并从 GitHub 仓库拉取
* **Anthropic API**：没有网络访问权限，也没有运行时包安装

在您的 SKILL.md 中列出所需包，并在[代码执行工具文档](/en/docs/agents-and-tools/tool-use/code-execution-tool)中验证它们是否可用。

### 运行时环境

Skills 在具有文件系统访问、bash 命令和代码执行能力的代码执行环境中运行。关于此架构的概念解释，请参阅概述中的 [Skills 架构](/en/docs/agents-and-tools/agent-skills/overview#the-skills-architecture)。

**这如何影响您的编写：**

**Claude 如何访问 Skills：**

1. **元数据预加载**：在启动时，所有 Skills 的 YAML frontmatter 中的名称和描述被加载到系统提示中
2. **按需读取文件**：Claude 使用 bash Read 工具在需要时从文件系统访问 SKILL.md 和其他文件
3. **高效执行脚本**：实用脚本可以通过 bash 执行，而无需将其完整内容加载到上下文中。只有脚本的输出消耗 token
4. **大文件无上下文惩罚**：参考文件、数据或文档不会消耗上下文 token，直到实际被读取

* **文件路径重要**：Claude 像文件系统一样导航您的 skill 目录。使用正斜杠（`reference/guide.md`），而不是反斜杠
* **描述性地命名文件**：使用表明内容的名称：`form_validation_rules.md`，而不是 `doc2.md`
* **为发现组织**：按领域或功能组织目录
  * 好：`reference/finance.md`、`reference/sales.md`
  * 糟糕：`docs/file1.md`、`docs/file2.md`
* **捆绑综合资源**：包含完整的 API 文档、大量示例、大型数据集；直到被访问才有上下文惩罚
* **确定性操作首选脚本**：编写 `validate_form.py` 而不是让 Claude 生成验证代码
* **使执行意图清晰**：
  - "运行 `analyze_form.py` 提取字段"（执行）
  - "有关提取算法请参阅 `analyze_form.py`"（作为参考阅读）
* **测试文件访问模式**：通过使用真实请求测试来验证 Claude 可以导航您的目录结构

**示例**：

```
bigquery-skill/
├── SKILL.md (概述，指向参考文件)
└── reference/
    ├── finance.md (收入指标)
    ├── sales.md (管道数据)
    └── product.md (使用分析)
```

当用户询问收入时，Claude 读取 SKILL.md，看到对 `reference/finance.md` 的引用，并调用 bash 只读取该文件。sales.md 和 product.md 文件保留在文件系统中，在需要之前不消耗任何上下文 token。这种基于文件系统的模型是实现渐进式披露的原因。Claude 可以导航并有选择地加载每个任务所需的内容。

有关技术架构的完整详细信息，请参阅 Skills 概述中的 [Skills 如何工作](/en/docs/agents-and-tools/agent-skills/overview#how-skills-work)。

### MCP 工具引用

如果您的 Skill 使用 MCP（模型上下文协议）工具，请始终使用完全限定的工具名称以避免"找不到工具"错误。

**格式**：`ServerName:tool_name`

**示例**：

```markdown  theme={null}
Use the BigQuery:bigquery_schema tool to retrieve table schemas.
Use the GitHub:create_issue tool to create issues.
```

其中：

* `BigQuery` 和 `GitHub` 是 MCP 服务器名称
* `bigquery_schema` 和 `create_issue` 是这些服务器中的工具名称

没有服务器前缀，Claude 可能会无法定位工具，尤其是在有多个 MCP 服务器可用时。

### 避免假设工具已安装

不要假设包可用：

````markdown  theme={null}
**糟糕的示例：假设安装**：
"Use the pdf library to process the file."

**好的示例：明确依赖**：
"Install required package: `pip install pypdf`

Then use it:
```python
from pypdf import PdfReader
reader = PdfReader("file.pdf")
```
````

## 技术说明

### YAML frontmatter 要求

SKILL.md frontmatter 只包含 `name`（最多 64 个字符）和 `description`（最多 1024 个字符）字段。请参阅 [Skills 概述](/en/docs/agents-and-tools/agent-skills/overview#skill-structure) 了解完整的结构详细信息。

### Token 预算

为获得最佳性能，保持 SKILL.md 正文在 500 行以下。如果您的内容超过此限制，请使用前面描述的渐进式披露模式将其拆分为单独的文件。架构详细信息请参阅 [Skills 概述](/en/docs/agents-and-tools/agent-skills/overview#how-skills-work)。

## 有效 Skills 清单

在分享 Skill 之前，验证以下内容：

### 核心质量

* [ ] 描述具体并包含关键术语
* [ ] 描述包括 Skill 做什么以及何时使用它
* [ ] SKILL.md 正文在 500 行以下
* [ ] 额外详情在单独的文件中（如果需要）
* [ ] 没有时间敏感信息（或在"旧模式"部分）
* [ ] 整个过程中术语一致
* [ ] 示例具体，而不是抽象
* [ ] 文件引用只有一层深
* [ ] 适当使用渐进式披露
* [ ] 工作流程有清晰的步骤

### 代码和脚本

* [ ] 脚本解决问题而不是交给 Claude
* [ ] 错误处理明确且有帮助
* [ ] 没有"巫毒常数"（所有值都被证明）
* [ ] 指令中列出了所需包并验证可用
* [ ] 脚本有清晰的文档
* [ ] 没有 Windows 风格路径（全部正斜杠）
* [ ] 关键操作有验证/验证步骤
* [ ] 质量关键任务包含反馈循环

### 测试

* [ ] 至少创建了三个评估
* [ ] 使用 Haiku、Sonnet 和 Opus 测试
* [ ] 使用真实使用场景测试
* [ ] 纳入了团队反馈（如果适用）

## 下一步

<CardGroup cols={2}>
  <Card title="Agent Skills 入门" icon="rocket" href="/en/docs/agents-and-tools/agent-skills/quickstart">
    创建您的第一个 Skill
  </Card>

  <Card title="在 Claude Code 中使用 Skills" icon="terminal" href="/en/docs/claude-code/skills">
    在 Claude Code 中创建和管理 Skills
  </Card>

  <Card title="通过 API 使用 Skills" icon="code" href="/en/api/skills-guide">
    以编程方式上传和使用 Skills
  </Card>
</CardGroup>
