const LESSONS_KEY = 'language_lessons';

export function getLessons() {
  try {
    const data = localStorage.getItem(LESSONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLesson(lesson) {
  const lessons = getLessons();
  lesson.id = Date.now().toString();
  lesson.createdAt = new Date().toISOString();
  lessons.push(lesson);
  localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons));
  return lesson;
}

export function deleteLesson(lessonId) {
  const lessons = getLessons().filter(l => l.id !== lessonId);
  localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons));
  return lessons;
}

export function deleteSentenceFromLesson(lessonId, sentenceIndex) {
  const lessons = getLessons();
  const lesson = lessons.find(l => l.id === lessonId);
  if (lesson) {
    lesson.sentences.splice(sentenceIndex, 1);
    if (lesson.sentences.length === 0) {
      return deleteLesson(lessonId);
    }
    localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons));
  }
  return lessons;
}

export function getLesson(lessonId) {
  return getLessons().find(l => l.id === lessonId) || null;
}
