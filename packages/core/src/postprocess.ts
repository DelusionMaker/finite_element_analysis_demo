import type { FEModel } from './model/types';

/** 单个单元沿杆轴采样得到的内力分布。 */
export interface MemberForces {
  elementId: number;
  x: number[]; // 沿杆局部坐标采样点
  N: number[]; // 轴力（拉为正）
  Vy: number[]; // 绕 z 轴剪力
  Vz: number[]; // 绕 y 轴剪力
  T: number[]; // 扭矩
  My: number[]; // 绕 y 轴弯矩
  Mz: number[]; // 绕 z 轴弯矩（下缘受拉为正，约定须钉死）
}

/** 求解结果。 */
export interface FEResult {
  displacements: number[]; // 全部自由度位移
  reactions: number[]; // 支座反力（按自由度）
  memberForces: MemberForces[];
}

/**
 * TODO（阶段 3–4）：求解主入口 + 内力回代。
 * 1) 组装总刚 → 2) 加约束 → 3) LDLᵀ 求解位移 → 4) 回代杆端力 →
 * 5) 沿杆隔离体平衡得 N/V/M/T → 6) 支反力 R = K·u − F。
 *
 * ⚠️ 符号约定必须在阶段 4 先用“受拉杆 + 简支梁”两条单测钉死，
 * 之后所有代码只服从这两条约定。
 */
export function solve(_model: FEModel): FEResult {
  throw new Error('TODO 阶段 3–4：实现求解与内力回代（postprocess.ts）');
}
