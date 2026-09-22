/**
 * learn.js —— 零依赖有限元最小教学实现
 * 运行：  node learn.js
 *
 * ⚠️ 单位制（全局唯一，写死在第一行）：N · m · Pa
 *    不要混用 mm！混用是「结果差 10⁶ 倍」的头号原因。
 *
 * 主线：切块 → 单元刚度 → 组装 → 加约束 → 解方程 → 回代
 * 本文件刻意用最简单的「平面梁单元」（每节点 2 个自由度：竖向位移 v、转角 θ），
 * 真正的桥梁用「空间梁单元」（每节点 6 个自由度），思路完全一样，只是表格从 4×4 变成 12×12。
 */

// ==========================================================
// 工具区（通用数学，和力学无关，可以直接抄到别的项目）
// ==========================================================

/** 生成 n×n 的全 0 矩阵 */
function zeros(n) {
  return Array.from({ length: n }, () => new Array(n).fill(0));
}

/** 高斯消元法解 A x = b（带部分选主元） */
function solveLinearSystem(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]); // 增广矩阵

  // 奇异性判据必须用「相对阈值」：
  // 矩阵元素是 1e7 量级时，理论上为 0 的主元在浮点运算里会残留成 1e-8 左右，
  // 写死 1e-14 是抓不到的。所以阈值要跟着矩阵自身的量级走。
  let maxAbs = 0;
  for (const row of A) for (const v of row) maxAbs = Math.max(maxAbs, Math.abs(v));
  const singTol = maxAbs * 1e-12;

  for (let col = 0; col < n; col++) {
    // 1) 选这一列绝对值最大的行作为主元行（防止除零、减小误差）
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];

    if (Math.abs(M[col][col]) < singTol) {
      throw new Error(
        `❌ 矩阵在第 ${col} 列接近奇异（主元 ${M[col][col].toExponential(2)}，阈值 ${singTol.toExponential(2)}）\n` +
          `   最常见的原因：支座约束加少了，结构还能整体平移或转动（称为"机构"）。`
      );
    }

    // 2) 用主元行把下面的行消成 0
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }

  // 3) 回代
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let c = r + 1; c < n; c++) s -= M[r][c] * x[c];
    x[r] = s / M[r][r];
  }
  return x;
}

/** 好看地打印矩阵 */
function printMatrix(title, M, labels) {
  console.log(`\n${title}`);
  if (labels) console.log('        ' + labels.map((s) => String(s).padStart(12)).join(''));
  M.forEach((row, i) => {
    const head = labels ? String(labels[i]).padStart(7) + ' ' : '';
    console.log(head + row.map((v) => fmtNum(v)).join(''));
  });
}

/** 数字格式化：太小就显示 0 */
function fmtNum(v, w = 12) {
  if (Math.abs(v) < 1e-12) return '0'.padStart(w);
  if (Math.abs(v) >= 1e5 || Math.abs(v) < 1e-3) return v.toExponential(3).padStart(w);
  return v.toPrecision(6).padStart(w);
}

const line = (s = '') => console.log('\n' + '─'.repeat(66) + (s ? `\n${s}` : ''));

// ==========================================================
// 力学区
// ==========================================================

/**
 * 平面梁单元的 4×4 刚度矩阵
 * 自由度顺序：[ v_i, θ_i, v_j, θ_j ]
 *
 * 它就是结构力学课本上现成的公式，不用推导，直接抄：
 *       ⎡  12    6L   -12    6L ⎤
 * k = EI/L³ · ⎢  6L   4L²  -6L   2L²⎥
 *       ⎢ -12   -6L    12   -6L ⎥
 *       ⎣  6L   2L²  -6L   4L²⎦
 */
