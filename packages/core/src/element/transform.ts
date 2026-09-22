import type { Vec3 } from '../model/types';

export interface LocalAxes {
  x: Vec3; // 沿杆轴
  y: Vec3; // 截面主轴 1（参考方向投影）
  z: Vec3; // 截面主轴 2（x × y）
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/**
 * 由两端节点坐标计算单元局部坐标轴（方向余弦）。
 * 局部 x 沿杆轴 (Pj − Pi)；局部 y 由参考方向 ref 投影到垂直于 x 的平面得到；
 * 若 ref 与 x 接近平行（竖杆），用 [1,0,0] 兜底。局部 z = x × y。
 *
 * ⚠️ 这是“弯矩差一倍 / Iy 与 Iz 对调”的头号来源：箱梁 Iy、Iz 常差一个量级，
 * 局部轴旋转 90° 结果完全错误。务必给 Section.refVector 显式赋值。
 */
export function localAxes(pi: Vec3, pj: Vec3, ref: Vec3 = [0, 1, 0]): LocalAxes {
  const x = norm(sub(pj, pi));
  let r = ref;
  if (Math.abs(dot(x, r)) > 0.999) r = [1, 0, 0]; // 竖杆兜底
  const y = norm(sub(r, scale(x, dot(r, x))));
  const z = cross(x, y);
  return { x, y, z };
}

/** 由三个局部轴构造 3×3 方向余弦矩阵 Λ = [xᵀ; yᵀ; zᵀ]。 */
export function directionCosine(a: LocalAxes): number[][] {
  return [a.x, a.y, a.z];
}

/** 12×12 块对角变换矩阵 T = blockDiag(Λ, Λ, Λ, Λ)。 */
export function transformMatrix(a: LocalAxes): number[][] {
  const L = directionCosine(a);
  const T: number[][] = Array.from({ length: 12 }, () => new Array(12).fill(0));
  for (let b = 0; b < 4; b++) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        T[b * 3 + r][b * 3 + c] = L[r][c];
      }
    }
  }
  return T;
}

export { sub, dot, cross, norm, scale, add };
