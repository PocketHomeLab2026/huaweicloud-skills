import { test } from "node:test";
import assert from "node:assert/strict";
import { 数据引力仪 } from "./公共引力引擎.mjs";

const 仪 = new 数据引力仪();

test("皮尔逊: 完全正相关为1", () => {
  assert.equal(仪.皮尔逊([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]).toFixed(6), "1.000000");
});

test("皮尔逊: 完全负相关为-1", () => {
  assert.equal(仪.皮尔逊([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]).toFixed(6), "-1.000000");
});

test("皮尔逊: 常数列返回0（无方差）", () => {
  assert.equal(仪.皮尔逊([1, 2, 3], [5, 5, 5]), 0);
});

test("斯皮尔曼: 单调非线性关系为1", () => {
  assert.equal(仪.斯皮尔曼([1, 2, 3, 4, 5], [1, 4, 9, 16, 25]).toFixed(6), "1.000000");
});

test("二次拟合: 检测倒U型曲线", () => {
  const x = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const y = [0, 2, 3.5, 4.5, 5, 4.5, 3.5, 2, 0];
  const 结果 = 仪.二次拟合(x, y);
  assert.ok(结果.决定系数 > 0.95, `R²应接近1，实际${结果.决定系数}`);
  assert.equal(结果.开口方向, -1);
  assert.ok(Math.abs(结果.峰值x - 4) < 0.5);
});

test("二次拟合: 线性数据开口近零仍可拟合", () => {
  const 结果 = 仪.二次拟合([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
  assert.ok(结果.决定系数 > 0.99);
});

test("CSV解析: 自动识别数值列与类别列", () => {
  const 表 = 仪.解析CSV("名称,数值甲,数值乙,备注\nA,1,2,x\nB,3,4,y\nC,5,6,z\nD,7,8,w");
  assert.deepEqual(表.列名, ["数值甲", "数值乙"]);
  assert.equal(表.行数, 4);
});

test("CSV解析: 分号与制表符分隔符", () => {
  const 分号 = 仪.解析CSV("甲;乙\n1;2\n3;4\n5;6");
  assert.deepEqual(分号.列名, ["甲", "乙"]);
  const 制表 = 仪.解析CSV("甲\t乙\n1\t2\n3\t4\n5\t6");
  assert.deepEqual(制表.列名, ["甲", "乙"]);
});

test("CSV解析: 至少2数值列的校验", () => {
  assert.throws(() => 仪.解析CSV("名称,备注\nA,x\nB,y\nC,z"), /至少需要2个数值列/);
});

test("完整分析: 强相关列被识别", () => {
  let CSV = "x,y,噪声\n";
  for (let i = 1; i <= 20; i++) CSV += `${i},${i * 2 + 1},${(i * 7919) % 100}\n`;
  const 结果 = 仪.完整分析(CSV);
  const xy关系 = 结果.原始关系.find(r => (r.甲 === "x" && r.乙 === "y") || (r.甲 === "y" && r.乙 === "x"));
  assert.ok(xy关系, "x-y关系应被发现");
  assert.ok(xy关系.引力 > 0.4);
  assert.ok(结果.跳过率 > 0, "噪声列配对应被跳过");
});

test("完整分析: 门槛建制关系被识别", () => {
  let CSV = "运动量,效果\n";
  for (let i = 0; i <= 12; i++) {
    const 效果 = -((i - 6) ** 2) + 40;
    CSV += `${i},${效果}\n`;
  }
  const 结果 = 仪.完整分析(CSV);
  assert.equal(结果.原始关系.length, 1);
  assert.equal(结果.原始关系[0].类型, "门槛建制");
  assert.equal(结果.原始关系[0].门槛信息.开口, "峰值");
  assert.ok(Math.abs(结果.原始关系[0].门槛信息.位置比例 - 0.5) < 0.1);
});

test("完整分析: 缺失值被正确对齐", () => {
  let CSV = "甲,乙\n1,10\n2,\n3,30\n,40\n5,50\n6,60\n7,70\n8,80\n";
  const 结果 = 仪.完整分析(CSV);
  assert.ok(结果.原始关系.length >= 1);
  assert.equal(结果.原始关系[0].共同样本, 6);
});

test("列质量: 缺失率影响质量但不归零", () => {
  const 质量 = 仪.计算列质量([1, 2, null, 4, 5, null, 7, 8]);
  assert.ok(质量.质量 > 0);
  assert.equal(质量.缺失率.toFixed(4), "0.2500");
});

test("统计距离: 同分布距离小", () => {
  const 甲 = { 缺失率: 0, 均值: 100 };
  const 乙 = { 缺失率: 0.02, 均值: 105 };
  assert.ok(仪.统计距离(甲, 乙) < 0.1);
});

test("执行链溯源: 意脚本引力算法函数等价性（无血缘环境时跳过）", async (t) => {
  const { readFileSync, existsSync } = await import("node:fs");
  const 解释器路径 = "D:/意语言/native/yiscript-interpreter.mjs";
  const 血缘路径 = "D:/PocketHome/意语言重写/海域火种核心/整体对齐/知识引力场构建器.意脚本";
  if (!existsSync(解释器路径) || !existsSync(血缘路径)) return t.skip("本机无算法血缘源码（意脚本），跳过等价性验证");
  const { 编译并执行 } = await import(`file:///${解释器路径.replace(/\\/g, "/")}`);
  const 源码 = readFileSync(血缘路径, "utf8");
  const 结果 = 编译并执行(源码, "主函数", []);
  assert.equal(结果.状态, "执行完成");
  const 输出 = JSON.stringify(结果.堆回执.对象);
  assert.ok(输出.includes("[0,1,3,4]"), "引力筛选结果应保留权重达标条目");
});