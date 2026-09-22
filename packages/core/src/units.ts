/**
 * 单位制约定（全局唯一，写死在代码与 UI 顶部）。
 * 桥梁常用 N – mm – MPa：力 N、长度 mm、应力 MPa（即 N/mm²）。
 * 混用 mm 与 m 是“结果差 10⁶ 倍”的头号错误，所有输入须统一到此制。
 */
export const UNIT_SYSTEM = 'N-mm-MPa' as const;

export const UNIT_NOTE =
  '全局单位制：力 N，长度 mm，应力 MPa（E 以 N/mm² 计）。' +
  '所有输入须统一，混用 mm/m 会导致结果差 10⁶ 倍。';