function beamStiffness2D(E, I, L) {
  const a = (E * I) / (L * L * L);
  return [
    [12 * a, 6 * a * L, -12 * a, 6 * a * L],
    [6 * a * L, 4 * a * L * L, -6 * a * L, 2 * a * L * L],
    [-12 * a, -6 * a * L, 12 * a, -6 * a * L],
    [6 * a * L, 2 * a * L * L, -6 * a * L, 4 * a * L * L],
  ];
}

/**
 * 均布荷载的「等效节点力」
 * 课本上叫 consistent nodal load —— 意思是把分布的力，等价翻译成作用在两端节点上的力+力矩。
 * 对整根杆满布的均布荷载 q（沿 +v 方向），结果是：
 *     f = [ qL/2 ,  qL²/12 ,  qL/2 , −qL²/12 ]
 * （注意第三项是正的 L²/12 —— 两端力矩大小相同、方向相反，这是最容易抄错的一格）
 */
function uniformLoadVector(q, L) {
  return [(q * L) / 2, (q * L * L) / 12, (q * L) / 2, (-q * L * L) / 12];
}

/**
 * 施加边界条件 —— 用「置 1 置 0 + 右端修正」
 * 为什么不用「罚函数法」（把对角元改成 1e30）？
 *   因为 1e30 会让矩阵条件数爆炸，几千自由度以上就开始出鬼。
 *   下面这个做法能保持矩阵对称正定，数值上干净得多。
 *
 * @param constraints Map<自由度编号, 给定位移值>
 */
function applyBoundary(K, F, constraints) {
  const n = F.length;
  for (const [d, value] of constraints) {
    // 先把这一列原本的值存下来，因为马上要把它清零
    const colSnapshot = K.map((row) => row[d]);
    for (let i = 0; i < n; i++) {
      if (i === d) continue;
      F[i] -= colSnapshot[i] * value; // 已知位移对别人产生的贡献，挪到等号右边
      K[i][d] = 0;
      K[d][i] = 0;
    }
    K[d][d] = 1;
    F[d] = value;
  }
}

/** 由 nodal dof 编号规则：第 i 个节点占 dof 2i（竖向位移）和 2i+1（转角） */
const dofsOfNode = (nodeId) => [2 * nodeId, 2 * nodeId + 1];

