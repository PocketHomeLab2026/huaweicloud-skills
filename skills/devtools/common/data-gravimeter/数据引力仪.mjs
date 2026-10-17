#!/usr/bin/env node
/**
 * 数据引力仪 · 命令行入口
 * 用法: node 数据引力仪.mjs <数据.csv> [--阈值 0.35] [--仅图]
 * 也可被 import 作为模块调用
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { 数据引力仪 } from "./公共引力引擎.mjs";

const 参数 = process.argv.slice(2);
if (参数.length === 0) {
  console.log(`数据引力仪 —— 用「引力确定浮点关系」算法发现数据列之间的隐藏关联

用法:
  node 数据引力仪.mjs <数据文件.csv> [选项]

选项:
  --阈值 <0~1>   引力激活阈值，默认 0.35（越高关系图越严格）
  --仅图         只输出关系图，不输出人话解读
  --JSON         输出机器可读的JSON结果

示例:
  node 数据引力仪.mjs 示例-笔记运营数据.csv
  node 数据引力仪.mjs 销售数据.csv --阈值 0.5 --JSON`);
  process.exit(0);
}

const 文件 = 参数[0];
const 阈值位置 = 参数.indexOf("--阈值");
const 引力阈值 = 阈值位置 >= 0 ? Number(参数[阈值位置 + 1]) : undefined;
const 仅图 = 参数.includes("--仅图");
const 输出JSON = 参数.includes("--JSON");

try {
  const CSV文本 = readFileSync(resolve(process.cwd(), 文件), "utf8");
  const 仪 = new 数据引力仪({
    引力阈值: Number.isFinite(引力阈值) ? 引力阈值 : undefined,
  });
  const 结果 = 仪.完整分析(CSV文本);
  if (输出JSON) {
    console.log(JSON.stringify(结果, null, 2));
  } else {
    console.log(结果.关系图);
    if (!仅图) {
      console.log("");
      console.log(结果.解读);
    }
  }
} catch (错误) {
  console.error(`引力仪出错: ${错误.message}`);
  process.exit(1);
}

export { 数据引力仪 };