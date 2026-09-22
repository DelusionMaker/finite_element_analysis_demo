/**
 * TODO（阶段 3）：对称正定线性方程组求解，LDLᵀ 分解。
 * 比 Cholesky 更稳（避免开方）。多个荷载工况可复用一次分解、只重做回代，
 * 对“多工况包络”至关重要。
 *
 * @param K 对称正定总刚（n×n，行主序稠密存储）
 * @param F 右端荷载向量
 * @param n 自由度数量
 * @returns 位移向量 u
 */
export function ldltSolve(_K: Float64Array, _F: Float64Array, _n: number): Float64Array {
  throw new Error('TODO 阶段 3：实现 LDLᵀ 求解（solver/ldlt.ts）');
}

/**
 * TODO（阶段 3.5）：奇异性检查。
 * 分解过程中若某主元 |D_kk| < ε·max(diag) → 判定为“机构”（缺约束），
 * 返回具体 DOF 编号，供 UI 提示（避免位移飞到 1e18）。
 */
export function detectSingularPivot(): number | null {
  return null;
}
