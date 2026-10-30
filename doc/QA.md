# 验证与已知边界

执行日期：2026-10-30 UTC。执行者：Codex。以下为真实运行结果。

## 本地验证

| 检查 | 结果 |
|---|---|
| `npm run typecheck` | 通过；同时检查 src 与 test，strict、noUncheckedIndexedAccess、exactOptionalPropertyTypes 等开启 |
| `npm run lint` | 通过；ESLint recommended + TypeScript recommended |
| `npm test` | 17/17 通过；无 skip、无 todo |
| `npm run build` | 通过；生成 dist，dist 不提交 |
| `node dist/cli/Main.js < scripts/flowchart.cli` | 通过；8 元素，移动撤销后 process.y=100，文字更新为“处理数据 v2” |
| `npm run demo:typical` | 成功回放；恰有两个预期错误：祖先/子孙分组拒绝、save 后 undo 屏障 |
| `npm run demo` | 无错误；SVG 为实际 CLI 生成结果 |
| `npm run demo:transforms` | 无错误；生成 transformed-flat.svg，读取后坐标与文本一致 |
| V8 coverage | 行 99.63%、分支 95.47%、函数 99.04%；命令见下方 |
| GitHub Actions | `d4af0ae` 在 Node 22/24 通过；[运行记录](https://github.com/Zyrrick/fudan-svg-cli-lab1/actions/runs/41046667623) |

```sh
node --import tsx --experimental-test-coverage --test-coverage-include='src/**/*.ts' --test test/*.test.ts
```

## 测试覆盖的需求

- 全部命令、全部六种图形、几何和共享样式 setter、大小写敏感 ID、双引号/转义、浮点/Unicode/空文本。
- 嵌套 move/scale、几何溢出中途回滚、分组前序顺序、祖先/子孙拒绝、防环、addto 尾部、同级 front/back、嵌套 ungroup 原位提升、顶层 g 拒绝、删除子树和精确恢复。
- 一命令一历史单元、undo/redo、成功新编辑清空 redo、36 类失败后 XML 完全一致且旧 redo 可用。
- 成功 init/read/save/canvas 修改建立屏障，显示/只读 canvas 不干扰历史；失败 IO 不更改路径或历史。
- 缺 ID 警告、后来显式 ID 预留、重复 ID 拒绝；XML 实体/CDATA/换行/Unicode；脚本、DOCTYPE、外部实体、URL paint、未知属性、错误 XML、未知图形、错误 viewBox 拒绝。
- 六种元素 serialize/read roundtrip，原文嵌套 transform 的矩阵顺序、有效线宽/字号与再次 roundtrip。
- 真实文件 rename 成功/失败与临时文件清理；真实 CLI 进程经 stdin 输入并保存带空格路径；源码依赖方向与一类一文件检查。

## 审查修正及边界

1. 快照对树和顺序完整复制，避免用反向浮点运算撤销。大文档/长历史内存成本高，未做性能压测或差量存储。
2. write 使用同目录临时文件及 rename；只有写入成功才更新会话。失败 cleanup 不覆盖原始错误。
3. 支持受限 SVG 子集，不支持任意浏览器 SVG；不匹配 viewBox、CSS、path、旋转/非等比变换等明确失败，不悄悄丢弃。
4. g 样式按 SVG 继承处理，改变父级会改变继承来源；本阶段未实现外观无损重分组的计算样式固化。
5. 代码审查和自动验证均由 AI 完成，未声称人工验收。没有执行浏览器像素级渲染比对；SVG 几何/属性和 roundtrip 已自动核验，文件可用浏览器直接预览。
6. 用户后续明确授权公开本作业仓库。公开前检查 68 个已提交历史 blob 及工作文档，未发现凭据、学号或完整课程原文；GitHub 已核验为 PUBLIC。没有添加协作者或操作其他仓库。eLearning 提交仍由用户完成。
7. 平台截止显示 2026-10-31 23:59，账户时区未验证。final 的实际远端时间和提交由 GitHub 可追溯，不能把本地计划当作平台已确认时区。
