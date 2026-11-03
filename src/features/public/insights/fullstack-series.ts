import type { DevelopmentInsight } from './catalog';
const article01 = () => import('./articles/fullstack-series/01.md?raw').then(module => module.default);
const article02 = () => import('./articles/fullstack-series/02.md?raw').then(module => module.default);
const article03 = () => import('./articles/fullstack-series/03.md?raw').then(module => module.default);
const article04 = () => import('./articles/fullstack-series/04.md?raw').then(module => module.default);
const article05 = () => import('./articles/fullstack-series/05.md?raw').then(module => module.default);
const article06 = () => import('./articles/fullstack-series/06.md?raw').then(module => module.default);
const article07 = () => import('./articles/fullstack-series/07.md?raw').then(module => module.default);
const article08 = () => import('./articles/fullstack-series/08.md?raw').then(module => module.default);
const article09 = () => import('./articles/fullstack-series/09.md?raw').then(module => module.default);
const article10 = () => import('./articles/fullstack-series/10.md?raw').then(module => module.default);
const article11 = () => import('./articles/fullstack-series/11.md?raw').then(module => module.default);
const article12 = () => import('./articles/fullstack-series/12.md?raw').then(module => module.default);
const article13 = () => import('./articles/fullstack-series/13.md?raw').then(module => module.default);
const article14 = () => import('./articles/fullstack-series/14.md?raw').then(module => module.default);
const article15 = () => import('./articles/fullstack-series/15.md?raw').then(module => module.default);
const article16 = () => import('./articles/fullstack-series/16.md?raw').then(module => module.default);
const article17 = () => import('./articles/fullstack-series/17.md?raw').then(module => module.default);
const article18 = () => import('./articles/fullstack-series/18.md?raw').then(module => module.default);
const article19 = () => import('./articles/fullstack-series/19.md?raw').then(module => module.default);
const article20 = () => import('./articles/fullstack-series/20.md?raw').then(module => module.default);
const article21 = () => import('./articles/fullstack-series/21.md?raw').then(module => module.default);
const article22 = () => import('./articles/fullstack-series/22.md?raw').then(module => module.default);
const article23 = () => import('./articles/fullstack-series/23.md?raw').then(module => module.default);
const article24 = () => import('./articles/fullstack-series/24.md?raw').then(module => module.default);
const article25 = () => import('./articles/fullstack-series/25.md?raw').then(module => module.default);
const article26 = () => import('./articles/fullstack-series/26.md?raw').then(module => module.default);
const article27 = () => import('./articles/fullstack-series/27.md?raw').then(module => module.default);
const article28 = () => import('./articles/fullstack-series/28.md?raw').then(module => module.default);
const article29 = () => import('./articles/fullstack-series/29.md?raw').then(module => module.default);
const article30 = () => import('./articles/fullstack-series/30.md?raw').then(module => module.default);
const article31 = () => import('./articles/fullstack-series/31.md?raw').then(module => module.default);
const article32 = () => import('./articles/fullstack-series/32.md?raw').then(module => module.default);

type ArticleMetadata = Pick<DevelopmentInsight, 'slug' | 'title' | 'summary' | 'category'> & { order: number };