// ==========================================================
// 例 1：简支梁，跨中集中力
// ==========================================================
function example1() {
  line('【例 1】简支梁 · 跨中集中力');

  const L = 6; // 跨度 6 m
  const E = 2.1e11; // 钢材弹性模量 210 GPa
  const I = 8e-5; // 截面惯性矩，约等于一根中等工字钢
  const P = 1000; // 跨中集中力 1000 N（向下，取负号）

  console.log(`梁长 L = ${L} m ｜ E = ${E.toExponential(2)} Pa ｜ I = ${I.toExponential(2)} m⁴ ｜ P = ${P} N`);

  // ---- 第 1 步：切块（离散化）----
  // 因为要在跨中加力，跨中必须有一个节点，所以切成 2 段。
  const nodes = [
    { id: 0, x: 0 },
    { id: 1, x: L / 2 },
    { id: 2, x: L },
  ];
  const elements = [
    { id: 0, n: [0, 1] },
    { id: 1, n: [1, 2] },
  ];
  console.log(`\n① 切块：${nodes.length} 个节点、${elements.length} 个单元`);
  console.log(`   总自由度 = ${nodes.length} × 2 = ${nodes.length * 2}  （每个节点一个位移 + 一个转角）`);
  console.log('   自由度编号：[v0 θ0 v1 θ1 v2 θ2] = [0 1 2 3 4 5]');

  // ---- 第 2 步：单元刚度 ----
  const Le = L / 2; // 每段长度 3 m
  const ke = beamStiffness2D(E, I, Le);
  printMatrix('② 单元刚度矩阵 ke（4×4，两段完全相同）：', ke, ['v_i', 'θ_i', 'v_j', 'θ_j']);

  // ---- 第 3 步：组装 ----
  const ndof = nodes.length * 2;
  const K = zeros(ndof);
  for (const el of elements) {
    const map = [...dofsOfNode(el.n[0]), ...dofsOfNode(el.n[1])]; // [0,1,2,3] 或 [2,3,4,5]
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        K[map[r]][map[c]] += ke[r][c]; // 共用位置叠加
      }
    }
  }
  printMatrix('③ 组装后的总刚 K（6×6）：', K, ['v0', 'θ0', 'v1', 'θ1', 'v2', 'θ2']);
  console.log('   注意 K[2][2]：两个单元都贡献到这里，所以是两个 12EI/L³ 相加');

  // ---- 第 4 步：荷载与约束 ----
  const F = new Array(ndof).fill(0);
  F[2] = -P; // 节点 1 的竖向自由度 = dof 2，向下所以是负的
  console.log(`\n④ 荷载向量 F = [${F.map((f) => fmtNum(f, 8).trim()).join(', ')}]`);

  // 保留一份原始 K、F，因为第 7 步算支反力要用「未经修改」的 K
  const K0 = K.map((r) => [...r]);
  const F0 = [...F];

  const constraints = new Map([
    [0, 0], // 节点 0 竖向位移 = 0（左支座）
    [4, 0], // 节点 2 竖向位移 = 0（右支座）
  ]);
  console.log('   约束：v0 = 0（左铰支座）、v2 = 0（右铰支座）；转角 θ 全部自由');

  applyBoundary(K, F, constraints);
  printMatrix('   施加约束后（第 0、4 行/列清零、对角置 1）：', K, ['v0', 'θ0', 'v1', 'θ1', 'v2', 'θ2']);

  // ---- 第 5 步：求解 ----
  const u = solveLinearSystem(K, F);
  console.log('\n⑤ 解出的位移 u：');
  console.log(`   v0 = ${fmtNum(u[0], 10).trim()} m  （支座处，应当 = 0）`);
  console.log(`   θ0 = ${u[1].toExponential(4)} rad`);
  console.log(`   v1 = ${fmtNum(u[2], 10).trim()} m  ← 跨中挠度，本次的主角`);
  console.log(`   θ1 = ${u[3].toExponential(4)} rad`);
  console.log(`   v2 = ${fmtNum(u[4], 10).trim()} m  （支座处，应当 = 0）`);
  console.log(`   θ2 = ${u[5].toExponential(4)} rad`);

  // ---- 第 6 步：拿解析解验收 ----
  const exact = -(P * L * L * L) / (48 * E * I);
  const fe = u[2];
  const err = Math.abs((fe - exact) / exact);
  console.log('\n⑥ 与结构力学解析解对比：');
  console.log(`   理论 δ = −PL³/(48EI) = ${(exact * 1000).toFixed(4)} mm`);
  console.log(`   有限元 δ            = ${(fe * 1000).toFixed(4)} mm`);
  console.log(`   相对误差            = ${(err * 100).toExponential(2)} %  ${err < 1e-10 ? '✅ 通过' : '❌ 不通过'}`);

  // ---- 第 7 步：回代支反力 ----
  // R = K0·u − F0（用未修改的 K 和原始外力）
  const R = K0.map((row, i) => row.reduce((s, kij, j) => s + kij * u[j], 0) - F0[i]);
  console.log('\n⑦ 支反力 R = K·u − F：');
  console.log(`   左支座 R0 = ${R[0].toFixed(3)} N`);
  console.log(`   右支座 R2 = ${R[4].toFixed(3)} N`);
  console.log(`   合计      = ${(R[0] + R[4]).toFixed(3)} N，外力合计 = ${-P} N`);
  const balanceOK = Math.abs(R[0] + R[4] - P) < 1e-6 && Math.abs(R[0] - P / 2) < 1e-6;
  console.log(`   静力平衡检查：${balanceOK ? '✅ 通过（各承担 P/2 = 500 N）' : '❌ 不平衡，回去查组装'}`);

  return err < 1e-10 && balanceOK;
}

