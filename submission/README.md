# Lab1 Phase 1 提交说明

课程：复旦大学高级软件开发技术。姓名：刘子源（Ziyuan Liu）；GitHub：Zyrrick。

代码仓库：[https://github.com/Zyrrick/fudan-svg-cli-lab1](https://github.com/Zyrrick/fudan-svg-cli-lab1)

最终交付版本：[final 标签](https://github.com/Zyrrick/fudan-svg-cli-lab1/tree/final)，请以该标签定位提交。开发历史包含实际分阶段方案、模型、Command、IO、CLI、回归修正和文档提交。

公开仓库，可直接访问。

## 内容与运行

- `src/`：TypeScript 面向对象实现，六类内置图形、Composite、Command/Memento、历史屏障、安全子集 SVG IO 和 REPL。
- `doc/README.md`：架构方案、PlantUML、依赖规则、模式、协作过程与迭代、自查。
- `doc/QA.md`：已运行质量保证与明确限制。
- `test/`：20 项自动测试，含 36 类失败不变性、全部命令、IO/undo、嵌套顺序、导入 ID、roundtrip、真实 CLI，以及另存后默认 save 原路径和 init 清除来源的专项回归。
- `scripts/` 与 `examples/`：原文典型会话、两节点流程图、嵌套变换示例和实际生成 SVG。

```sh
git clone https://github.com/Zyrrick/fudan-svg-cli-lab1.git
cd fudan-svg-cli-lab1
git checkout final
npm ci
npm run check
npm run cli
npm run demo
```

推荐 Node.js 22 或 24 LTS。`npm run check` 已运行通过，包含类型检查、lint、20 项测试和 build。开发环境 Node.js 26.5.0；Node 22/24 的远端 CI 亦已通过。Ctrl-D 退出 REPL；输入 help 查看全部语法。

本阶段不实现 box/插件。导入支持 translate 和正数等比 scale 展开；旋转、非等比变换、CSS、path 等范围外内容明确拒绝。普通 g 保持 SVG 样式继承语义，改变父级会改变继承来源。
