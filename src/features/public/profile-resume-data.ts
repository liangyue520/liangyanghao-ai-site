export type ResumeTimelineItem = {
  title: string;
  period: string;
  subtitle: string;
  description: string;
};

export type ResumeTimelineSection = {
  title: string;
  note: string;
  items: ResumeTimelineItem[];
};

export type ResumeSkillGroup = {
  title: string;
  tags: string[];
  description?: string;
};

export type ResumeProjectCard = {
  title: string;
  description: string;
  href: string;
  tags: string[];
  status: string;
  period?: string;
  outcome?: string;
  caveat?: string;
};

export type ResumeCertificateCard = {
  title: string;
  year: string;
  issuer: string;
  description: string;
  image: string;
  alt: string;
};

export type ResumeSocialLink = {
  name: string;
  href: string;
  followers?: string;
  followerCount?: number;
  description: string;
  action?: string;
};

export const resumeSocialLinks: ResumeSocialLink[] = [
  { name: 'CSDN', href: 'https://blog.csdn.net/weixin_44317873', followers: '约 1.1 万粉丝', followerCount: 11000, description: '技术文章与开发记录' },
  { name: '知乎', href: 'https://www.zhihu.com/people/liang-yue-6-70', followers: '约 1 千粉丝', followerCount: 1000, description: '观点分享与问题交流' },
  { name: '小红书', href: 'https://www.xiaohongshu.com/user/profile/642175a400000000120106ab', followers: '约 1 千粉丝', followerCount: 1000, description: '日常分享与作品动态' },
  { name: '哔哩哔哩', href: 'https://space.bilibili.com/392301580', followers: '43 位粉丝', followerCount: 43, description: '视频与动态分享' },
  { name: '抖音', href: 'https://www.douyin.com/user/MS4wLjABAAAAsrtnwBas7-tiq-ZJ1UrFFvfgAsMN9DpE2yqJmTPZ0F4', followers: '24 位粉丝', followerCount: 24, description: '短视频与日常分享' },
  { name: 'GitHub', href: 'https://github.com/liangyue520', followerCount: 0, description: '代码仓库与项目记录', action: '查看代码主页' },
  { name: '微信公众号', href: 'https://mp.weixin.qq.com/s/QQEzmxb9fgm-UkZtAWFugQ', description: '公众号文章与分享', action: '阅读公众号文章' }
];

export const resumeIntroduction = {
  role: 'AI 应用开发工程师，以 C++ 工程经验为底座。',
  lead: '我有 6 年 C++ 开发经验，做过工业视觉、Qt 桌面应用、跨平台仿真和三维可视化。现在，我把这些工程经验与 AI 辅助开发结合，推进 Web 应用、仿真客户端和存量系统改造。',
  description: '日常使用 DeepSeek 辅助需求与方案分析，使用 Codex 进行设计、编码和调试。我会把技术要求拆成具体任务，用项目规则约束开发，再亲自操作、验收和修复问题。我也是 CSDN C++ 领域博主，希望把实践中学到的方法讲清楚、分享出来。',
  directions: ['Codex · DeepSeek', 'C++ / Qt · 三维可视化', 'Web 应用 · 工程交付'],
  highlights: [
    { value: '6 年', label: 'C++ 开发经验' },
    { value: '100 余种', label: '仿真模型重构与迁移' },
    { value: '95 余份', label: '技术文档编写' }
  ]
};