// ==========================================================
// 例 2：悬臂梁，全长均布荷载（演示「等效节点力」）
// ==========================================================
function example2() {
  line('【例 2】悬臂梁 · 全长均布荷载');

  const L = 4;
  const E = 2.1e11;
  const I = 8e-5;
  const w = 500; // 均布荷载 500 N/m，向下

  console.log(`悬臂梁 L = ${L} m ｜ 均布荷载 w = ${w} N/m（向下）`);

  const nodes = [{ id: 0, x: 0 }, { id: 1, x: L }];
  const ndof = nodes.length * 2;

  // 第 1 步：切块 —— 只切 1 段就够了（见下面的"为什么"）
  const ke = beamStiffness2D(E, I, L);
  const map = [0, 1, 2, 3];
  const K = zeros(ndof);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) K[map[r]][map[c]] += ke[r][c];

  // 第 2 步：把分布荷载翻译成节点力（这一步就是「一致荷载向量」）
  // 向下 = v 的负方向，所以 q = −w
  const fe = uniformLoadVector(-w, L);
  const F = new Array(ndof).fill(0);
  map.forEach((d, i) => (F[d] += fe[i]));
  printMatrix('单元刚度 K（4×4）：', K, ['v0', 'θ0', 'v1', 'θ1']);
  console.log(`\n等效节点荷载      = [${fe.map((v) => fmtNum(v, 9).trim()).join(', ')}]`);
  console.log('（前两项给固定端、后两项给自由端：两个竖向力 −1000 N、两个端弯矩 ±666.7 N·m）');

  // 第 3 步：固端约束——位移和转角都锁死
  const K0 = K.map((r) => [...r]);
  const F0 = [...F];
  applyBoundary(K, F, new Map([[0, 0], [1, 0]]));

  // 第 4 步：求解
  const u = solveLinearSystem(K, F);

  // 第 5 步：验收
  const exactV = -(w * L ** 4) / (8 * E * I);
  const exactT = -(w * L ** 3) / (6 * E * I);
  const errV = Math.abs((u[2] - exactV) / exactV);
  const errT = Math.abs((u[3] - exactT) / exactT);

  console.log('\n结果对比：');
  console.log(`   端部挠度  理论 −wL⁴/(8EI) = ${(exactV * 1000).toFixed(4)} mm ｜ 有限元 = ${(u[2] * 1000).toFixed(4)} mm ｜ 误差 ${(errV * 100).toExponential(2)} %`);
  console.log(`   端部转角  理论 −wL³/(6EI) = ${exactT.toExponential(4)} rad ｜ 有限元 = ${u[3].toExponential(4)} rad ｜ 误差 ${(errT * 100).toExponential(2)} %`);

  const R = K0.map((row, i) => row.reduce((s, k, j) => s + k * u[j], 0) - F0[i]);
  console.log(`\n固端支反力（这里打印的是「支座提供给结构的力」，向上/逆时针为正）：`);
  console.log(`   竖向    ${R[0].toFixed(1)} N     ｜ 检查：应等于 wL = ${w * L} N`);
  console.log(`   固端弯矩 ${R[1].toFixed(1)} N·m  ｜ 检查：大小应等于 wL²/2 = ${(w * L * L) / 2} N·m`);
  console.log('   注：课本查表常把「梁端内力弯矩」记为 −wL²/2，那是另一套符号约定（内力 vs 支座反力），');
  console.log('       数值一样、符号相反。这恰恰说明：符号约定必须一开始就钉死，否则越往后越乱。');

  console.log('\n💡 为什么只切 1 段就精确？');
  console.log('   因为梁单元的形函数是三次多项式，而"用一致荷载向量"处理分布荷载时，');
  console.log('   节点位移恰好是精确解。集中力作用在节点上时同理。');
  console.log('   ⇒ 所以「要不要加���网格」的答案是：节点位移已经是精确解，加密不会让它更准；
      只有当你需要看「两个节点之间那一段」的变形形状时，才需要多切几段。');

  return errV < 1e-10 && errT < 1e-10;
}

