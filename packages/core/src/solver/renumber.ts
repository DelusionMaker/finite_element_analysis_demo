import type { FEModel } from '../model/types';

/**
 * TODO（阶段 3.2）：节点重编号以压小总刚带宽。
 * Cuthill–McKee 或简单的“沿桥轴排序”。返回新的 nodeId → 旧 nodeId 映射。
 */
export function renumberCMK(_model: FEModel): Map<number, number> {
  throw new Error('TODO 阶段 3.2：实现 Cuthill–McKee 重编号（solver/renumber.ts）');
}
