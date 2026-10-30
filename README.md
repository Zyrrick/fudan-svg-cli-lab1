# Fudan SVG CLI — Lab1 Phase 1

复旦大学高级软件开发技术 Lab1 Phase 1：TypeScript 面向对象 SVG CLI 编辑器。作者账号：[Zyrrick / Ziyuan Liu](https://github.com/Zyrrick)，本次实现由 Codex 在用户授权下分阶段完成。

仓库：[Zyrrick/fudan-svg-cli-lab1](https://github.com/Zyrrick/fudan-svg-cli-lab1)，**PRIVATE**。交付标签：[final](https://github.com/Zyrrick/fudan-svg-cli-lab1/tree/final)。老师需要获得仓库访问授权才能阅览；本项目没有擅自公开仓库或添加协作者。

## 安装、运行、验证

推荐 Node.js 22 LTS 或 24 LTS（CI 均验证）；本地开发环境为 Node.js 26.5.0。需要 npm。

```sh
git clone https://github.com/Zyrrick/fudan-svg-cli-lab1.git
cd fudan-svg-cli-lab1
git checkout final
npm ci
npm run cli
```

在 `svg>` 提示符输入 `help`；Ctrl-D 结束。命令失败输出单行 `error:`，REPL 继续接收后续命令。

```sh
npm run check             # 源码和测试类型检查、ESLint、自动测试、构建
npm test                  # 17 项行为/架构测试，含真实 CLI 子进程
npm run build
node dist/cli/Main.js     # 执行已编译版本
npm run demo              # 原文 6.1 两节点流程图
npm run demo:typical      # 原文 6 典型会话，含两个预期错误
npm run demo:transforms   # 原文 0.1 嵌套 translate/scale 示例
```

回放脚本会重写对应 `examples/*.svg`，输出具有确定性。可直接用浏览器打开 [flowchart.svg](examples/flowchart.svg) 查看流程图；箭头示例按原文输出普通 line，不额外实现 marker。

## 范围与语义

- 内置 `rect`、`circle`、`ellipse`、`line`、`text`、`g`，支持所有 Phase 1 命令。`box` 和插件接口属于后续阶段，明确报 unknown shape type。
- ID 唯一且大小写敏感；支持浮点、双引号参数、`\"`/`\\` 转义和整行 `#` 注释。行内 `#` 不作为注释，以保留颜色值。
- 一条成功编辑是一个 undo 单元；失败不改变文档、路径或历史。成功 init/read/save/canvas 修改清空历史并建立 IO 屏障；无参数 canvas 和显示命令不影响历史。成功编辑解除屏障，undo 后新编辑清空 redo。
- `init [w] [h]` 缺省 800×600；`canvas w` 只改宽度；首次 save 必须指定路径，此后无参数使用最近成功 read/save 的路径。
- `group` 按原文的“保持相对顺序”解释为全文档前序遍历顺序，新增组置于画布根末尾；`ungroup` 保持原位置，顶层 g 禁止解散。`front` 放到同级数组末尾，即最后绘制、视觉最前方。
- 容器设置 fill/stroke 等采用 SVG 继承语义；更换父容器会相应改变继承来源。scale 同乘位置和尺寸，不修改普通编辑中的线宽或字号（不属于本阶段几何白名单）。

## SVG 兼容范围

支持六种内置元素、嵌套 g、文本实体/CDATA、公共样式及几何属性；保留安全的 `font-size` 和 `text-anchor` 导入属性，但 CLI `set` 白名单不为此扩展。缺失 ID 先预留全部显式 ID 再补齐，避免与后文显式 ID 冲突。

支持元素及容器的 `translate(x[,y])`、正数等比 `scale(s)` / `scale(s,s)`，按 SVG 矩阵顺序展开到叶子坐标；同时展开缩放后的有效线宽和文字字号。导出使用普通几何属性，不保留 transform 字符串。

这是一套明确验证的 SVG 子集导入器。旋转、matrix、负缩放、非等比缩放、path、CSS/style、脚本、外部资源 URL、DOCTYPE、自定义实体、未知属性及不匹配的 viewBox 均拒绝，失败时保留原文档。根画布宽高支持数值或 px，viewBox 如存在必须等于 `0 0 width height`。输入限制 10 MiB、100,000 元素和约 200 层嵌套。

## 文档与提交材料

- [doc/README.md](doc/README.md)：模块职责、PlantUML、模式、依赖规则、变化点、真实过程、自查和质量证据。
- [doc/QA.md](doc/QA.md)：执行过的验证、边界和审查修正。
- [submission/README.md](submission/README.md)：供用户预览、可上传 eLearning 的独立提交说明，未代提交。
- [scripts](scripts)：CLI 演示脚本；[examples](examples)：输入及真实生成 SVG。

私有仓库的访问权限与平台截止时区需要用户在提交前确认。平台显示截止为 2026-10-31 23:59，账户时区尚未验证；本项目没有将假定北京时间当作已核实事实。