export const resumeTimelineSections: ResumeTimelineSection[] = [
  {
    title: '公开学习经历',
    note: '工程学习、实验室实践与持续学习。',
    items: [
      {
        title: '湖南工程学院',
        period: '2016—2020',
        subtitle: '测控技术与仪器 · 本科',
        description: '在视觉实验室协助收集、整理科研申报参考文献；在机器人实验室负责竞赛项目策划和商业计划书，团队获得“互联网+”创新创业大赛三等奖。'
      },
      {
        title: 'AI 辅助开发与工程实践',
        period: '持续学习',
        subtitle: '需求拆解、开发规范、人工验收与方法沉淀',
        description: '结合已有 C++ 工程经验，持续实践 DeepSeek、Codex、Markdown 需求文档和 AGENTS 项目规则，把开发、调试、功能验收与问题修复连成完整工作流程。'
      }
    ]
  },
  {
    title: '公开工作经历',
    note: '保留职责、技术方向和已完成的阶段成果。',
    items: [
      {
        title: 'AI 应用开发与工程交付',
        period: '2026.08—至今',
        subtitle: 'AI 应用开发工程师 · Web 应用与 C++ / Qt 客户端',
        description: '负责信息管理、科研经费管理及仿真平台的需求梳理、方案设计、开发与交付整理。使用 DeepSeek 辅助分析、Codex 辅助开发，实践 Vue、Spring Boot、MySQL、Redis 及 C++、Qt、Cesium 技术栈，并按实际操作流程开展功能验收。'
      },
      {
        title: '仿真模型开发与国产化迁移',
        period: '2023.02—2026.06',
        subtitle: 'C/C++ 开发 · 模型负责人、需求对接与项目协同',
        description: '主导 C++ 仿真模型开发，完成 100 余种模型的国产化重构和 Windows / Linux 迁移适配，处理字节对齐、序列化和异构数据交互问题；承担需求拆解、联调、培训和技术文档工作，参与统筹我方及外协近 40 人协作，两获甲方书面表彰。'
      },
      {
        title: '工业视觉上位机软件开发',
        period: '2021.05—2023.01',
        subtitle: 'C/C++ 开发 · Qt、工业相机与设备通信',
        description: '基于 Qt 独立承接软件界面、功能、调试与部署，使用 SQLite3 管理本地数据，接入工业相机 SDK，开发 TCP/IP、Modbus 及工业总线通信，打通采集、界面、通信和数据库流程。'
      },
      {
        title: '机器视觉检测系统开发',
        period: '2020.06—2021.04',
        subtitle: '机器视觉工程师 · C#、VisionPro、Halcon',
        description: '参与工业相机、镜头和光源选型与打光，开发视觉框架及 RS232 / TCP 通信应用，与 PLC 联动触发拍照取像，完成点胶机视觉调试和现场交付。'
      }
    ]
  }
];

export const resumeSkillGroups: ResumeSkillGroup[] = [
  {
    title: 'AI 辅助开发与验收',
    tags: ['DeepSeek', 'Codex', 'Markdown', 'AGENTS', '人工验收'],
    description: '从需求分析、最小任务拆解到设计、编码和调试，结合项目规则约束实现方式，亲自检查交互、记录问题并推动修复。'
  },
  {
    title: '离线识别与知识服务',
    tags: ['离线 OCR', '规则抽取', '结构化校验', '模板问答', '知识图谱'],
    description: '集成离线识别组件，组织字段抽取、冲突提示、数据存储、来源追溯与知识查询展示流程。'
  },
  {
    title: 'Web 全栈应用',
    tags: ['Vue', 'Spring Boot', 'MySQL', 'Redis', '接口联调'],
    description: '结合 AI 辅助完成数据库设计、前后端开发、接口对接、调试和部署，实践信息管理与仿真平台等应用。'
  },
  {
    title: 'C++ 与 Qt 桌面开发',
    tags: ['C++11/14', 'Qt Designer', 'Qt WebEngine', 'QWebChannel', '动态库封装'],
    description: '具备 6 年 C++ 开发经验，熟悉面向对象、设计模式与桌面应用开发，能够结合已有工程排查和集成 AI 生成代码。'
  },
  {
    title: '三维可视化与仿真集成',
    tags: ['Cesium', 'OSG / osgEarth', 'AFSIM', '想定 JSON', '轨迹回放'],
    description: '实践三维地图、仿真引擎进程集成、想定格式转换、实时态势、运行记录和回放；开展过同机多进程及有限恢复机制验证。'
  },
  {
    title: '跨平台、构建与脚本',
    tags: ['Windows / Linux', 'CMake', 'GCC / 麒麟', 'Python / Shell', 'Protobuf'],
    description: '处理跨平台迁移、编译打包、静态与动态库管理、字节对齐及序列化；具备将 MATLAB / Python 算法改写并封装为 C++ 动态库的经验。'
  },
  {
    title: '版本管理与部署排障',
    tags: ['Git 多分支', 'Nacos', 'Kafka', 'Nginx', '达梦适配'],
    description: '具备模块责任划分、集成管理、现场组件部署与异常排查经验，结合业务环境处理依赖、服务启停和兼容性问题。'
  },
  {
    title: '工业视觉与多线程通信',
    tags: ['相机 SDK', 'Halcon / OpenCV', 'PLC', 'TCP/IP / Modbus', 'SQLite3'],
    description: '实践采集、算法与界面线程分离及同步保护，接入工业相机和设备通信，将图像处理、结果展示与现场操作流程连通。'
  },
  {
    title: '技术文档与项目协同',
    tags: ['需求对接', '任务拆解', '联调交付', 'GJB438C', '培训与复盘'],
    description: '具备近 40 人内外协作统筹经验，编写建设方案至验收阶段技术文档 95 余份，重视操作体验、问题闭环与成果交接。'
  }
];

