# 用户反馈 Skills 改进

**日期：** 2025-11-28
**状态：** 草稿
**来源：** 两个在真实开发场景中使用 superpowers 的 Claude 实例

---

## 执行摘要

两个 Claude 实例提供了来自真实开发会话的详细反馈。它们的反馈揭示了当前 skills 中的**系统性差距**，尽管遵循了 skills，但仍允许可预防的 bug 发布。

**关键洞察：** 这些是问题报告，而不仅仅是解决方案建议。问题是真实的；解决方案需要仔细评估。

**关键主题：**
1. **验证差距** - 我们验证操作成功，但没有验证它们是否达到了预期结果
2. **流程卫生** - 后台进程累积并在 subagents 之间造成干扰
3. **上下文优化** - Subagents 获得太多无关信息
4. **自我反思缺失** - 没有提示在交接前批评自己的工作
5. **Mock 安全** - Mock 可能与接口漂移而未被检测到
6. **Skill 激活** - Skills 存在但没有被阅读/使用

---

## 发现的问题

### 问题 1：配置变更验证差距

**发生了什么：**
- Subagent 测试"OpenAI 集成"
- 设置了 `OPENAI_API_KEY` 环境变量
- 获得了 200 状态响应
- 报告"OpenAI 集成工作正常"
- **但** 响应包含 `"model": "claude-sonnet-4-20250514"` - 实际使用的是 Anthropic

**根本原因：**
`verification-before-completion` 检查操作是否成功，但没有验证结果是否反映了预期的配置变更。

**影响：** 高 - 对集成测试的虚假信心，bug 发货到生产环境

**示例失败模式：**
- 切换 LLM 提供商 → 验证状态 200 但不检查模型名称
- 启用功能标志 → 验证没有错误但不检查功能是否激活
- 更改环境 → 验证部署成功但不检查环境变量

---

### 问题 2：后台进程累积

**发生了什么：**
- 会话期间调度了多个 subagents
- 每个都启动了后台服务器进程
- 进程累积（4+ 个服务器运行）
- 陈旧进程仍然绑定到端口
- 后续 E2E 测试命中具有错误配置的陈旧服务器
- 结果混淆/不正确

**根本原因：**
Subagents 是无状态的 - 不知道之前 subagents 的进程。没有清理协议。

**影响：** 中-高 - 测试命中错误的服务器，虚假通过/失败，调试混淆

---

### 问题 3：Subagent 提示中的上下文膨胀

**发生了什么：**
- 标准方法：让 subagent 读取完整计划文件
- 实验：只给出任务 + 模式 + 文件 + 验证命令
- 结果：更快，更聚焦，单次尝试完成更常见

**根本原因：**
Subagents 在无关的计划部分上浪费 tokens 和注意力。

**影响：** 中 - 执行更慢，更多失败尝试

**有效的方法：**
```
你正在为 packnplay 的测试套件添加一个 E2E 测试。

**你的任务：** 将 `TestE2E_FeaturePrivilegedMode` 添加到 `pkg/runner/e2e_test.go`

**要测试的内容：** 一个请求 `"privileged": true` 的本地 devcontainer 特性应该导致容器以 `--privileged` 标志运行。

**遵循 TestE2E_FeatureOptionValidation 的确切模式**（在文件末尾）

**编写后，运行：** `go test -v ./pkg/runner -run TestE2E_FeaturePrivilegedMode -timeout 5m`
```

---

### 问题 4：交接前没有自我反思

**发生了什么：**
- 添加了自我反思提示："用新眼光看待你的工作——有什么可以更好的？"
- Task 5 的实现者识别到失败的测试是由于实现 bug，而不是测试 bug
- 追溯到第 99 行：`strings.Join(metadata.Entrypoint, " ")` 创建了无效的 Docker 语法
- 没有自我反思，只会报告"测试失败"而没有根本原因

**根本原因：**
实现者不会自然地退后一步在报告完成前批评自己的工作。

**影响：** 中 - Bug 被交给审查者，而实现者本可以捕获

---

### 问题 5：Mock-接口漂移

