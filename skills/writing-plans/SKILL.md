---
name: writing-plans
description: 当你有多步任务的需求或规范时使用，在接触代码之前
---

# 编写计划

## 概述

编写全面的实施计划，假设工程师对我们的代码库上下文为零且品味可疑。记录他们需要知道的一切：每个任务要触摸哪些文件、代码、他们可能需要检查的文档、如何测试。将整个计划提供给他们作为小的任务。DRY。YAGNI。TDD。频繁提交。

假设他们是一名熟练的开发者，但对我们的工具集或问题领域几乎一无所知。假设他们不太懂好的测试设计。

**开始时声明：** "我正在使用 writing-plans 技能来创建实施计划。"

**上下文：** 这应该在专门的工作树中运行（由头脑风暴技能创建）。

**保存计划到：** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## 小任务的粒度

**每个步骤是一个操作（2-5 分钟）：**
- "编写失败的测试" - 步骤
- "运行它确保它失败" - 步骤
- "编写最少的代码使测试通过" - 步骤
- "运行测试确保它们通过" - 步骤
- "提交" - 步骤

## 计划文档头

**每个计划必须以此头开始：**

```markdown
# [功能名称] 实施计划

> **For Claude:** 必需的子技能：使用 superpowers:executing-plans 逐任务实施此计划。

**目标：** [描述构建内容的一句话]

**架构：** [关于方法的 2-3 句话]

**技术栈：** [关键技术/库]

---
```

## 任务结构

````markdown
### 任务 N：[组件名称]

**文件：**
- 创建：`exact/path/to/file.py`
- 修改：`exact/path/to/existing.py:123-145`
- 测试：`tests/exact/path/to/test.py`

**步骤 1：编写失败的测试**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**步骤 2：运行测试验证它失败**

运行：`pytest tests/path/test.py::test_name -v`
预期：失败，显示 "function not defined"

**步骤 3：编写最少实现**

```python
def function(input):
    return expected
```

**步骤 4：运行测试验证它通过**

运行：`pytest tests/path/test.py::test_name -v`
预期：通过

**步骤 5：提交**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## 记住

- 始终使用精确的文件路径
- 计划中的完整代码（不是"添加验证"）
- 带预期输出的精确命令
- 使用 @ 语法引用相关技能
- DRY、YAGNI、TDD、频繁提交

## 执行交接

保存计划后，提供执行选择：

**"计划完成并保存到 `docs/plans/<filename>.md`。两种执行选项：**

**1. 子代理驱动（此会话）** - 我为每个任务调度新的子代理，任务之间审查，快速迭代

**2. 并行会话（单独）** - 在工作树中打开新会话使用 executing-plans，带检查点的批量执行

**哪种方法？**

**如果选择子代理驱动：**
- **必需的子技能：** 使用 superpowers:subagent-driven-development
- 保持在当前会话
- 每个任务一个新子代理 + 代码审查

**如果选择并行会话：**
- 引导他们在工作树中打开新会话
- **必需的子技能：** 新会话使用 superpowers:executing-plans