export const resumeProjectCards: ResumeProjectCard[] = [
  {
    title: '卫星信息管理系统',
    period: '2026.08—至今',
    description: '基于 Vue、Spring Boot、MySQL、Redis，负责需求梳理、前后端开发与数据处理，支持数据增删改查、修改留痕、二三维展示及轨道计算。',
    outcome: '完成约 2 万条卫星相关数据的管理与展示，以及离线识别、规则抽取、模板问答和知识图谱等主要功能；完成领导演示并整理可运行项目副本。',
    href: '/resources',
    tags: ['全栈开发', '离线识别', '知识图谱'],
    status: '已演示'
  },
  {
    title: '科研经费管理系统维护与改造',
    period: '2026.08—至今',
    description: '接手约 2020 年的存量系统，在既有架构上修复业务与界面问题，完善展示、录入、提交和校准流程。',
    outcome: '约 5 天完成计算规则纠正、下载功能修复、模板补充及模拟测试数据准备；已交付，对方确认所涉功能齐全、可正常演示。',
    href: '/resources',
    tags: ['存量系统', '规则纠正', '功能验证'],
    status: '已交付'
  },
  {
    title: 'B/S 仿真推演平台',
    period: '2026.08—至今',
    description: '基于 Vue、Spring Boot、MySQL、Redis，搭建场景设计、仿真运行、实时态势、裁决、统计、复盘、评估和大样本实验八个模块的主要框架。',
    outcome: '贯通想定 JSON 保存、格式转换、AFSIM 加载运行及记录回放，支持评估报告网页查看和 Word 下载。',
    caveat: '目前为阶段版本：大样本实验仅支持方案新增，批量运行尚未实现，部分业务细节仍待完善。',
    href: '/resources',
    tags: ['AFSIM', '运行回放', '评估报告'],
    status: '阶段版本'
  },
  {
    title: 'C/S 三维仿真客户端',
    period: '2026.08—至今',
    description: '从零搭建 C++、Qt、Cesium 工程，完成想定管理、模型与实例树编辑、拖拽部署、地图图层和气象区域编辑等阶段功能。',
    outcome: '2026 年 10 月 30 日完成首次演示；开展同机多进程通信、业务消息闭环和有限恢复机制验证。',
    caveat: '整体仍在开发中，真实多机网络与目标环境性能尚未验证。',
    href: '/resources',
    tags: ['C++ / Qt', 'Cesium', '场景编辑'],
    status: '开发中 · 已演示'
  },
  {
    title: '地空联合仿真与国产化迁移',
    period: '2024.07—2026.06',
    description: '担任模型开发负责人和需求对接入口，组织任务拆解、联调、培训与技术移交，处理跨平台模型和异构系统数据交互。',
    outcome: '完成 100 余种模型的国产化重构和跨平台迁移适配，参与统筹我方与外协近 40 人协作，按期验收并获两份甲方书面表彰。',
    href: '/resources',
    tags: ['C++', '国产化迁移', '协作交付'],
    status: '已验收'
  },
  {
    title: '综合态势仿真与协同推演',
    period: '2023.10—2024.07',
    description: '负责态势展示、六自由度运动解算、轨道预测和推演相关 C++ 模型开发，承担需求拆解、驻场建模与进度沟通。',
    outcome: '交付仿真软件、模型与配套文档，支持态势展示、推演和效能评估，按期完成验收。',
    href: '/resources',
    tags: ['态势显示', 'C++ 模型', '效能评估'],
    status: '已验收'
  },
  {
    title: '城市级综合仿真与可视化',
    period: '2023.02—2023.10',
    description: '担任现场技术负责人，开展 C++ 组件化建模、三维场景搭建与可视化演示迭代，跟进开发进度和交付验收。',
    outcome: '交付软件与模型体系，支持用户开展仿真设计和验证，完成展会演示与项目验收。',
    href: '/resources',
    tags: ['组件化建模', '三维场景', '现场交付'],
    status: '已验收'
  },
  {
    title: '工业视觉上位机软件',
    period: '2022.05—2023.01',
    description: '基于 Qt、C++ 和 SQLite3，负责工业软件开发、调试与部署，接入工业相机 SDK，开发多线程通信和工业总线协议。',
    outcome: '打通相机采集、Qt 界面、设备通信和本地数据库流程，形成可复用的上位机开发能力。',
    href: '/resources',
    tags: ['Qt', '相机 SDK', '工业通信'],
    status: '已交付'
  },
  {
    title: '机器视觉检测系统',
    period: '2020.06—2021.04',
    description: '基于 C#、VisionPro、Halcon 和视觉组件二次开发，沉淀视觉框架与 RS232 / TCP 通信应用，触发取像并与 PLC 联动。',
    outcome: '完成多台点胶机视觉调试、打光与现场交付，积累设备、图像处理和操作流程协同开发经验。',
    href: '/resources',
    tags: ['C#', '机器视觉', 'PLC 联动'],
    status: '已交付'
  }
];

