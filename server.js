const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const TEACHER_PASSWORD = '111';

const DAYS = {
  monday: 'Понедельник',
  tuesday: 'Вторник',
  wednesday: 'Среда',
  thursday: 'Четверг',
  friday: 'Пятница'
};

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'school-diary-secret-key-2026',
  resave: false,
  saveUninitialized: false
}));

function sortClassNames(names) {
  return names.slice().sort((a, b) => {
    const gradeA = parseInt(a, 10);
    const gradeB = parseInt(b, 10);
    if (gradeA !== gradeB) return gradeA - gradeB;
    return a.slice(1).localeCompare(b.slice(1), 'ru');
  });
}

function loadDb() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  db.school = db.school || { name: 'Начальная школа №5', type: 'начальная школа' };
  db.subjects = db.subjects || [
    'Русский язык',
    'Математика',
    'Литературное чтение',
    'Окружающий мир',
    'ИЗО',
    'Музыка',
    'Физическая культура',
    'Технология'
  ];
  db.grades = db.grades || [];
  db.classes = db.classes || {};
  return db;
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function nextId(items) {
  return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

function getClassInfo(db, className) {
  return db.classes[className] || null;
}

function getClassGrades(db, className) {
  return db.grades.filter(g => g.class === className);
}

function calcAverages(grades) {
  const map = {};
  grades.forEach(g => {
    if (!map[g.subject]) map[g.subject] = [];
    map[g.subject].push(g.grade);
  });
  const averages = {};
  Object.keys(map).forEach(subject => {
    const arr = map[subject];
    averages[subject] = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
  });
  return averages;
}

function calculateStudentStats(students, grades) {
  const map = {};
  students.forEach(student => {
    map[student.name] = {
      student: student.name,
      average: '—',
      count: 0,
      lastGrade: '—',
      lastDate: ''
    };
  });
  grades.forEach(g => {
    if (!map[g.student]) return;
    const rec = map[g.student];
    rec.count += 1;
    rec.sum = (rec.sum || 0) + g.grade;
    if (!rec.lastDate || g.date > rec.lastDate) {
      rec.lastDate = g.date;
      rec.lastGrade = g.grade;
    }
  });
  return Object.values(map).map(rec => {
    if (rec.count) {
      rec.average = (rec.sum / rec.count).toFixed(2);
    }
    return rec;
  }).sort((a, b) => a.student.localeCompare(b.student, 'ru'));
}

function groupGradesBySubject(grades) {
  const map = {};
  grades.forEach(g => {
    if (!map[g.subject]) map[g.subject] = [];
    map[g.subject].push(g);
  });
  return map;
}

function todayKey() {
  const keys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const day = new Date().getDay();
  return keys[day] === 'sunday' || keys[day] === 'saturday' ? null : keys[day];
}

function requireTeacherClass(req, res, next) {
  const className = req.params.className;
  if (req.session.teacherClass !== className) {
    return res.status(403).render('error', {
      title: 'Доступ запрещён',
      message: 'Редактирование доступно только учителю этого класса.'
    });
  }
  next();
}

app.use((req, res, next) => {
  res.locals.teacherClass = req.session.teacherClass || null;
  res.locals.DAYS = DAYS;
  next();
});

app.get('/', (req, res) => {
  const db = loadDb();
  const classes = sortClassNames(Object.keys(db.classes || {})).map(name => db.classes[name]);
  res.render('home', { classes, loginError: null });
});

app.post('/teacher-login', (req, res) => {
  const db = loadDb();
  const className = req.body.className;
  const password = (req.body.password || '').trim();
  const classInfo = getClassInfo(db, className);

  if (!classInfo || password !== TEACHER_PASSWORD) {
    const classes = sortClassNames(Object.keys(db.classes || {})).map(name => db.classes[name]);
    return res.render('home', { classes, loginError: 'Неверный класс или пароль учителя.' });
  }

  req.session.teacherClass = className;
  res.redirect('/class/' + encodeURIComponent(className));
});

app.post('/teacher-logout', (req, res) => {
  req.session.teacherClass = null;
  res.redirect('/');
});

app.get('/class/:className', (req, res) => {
  const db = loadDb();
  const className = req.params.className;
  const classInfo = getClassInfo(db, className);

  if (!classInfo) {
    return res.status(404).render('error', {
      title: 'Класс не найден',
      message: 'Выбранный дневник не существует. Выберите другой класс.'
    });
  }

  const grades = getClassGrades(db, className);
  const studentStats = calculateStudentStats(classInfo.students, grades);
  const averages = calcAverages(grades);
  const gradesBySubject = groupGradesBySubject(grades);
  const today = todayKey();
  const todayLessons = today ? classInfo.schedule[today] || [] : [];

  res.render('class', {
    classInfo,
    classNames: sortClassNames(Object.keys(db.classes || {})),
    className,
    grades,
    studentStats,
    averages,
    gradesBySubject,
    teacherMode: req.session.teacherClass === className,
    todayLessons,
    todayName: today ? DAYS[today] : 'Выходной',
    subjects: db.subjects
  });
});

app.get('/class/:className/schedule', (req, res) => {
  const db = loadDb();
  const className = req.params.className;
  const classInfo = getClassInfo(db, className);

  if (!classInfo) {
    return res.status(404).render('error', {
      title: 'Класс не найден',
      message: 'Выбранный дневник не существует. Выберите другой класс.'
    });
  }

  res.render('schedule', {
    classInfo,
    schedule: classInfo.schedule,
    className,
    classes: sortClassNames(Object.keys(db.classes || {})),
    dayKeys: DAY_KEYS,
    subjects: db.subjects,
    teacherMode: req.session.teacherClass === className
  });
});

app.post('/class/:className/schedule/add', requireTeacherClass, (req, res) => {
  const className = req.params.className;
  const { day, time, subject, room } = req.body;
  const db = loadDb();
  const classInfo = getClassInfo(db, className);

  if (!classInfo.schedule[day]) classInfo.schedule[day] = [];
  classInfo.schedule[day].push({
    time: time || '08:30',
    subject,
    room: room || classInfo.room,
    teacher: classInfo.teacherShort
  });
  classInfo.schedule[day].sort((a, b) => a.time.localeCompare(b.time));
  saveDb(db);
  res.redirect('/class/' + encodeURIComponent(className) + '/schedule');
});

app.post('/class/:className/schedule/remove', requireTeacherClass, (req, res) => {
  const className = req.params.className;
  const { day, index } = req.body;
  const db = loadDb();
  const classInfo = getClassInfo(db, className);
  const lessons = classInfo.schedule[day] || [];
  lessons.splice(parseInt(index, 10), 1);
  saveDb(db);
  res.redirect('/class/' + encodeURIComponent(className) + '/schedule');
});

app.post('/class/:className/schedule/update', requireTeacherClass, (req, res) => {
  const className = req.params.className;
  const { day, index, time, subject, room } = req.body;
  const db = loadDb();
  const classInfo = getClassInfo(db, className);
  const lesson = classInfo.schedule[day] && classInfo.schedule[day][parseInt(index, 10)];

  if (lesson) {
    lesson.time = time;
    lesson.subject = subject;
    lesson.room = room;
    lesson.teacher = classInfo.teacherShort;
    classInfo.schedule[day].sort((a, b) => a.time.localeCompare(b.time));
    saveDb(db);
  }

  res.redirect('/class/' + encodeURIComponent(className) + '/schedule');
});

app.get('/class/:className/grades', (req, res) => {
  const db = loadDb();
  const className = req.params.className;
  const classInfo = getClassInfo(db, className);

  if (!classInfo) {
    return res.status(404).render('error', {
      title: 'Класс не найден',
      message: 'Выбранный дневник не существует. Выберите другой класс.'
    });
  }

  const grades = getClassGrades(db, className).sort((a, b) => b.date.localeCompare(a.date));
  const gradesBySubject = groupGradesBySubject(grades);
  const summary = calcAverages(grades);

  res.render('grades-class', {
    classInfo,
    className,
    classes: sortClassNames(Object.keys(db.classes || {})),
    students: classInfo.students,
    grades,
    gradesBySubject,
    subjects: db.subjects,
    summary,
    teacherMode: req.session.teacherClass === className
  });
});

app.post('/class/:className/grades', requireTeacherClass, (req, res) => {
  const className = req.params.className;
  const { student, subject, grade, type, comment, date } = req.body;
  const db = loadDb();

  db.grades.push({
    id: nextId(db.grades),
    class: className,
    student,
    subject,
    grade: parseInt(grade, 10),
    type: type || 'урок',
    date: date || new Date().toISOString().slice(0, 10),
    comment: comment || ''
  });
  saveDb(db);
  res.redirect('/class/' + encodeURIComponent(className) + '/grades');
});

app.post('/class/:className/grades/delete', requireTeacherClass, (req, res) => {
  const id = parseInt(req.body.id, 10);
  const db = loadDb();
  db.grades = db.grades.filter(g => g.id !== id);
  saveDb(db);
  res.redirect('/class/' + encodeURIComponent(req.params.className) + '/grades');
});

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Страница не найдена',
    message: 'Страница, которую вы ищете, отсутствует. Вернитесь на главную.'
  });
});

app.listen(PORT, () => {
  console.log(`Электронный дневник (начальная школа): http://localhost:${PORT}`);
});