**发生了什么：**
```typescript
// 接口定义了 close()
interface PlatformAdapter {
  close(): Promise<void>;
}

// 代码（有 bug）调用 cleanup()
await adapter.cleanup();

// Mock（匹配 bug）定义了 cleanup()
vi.mock('web-adapter', () => ({
  WebAdapter: vi.fn().mockImplementation(() => ({
    cleanup: vi.fn().mockResolvedValue(undefined),  // 错误！
  })),
}));
```
- 测试通过
- 运行时崩溃："adapter.cleanup is not a function"

**根本原因：**
Mock 派生于有 bug 的代码调用的内容，而不是接口定义。TypeScript 无法捕获具有错误方法名的内联 mock。

**影响：** 高 - 测试给出虚假信心，运行时崩溃

**为什么 testing-anti-patterns 没有防止这个问题：**
该 skill 涵盖了测试 mock 行为和不理解依赖的 mock，但没有"从接口而不是实现派生 mock"这个特定模式。

---

### 问题 6：代码审查者文件访问

**发生了什么：**
- 调度了代码审查者 subagent
- 找不到测试文件："该文件似乎不存在于仓库中"
- 文件实际存在
- 审查者不知道需要先显式读取它

**根本原因：**
审查者提示没有包含显式文件读取说明。

**影响：** 低-中 - 审查失败或不完整

---

### 问题 7：修复工作流延迟

**发生了什么：**
- 实现者在自我反思期间识别了 bug
- 实现者知道如何修复
- 当前工作流：报告 → 我调度修复者 → 修复者修复 → 我验证
- 额外的往返增加了延迟而没有增加价值

**根本原因：**
当实现者已经诊断出问题时，在实现者和修复者角色之间进行刚性分离。

**影响：** 低 - 延迟，但没有正确性问题

---

### 问题 8：Skills 没有被阅读

**发生了什么：**
- `testing-anti-patterns` skill 存在
- 人类和 subagents 都没有在写测试之前阅读它
- 虽然不是全部（见问题 5），但本可以防止一些问题

**根本原因：**
没有强制 subagents 阅读相关 skills。没有提示包含 skill 阅读。

**影响：** 中 - 如果不使用，skill 投资就浪费了

---

## 建议改进

### 1. verification-before-completion：添加配置变更验证

**添加新部分：**

```markdown
## 验证配置变更

当测试配置、提供商、功能标志或环境的变更时：

**不要只验证操作成功了。验证输出反映了预期的变更。**

### 常见失败模式

操作成功是因为*某些*有效配置存在，但它不是你打算测试的配置。

### 示例

| 变更 | 不充分 | 必需 |
|--------|-------------|----------|
| 切换 LLM 提供商 | 状态 200 | 响应包含预期模型名称 |
| 启用功能标志 | 没有错误 | 功能行为实际激活 |
| 更改环境 | 部署成功 | 日志/变量引用新环境 |
| 设置凭证 | 认证成功 | 认证的用户/上下文正确 |

### 门控函数

```
在声称配置变更有效之前：

1. 识别：这个变更之后什么应该不同？
2. 定位：在哪里可以观察到这种差异？
   - 响应字段（模型名称、用户 ID）
   - 日志行（环境、提供商）
   - 行为（功能激活/未激活）
3. 运行：显示可观察差异的命令
4. 验证：输出包含预期差异
5. 只有这样：声称配置变更有效

红色警告：
  - "请求成功"而不检查内容
  - 检查状态码但不检查响应体
  - 验证没有错误但不是正面确认
```

**为什么这有效：**
强制验证意图，而不仅仅是操作成功。

---

### 2. subagent-driven-development：为 E2E 测试添加流程卫生

**添加新部分：**

```markdown
## E2E 测试的流程卫生

当调度启动服务（服务器、数据库、消息队列）的 subagents 时：

### 问题

Subagents 是无状态的 - 它们不知道之前 subagents 启动的进程。后台进程持续存在并可能干扰后续测试。

### 解决方案

**在调度 E2E 测试 subagent 之前，在提示中包含清理：**

```
在启动任何服务之前：
1. 杀死现有进程：pkill -f "<service-pattern>" 2>/dev/null || true
2. 等待清理：sleep 1
3. 验证端口空闲：lsof -i :<port> && echo "ERROR: Port still in use" || echo "Port free"

测试完成后：
1. 杀死你启动的进程
2. 验证清理：pgrep -f "<service-pattern>" || echo "Cleanup successful"
```