export const resumeQualifications = ['大学英语四级'];

export const resumeCertificates: ResumeCertificateCard[] = [
  {
    title: '优秀员工',
    year: '2021 年度',
    issuer: '长沙麦晴科技股份有限公司',
    description: '因工作认真、表现优异，被评为 2021 年度优秀员工。',
    image: new URL('./assets/certificates/excellent-employee-2021.webp', import.meta.url).href,
    alt: '2021 年度优秀员工荣誉证书'
  },
  {
    title: '优秀员工',
    year: '2023 年度',
    issuer: '湖南高至科技有限公司',
    description: '因工作认真、表现优异，被评为 2023 年度优秀员工。',
    image: new URL('./assets/certificates/excellent-employee-2023.webp', import.meta.url).href,
    alt: '2023 年度优秀员工荣誉证书'
  },
  {
    title: '优秀员工',
    year: '2024 年度',
    issuer: '湖南高至科技有限公司',
    description: '因踏实肯干、表现优异，被评为 2024 年度优秀员工。',
    image: new URL('./assets/certificates/excellent-employee-2024.webp', import.meta.url).href,
    alt: '2024 年度优秀员工荣誉证书'
  },
  {
    title: '质量先进集体',
    year: '2023 年',
    issuer: '湖南高至科技有限公司',
    description: '所在 203 项目组因工作严谨、表现优异，被评为质量先进集体。',
    image: new URL('./assets/certificates/quality-team-2023.webp', import.meta.url).href,
    alt: '203 项目组质量先进集体荣誉证书'
  }
];

export const resumeCertificateEmpty = {
  title: '证书与荣誉',
  status: '公开展示',
  description: '这里展示站主提供并确认可公开的荣誉证书。'
};
