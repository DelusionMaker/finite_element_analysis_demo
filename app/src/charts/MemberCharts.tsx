import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * 内力 / 位移沿桥轴的曲线（路线图阶段 5 图表侧）。
 * 骨架阶段暂无数据：求解内核实现后，把沿里程采样的
 * N / V / M / T（及位移）数组传入 data 即可。支持多工况叠加与包络。
 */
export function MemberCharts() {
  // 求解内核实现后形如：
  // const data = memberForces.map(f => ({ x: f.x, N: f.N, V: f.V, M: f.M, T: f.T }));
  const data: Array<Record<string, number>> = [];

  return (
    <div className="charts">
      <h2>内力图（沿桥轴）</h2>
      <p className="note">
        求解内核实现后，此处绘制 N / V / M / T 沿里程的曲线，支持多工况叠加与包络。
      </p>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="N" stroke="#1f6feb" dot={false} />
          <Line type="monotone" dataKey="V" stroke="#6fcf57" dot={false} />
          <Line type="monotone" dataKey="M" stroke="#e0533d" dot={false} />
          <Line type="monotone" dataKey="T" stroke="#9b59d0" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