### 示例

```
任务：运行 API 服务器的 E2E 测试

提示包含：
"在启动服务器之前：
- 杀死任何现有服务器：pkill -f 'node.*server.js' 2>/dev/null || true
- 验证端口 3001 空闲：lsof -i :3001 && exit 1 || echo 'Port available'

测试后：
- 杀死你启动的服务器
- 验证：pgrep -f 'node.*server.js' || echo 'Cleanup verified'"
```

### 为什么这很重要

- 陈旧进程用错误的配置服务请求
- 端口冲突导致静默失败
- 进程累积减慢系统
- 测试结果混淆（命中错误的服务器）
```

**权衡分析：**
- 为提示添加了样板
- 但防止了非常混淆的调试
- 对于 E2E 测试 subagents 来说是值得的

---

### 3. subagent-driven-development：添加精简上下文选项

**修改第 2 步：使用 Subagent 执行任务**

**之前：**
```
仔细从 [plan-file] 中读取该任务。
```

**之后：**
```
## 上下文方法

**完整计划（默认）：**
当任务复杂或有依赖时使用：
```
仔细从 [plan-file] 中读取任务 N。
```

**精简上下文（用于独立任务）：**
当任务是独立的且基于模式时使用：
```
你正在实现：[1-2 句任务描述]

要修改的文件：[确切路径]
要遵循的模式：[对现有函数/测试的引用]
要实现的内容：[具体需求]
验证：[要运行的确切命令]

[不要包含完整计划文件]
```

**使用精简上下文当：**
- 任务遵循现有模式（添加类似测试、实现类似功能）
- 任务是自包含的（不需要其他任务的上下文）
- 模式引用足够（例如，"遵循 TestE2E_FeatureOptionValidation"）

**使用完整计划当：**
- 任务依赖于其他任务
- 需要理解整体架构
- 需要上下文的复杂逻辑
```

**示例：**
```
精简上下文提示：

"你正在为 devcontainer 特性添加特权模式测试。

文件：pkg/runner/e2e_test.go
模式：遵循 TestE2E_FeatureOptionValidation（在文件末尾）
测试：具有 `"privileged": true` 元数据的特性导致 `--privileged` 标志
验证：go test -v ./pkg/runner -run TestE2E_FeaturePrivilegedMode -timeout 5m

报告：实现、测试结果、任何问题。"
```

**为什么这有效：**
减少 token 使用，增加聚焦，在适当的时候更快完成。

---

### 4. subagent-driven-development：添加自我反思步骤

**修改第 2 步：使用 Subagent 执行任务**

**添加到提示模板：**

```
完成后，在报告之前：

退后一步，用新眼光审视你的工作。

问自己：
- 这真的解决了指定的任务吗？
- 我有没有考虑到边缘情况？
- 我正确遵循模式了吗？
- 如果测试失败，根本原因是什么（实现 bug vs 测试 bug）？
- 这个实现有什么可以更好的？

如果在这个反思期间识别到问题，立即修复它们。

然后报告：
- 你实现了什么
- 自我反思发现（如果有）
- 测试结果
- 修改的文件
```

**为什么这有效：**
捕获实现者自己可以发现的 bug，然后再交接。记录在案的案例：通过自我反思识别了 entrypoint bug。

**权衡：**
为每个任务增加约 30 秒，但在审查之前捕获问题。

---

### 5. requesting-code-review：添加显式文件读取

**修改代码审查者模板：**

**在开头添加：**

```markdown
## 要审查的文件

在分析之前，先读取这些文件：

1. [差值中更改的具体文件]
2. [更改引用但未修改的文件]

使用 Read 工具加载每个文件。

如果你找不到文件：
- 从差值中检查确切路径
- 尝试备用位置
- 报告："无法定位 [路径] - 请验证文件存在"

在你读取实际代码之前不要继续审查。
```

**为什么这有效：**
明确的说明防止了"找不到文件"问题。

---

### 6. testing-anti-patterns：添加 Mock-接口漂移反模式

**添加新的反模式 6：**

```markdown
## 反模式 6：从实现派生的 Mock

