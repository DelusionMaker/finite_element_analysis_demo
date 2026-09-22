# 项目进度记录（finite_element_analysis_demo）

> 本文件用于跨终端 / 跨会话接续开发。最后更新：2026-09-22

## 0. 项目定位
把"会前端 / 3D、但没学过结构力学"的最小可信 FEM 教学代码（`ref_files/learn.js` + `01-手把手第一步.md`），
工程化、升维、解耦成**真实桥梁线性有限元 Web 应用**。

- 教学版：2 自由度 / 4×4 平面梁单元 / 高斯消元 / 置 1 置 0 约束
- 工程版：6 自由度 / 12×12 空间梁单元 / 坐标变换 / LDLᵀ 求解 / 7 个解析解验收

参考文档（均在 `ref_files/`）：
- `01-手把手第一步.md` —— FEM 直觉与主线
- `learn.js` —— 教学版可运行配套（零依赖）
- `压力与应力可视化技术综述.html` —— 阶段 5 三维可视化方法论
- `桥梁线性有限元应用-开发路线图.md` —— 总蓝图（7 阶段）

## 1. 当前进度：阶段 0 ✅ + 骨架搭建 ✅
- [x] 阶段 0：验收基准文档化（7 个解析解算例定义于 `packages/core/src/validation/benchmarks.ts`）
- [x] Monorepo 骨架（npm workspaces + TS project references）
- [x] `@fem/core` 求解内核骨架（零 UI 依赖）
- [x] `app` React + TS + R3F 应用骨架（可启动空白 3D 画布 + 主题）
- [x] 初始化 git 并推送到远程 `master`

### 仓库状态
- 远程：`origin` → `https://github.com/DelusionMaker/finite_element_analysis_demo.git`
- 分支：`master`（已跟踪 `origin/master`）
- 最新提交：`b0fe00f` —— feat: 搭建桥梁线性有限元应用骨架
- 工作区：clean

## 2. 目录结构
```
finite_element_analysis_demo/
├── package.json            # 根 monorepo + workspaces + scripts
├── tsconfig.base.json      # 共享 TS 配置
├── packages/
│   └── core/               # @fem/core 求解内核（零 UI 依赖）
│       └── src/
│           ├── index.ts            # 导出入口（barrel）
│           ├── math/arithmetic.ts  # 矩阵运算（matmul, transpose, matVec, ...
│           ├── fem/model.ts        # 类型/数据模型（Node, BeamElement, BridgeModel）
│           ├── fem/assemble.ts     # 全局刚度组装（stub）
│           ├── fem/boundary.ts     # 边界条件（stub）
│           ├── fem/solve.ts        # LDLᵀ 求解器（stub）
│           └── validation/benchmarks.ts  # 7 个解析解验收算例（it.todo）
└── app/                    # React + TS + R3F 应用
    └── src/
        ├── main.tsx, App.tsx, index.css
        ├── theme/theme.tsx
        ├── components/Scene.tsx, BridgeCanvas.tsx
        └── components/three/*   # CameraRig, Grid, Lights, BridgeMesh(stub)
```

## 3. 已实现（skeleton 级）
**@fem/core**
- `arithmetic.ts`：完整矩阵/向量基础运算（已可直接用于阶段 2、3）
- `model.ts`：完整数据模型类型（Node/BeamElement/Section/Load/BridgeModel + `dofIndex`/`dofsOfNode`/`numDOFs`）
- `benchmarks.ts`：7 个验收算例的输入构造 + 断言阈值（全部 `it.todo`，待转正）
- `assemble.ts` / `boundary.ts` / `solve.ts`：**仅 stub**，导出签名占位

**app**
- Vite + R3F 空白 3D 场景（Canvas + CameraRig + Lights + Grid + OrbitControls）
- 主题/暗色配色占位

## 4. 下一步（按路线图优先级）
1. **阶段 2 内核核心**（最关键，解锁验收）：
   - `packages/core/src/fem/beam.ts`：新增 `beamStiffness3D`（12×12 局部刚度，含 EA/L、GJ/L、12EI/L³ 等项）
   - `assemble.ts`：实现 `assembleStiffness`（`matAdd` + 6 自由度映射）
   - `solve.ts`：实现 `ldltDecompose` + `ldltSolve`（LDLᵀ，带相对阈值奇异性判定）
   - `boundary.ts`：实现 `applyBoundary`（置 1 置 0 + 右端修正）
2. **转正验收**：把 `benchmarks.ts` 的 `it.todo` 改为 `it`，接真实求解器，目标 7/7 通过（`npm test`）
3. **阶段 3/4**：内力回代（梁端内力）、多工况封装
4. **阶段 5**：`BridgeMesh` 接真实 `BridgeModel`，加 von Mises 云图 + 变形网格（参考可视化综述）
5. **阶段 6**：Web Worker 求解、IO（JSON 导入导出）、更多测试

## 5. 常用命令
```bash
npm install            # 安装依赖（根目录，自动装 workspaces）
npm run dev            # 启动 app（Vite，默认 5173）
npm run build          # 构建全部（core + app）
npm run test           # 运行 @fem/core 验收测试（vitest）
npm run typecheck      # 全量 TS 类型检查
```
> 注意：当前 `npm run test` 因 `it.todo` 不会失败；实现求解器后转正验收才会真正校验。

## 6. 接续提示（给下一个终端/会话）
- 环境：Node 已具备，`npm install` 即可，无需额外工具链
- 第一个可验证的小目标：**让 7 个验收测试从 `it.todo` 变 `it` 并全绿** —— 这要求先补完阶段 2 的 `beam.ts` + `assemble/solve/boundary` 实现
- 关键坑（与教学三坑一致，详见路线图 8 大坑）：**单位统一**、**局部坐标轴向**、**缺约束导致矩阵奇异**、**变形倍数必须标注**
- 可视化前务必先过验收，否则云图无参照
