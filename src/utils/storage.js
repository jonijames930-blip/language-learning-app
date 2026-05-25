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

export async function exportLessons() {
  const lessons = getLessons();
  const data = JSON.stringify(lessons, null, 2);
  const fileName = `lessons_backup_${new Date().toISOString().slice(0, 10)}.json`;

  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');

      const result = await Filesystem.writeFile({
        path: fileName,
        data: btoa(unescape(encodeURIComponent(data))),
        directory: Directory.Cache,
      });

      await Share.share({
        title: fileName,
        url: result.uri,
      });
      return;
    }
  } catch {
    // fallback to web download
  }

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importLessons(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) {
          reject(new Error('Invalid format'));
          return;
        }
        const existing = getLessons();
        const existingIds = new Set(existing.map(l => l.id));
        let added = 0;
        for (const lesson of imported) {
          if (lesson.id && lesson.sentences && !existingIds.has(lesson.id)) {
            existing.push(lesson);
            added++;
          }
        }
        localStorage.setItem(LESSONS_KEY, JSON.stringify(existing));
        resolve(added);
      } catch {
        reject(new Error('Invalid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Read error'));
    reader.readAsText(file);
  });
}
