import { foundations } from './foundations';
import { models } from './models';
import { practice } from './practice';
import type { Course, CourseArticle } from './types';

export const courseGroups = [
  { id: 'start', name: '从生活认识 AI', note: '从手机助手到语言模型，先建立直觉。' },
  { id: 'networks', name: '神经网络时代', note: '看看模型怎样记住上下文、表示词语。' },
  { id: 'transformer', name: 'Transformer 时代', note: '理解注意力，以及理解和生成的不同分工。' },
  { id: 'training', name: '模型与训练方法', note: '模型怎样学习、压缩，又如何稳定地训练。' },
  { id: 'products', name: '模型与产品的来路', note: '按历史脉络认识常见模型和 AI 产品。' },
  { id: 'reliability', name: '使用、推理与核验', note: '学会提问，也学会检查 AI 的回答。' },
  { id: 'agents', name: 'Skills 与开发工作流', note: '从对话走向工具、分工和可验证的任务。' },
  { id: 'practice', name: '工具与项目实践', note: '把课程中的理解用到一个具体问题上。' }
];

const slugs = [
  'ai-is-not-mysterious', 'nlp', 'language-models', 'ai-history', 'n-gram',
  'rnn', 'brnn', 'lstm', 'embeddings', 'pretraining',
  'transformer', 'encoder-decoder', 'bert', 'bert-family', 't5-bart-glm',
  'gan', 'palm-llama', 'switch-transformer', 'distillation', 'gradients',
  'openai-chatgpt', 'gpt-history', 'codex', 'ernie', 'deepseek',
  'reasoning', 'few-shot', 'prompt-rlhf', 'multimodal', 'hallucinations',
  'fact-checking', 'data-silos', 'skills', 'agents', 'multi-agent',
  'screenshots', 'coding-workflow', 'env-secrets', 'image-recognition',
  'archive-backup', 'costs', 'tutorials', 'scripts', 'ai-for-everyone',
  'creator', 'mars-3d', 'ai-interview', 'mac-screensavers'
];
const groupIndexes = [0,0,0,0,0, 1,1,1,1,1, 2,2,2,2,2, 3,3,3,3,3, 4,4,4,4,4, 5,5,5,5,5, 5,5,6,6,6,6,6,6,6, 7,7,7,7,7,7,7,7,7];

export function articleText(article: CourseArticle): string {
  return [article.summary, article.goal, ...article.story,
    ...article.sections.flatMap(s => [s.heading, ...s.paragraphs]),
    article.example.title, article.example.text, ...article.pitfalls,
    ...article.glossary.flatMap(g => [g.term, g.meaning]), article.takeaway,
    article.question.prompt, article.question.answer].join('\n');
}
export const courses: Course[] = [...foundations, ...models, ...practice].map((article, index) => {
  const group = courseGroups[groupIndexes[index]];
  const characters = Array.from(articleText(article).replace(/\s/g, '')).length;
  return { ...article, slug: slugs[index], number: index + 1, group: group.name, groupId: group.id,
    minutes: Math.max(1, Math.ceil(characters / 420)), characters };
});
export const courseHref = (course: Pick<Course, 'slug'>) => `/learning/${course.slug}`;
export const displayTitle = (course: Course) => course.slug === 'ai-is-not-mysterious' ? 'AI 并不神秘' : course.title;
export function findCourse(value: string) {
  return courses.find(c => c.slug === value || c.title === value || displayTitle(c) === value);
}
export function searchCourses(query: string, groupId = 'all'): Course[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return courses.filter(c => (groupId === 'all' || c.groupId === groupId)
    && terms.every(term => `${c.title} ${displayTitle(c)} ${c.group} ${articleText(c)}`.toLocaleLowerCase().includes(term)));
}
