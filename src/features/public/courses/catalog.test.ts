import test from 'node:test';
import assert from 'node:assert/strict';
import { articleText, courses, courseGroups, courseHref, displayTitle, findCourse, searchCourses } from './catalog';

test('every course has substantial, topic-specific content and relevant reading links', () => {
  assert.equal(courses.length, 48);
  const paragraphs = new Map<string, string>();
  for (const course of courses) {
    const chinese = (articleText(course).match(/[\u3400-\u9fff]/g) || []).length;
    assert.ok(chinese >= 700, `${course.title}: only ${chinese} Chinese characters`);
    assert.ok(course.sections.length >= 3, `${course.title}: sections missing`);
    assert.ok(course.sources.length, `${course.title}: sources missing`);
    assert.ok(course.glossary.length >= 2, `${course.title}: glossary missing`);
    assert.ok(course.pitfalls.length >= 2, `${course.title}: pitfalls missing`);
    assert.ok(course.question.answer.length >= 20, `${course.title}: answer missing`);
    for (const source of course.sources) assert.equal(new URL(source.url).protocol, 'https:');
    for (const section of course.sections) for (const paragraph of section.paragraphs) {
      if (paragraph.length < 50) continue;
      assert.ok(!paragraphs.has(paragraph), `${course.title}: reused paragraph from ${paragraphs.get(paragraph)}`);
      paragraphs.set(paragraph, course.title);
    }
    assert.doesNotMatch(articleText(course), /这是“.*”主题的入门说明|先把它想成一个可以拆开观察的工具箱|后续会继续补充/);
  }
});

test('lesson sequence, identifiers and legacy title lookups are unambiguous', () => {
  assert.equal(new Set(courses.map(c => c.slug)).size, courses.length);
  assert.equal(new Set(courses.map(c => c.title)).size, courses.length);
  assert.equal(findCourse('nlp')?.number, 2);
  assert.equal(findCourse('language-models')?.number, 3);
  assert.equal(courseHref(findCourse('AI 并不神秘')!), '/learning/ai-is-not-mysterious');
  assert.equal(courseHref(findCourse('NLP 是什么？')!), '/learning/nlp');
  assert.equal(displayTitle(courses[0]), 'AI 并不神秘');
  for (const [index, c] of courses.entries()) {
    assert.equal(c.number, index + 1);
    assert.match(c.slug, /^[a-z][a-z0-9-]+$/);
    assert.ok(courseGroups.some(g => g.id === c.groupId));
    assert.ok(c.minutes >= 2 && c.minutes <= 6, `${c.title}: unexpected duration ${c.minutes}`);
    for (const related of c.related) assert.ok(findCourse(related), `${c.title}: broken related link ${related}`);
  }
});

test('search and stage filters work with real lesson content', () => {
  assert.ok(searchCourses('nlp').some(c => c.slug === 'nlp'));
  assert.ok(searchCourses('agent').some(c => c.slug === 'agents'));
  assert.ok(searchCourses('语言模型').some(c => c.slug === 'language-models'));
  assert.ok(searchCourses('提示词').some(c => c.slug === 'prompt-rlhf'));
  assert.ok(searchCourses('豆包').some(c => c.slug === 'fact-checking'));
  assert.deepEqual(searchCourses('一个不存在的主题b2c7'), []);
  for (const group of courseGroups) {
    const matches=searchCourses('', group.id);
    assert.ok(matches.length > 0);
    assert.ok(matches.every(c => c.groupId === group.id));
  }
  assert.equal(searchCourses('   ').length, courses.length);
});
