# 课程一致性复核

依据父任务团队对课程 10 份、287 页课件的实际阅读及关键图表核对汇总。此处仅整理与 Lab1 有关的设计依据，不发布完整课件。课堂倡导不全部等于作业强制要求。

- Command p2/p11/p16/p20：装配时绑定 Receiver，具体命令委托业务；允许保存 undo 状态。p21/p31：审视全量快照的选择及资源成本，并非绝对禁止快照。p22–25：统一执行器、undo/redo 两栈、新成功编辑清 redo。p29：删除保留对象与原位置，Save 的不可撤销边界需明确。
- Composite p10–15/p24/p28–29：统一 Component、递归委派、安全式/透明式取舍、容器自身防环；客户端不依具体组件 instanceof。作业允许的工厂类型映射仍保留。
- OOP p17/p19：以接口隔离变化、收敛公开 API、避免具体实现的循环依赖。
- TDD p4/p7/p12/p33–34：红绿重构、先运行 Bug 回归；Receiver/Command/Invoker 分层测试及少量端到端。
- 其余课件强调依赖接口、组合、多态与变化方向，不据此为 Lab1 追加无需求模式、宏或队列。

## 本轮真实红绿记录

1. 在生产代码仍为 `8b4383c` 时新增 `test/course.test.ts`，运行 `node --import tsx --test test/course.test.ts`，退出码 1，9 项全部失败。失败暴露：命令未构造绑定 Receiver、缺少 Receiver.create、Receiver 直接缩放中途失败残留修改、public attach、客户端具体类型判断、Invoker 仍向 mock 传文档，以及新绑定接口下的精确撤销契约。
2. 当时旧的 20 项回归并不覆盖上述设计约束；这次失败不是把原先功能开发倒叙写成 TDD。
3. 修复计划：Receiver 生成受影响几何/属性/结构位置的前后状态；命令持有 Receiver 与编辑记录；容器通过一致性维护 API 更新父子关系；导入和变换用多态能力。
4. `a5d022f` 保存红阶段；`3c3b048` 实现模型与局部状态，并通过 7 项既有模型/IO 测试；`e6c4f07` 绑定 Receiver 并迁移 Invoker，完整 check 达到 29/29 绿阶段。
5. 随后添加验证覆盖替身 Receiver 的九条委托、命令生命周期失败重试、替代组件、跨父级位置恢复、精确小数、实际结构 undo 注入失败及直接 Composite 原子性；完整 check 共 36/36 通过。新增的后续验证不冒称也经历过先红阶段。

## 修复前资源基线

Node 26.5.0、内存模型、保留 History、强制 GC 的参考测量。1000 个矩形、50 条单叶 move 历史实际克隆 100100 个对象，堆增量约 57.49 MiB；一次 undo/redo 各复制 1001 个对象。计数包含内部根，时间受 JIT/GC 影响，不能当跨平台保证。简单反向浮点运算也不精确，因此改用局部原值，而非仅换成负 dx 或倒数 factor。

## 同负载修复后测量

相同 Node 26.5.0、本机 darwin、矩形坐标/尺寸、单叶 r0 每次 move(1,0)、历史保留及强制 GC 条件。前测为旧快照接口，后测仅适配新构造绑定接口；可用 `npm run benchmark` 重复后测。克隆次数统计 Shape.clone，几何采集统计 geometryValues；这些测量钩子仅在脚本进程内，finally 恢复。

| N 元素 | H 条历史 | 旧编辑克隆数 | 新编辑克隆数 | 旧堆增量 MiB | 新堆增量 MiB | 新几何采集数 |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 10 | 2020 | 0 | 1.22 | 0.021 | 20 |
| 100 | 50 | 10100 | 0 | 5.81 | 0.050 | 100 |
| 1000 | 10 | 20020 | 0 | 11.52 | 0.011 | 20 |
| 1000 | 50 | 100100 | 0 | 57.49 | 0.063 | 100 |

新方案所有场景一次 undo/redo 克隆数均为 0。旧平均编辑耗时分别 0.157/0.230/1.427/1.083 ms；新参考值 0.017/0.008/0.068/0.033 ms。小堆增量和耗时受 GC/JIT 噪声影响，应优先评估确定性的复制次数与被保存状态范围，不能把一次跑分当性能保证。

move/scale 保存 K 个受影响叶子的原值/结果，set 保存属性的缺省状态与字符串值，结构操作保存对象、父级和位置。删除保留子树对象本身。Document 当前仍 O(N) 遍历 ID，结构数组插入/移除仍有同级数量成本，整组操作仍需 O(K) 状态；没有声称所有编辑 O(1) 或无限历史不耗内存。

## 按课件验收

| 依据 | 实现与验证 | 取舍 |
|---|---|---|
| Command 五角色与绑定 | Controller 装配九种具体命令；Command 持有 EditingReceiver；Document 执行业务并返回 Change；History 依赖 UndoableCommand，无 execute(document) | 输入语法解析仍在具体命令构造中，不包含文档业务判断 |
| ConcreteCommand 委托 | 九个 apply 仅转发 Receiver；Create 构造、唯一性与挂接移入 Document.create；ReceiverProbe 验证一条请求和后续 undo/redo | 不为示例追加宏、队列 |
| 局部撤销状态 | GeometryState/PropertyState/PlacementState 和 EditRecord；原值恢复，不做浮点反算；删除保存原对象和父级位置 | Memento 并非课件禁止，此处是根据实测成本主动缩小状态范围 |
| Invoker 两栈 | 独立 mock 验证零 Receiver 入参、调用顺序、execute/undo/redo 抛错不损坏栈；保留新成功编辑清 redo 和 IO 屏障回归 | History 承担 CommandExecutor 角色，不仅为改类名增加一层 |
| Composite 统一接口 | Shape、Container、安全式容器能力；Group 委派递归；Hierarchy 无 parent-only setter 并在 add 防环 | 不强迫叶子暴露 add/remove；不支持容器能力时明确抛错 |
| 客户端开放扩展 | 导入/变换/展示无具体图形 instanceof；TestBranch/TestLabel 均不继承 Group/Text，也能走相同客户端路径 | ShapeProvider 仅为 DI 构造契约，不实现运行时插件系统；CLI 仍只认六种类型 |
| OOP API/依赖 | Shape.parent 依赖 Container 而非 Group；Hierarchy 私有 WeakMap 维护双向边；History、Receiver、文件和工厂依赖接口 | Document 保留接收者职责，未为课程其他模式额外拆层 |
| TDD 分层 | 红 9 项 → 首绿 29 项 → 加验证共 36 项；Receiver 单元、直接 Command 真实/替身 Receiver、Invoker mock、少量 CLI E2E | 只记录本轮真实红绿，不重写先前开发历史 |

剩余限制：SVG 仍为明确验证的子集；重新归属遵循 SVG 样式继承，不固化旧计算样式；未做像素级跨浏览器比对；上述测试与测量不保证不存在所有缺陷。
