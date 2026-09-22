import { useMemo } from 'react';
import { buildSimplySupportedBeam } from '@fem/core';
import { BridgeViewer } from './viewer/BridgeViewer';
import { StatusPanel } from './panel/StatusPanel';
import { MemberCharts } from './charts/MemberCharts';

export default function App() {
  // 当前骨架阶段：用构造器生成一根简支梁，仅展示未变形几何。
  // 求解内核（阶段 2–4）实现后，这里改为从 UI / 导入文件拿模型，并调用 solve()。
  const model = useMemo(
    () => buildSimplySupportedBeam({ span: 30_000, segments: 12 }),
    [],
  );

  return (
    <div className="app">
      <div className="viewer">
        <BridgeViewer model={model} />
      </div>
      <aside className="panel">
        <StatusPanel model={model} />
        <MemberCharts />
      </aside>
    </div>
  );
}
