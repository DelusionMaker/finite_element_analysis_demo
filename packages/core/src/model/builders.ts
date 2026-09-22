import type { FEModel, Node, Element, Material, Section, Support, LoadCase } from './types';

export interface BeamOptions {
  span?: number; // 跨度（mm）
  segments?: number; // 单元段数
  E?: number; // 弹性模量（N/mm²）
  I?: number; // 截面惯性矩（mm⁴）
  A?: number; // 截面积（mm²）
  P?: number; // 跨中集中力（N，向下为负 y）
}

/**
 * 构造一根简支梁模型（阶段 1 交付物：可手工构造的 helper）。
 * 竖向 = y 轴。两端简支：约束 uy、uz（竖向 + 横向），轴向 ux 自由。
 * 跨中施加向下集中力。用于三维视图展示未变形几何，以及后续验收算例 1。
 */
export function buildSimplySupportedBeam(opts: BeamOptions = {}): FEModel {
  const span = opts.span ?? 30_000; // 默认 30 m
  const n = opts.segments ?? 12;
  const E = opts.E ?? 2.1e5; // 钢材 210 GPa = 2.1e5 N/mm²
  const I = opts.I ?? 8e8; // 中等工字钢量级
  const A = opts.A ?? 1e4; // 100 cm²
  const P = opts.P ?? 1e5; // 100 kN

  const nodes: Node[] = [];
  for (let i = 0; i <= n; i++) {
    nodes.push({ id: i, x: (span * i) / n, y: 0, z: 0 });
  }

  const elements: Element[] = [];
  for (let i = 0; i < n; i++) {
    elements.push({ id: i, i, j: i + 1, mat: 0, sec: 0, type: 'beam' });
  }

  const materials: Material[] = [
    { id: 0, E, nu: 0.3, rho: 7.85e-9, alpha: 1.2e-5 }, // rho 单位随制统一
  ];
  const sections: Section[] = [{ id: 0, A, Iy: I, Iz: I, J: I * 0.5 }];

  const mid = Math.floor(n / 2);
  const loadCases: LoadCase[] = [
    {
      id: 0,
      name: '跨中集中力',
      nodal: [{ node: mid, f: [0, -P, 0], m: [0, 0, 0] }],
      distributed: [],
      prescribe: [],
    },
  ];

  const supports: Support[] = [
    { node: 0, ux: false, uy: true, uz: true, rx: false, ry: false, rz: false },
    { node: n, ux: false, uy: true, uz: true, rx: false, ry: false, rz: false },
  ];

  return { nodes, elements, materials, sections, supports, loadCases };
}