function fromArticle(loadMarkdown: () => Promise<string>, metadata: ArticleMetadata): DevelopmentInsight {
  const { order, ...entry } = metadata;
  return {
    ...entry,
    publishedAt: '2026-11-03',
    series: { name: '全栈 AI 开发手记', order },
    articleType: 'scenario',
    loadMarkdown: async () => {
      const lines = (await loadMarkdown()).replace(/\r\n?/g, '\n').trim().split('\n');
      const title = lines.shift()?.replace(/^#\s+/, '').trim();
      if (title !== metadata.title) throw new Error(`全栈 AI 开发手记第 ${order} 篇标题与目录不一致`);
      return lines.join('\n').trim();
    },
    sections: []
  };
}

export const fullstackSeries: DevelopmentInsight[] = [
  fromArticle(article01, {"order": 1, "slug": "fullstack-ai-from-demo-to-product", "title": "从聊天演示到可用产品：全栈 AI 开发要补上哪些环节", "summary": "以企业知识助手为例，梳理全栈 AI 开发中的需求、数据、检索、权限、评估与部署。说明接通模型之后还要完成什么，并给出从小项目开始学习的路径，避免把能演示误认为能交付。", "category": "开发工作流"}),
  fromArticle(article02, {"order": 2, "slug": "assigning-and-checking-ai-coding-tasks", "title": "把订单导出交给 AI 之后，工程师还要做什么", "summary": "从一次订单导出任务展开，讨论如何提供项目上下文、复用现有查询、明确权限与验收条件。保留具体任务描述和排查示例，说明 AI 编码中的派活、检查和系统理解各自承担什么作用。", "category": "开发工作流"}),
  fromArticle(article03, {"order": 3, "slug": "ai-coding-attention-and-time", "title": "AI 一直在生成，为什么一天还是不够用", "summary": "从文件上传功能反复调试的场景出发，讨论多窗口、连续尝试与新工具焦虑怎样消耗注意力。介绍记录试验目标和阶段结果的做法，区分有效探索与忙碌感，不把 Token 用量当成工作成果。", "category": "个人思考"}),
  fromArticle(article04, {"order": 4, "slug": "estimating-ai-development-delivery", "title": "AI 半天做出第一版，工期该怎么估", "summary": "借知识助手的演示与真实资料测试之间的落差，拆解需求、数据、验证和协作如何影响工期。说明演示、试用与正式交付的不同标准，并讨论如何通过小范围验证更新估算，而非承诺固定提效倍数。", "category": "开发工作流"}),
  fromArticle(article05, {"order": 5, "slug": "deploying-a-fullstack-ai-application", "title": "本地能跑之后：一个 AI 应用还要怎样部署", "summary": "沿着浏览器、后端、存储、检索和模型服务的请求链路，解释环境变量、localhost、流式连接与数据持久化等常见问题。给出最小部署路径，强调从用户操作验证上线结果，并区分 API 与自部署模型。", "category": "工具使用"}),
  fromArticle(article06, {"order": 6, "slug": "ai-across-the-development-workflow", "title": "每个流程都有 AI，项目就能交付得更好吗", "summary": "通过需求整理、代码审查和项目汇报中的情景，讨论全流程使用 AI 时容易漏掉的业务确认与有效验证。提供按任务清晰度、可检查性和出错影响分配工作的思路，衡量 AI 是否推动了可用结果。", "category": "开发工作流"}),
  fromArticle(article07, {"order": 7, "slug": "why-token-rankings-mislead", "title": "用 Token 排名考核开发，会鼓励什么行为", "summary": "围绕一份虚构的 Token 排行榜，分析把工具消耗量绑定个人奖惩可能带来的行为变化。区分使用量、成本与工作成果，讨论需求沟通等难以量化的劳动，以及如何用具体任务记录改善团队讨论。", "category": "个人思考"}),
  fromArticle(article08, {"order": 8, "slug": "domain-experts-building-with-ai", "title": "当懂业务的人开始用 AI 做工具，工程师能帮什么", "summary": "从保安老陈制作排班页面的故事出发，讨论 AI 降低动手门槛后，业务经验和工程能力如何配合。保留换班确认、日期计算和多人协作的例子，既承认工作内容可能变化，也说明原型走向团队使用的要求。", "category": "个人思考"}),
  fromArticle(article09, {"order": 9, "slug": "ai-weekly-reports-without-losing-facts", "title": "周报扩到两千字再缩回两百字，信息丢在哪里", "summary": "借员工扩写、负责人摘要的周报场景，分析成果夸大和限制条件丢失怎样影响协作。给出保留完成状态、验证范围、阻碍与协调事项的写法，让 AI 帮忙整理真实记录，并说明复杂背景何时值得展开。", "category": "工具使用"}),
  fromArticle(article10, {"order": 10, "slug": "comparing-ai-subscription-bills", "title": "两份 AI 工具账单，为什么不能只比价格", "summary": "以文中假设的 760 元和 690 元账单为线索，说明比较订阅前要核对方案、周期、币种和实际权益。区分个人订阅、API 与组织席位，讨论账号和公司采购边界；示例金额不代表当前官方价格或购买建议。", "category": "工具使用"}),
  fromArticle(article11, {"order": 11, "slug": "evaluate-coding-tools-on-real-tasks", "title": "选 AI 编程工具，先把比较条件说清楚", "summary": "从一次关于模型选择的争论出发，区分模型能力与编程工具、上下文和执行环境。提供在同一项目版本上比较真实任务的方法，兼顾权限、返工、时间和费用，不用单次体验或产地标签推断所有模型。", "category": "工具使用"}),
  fromArticle(article12, {"order": 12, "slug": "useful-records-for-ai-development", "title": "AI 开发要留什么记录，才能方便排查和接手", "summary": "从找不到权限修复依据的情景出发，讨论任务、代码变更、验证结果与运行版本怎样构成有用记录。区分开发记录和应用运行日志，说明完整聊天未必有助于接手，并保留敏感信息与保存范围的边界。", "category": "开发工作流"}),
  fromArticle(article13, {"order": 13, "slug": "sketches-and-ai-prototypes", "title": "手画草图与 AI 原型，各自帮团队确认什么", "summary": "借知识库原型的两种做法，讨论草图表达意图、交互原型发现使用障碍各自的价值。保留上传状态、资料选择和真实数据接入的例子，说明怎样标注模拟功能，以及何时可以沿用已确认的原型继续开发。", "category": "开发工作流"}),
  fromArticle(article14, {"order": 14, "slug": "before-upgrading-ai-coding-quotas", "title": "升级 AI 编程额度前，先看任务卡在哪里", "summary": "以文中假设的 3700 元支出和“50x”标签，讨论高额度、并行任务与个人注意力之间的关系。区分额度和工作效率，结合任务、预算及费用归属判断是否升级；金额与倍率均不构成当前官方方案说明。", "category": "个人思考"}),
  fromArticle(article15, {"order": 15, "slug": "ai-project-acceptance-in-five-days", "title": "五天交付一个 AI 项目，先把验收说清楚", "summary": "通过一个假设金额为 25 万元、要求五天验收的知识管理项目，说明合同金额和页面生成速度都不能直接决定工期。沿真实资料、权限、接口与复测展开，讨论如何呈现进度并如实处理未通过的验收项。", "category": "项目复盘"}),
  fromArticle(article16, {"order": 16, "slug": "keeping-ai-prototypes-faithful-to-references", "title": "AI 原型很好看，为什么还是偏离了参考稿", "summary": "从待办工作台被生成成数据展示页的情景出发，分析布局、字段、交互和业务目标怎样在生成中走偏。给出限定修改范围、补充截图外操作、保留已确认内容的方法，并区分交互演示与真实保存。", "category": "开发工作流"}),
  fromArticle(article17, {"order": 17, "slug": "debug-ai-code-with-evidence", "title": "AI 一直在修，问题为什么越来越多？", "summary": "上传成功却检索不到文档，连续修改上传、解析和检索逻辑，仍可能错过真正的配置问题。从一次调试情景出发，讨论如何区分事实与假设、确认运行环境，并回到原来的失败路径验证修复。", "category": "开发工作流"}),
  fromArticle(article18, {"order": 18, "slug": "design-ai-interfaces-for-real-work", "title": "AI 生成的界面，怎样才能贴近真实业务？", "summary": "中英文混杂、首页大卡片、藏得很深的常用操作，都可能来自缺少业务上下文。以订单工作台为例，讨论如何提供用户任务、已确认原型和接近实际的数据，让界面改进有明确依据。", "category": "工具使用"}),
  fromArticle(article19, {"order": 19, "slug": "verify-real-results-beyond-passing-tests", "title": "页面提示成功，数据真的保存了吗？", "summary": "客户记录刷新后还在，却只保存在当前浏览器里。这个情景揭示局部验收与真实业务之间的空隙，也讨论模拟数据、修改测试和虚假成功提示的边界，以及如何用实际结果确认功能完成。", "category": "开发工作流"}),
  fromArticle(article20, {"order": 20, "slug": "keep-ai-agent-collaboration-practical", "title": "给 AI 安排两层领导之后，筛选功能还没开始做", "summary": "一个文件状态筛选，在多层 AI 角色之间变成方案、审批和传话。讨论角色设置如何增加协调负担，什么时候值得分工，以及如何用清楚的执行范围与必要验证，让协作回到交付。", "category": "开发工作流"}),
  fromArticle(article21, {"order": 21, "slug": "learn-from-an-ai-prototype-that-users-prefer", "title": "当产品经理的 AI 原型，比工程版本更受欢迎", "summary": "以“十三天与一个下午”的情景对照，讨论界面、业务理解和工程实现如何共同影响产品判断。演示不能证明完整交付，但可操作的原型也有真实价值；下一步是复用两边成果、接通并验证流程。", "category": "项目复盘"}),
  fromArticle(article22, {"order": 22, "slug": "connect-modules-into-a-usable-system", "title": "页面越来越多，复杂系统为什么还是接不起来？", "summary": "多个目录、不同字段和一连串“已完成”，可能掩盖尚未连通的业务流程。以客户、录入、审核和导出为例，讨论如何定位现有入口、收拢已有成果，并逐段验证系统关系，继续完成全部约定范围。", "category": "项目复盘"}),
  fromArticle(article23, {"order": 23, "slug": "turn-ai-access-into-your-own-understanding", "title": "AI 降低了知识门槛，理解为什么还需要自己建立？", "summary": "AI 让跨领域提问和动手实践更容易，但能做出功能、理解功能和承担交付责任，仍需要分别判断。通过数据保存与产品协作的情景，讨论如何边用边学，也保留时间、资源和经验差异的现实边界。", "category": "个人思考"}),
  fromArticle(article24, {"order": 24, "slug": "keep-your-judgment-when-coding-with-ai", "title": "当 AI 替我想得越来越多，我还理解自己的项目吗？", "summary": "把任务交给 AI 能节省时间，也可能让开发者逐渐只看总结、转发消息。围绕数据保存与权限规则，讨论如何保留关键判断、用追问和实际操作建立理解，同时承认交付压力与学习时间的限制。", "category": "个人思考"}),
  fromArticle(article25, {"order": 25, "slug": "decide-the-system-connections-before-building", "title": "开始大范围开发前，先弄清系统怎样连接", "summary": "架构可以从几个具体问题开始：入口在哪里，数据怎样保存，状态由谁维护，部署如何连接。讨论如何沿用现有项目，先明确关键关系并验证完整流程，同时避免过度设计和把规则变成新的负担。", "category": "开发工作流"}),
  fromArticle(article26, {"order": 26, "slug": "model-business-facts-in-the-database", "title": "商品调价后，历史订单为什么也变了？", "summary": "数据能保存，不代表保存方式符合业务要求。以历史成交价、客户编号和审核记录为例，讨论数据库设计如何表达关系与历史事实，以及调整已有结构时，为什么必须考虑旧数据和实际流程。", "category": "开发工作流"}),
  fromArticle(article27, {"order": 27, "slug": "make-performance-part-of-product-delivery", "title": "功能都能跑，产品为什么还是用不顺？", "summary": "页面慢、解析没有进度、问答等待太久，会让已经存在的功能难以使用。讨论如何沿用户路径测量瓶颈、改善状态反馈，并分清流式输出与总耗时；必要性能与约定功能都属于交付的一部分。", "category": "开发工作流"}),
  fromArticle(article28, {"order": 28, "slug": "give-ai-the-full-goal-and-clear-boundaries", "title": "整份需求可以交给 AI，完成标准也要一起交代", "summary": "完整需求有助于 AI 理解全局，却不能自动消除遗漏规则、模拟页面和模块衔接问题。讨论如何交代现有项目、原型和数据边界，让 AI 连续推进，并区分核心流程跑通与全部需求完成。", "category": "开发工作流"}),
  fromArticle(article29, {"order": 29, "slug": "build-skills-from-recurring-project-problems", "title": "把反复提醒 AI 的几句话，整理成自己的 Skill", "summary": "有用的 Skill 往往来自反复遇到的具体问题，例如原型被改、模拟数据未说明、验证范围不清。讨论如何把经验写成简短说明，在真实任务中试用和调整，并识别复制他人流程带来的依赖与负担。", "category": "工具使用"}),
  fromArticle(article30, {"order": 30, "slug": "parallelize-ai-tasks-with-clear-ownership", "title": "不用守着一个对话，也别让多个 AI 抢同一份代码", "summary": "并行可以减少独立任务的等待，也可能放大文件、数据库和上下文冲突。通过客户列表、订单与导出的情景，讨论如何判断任务依赖、划清修改范围，并把各自结果整合回同一套系统验证。", "category": "开发工作流"}),
  fromArticle(article31, {"order": 31, "slug": "set-codex-goals-for-continuous-work", "title": "用 /goal 交代结果，少说几次“继续”", "summary": "持续目标适合需要反复排查、修改和验证的任务，但需要清楚的完成依据和运行条件。以文档解析故障为例，讨论如何写目标、保留权限与预算边界，并为下一次审查实际结果做好准备。", "category": "工具使用"}),
  fromArticle(article32, {"order": 32, "slug": "review-codex-goal-results-and-test-evidence", "title": "续篇：/goal 跑完以后，先看看哪些测试没跑", "summary": "承接上一篇的测试排查任务：报告一片绿色，却有测试被跳过。讨论如何分别审查已验证、仍失败和未运行的结果，怎样写清目标与边界，以及任务受环境、预算或外部条件限制时，什么仍算有用的成果。", "category": "工具使用"})
];
