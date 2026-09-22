/// <reference lib="webworker" />
import type { FEModel } from '@fem/core';

export interface SolveRequest {
  type: 'solve';
  model: FEModel;
}

export interface SolveResponse {
  type: 'result' | 'error';
  message?: string;
}

/**
 * 求解放进 Web Worker（路线图阶段 6），避免大模型卡死 UI。
 * 用 postMessage 传 Float64Array（Transferable 零拷贝）。
 *
 * 当前内核未实现，仅占位。实现后：
 *   import { solve } from '@fem/core';
 *   const res = solve(model);
 *   (self as unknown as Worker).postMessage({ type: 'result', result: res });
 */
self.onmessage = (e: MessageEvent<SolveRequest>) => {
  if (e.data?.type === 'solve') {
    const res: SolveResponse = {
      type: 'error',
      message: '求解内核尚未实现（见 packages/core 阶段 2–4）',
    };
    (self as unknown as Worker).postMessage(res);
  }
};
