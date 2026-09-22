import type { FEModel } from './model/types';

/** 自由度编号规则：dof(nodeId, k) = nodeId * 6 + k （k = 0..5）。 */
export const DOF_PER_NODE = 6;

export function dofOf(nodeId: number, k: number): number {
  return nodeId * DOF_PER_NODE + k;
}

export function totalDofs(model: FEModel): number {
  return model.nodes.length * DOF_PER_NODE;
}

/**
 * 总刚组装结果（阶段 3 实现）。
 * K 为对称正定总刚（v1 稠密 Float64Array(n*n)，v2 Skyline 变带宽）。
 * freeDofs / fixedDofs 标记约束情况，供边界条件处理使用。
 */
export interface GlobalSystem {
  K: Float64Array;
  ndof: number;
  fixedDofs: number[];
}

/**
 * TODO（阶段 3）：总刚组装。
 * 对每根单元：算局部 k → Tᵀ k T 转到全局 → 按 dofOf 映射到总刚对应位置 +=。
 */
export function assembleStiffness(_model: FEModel): GlobalSystem {
  throw new Error('TODO 阶段 3：实现总刚组装（assemble.ts）');
}