**违规：**
```typescript
// 代码（有 bug）调用 cleanup()
await adapter.cleanup();

// Mock（匹配 bug）有 cleanup()
const mock = {
  cleanup: vi.fn().mockResolvedValue(undefined)
};

// 接口（正确）定义了 close()
interface PlatformAdapter {
  close(): Promise<void>;
}
```

**为什么这是错误的：**
- Mock 将 bug 编码到测试中
- TypeScript 无法捕获具有错误方法名的内联 mock
- 测试通过因为代码和 mock 都错了
- 运行时在使用真实对象时崩溃

**修复：**
```typescript
// ✅ 好：从接口派生 mock

// 步骤 1：打开接口定义（PlatformAdapter）
// 步骤 2：列出其中定义的方法（close、initialize 等）
// 步骤 3：Mock 正是那些方法

const mock = {
  initialize: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),  // 来自接口！
};

// 现在测试失败，因为代码调用 cleanup() 而它不存在
// 这个失败在 runtime 之前就揭示了 bug
```

### 门控函数

```
在编写任何 mock 之前：

  1. 停止 - 还不要看被测试的代码
  2. 找到：依赖的接口/类型定义
  3. 读取：接口文件
  4. 列出：接口中定义的方法
  5. Mock：只 mock 那些具有确切名称的方法
  6. 不要：看你的代码调用什么

  如果你的测试失败因为代码调用 mock 中没有的东西：
    ✅ 好 - 测试找到了你的代码中的 bug
    修复代码调用正确的接口方法
    而不是 mock

  红色警告：
    - "我会 mock 代码调用的东西"
    - 从实现复制方法名
    - 在没有读取接口的情况下编写 mock
    - "测试失败，所以我会在 mock 中添加这个方法"
```

**检测：**

当你看到运行时错误"X is not a function"且测试通过时：
1. 检查 X 是否被 mock
2. 比较 mock 方法和接口方法
3. 寻找方法名不匹配
```

**为什么这有效：**
直接解决反馈中的失败模式。

---

### 7. subagent-driven-development：要求测试 Subagents 阅读 Skills

**当任务涉及测试时添加到提示模板：**

```markdown
在编写任何测试之前：

1. 阅读 testing-anti-patterns skill：
   使用 Skill 工具：superpowers:testing-anti-patterns

2. 在以下情况下应用该 skill 的门控函数：
   - 编写 mocks
   - 向生产类添加方法
   - Mock 依赖

这**不是**可选的。违反反模式的测试将在审查中被拒绝。
```

**为什么这有效：**
确保 skills 实际被使用，而不仅仅是存在。

**权衡：**
为每个任务增加时间，但防止了整类 bug。

---

### 8. subagent-driven-development：允许实现者修复自己识别的问题

**修改第 2 步：**

**当前：**
```
Subagent 报告工作总结。
```

**建议：**
```
Subagent 执行自我反思，然后：

如果自我反思识别到可修复的问题：
  1. 修复这些问题
  2. 重新运行验证
  3. 报告："初始实现 + 自我反思修复"

否则：
  报告："实现完成"

