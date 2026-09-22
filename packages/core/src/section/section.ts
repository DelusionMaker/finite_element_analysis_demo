import type { Section } from '../model/types';

/** 不含 id 的截面特性（用于构造后填入模型）。 */
export type SectionProps = Omit<Section, 'id'>;

/** 矩形截面（b 宽，h 高，默认 h 沿 y 轴）。 */
export function rectSection(b: number, h: number): SectionProps {
  const A = b * h;
  const Iy = (b * h ** 3) / 12; // 绕 y 轴（水平轴）的抗弯
  const Iz = (h * b ** 3) / 12; // 绕 z 轴（横向轴）的抗弯
  const bH = Math.max(b, h);
  const sH = Math.min(b, h);
  // Cowper 薄壁扭转常数近似
  const J = bH * sH ** 3 * (1 / 3 - 0.21 * (sH / bH) * (1 - sH ** 4 / (12 * bH ** 4)));
  return { A, Iy, Iz, J };
}

/** 圆截面（直径 d）。 */
export function circleSection(d: number): SectionProps {
  const r = d / 2;
  const A = Math.PI * r * r;
  const I = (Math.PI * r ** 4) / 4;
  const J = (Math.PI * r ** 4) / 2;
  return { A, Iy: I, Iz: I, J };
}

/** 箱形截面（b×h 外尺寸，壁厚 t），J 用 Bredt 薄壁近似。 */
export function boxSection(b: number, h: number, t: number): SectionProps {
  const A = b * h - (b - 2 * t) * (h - 2 * t);
  const Iy = (b * h ** 3 - (b - 2 * t) * (h - 2 * t) ** 3) / 12;
  const Iz = (h * b ** 3 - (h - 2 * t) * (b - 2 * t) ** 3) / 12;
  const Am = (b - t) * (h - t); // 闭合面积
  const J = (2 * Am * Am * t) / (b - t + h - t); // Bredt：J = 4A_m² / ∮(ds/t)
  return { A, Iy, Iz, J };
}
