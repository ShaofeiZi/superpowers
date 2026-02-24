---
name: requesting-code-review
description: 当完成任务、实施主要功能或在合并前使用，以验证工作是否符合要求
---

# 请求代码审查

调度 superpowers:code-reviewer 子代理以在问题级联之前发现问题。

**核心原则：** 早审查，常审查。

## 何时请求审查

**强制：**
- 子驱动开发中每个任务之后
- 主要功能完成后
- 合并到 main 之前

**可选但有价值：**
- 陷入困境时（新鲜视角）
- 重构之前（基线检查）
- 修复复杂 bug 后

## 如何请求

**1. 获取 git SHA：**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # 或 origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. 调度 code-reviewer 子代理：**

使用 Task 工具，类型为 superpowers:code-reviewer，填写 `code-reviewer.md` 中的模板

**占位符：**
- `{WHAT_WAS_IMPLEMENTED}` - 你刚构建的内容
- `{PLAN_OR_REQUIREMENTS}` - 它应该做什么
- `{BASE_SHA}` - 起始提交
- `{HEAD_SHA}` - 结束提交
- `{DESCRIPTION}` - 简要摘要

**3. 处理反馈：**
- 立即修复关键问题
- 重要问题在继续之前修复
- 记录小问题以供稍后处理
- 如果审查者错了，反驳（带推理）

## 示例

```
[刚刚完成任务 2：添加验证函数]

你：让我在继续之前请求代码审查。

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[调度 superpowers:code-reviewer 子代理]
  WHAT_WAS_IMPLEMENTED: 会话索引的验证和修复函数
  PLAN_OR_REQUIREMENTS: docs/plans/deployment-plan.md 中的任务 2
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: 添加了 verifyIndex() 和 repairIndex()，包含 4 种问题类型

[子代理返回]：
  优势：清晰的架构，真实的测试
  问题：
    重要：缺少进度指示器
    小：报告间隔的魔数 (100)
  评估：准备好继续

你：[修复进度指示器]
[继续到任务 3]
```

## 与工作流的集成

**子代理驱动开发：**
- 每个任务后审查
- 在问题复合之前发现问题
- 继续下一个任务前修复

**执行计划：**
- 每批（3 个任务）后审查
- 获取反馈，应用，继续

**临时开发：**
- 合并前审查
- 陷入困境时审查

## 红旗

**永远不要：**
- 因为"简单"而跳过审查
- 忽略关键问题
- 带着未修复的重要问题继续
- 与有效的技术反馈争论

**如果审查者错了：**
- 用技术推理反驳
- 展示证明其有效的代码/测试
- 请求澄清

请参阅模板：requesting-code-review/code-reviewer.md