报告中包含：
- 自我反思发现
- 是否应用了修复
- 最终验证结果
```

**为什么这有效：**
当实现者已经知道修复方法时减少延迟。记录在案的案例：为 entrypoint bug 节省了一次往返。

**权衡：**
提示稍微复杂，但端到端更快。

---

## 实现计划

### 阶段 1：高影响、低风险（先做）

1. **verification-before-completion：配置变更验证**
   - 清晰添加，不改变现有内容
   - 解决高影响问题（测试中的虚假信心）
   - 文件：`skills/verification-before-completion/SKILL.md`

2. **testing-anti-patterns：Mock-接口漂移**
   - 添加新反模式，不修改现有内容
   - 解决高影响问题（运行时崩溃）
   - 文件：`skills/testing-anti-patterns/SKILL.md`

3. **requesting-code-review：显式文件读取**
   - 简单添加到模板
   - 解决具体问题（审查者找不到文件）
   - 文件：`skills/requesting-code-review/SKILL.md`

### 阶段 2：适度更改（仔细测试）

4. **subagent-driven-development：流程卫生**
   - 添加新部分，不改变工作流
   - 解决中-高影响（测试可靠性）
   - 文件：`skills/subagent-driven-development/SKILL.md`

5. **subagent-driven-development：自我反思**
   - 改变提示模板（更高风险）
   - 但记录可捕获 bug
   - 文件：`skills/subagent-driven-development/SKILL.md`

6. **subagent-driven-development：Skills 阅读要求**
   - 添加提示开销
   - 但确保 skills 实际被使用
   - 文件：`skills/subagent-driven-development/SKILL.md`

### 阶段 3：优化（先验证）

7. **subagent-driven-development：精简上下文选项**
   - 添加复杂性（两种方法）
   - 需要验证它不会造成混淆
   - 文件：`skills/subagent-driven-development/SKILL.md`

8. **subagent-driven-development：允许实现者修复**
   - 改变工作流（更高风险）
   - 优化，不是 bug 修复
   - 文件：`skills/subagent-driven-development/SKILL.md`

---

## 开放问题

1. **精简上下文方法：**
   - 我们应该将其作为基于模式任务的默认值吗？
   - 我们如何决定使用哪种方法？
   - 太精简而错过重要上下文的风险？

2. **自我反思：**
   - 这会显著减慢简单任务吗？
   - 它应该只适用于复杂任务吗？
   - 我们如何防止"反思疲劳"让它变得机械？

3. **流程卫生：**
   - 这应该在 subagent-driven-development 中还是单独的 skill 中？
   - 它是否适用于 E2E 测试之外的其他工作流？
   - 我们如何处理进程应该持续存在的情况（开发服务器）？

4. **Skills 阅读强制：**
   - 我们是否要求所有 subagents 阅读相关 skills？
   - 我们如何防止提示变得太长？
   - 过度文档化而失去聚焦的风险？

---

## 成功指标

我们如何知道这些改进有效？

1. **配置验证：**
   - 零实例"测试通过但使用了错误配置"
   - Jesse 不会说"那实际上不是在测试你想要的"

2. **流程卫生：**
   - 零实例"测试命中错误的服务器"
   - E2E 测试运行期间没有端口冲突错误

3. **Mock-接口漂移：**
   - 零实例"测试通过但运行时因缺少方法而崩溃"
   - Mock 和接口之间没有方法名不匹配

4. **自我反思：**
   - 可衡量：实现者报告是否包含自我反思发现？
   - 定性：更少的 bug 进入代码审查？

5. **Skills 阅读：**
   - Subagent 报告引用 skill 门控函数
   - 代码审查中更少的反模式违规

---

## 风险和缓解措施

### 风险：提示膨胀
**问题：** 添加所有这些要求使提示不堪重负
**缓解：**
- 分阶段实现（不要一次添加所有内容）
- 使一些添加有条件（E2E 卫生仅用于 E2E 测试）
- 考虑为不同任务类型使用模板

### 风险：分析瘫痪
**问题：** 太多反思/验证减慢执行
**缓解：**
- 保持门控函数快速（秒，而不是分钟）
- 使精简上下文最初可选
- 监控任务完成时间

### 风险：虚假安全感
**问题：** 遵循检查清单不能保证正确性
**缓解：**
- 强调门控函数是最低要求，不是最高要求
- 在 skills 中保持"使用判断"语言
- 记录 skills 捕获常见失败，而不是所有失败

### 风险：Skill 分歧
**问题：** 不同 skills 给出冲突的建议
**缓解：**
- 审查所有 skills 的一致性更改
- 记录 skills 如何交互（集成部分）
- 在部署前用真实场景测试

---

## 建议

**立即进入阶段 1：**
- verification-before-completion：配置变更验证
- testing-anti-patterns：Mock-接口漂移
- requesting-code-review：显式文件读取

**在最终确定前与 Jesse 一起测试阶段 2：**
- 获得关于自我反思影响的反馈
- 验证流程卫生方法
- 确认 skills 阅读要求值得开销

**等待验证后进入阶段 3：**
- 精简上下文需要真实世界测试
- 实现者-修复工作流更改需要仔细评估

这些更改解决了用户记录的真实问题，同时最小化了使 skills 变得更糟的风险。
