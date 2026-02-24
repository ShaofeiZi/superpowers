# 条件等待

## 概述

不稳定的测试经常用任意延迟猜测时间。这会在快速机器上通过但在负载下或 CI 中失败的竞态条件。

**核心原则：** 等待您关心的实际条件，而不是猜测需要多长时间。

## 何时使用

```dot
digraph when_to_use {
    "Test uses setTimeout/sleep?" [shape=diamond];
    "Testing timing behavior?" [shape=diamond];
    "Document WHY timeout needed" [shape=box];
    "Use condition-based waiting" [shape=box];

    "Test uses setTimeout/sleep?" -> "Testing timing behavior?" [label="yes"];
    "Testing timing behavior?" -> "Document WHY timeout needed" [label="yes"];
    "Testing timing behavior?" -> "Use condition-based waiting" [label="no"];
}
```

**使用当：**
- 测试有任意延迟（`setTimeout`、`sleep`、`time.sleep()`）
- 测试不稳定（有时通过，负载下失败）
- 测试在并行运行时超时
- 等待异步操作完成

**不使用当：**
- 测试实际计时行为（防抖、节流间隔）
- 如果使用任意超时总是记录为什么

## 核心模式

```typescript
// ❌ 之前：猜测时间
await new Promise(r => setTimeout(r, 50));
const result = getResult();
expect(result).toBeDefined();

// ✅ 之后：等待条件
await waitFor(() => getResult() !== undefined);
const result = getResult();
expect(result).toBeDefined();
```

## 快速模式

| 场景 | 模式 |
|----------|---------|
| 等待事件 | `waitFor(() => events.find(e => e.type === 'DONE'))` |
| 等待状态 | `waitFor(() => machine.state === 'ready')` |
| 等待数量 | `waitFor(() => items.length >= 5)` |
| 等待文件 | `waitFor(() => fs.existsSync(path))` |
| 复杂条件 | `waitFor(() => obj.ready && obj.value > 10)` |

## 实现

通用轮询函数：
```typescript
async function waitFor<T>(
  condition: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000
): Promise<T> {
  const startTime = Date.now();

  while (true) {
    const result = condition();
    if (result) return result;

    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Timeout waiting for ${description} after ${timeoutMs}ms`);
    }

    await new Promise(r => setTimeout(r, 10)); // 每 10ms 轮询
  }
}
```

有关带有领域特定助手（`waitForEvent`、`waitForEventCount`、`waitForEventMatch`）的完整实现，请参阅此目录中的 `condition-based-waiting-example.ts`。

## 常见错误

**❌ 轮询太快：** `setTimeout(check, 1)` - 浪费 CPU
✅ 修复：每 10ms 轮询

**❌ 没有超时：** 如果条件永不满足则永远循环
✅ 修复：始终包含带清晰错误消息的超时

**❌ 过期数据：** 在循环前缓存状态
✅ 修复：在循环内调用 getter 获取新数据

## 任意超时何时是正确的

```typescript
// 工具每 100ms 滴答 - 需要 2 次滴答来验证部分输出
await waitForEvent(manager, 'TOOL_STARTED'); // 首先：等待条件
await new Promise(r => setTimeout(r, 200));   // 然后：等待计时行为
// 200ms = 100ms 间隔的 2 次滴答 - 记录并证明
```

**要求：**
1. 首先等待触发条件
2. 基于已知计时（不是猜测）
3. 注释解释为什么

## 现实影响

来自调试会话（2025-10-03）：
- 修复了 3 个文件中 15 个不稳定的测试
- 通过率：60% → 100%
- 执行时间：快 40%
- 不再有竞态条件
