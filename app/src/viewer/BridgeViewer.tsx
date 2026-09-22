import { useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import type { FEModel } from '@fem/core';

type Vec3Tuple = [number, number, number];

function useBounds(model: FEModel) {
  return useMemo(() => {
    const xs = model.nodes.map((n) => n.x);
    const ys = model.nodes.map((n) => n.y);
    const zs = model.nodes.map((n) => n.z);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    const dx = Math.max(...xs) - Math.min(...xs);
    const dy = Math.max(...ys) - Math.min(...ys);
    const dz = Math.max(...zs) - Math.min(...zs);
    const radius = Math.max(dx, dy, dz, 1) * 1.4;
    return { center: [cx, cy, cz] as Vec3Tuple, radius };
  }, [model]);
}

/** 杆件几何：用合并的 LineSegments 绘制，避免一个单元一个 mesh。 */
function ElementLines({ model }: { model: FEModel }) {
  const positions = useMemo(() => {
    const byId = new Map(model.nodes.map((n) => [n.id, n]));
    const pos: number[] = [];
    for (const e of model.elements) {
      const a = byId.get(e.i);
      const b = byId.get(e.j);
      if (!a || !b) continue;
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    return new Float32Array(pos);
  }, [model]);

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#1f6feb" />
    </lineSegments>
  );
}

/** 支座标记：受约束的节点放一个锥体。 */
function SupportMarkers({ model }: { model: FEModel }) {
  const byId = useMemo(() => new Map(model.nodes.map((n) => [n.id, n])), [model]);
  return (
    <>
      {model.supports.map((s, idx) => {
        const n = byId.get(s.node);
        if (!n) return null;
        const restrained = s.uy || s.uz || s.ux;
        if (!restrained) return null;
        return (
          <mesh key={idx} position={[n.x, n.y - 0.6, n.z]}>
            <coneGeometry args={[0.6, 1.2, 4]} />
            <meshStandardMaterial color="#e0533d" />
          </mesh>
        );
      })}
    </>
  );
}

/** 节点小球。 */
function Nodes({ model }: { model: FEModel }) {
  return (
    <>
      {model.nodes.map((n) => (
        <mesh key={n.id} position={[n.x, n.y, n.z]}>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial color="#9aa4b2" />
        </mesh>
      ))}
    </>
  );
}

export function BridgeViewer({ model }: { model: FEModel }) {
  const { center, radius } = useBounds(model);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const c = controlsRef.current;
    if (c && c.target) {
      c.target.set(center[0], center[1], center[2]);
      c.update();
    }
  }, [center]);

  return (
    <>
      <div className="viewer-title">未变形几何 · 求解内核实现后将叠加变形与云图</div>
      <Canvas
        camera={{
          position: [center[0] + radius, center[1] + radius * 0.8, center[2] + radius * 1.4],
          fov: 50,
        }}
      >
        <color attach="background" args={['#0f1115']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[radius, radius, radius]} intensity={0.8} />

        <Nodes model={model} />
        <ElementLines model={model} />
        <SupportMarkers model={model} />

        <Grid
          args={[radius * 4, radius * 4]}
          cellColor="#2a2f3a"
          sectionColor="#3a4150"
          position={[center[0], center[1] - 1.4, center[2]]}
          infiniteGrid
        />

        <OrbitControls ref={controlsRef} makeDefault />
        <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
          <GizmoViewport axisColors={['#e0533d', '#6fcf57', '#1f6feb']} labelColor="white" />
        </GizmoHelper>
      </Canvas>
    </>
  );
}
