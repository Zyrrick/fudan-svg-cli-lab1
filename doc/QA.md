# 验证与已知边界

执行日期：2026-10-30 UTC。以下为实际运行结果。

## 本地验证

| 检查 | 结果 |
|---|---|
| `npm run typecheck` | 通过；同时检查 src 与 test，strict、noUncheckedIndexedAccess、exactOptionalPropertyTypes 等开启 |
| `npm run lint` | 通过；ESLint recommended + TypeScript recommended |
| `npm test` | 36/36 通过；无 skip、无 todo |
| `npm run build` | 通过；生成 dist，dist 不提交 |
| `node dist/cli/Main.js < scripts/flowchart.cli` | 通过；8 元素，移动撤销后 process.y=100，文字更新为“处理数据 v2” |
| `npm run demo:typical` | 成功回放；恰有两个预期错误：祖先/子孙分组拒绝、save 后 undo 屏障 |
| `npm run demo` | 无错误；SVG 为实际 CLI 生成结果 |
| `npm run demo:transforms` | 无错误；生成 transformed-flat.svg，读取后坐标与文本一致 |
| V8 coverage | 课程重构后行 99.34%、分支 96.80%、函数 98.48%；命令见下方 |
| GitHub Actions | 旧版 `8b4383c` 的 Node 22/24 已通过；本轮最终重构以对应提交的 Actions 结果为准 |

```sh
node --import tsx --experimental-test-coverage --test-coverage-include='src/**/*.ts' --test test/*.test.ts
```

## 测试覆盖的需求

- 全部命令、全部六种图形、几何和共享样式 setter、大小写敏感 ID、双引号/转义、浮点/Unicode/空文本。
- 嵌套 move/scale、几何溢出中途回滚、分组前序顺序、祖先/子孙拒绝、防环、addto 尾部、同级 front/back、嵌套 ungroup 原位提升、顶层 g 拒绝、删除子树和精确恢复。
- 一命令一历史单元、undo/redo、成功新编辑清空 redo、36 类失败后 XML 完全一致且旧 redo 可用。
- 成功 init/read/save/canvas 修改建立屏障，显示/只读 canvas 不干扰历史；失败 IO 不更改路径或历史。
- 无参数 save 只写最近成功 read 的原路径，另存不改变来源；init 清除来源，未 read 的新文档即使已显式保存也不能无参数 save；失败保存不破坏来源、XML 或 redo 分支。
- 缺 ID 警告、后来显式 ID 预留、重复 ID 拒绝；XML 实体/CDATA/换行/Unicode；脚本、DOCTYPE、外部实体、URL paint、未知属性、错误 XML、未知图形、错误 viewBox 拒绝。
- 六种元素 serialize/read roundtrip，原文嵌套 transform 的矩阵顺序、有效线宽/字号与再次 roundtrip。
- 真实文件 rename 成功/失败与临时文件清理；真实 CLI 进程经 stdin 输入并保存带空格路径；源码依赖方向与一类一文件检查。
- Receiver 纯业务原子性、直接命令与真实/替身 Receiver、独立 Invoker mock 调用顺序和失败后栈不变；直接容器自身/祖先防环和双向链接一致性。
- 单叶编辑禁止整份文档克隆，保留无关对象身份；局部结构状态精确恢复跨父级位置；恢复中注入失败后回滚并允许重试。
- 非 Group/Text 子类的替代实现经工厂契约注入，复用同一导入/变换/展示遍历；未增加插件注册命令或放宽内置类型范围。

## 审查修正及边界

1. 历史已改为受影响几何、单属性和结构位置的精确前后状态；不反向计算浮点值，也不复制无关文档。大范围编辑、删除子树和无界历史仍会保留对应数据，不能宣称常数空间或消除所有性能风险；资源参考测量见 COURSE-REVIEW。
2. write 使用同目录临时文件及 rename；只有写入成功才更新会话。失败 cleanup 不覆盖原始错误。
3. 支持受限 SVG 子集，不支持任意浏览器 SVG；不匹配 viewBox、CSS、path、旋转/非等比变换等明确失败，不悄悄丢弃。
4. g 样式按 SVG 继承处理，改变父级会改变继承来源；本阶段未实现外观无损重分组的计算样式固化。
5. 没有执行浏览器像素级渲染比对；SVG 几何/属性和 roundtrip 已自动核验，文件可用浏览器直接预览。
6. 用户后续明确授权公开本作业仓库。公开前检查 68 个已提交历史 blob 及工作文档，未发现凭据、学号或完整课程原文；GitHub 已核验为 PUBLIC。没有添加协作者或操作其他仓库。eLearning 提交仍由用户完成。
7. 平台截止显示 2026-10-31 23:59，账户时区未验证。final 的实际远端时间和提交由 GitHub 可追溯，不能把本地计划当作平台已确认时区。
8. 原文复核发现并修正默认 save 路径差异。新增三项回归，总测试数由 17 增至 20；详细复现与改动见开发过程记录。
9. 本轮课件审查以真实的 9 项失败测试开始，后续绿阶段由 29 项扩展至 36 项；没有把原先开发倒叙声称为 TDD。课堂模式只按当前变化点采用，不增加无需求宏、队列或其他模式。