// ==========================================================
// 例 3：故意犯错，看看会怎样（最有价值的一步）
// ==========================================================
function example3_commonMistakes() {
  line('【例 3】故意踩坑 —— 知道错的样子，才知道怎么debug');

  const E = 2.1e11, I = 8e-5, L = 6;
  const ke = beamStiffness2D(E, I, L / 2);

  // 坑 A：完全不加约束 → 矩阵奇异
  const nodes = 3, ndof = nodes * 2;
  const K = zeros(ndof);
  for (const el of [[0, 1], [1, 2]]) {
    const map = [2 * el[0], 2 * el[0] + 1, 2 * el[1], 2 * el[1] + 1];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) K[map[r]][map[c]] += ke[r][c];
  }
  const F = new Array(ndof).fill(0);
  F[2] = -1000;
  try {
    solveLinearSystem(K, F);
    console.log('❌ 坑A：居然解出来了，说明测试用例写错了');
  } catch (e) {
    console.log('✅ 坑A 成功复现 → ' + e.message.split('\n')[0]);
    console.log('   ' + e.message.split('\n')[1]);
    console.log('   实践中应该捕获这个异常，友好地告诉用户"第 N 号节点的哪个方向没约束住"，');
    console.log('   而不是让 NaN 或 1e30 一路流到 UI 上变成一个飞出天际的模型。');
  }

  // 坑 B：刚度矩阵不对称 → 手抄公式错了
  let maxAsym = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) maxAsym = Math.max(maxAsym, Math.abs(ke[i][j] - ke[j][i]));
  console.log(`\n✅ 坑B 检查：单元刚度矩阵对称性偏差 = ${maxAsym.toExponential(2)}`);
  console.log('   这条应写死成单元测试：|k − kᵀ| < 1e-12。它能在你还没算任何结构之前就抓出 90% 的抄写错误');

  // 坑 C：单位混用
  const I_mm = 8e-5 * 1e12; // 有人会把 m⁴ 写成 mm⁴
  const k_wrong = beamStiffness2D(E, I_mm, 6);
  console.log(`\n✅ 坑C 演示：把 I 从 m⁴ 当成 mm⁴ 用，刚度会放大 ${(k_wrong[0][0] / beamStiffness2D(E, I, 6)[0][0]).toExponential(2)} 倍`);
  console.log('   ⇒ 位移就会小同样的倍数。这就是「为什么我的桥完全不变形」');
}

// ==========================================================
// 主程序
// ==========================================================
function main() {
  console.log('╔' + '═'.repeat(66) + '╗');
  console.log('║' + '  有限元最小可读实现 —— 从「完全不懂」到「算出第一根梁」'.padEnd(58) + '║');
  console.log('╚' + '═'.repeat(66) + '╝');

  const ok1 = example1();
  const ok2 = example2();
  example3_commonMistakes();

  line('毕业检查');
  console.log(`  例 1 简支梁：${ok1 ? '✅ 通过' : '❌ 未通过'}`);
  console.log(`  例 2 悬臂梁：${ok2 ? '✅ 通过' : '❌ 未通过'}`);
  console.log('\n下一步做什么？');
  console.log('  1. 把 main() 里的参数改成你的桥，先跑一根真正的箱梁试试');
  console.log('  2. 把 beamStiffness2D 换成 12×12 的空间梁单元（加轴向 EA/L 与扭转 GJ/L）');
  console.log('  3. 加一个「多段自动划分」的循环，别再手写一个个节点');
  console.log('  4. 之后才是 UI：把这些数组丢给 Three.js 画变形和云图');
}

main();
