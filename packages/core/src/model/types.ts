import type { Vec3 } from './vec';
export type { Vec3 } from './vec';

/** 节点：每个节点 6 个自由度 [u, v, w, θx, θy, θz]。 */
export interface Node {
  id: number;
  x: number;
  y: number;
  z: number;
}

/** 材料：G = E / (2(1+ν))。 */
export interface Material {
  id: number;
  E: number; // 弹性模量（N/mm²，即 MPa）
  nu: number; // 泊松比
  rho: number; // 密度（kg/mm³ 或 t/mm³，按单位制统一）
  alpha: number; // 线膨胀系数（v1 仅整体升降温用）
}

/** 截面特性：A 面积、Iy/Iz 主惯性矩、J 扭转常数。 */
export interface Section {
  id: number;
  A: number;
  Iy: number;
  Iz: number;
  J: number;
  refVector?: Vec3; // 局部 y 轴参考方向，用于确定截面主轴朝向
}

export type ElementType = 'beam' | 'truss';

/** 单元：i→j 的有向杆件。releaseI/releaseJ 为端部转动释放（铰接）。 */
export interface Element {
  id: number;
  i: number;
  j: number;
  mat: number; // 引用 Material.id
  sec: number; // 引用 Section.id
  type: ElementType;
  releaseI?: boolean;
  releaseJ?: boolean;
}

/** 支座：true = 该自由度被约束。spring 为弹性支承刚度（6 自由度）。 */
export interface Support {
  node: number;
  ux: boolean;
  uy: boolean;
  uz: boolean;
  rx: boolean;
  ry: boolean;
  rz: boolean;
  spring?: [number, number, number, number, number, number];
}

/** 荷载工况。 */
export interface LoadCase {
  id: number;
  name: string;
  nodal: { node: number; f: Vec3; m: Vec3 }[]; // 节点力 + 节点力矩
  distributed: { elem: number; qLocal: Vec3 }[]; // 沿单元的局部坐标分布荷载
  prescribe: { node: number; dof: number; value: number }[]; // 支座位移 / 强制位移
}

/** 完整的有限元模型。 */
export interface FEModel {
  nodes: Node[];
  elements: Element[];
  materials: Material[];
  sections: Section[];
  supports: Support[];
  loadCases: LoadCase[];
}
