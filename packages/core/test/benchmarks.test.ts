import { describe, it, expect } from 'vitest';
import { beamStiffness3D } from '../src/element/beam3d';
import { localAxes } from '../src/element/transform';
import { rectSection } from '../src/section/section';
import type { Vec3 } from '../src/model/types';

/**
 * 阶段 0 · 验收基准（先写标准答案，再写求解器）。
 * 以下 7 个算例在求解内核实现前以 it.todo 占位；实现后应改为可运行的
 * expect(δ).toBeCloseTo(理论值, 6) 回归测试（见开发路线图阶段 0 表）。
 */
describe('阶段0 · 验收基准（解析解）', () => {
  it.todo('算例1 简支梁跨中集中力 P：δ = PL³/(48EI)，M_max = PL/4');
  it.todo('算例2 悬臂梁端部集中力 P：δ = PL³/(3EI)，θ = PL²/(2EI)');
  it.todo('算例3 悬臂梁全长均布荷载 q：δ = qL⁴/(8EI)，M_root = qL²/2');
  it.todo('算例4 两跨连续梁等跨均布荷载：中支座反力 = 1.25qL，端支座 0.375qL');
  it.todo('算例5 平面桁架经典算例：各杆轴力（节点法手算）');
  it.todo('算例6 空间刚架：端部横向水平力 + 扭矩，双向弯曲 + GJ/L 扭转');
  it.todo('算例7 刚体检验：无约束模型应奇异、求解应报错');
});

/**
 * 单元刚度矩阵基本性质（不依赖完整求解器，可立即验证，能在写结构前抓错）。
 */
describe('单元刚度矩阵 · 可立即验证', () => {
  it('梁单元局部刚度矩阵应对称 |k − kᵀ| < 1e-9（抓 90% 手抄错误）', () => {
    const sec = { id: 0, ...rectSection(300, 600) };
    const k = beamStiffness3D(2.1e5, 0.3, sec, 6000);
    let maxAsym = 0;
    for (let i = 0; i < 12; i++)
      for (let j = 0; j < 12; j++) maxAsym = Math.max(maxAsym, Math.abs(k[i][j] - k[j][i]));
    expect(maxAsym).toBeLessThan(1e-9);
  });

  it('局部坐标轴应正交归一', () => {
    const { x, y, z } = localAxes([0, 0, 0], [6000, 0, 0]);
    const len = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);
    const d = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    expect(len(x)).toBeCloseTo(1, 6);
    expect(len(y)).toBeCloseTo(1, 6);
    expect(len(z)).toBeCloseTo(1, 6);
    expect(d(x, y)).toBeCloseTo(0, 6);
    expect(d(x, z)).toBeCloseTo(0, 6);
    expect(d(y, z)).toBeCloseTo(0, 6);
  });
});
