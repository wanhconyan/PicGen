# PicGen 当前需求差异文档（对照《PicGen - gpt image2 使用教程 (2026_4_21 01：38：53).html》）

## 1. 对照范围
- 对照基线：教程中信息架构与功能章节（6.4 Styles、6.5 Generate、6.6 Edit Studio、6.7 Review、6.8 Export）及数据模型章节（5~14）。
- 项目现状：`backend/app` + `frontend/src` 当前实现。
- 输入依据：你提供的 Full review comments（P1/P2）。

## 2. 差异总览
- **P1（阻断达成）**：1 项
- **P2（关键能力缺口）**：6 项
- 当前结论：项目具备“页面骨架 + 本地数据流”基础，但“真实生成链路、风格模板入口、审核定稿与真实导出”未达教程目标。

## 3. 需求差异矩阵

| 优先级 | 模块 | 教程要求 | 当前实现 | 差异结论 | 关键证据 |
|---|---|---|---|---|---|
| P1 | 生成执行链路 | Generate/Edit 任务需调用 GPT Image 接口，按 `prompt/mask/size/model` 产图 | 任务执行直接使用 `picsum.photos` 占位图并立即 success | 核心“自动出图/换装”未真实落地 | `backend/app/services/task_service.py` 的 `_placeholder_image` 与 `execute_task` |
| P2 | Styles 一级导航与页面 | Styles 作为一级模块，支持模板管理与 Prompt 预览 | 前端无 `/styles` 导航与路由，也无 Styles 页面 | 用户无法在 GUI 完成风格模板管理 | `frontend/src/components/AppLayout.tsx`、`frontend/src/App.tsx` |
| P2 | 前端数据模型完整性 | Character/Outfit/Task/Result/Review/Export 需承载教程关键字段（身份锁定、主基准图、部件、状态枚举等） | 前端类型仅保留极简字段，难以表达业务主链 | 页面可渲染但无法承载真实业务参数 | `frontend/src/types/models.ts` |
| P2 | Generate 任务工坊能力 | 支持基准图、任务类型、风格、尺寸质量背景、fidelity、mask、Prompt 预览、批量策略 | 仅角色+套装+prompt，固定走 batch generate | 无法从主工坊发起教程定义的多类型任务 | `frontend/src/pages/GeneratePage.tsx` |
| P2 | Review 审核定稿能力 | 大图预览、评分维度、审核意见、通过/淘汰/设首选/回退编辑器/重生 | 仅表格 + approve/reject/rework，未暴露评分与意见录入面板 | 审核链路不满足定稿与追溯要求 | `frontend/src/pages/ReviewPage.tsx`、`frontend/src/hooks/useReviewActions.ts` |
| P2 | Export 真实资产导出 | 导出审核通过资源到目录，附 metadata、缩略图、JSON 清单、日志 | 仅写一条 success 记录，不落盘实际文件 | “导出成功”与实际资产不一致 | `backend/app/services/export_service.py`、`frontend/src/pages/ExportPage.tsx` |
| P2 | Edit Studio 局部编辑深度 | 教程要求遮罩画布、部位预设、前后对比、保留项与输出参数 | 当前仅 source/mask 下拉 + prompt 提交 | 局部编辑仍是轻量提交，不是可视化编辑器 | `frontend/src/pages/EditStudioPage.tsx` |

## 4. 与审查结果的对应关系
- 你给出的 6 条审查意见均已在代码中确认，结论一致。
- 额外补充 1 条：**Edit Studio 可视化能力缺口**（教程 6.6 与当前实现差异明显）。

## 5. 建议的补齐顺序（按交付风险）
1. **阶段 A（先通主链，P1）**：接入真实 GPT Image 生成/编辑服务，任务状态改为真实执行结果与失败重试。
2. **阶段 B（补可操作面，P2）**：补 Styles 页面与 Generate 高级参数，升级前端类型模型。
3. **阶段 C（补定稿闭环，P2）**：补 Review 评分/意见/首选能力，补 Export 实体文件+metadata+清单导出。
4. **阶段 D（体验完善，P2）**：补 Edit Studio 画布、遮罩工具与前后对比流。

## 6. 当前是否达到教程目标
- 结论：**未达到**。
- 原因：教程要求的“真实自动出图 → 审核评分定稿 → 真实资产导出”闭环仍未打通，现阶段以占位图与记录型导出为主。

## 7. 执行跟踪文档
- ToDo 与回写记录已拆分到独立文档：`Docs/PicGen执行ToDo-回写跟踪.md`
- 本文档仅保留需求差异结论，执行进度统一在新文档维护。