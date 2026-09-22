import type { Material, Section } from '../model/types';

/** 12×12 局部刚度矩阵（行主序）。自由度顺序 [u1 v1 w1 θx1 θy1 θz1 | u2 v2 w2 θx2 θy2 θz2] */
export type Mat12 = number[][];

/**
 * 空间梁单元（每节点 6 自由度）局部刚度矩阵。
 * 局部 x 沿杆轴，y/z 为截面主轴。公式来自结构力学课本（见开发路线图阶段 2.1）。
 *
 *  - Cy = EIy/L³ （绕 y 轴弯曲，对应横向位移 w）
 *  - Cz = EIz/L³ （绕 z 轴弯曲，对应横向位移 v）
 *  - C1 = EA/L   （轴向）
 *  - Ct = GJ/L   （扭转，G = E/2(1+ν)）
 */
export function beamStiffness3D(E: number, nu: number, sec: Section, L: number): Mat12 {
  const G = E / (2 * (1 + nu));
  const C1 = (E * sec.A) / L;
  const Cy = (E * sec.Iy) / L ** 3;
  const Cz = (E * sec.Iz) / L ** 3;
  const Ct = (G * sec.J) / L;

  const k: Mat12 = Array.from({ length: 12 }, () => new Array(12).fill(0));

  // 轴向 u（i=0, j=6）
  k[0][0] = C1; k[0][6] = -C1; k[6][0] = -C1; k[6][6] = C1;

  // 弯曲绕 z 轴 → 横向 v（用 Iz → Cz）：i=1, j=7, θz: i=5, j=11
  k[1][1] = 12 * Cz; k[1][5] = 6 * Cz * L; k[1][7] = -12 * Cz; k[1][11] = 6 * Cz * L;
  k[5][1] = 6 * Cz * L; k[5][5] = 4 * Cz * L * L; k[5][7] = -6 * Cz * L; k[5][11] = 2 * Cz * L * L;
  k[7][1] = -12 * Cz; k[7][5] = -6 * Cz * L; k[7][7] = 12 * Cz; k[7][11] = -6 * Cz * L;
  k[11][1] = 6 * Cz * L; k[11][5] = 2 * Cz * L * L; k[11][7] = -6 * Cz * L; k[11][11] = 4 * Cz * L * L;

  // 弯曲绕 y 轴 → 横向 w（用 Iy → Cy）：i=2, j=8, θy: i=4, j=10
  k[2][2] = 12 * Cy; k[2][4] = -6 * Cy * L; k[2][8] = -12 * Cy; k[2][10] = -6 * Cy * L;
  k[4][2] = -6 * Cy * L; k[4][4] = 4 * Cy * L * L; k[4][8] = 6 * Cy * L; k[4][10] = 2 * Cy * L * L;
  k[8][2] = -12 * Cy; k[8][4] = 6 * Cy * L; k[8][8] = 12 * Cy; k[8][10] = 6 * Cy * L;
  k[10][2] = -6 * Cy * L; k[10][4] = 2 * Cy * L * L; k[10][8] = 6 * Cy * L; k[10][10] = 4 * Cy * L * L;

  // 扭转 θx（i=3, j=9）
  k[3][3] = Ct; k[3][9] = -Ct; k[9][3] = -Ct; k[9][9] = Ct;

  return k;
}
