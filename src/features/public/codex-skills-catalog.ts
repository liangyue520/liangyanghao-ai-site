export type CodexSkillGroup = {
  title: string;
  description: string;
  skills: string[];
  download: string;
  filename: string;
};

// The two downloadable bundles contain the personal Skills shown in the user's screenshot.
export const codexSkillGroups: CodexSkillGroup[] = [
  {
    title: '小说创作与审稿',
    description: '第一人称悬疑探险写作、章节审查、人物、逻辑、节奏与信息揭示。',
    skills: ['author-first-person-fiction', 'r01-author-feedback', 'novel-boring-detect', 'novel-chapter-state', 'novel-character-check', 'novel-character-voice', 'novel-concept-check', 'novel-logic-review', 'novel-opening-check', 'novel-quality-check', 'novel-reader-review', 'novel-reveal-control', 'novel-scene-director'],
    download: '/downloads/ai-skills/novel-writing-review-skills.zip',
    filename: '小说创作与审稿-Skills.zip'
  },
  {
    title: '通用工作辅助',
    description: '表达精简、上下文压缩、长任务恢复、多智能体协作和执行时限管理。',
    skills: ['caveman', 'context-compressor', 'gobstopper', 'multi-agent-dev-sop', 'three-minute-stop'],
    download: '/downloads/ai-skills/general-work-assistant-skills.zip',
    filename: '通用工作辅助-Skills.zip'
  }
];

export const codexSkillCount = codexSkillGroups.reduce((count, group) => count + group.skills.length, 0);
