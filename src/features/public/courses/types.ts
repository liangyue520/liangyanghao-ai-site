export interface CourseArticle {
  title: string;
  summary: string;
  goal: string;
  story: string[];
  sections: { heading: string; paragraphs: string[] }[];
  example: { title: string; text: string };
  pitfalls: string[];
  glossary: { term: string; meaning: string }[];
  takeaway: string;
  question: { prompt: string; answer: string };
  sources: { title: string; url: string }[];
  related: string[];
}
export interface Course extends CourseArticle {
  slug: string;
  number: number;
  group: string;
  groupId: string;
  minutes: number;
  characters: number;
}
