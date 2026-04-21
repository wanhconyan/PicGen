# PicGen 执行 ToDo 与回写跟踪

## 1. 来源说明
- 来源文档：`Docs/PicGen需求差异文档-对照gpt-image2教程.md`
- 用途：集中维护执行任务、完成状态与回写记录。

## 2. 执行 ToDoList（持续回写）
- [x] 1. **P1** 接入真实 GPT Image 生成/编辑链路（替换 `picsum` 占位图）
- [x] 2. **P1** 打通参数透传：`prompt / mask / size / model / quality / background / fidelity`
- [x] 3. **P2** 新增前端 `Styles` 一级导航、路由与页面（模板管理 + Prompt 预览）
- [x] 4. **P2** 扩展前端数据模型（Character/Outfit/Task/Result/Review/Export 必要字段）
- [x] 5. **P2** 升级 Generate 页面（任务类型、基准图、风格、mask、高级参数、批量策略）
- [x] 6. **P2** 升级 Review 页面（大图预览、评分维度、审核意见、设为首选、回退编辑器）
- [x] 7. **P2** 实现真实 Export（图片文件、缩略图、metadata、JSON 清单、日志）
- [x] 8. **P2** 升级 Edit Studio（可视化遮罩编辑、预设部位、前后对比、另存版本）
- [ ] 9. 生成→审核→导出端到端联调与回归验证
- [x] 10. 修复前端现有 `react-hooks/exhaustive-deps` warnings 并通过完整校验
- [x] 11. 追加需求：Base Images 页面新增“对话式提示词生成基模”入口与提交流程
- [x] 12. 追加需求：支持在软件内设置 OPENAI_API_KEY（安全脱敏）

## 3. 回写规则
1. 每完成 1 项 ToDo，立即将对应条目标记为 `- [x]`，并在“任务回写记录”追加一条记录。
2. 若任务拆分为子项，先在文档内补充子项，再逐条回写完成状态。
3. 若出现阻塞，保留未完成状态并记录阻塞原因与下一步。

## 4. 任务回写记录
| 时间 | 任务 | 状态 | 说明 |
|---|---|---|---|
| 2026-04-21 | 初始化 ToDoList 与回写机制 | completed | 已从差异文档拆分为独立执行文档 |
| 2026-04-21 | ToDo #1 真实GPT Image链路 | completed | 后端任务执行已接入真实 images API，替换占位图并支持失败状态回写 |
| 2026-04-21 | ToDo #2 参数透传 | completed | 已确认 router→task→images 请求链路透传 prompt/mask/size/model/quality/background/fidelity |
| 2026-04-21 | ToDo #3 Styles 导航与页面 | completed | 已新增 /styles 导航与路由，支持模板列表/新增/编辑与 Prompt 预览 |
| 2026-04-21 | ToDo #4 前端模型扩展 | completed | 已扩展 Character/Outfit/Task/Result/Review/Export 类型字段并保持兼容 |
| 2026-04-21 | ToDo #5 Generate 页面升级 | completed | 已支持任务类型/基准图/风格/mask/高级参数与 Prompt 预览，并修复local_edit所需sourceResultId |
| 2026-04-21 | ToDo #6 Review 页面升级 | completed | 已补齐大图预览、评分维度、审核意见、设为首选与回退编辑器入口 |
| 2026-04-21 | ToDo #7 真实Export | completed | 已实现主图/metadata/manifest落盘与导出结果回显，支持批量导出并记录失败原因 |
| 2026-04-21 | ToDo #8 Edit Studio升级 | completed | 已支持sourceResultId回填、手绘mask、预设模板、对比预览与另存为新版本提交 |
| 2026-04-21 | ToDo #9 端到端联调回归 | blocked | 已验证review→export链路与落盘；生成环节重跑时返回 `billing_hard_limit_reached`，需可用计费额度后重跑完整链路 |
| 2026-04-21 | ToDo #10 lint warnings清理 | completed | 前端eslint已达到0 warning/0 error并构建通过 |
| 2026-04-21 | ToDo #11 Base Images 对话生成基模 | completed | 已新增对话输入prompt + 角色/风格选择，提交后执行 generate→getResult→createBaseImage 并刷新列表 |
| 2026-04-21 | ToDo #12 软件内设置 OpenAI Key | completed | Settings页可录入API Key；后端仅返回hasOpenApiKey并对日志脱敏，任务执行支持环境变量与设置值双来源 |