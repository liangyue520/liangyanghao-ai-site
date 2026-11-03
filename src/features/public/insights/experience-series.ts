import type { DevelopmentInsight } from './catalog';
import article01 from './articles/experience-series/01_从使用AI到判断结果.md?raw';
import article02 from './articles/experience-series/02_需求与原型.md?raw';
import article03 from './articles/experience-series/03_旧系统改造.md?raw';
import article04 from './articles/experience-series/04_先跑通最小仿真.md?raw';
import article05 from './articles/experience-series/05_逐项操作验证.md?raw';
import article06 from './articles/experience-series/06_追问分布式架构.md?raw';
import article07 from './articles/experience-series/07_数据导入与审核.md?raw';
import article08 from './articles/experience-series/08_知识图谱与问答.md?raw';
import article09 from './articles/experience-series/09_多智能体与集成.md?raw';
import article10 from './articles/experience-series/10_AI应用设计思考.md?raw';
import article11 from './articles/experience-series/11_时间成本与成长.md?raw';

type InsightMetadata = Pick<DevelopmentInsight, 'slug' | 'summary' | 'category'>;

// These source articles each contain one title followed by plain Markdown paragraphs.
// Keep their wording and inline Markdown intact for the shared safe inline renderer.
function fromOriginal(markdown: string, metadata: InsightMetadata, order: number): DevelopmentInsight {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const title = lines.shift()?.match(/^#\s+(.+?)\s*$/)?.[1];
  if (!title) throw new Error(`AI 项目实践系列第 ${order} 篇缺少一级标题`);

  const body = lines.join('\n').trim();
  const introduction = body ? body.split(/\n[\t ]*\n+/) : [];
  return {
    ...metadata,
    title,
    publishedAt: '2026-11-02',
    series: { name: 'AI 项目实践系列', order },
    introduction,
    sections: []
  };
}

export const experienceSeries: DevelopmentInsight[] = [
  fromOriginal(article01, {
    slug: 'judging-ai-development-results',
    summary: '从 DeepSeek 和 Codex 参与项目的经历出发，思考开发者如何判断需求、数据流程与验证结果，并继续保持代码理解能力。',
    category: '个人思考'
  }, 1),
  fromOriginal(article02, {
    slug: 'requirements-before-screens',
    summary: '结合信息管理与三维客户端实践，说明为什么要先梳理需求、数据去向和已有能力，再按实际业务推进界面与功能。',
    category: '开发工作流'
  }, 2),
  fromOriginal(article03, {
    slug: 'five-days-with-a-legacy-system',
    summary: '回顾约五天的科研经费系统维护：核对计算规则、模板下载与空输入边界，并用模拟数据准备验证和演示。',
    category: '项目复盘'
  }, 3),
  fromOriginal(article04, {
    slug: 'a-minimal-simulation-first',
    summary: '从最小想定运行、轨迹展示到实时联调，记录如何先验证一条具体业务链路，再逐步扩展仿真平台。',
    category: '项目复盘'
  }, 4),
  fromOriginal(article05, {
    slug: 'verify-features-by-using-them',
    summary: '以三维客户端的实际检查为例，记录如何从用户操作发现问题、反馈修改，并说明人工验证的覆盖边界。',
    category: '开发工作流'
  }, 5),
  fromOriginal(article06, {
    slug: 'testing-distributed-architecture',
    summary: '把架构疑问变成同机多进程原型验证，追查实体状态、消息消费和部分异常场景，区分原型结果与真实多机能力。',
    category: '项目复盘'
  }, 6),
  fromOriginal(article07, {
    slug: 'data-import-and-approval',
    summary: '区分数据上传、待审核与正式生效，沿着批次、冲突、审批和展示路径检查导入流程。',
    category: '开发工作流'
  }, 7),
  fromOriginal(article08, {
    slug: 'understanding-knowledge-graphs-and-qa',
    summary: '结合信息管理项目，区分知识图谱、信息抽取和问答的任务，并关注数据来源、实际实现与版本边界。',
    category: '项目复盘'
  }, 8),
  fromOriginal(article09, {
    slug: 'integrating-multi-agent-development',
    summary: '记录多智能体开发中的文件冲突、模块脱节与监督消耗，思考如何按需分工并集中负责集成与验证。',
    category: '开发工作流'
  }, 9),
  fromOriginal(article10, {
    slug: 'designing-an-ai-task-assistant',
    summary: '围绕 AI 任务助手整理模型调用、结构化输出、降级、历史记录与评估等设计思考，明确方案和实现的区别。',
    category: '个人思考'
  }, 10),
  fromOriginal(article11, {
    slug: 'estimating-ai-development-time-and-cost',
    summary: '重新估算 AI 开发中的等待、沟通、返工、集成与验证成本，思考如何识别进展并积累可参考的实践记录。',
    category: '个人思考'
  }, 11)
];
