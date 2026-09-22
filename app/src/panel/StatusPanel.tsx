import type { FEModel } from '@fem/core';
import { UNIT_NOTE } from '@fem/core';

export function StatusPanel({ model }: { model: FEModel }) {
  const ndof = model.nodes.length * 6;
  const loadCase = model.loadCases[0];

  return (
    <div>
      <h1>桥梁线性有限元 · 骨架</h1>

      <div className="stat">
        <span>节点数</span>
        <b>{model.nodes.length}</b>
      </div>
      <div className="stat">
        <span>单元数</span>
        <b>{model.elements.length}</b>
      </div>
      <div className="stat">
        <span>自由度 DOF</span>
        <b>{ndof}</b>
      </div>
      <div className="stat">
        <span>支座数</span>
        <b>{model.supports.length}</b>
      </div>
      <div className="stat">
        <span>荷载工况</span>
        <b>{model.loadCases.length}</b>
      </div>
      <div className="stat">
        <span>当前工况</span>
        <b>{loadCase ? loadCase.name : '—'}</b>
      </div>

      <p className="note">{UNIT_NOTE}</p>

      <div className="todo">
        求解内核（路线图阶段 2–4：单元刚度 / 坐标变换 / 组装 / LDLᵀ / 内力回代）
        尚未实现。当前三维视图仅渲染<strong>未变形几何</strong>、支座与节点。
      </div>
    </div>
  );
}
