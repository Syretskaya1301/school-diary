const fs = require('fs');
const path = require('path');

const TEACHER = 'Елена Викторовна Кузнецова';
const TEACHER_SHORT = 'Е.В. Кузнецова';
const CLASS_NAME = '3А';
const ROOM = '12';

const firstNames = [
  'Александр', 'Мария', 'Дмитрий', 'Анна', 'Максим', 'София', 'Артём', 'Виктория',
  'Иван', 'Елизавета', 'Кирилл', 'Полина', 'Михаил', 'Алиса', 'Даниил', 'Ксения',
  'Никита', 'Варвара', 'Егор', 'Ульяна', 'Андрей', 'Милана', 'Тимофей', 'Арина',
  'Роман', 'Дарья', 'Владислав', 'Ева', 'Глеб', 'Вероника'
];
const lastNames = [
  'Петров', 'Смирнова', 'Козлов', 'Новикова', 'Морозов', 'Волкова', 'Соколов', 'Лебедева',
  'Кузнецов', 'Попова', 'Васильев', 'Семёнова', 'Михайлов', 'Егорова', 'Фёдоров', 'Павлова',
  'Алексеев', 'Романова', 'Орлов', 'Никитина', 'Андреев', 'Захарова', 'Макаров', 'Степанова',
  'Николаев', 'Белова', 'Зайцев', 'Комарова', 'Соловьёв', 'Медведева'
];

const subjects = [
  'Русский язык', 'Математика', 'Литературное чтение', 'Окружающий мир',
  'ИЗО', 'Музыка', 'Физическая культура', 'Технология'
];

const students = firstNames.map((first, i) => ({
  name: `${first} ${lastNames[i]}`,
  class: CLASS_NAME
}));

const schedule = {
  [CLASS_NAME]: {
    monday: [
      { time: '08:30', subject: 'Русский язык', room: ROOM, teacher: TEACHER_SHORT },
      { time: '09:25', subject: 'Математика', room: ROOM, teacher: TEACHER_SHORT },
      { time: '10:30', subject: 'Литературное чтение', room: ROOM, teacher: TEACHER_SHORT },
      { time: '11:25', subject: 'Окружающий мир', room: ROOM, teacher: TEACHER_SHORT }
    ],
    tuesday: [
      { time: '08:30', subject: 'Математика', room: ROOM, teacher: TEACHER_SHORT },
      { time: '09:25', subject: 'Русский язык', room: ROOM, teacher: TEACHER_SHORT },
      { time: '10:30', subject: 'ИЗО', room: ROOM, teacher: TEACHER_SHORT },
      { time: '11:25', subject: 'Музыка', room: 'муз. зал', teacher: TEACHER_SHORT }
    ],
    wednesday: [
      { time: '08:30', subject: 'Русский язык', room: ROOM, teacher: TEACHER_SHORT },
      { time: '09:25', subject: 'Математика', room: ROOM, teacher: TEACHER_SHORT },
      { time: '10:30', subject: 'Окружающий мир', room: ROOM, teacher: TEACHER_SHORT },
      { time: '11:25', subject: 'Технология', room: ROOM, teacher: TEACHER_SHORT }
    ],
    thursday: [
      { time: '08:30', subject: 'Математика', room: ROOM, teacher: TEACHER_SHORT },
      { time: '09:25', subject: 'Литературное чтение', room: ROOM, teacher: TEACHER_SHORT },
      { time: '10:30', subject: 'Русский язык', room: ROOM, teacher: TEACHER_SHORT },
      { time: '11:25', subject: 'Физическая культура', room: 'спортзал', teacher: TEACHER_SHORT }
    ],
    friday: [
      { time: '08:30', subject: 'Русский язык', room: ROOM, teacher: TEACHER_SHORT },
      { time: '09:25', subject: 'Математика', room: ROOM, teacher: TEACHER_SHORT },
      { time: '10:30', subject: 'Окружающий мир', room: ROOM, teacher: TEACHER_SHORT },
      { time: '11:25', subject: 'Литературное чтение', room: ROOM, teacher: TEACHER_SHORT }
    ]
  }
};

const gradeTypes = ['урок', 'контрольная', 'самостоятельная', 'диктант', 'изложение'];
const grades = [];
let id = 1;
for (let i = 0; i < 8; i++) {
  const student = students[i].name;
  for (const subject of ['Русский язык', 'Математика', 'Литературное чтение']) {
    grades.push({
      id: id++,
      student,
      subject,
      grade: 4 + (i % 2),
      type: gradeTypes[i % gradeTypes.length],
      date: `2026-06-0${(i % 3) + 1}`,
      comment: ''
    });
  }
}

const db = {
  school: {
    name: 'Начальная школа №5',
    class: CLASS_NAME,
    teacher: TEACHER,
    teacherShort: TEACHER_SHORT,
    room: ROOM,
    type: 'начальная школа'
  },
  students,
  subjects,
  schedule,
  grades,
  announcements: [
    {
      id: 1,
      title: 'Родительское собрание',
      text: `20 июня в 17:00 — собрание для родителей класса ${CLASS_NAME}.`,
      date: '2026-06-01'
    },
    {
      id: 2,
      title: 'Экскурсия',
      text: '25 июня — поход в краеведческий музей для класса 3А.',
      date: '2026-05-28'
    }
  ]
};

fs.writeFileSync(path.join(__dirname, '..', 'data', 'db.json'), JSON.stringify(db, null, 2), 'utf8');
console.log('db.json: класс', CLASS_NAME + ',', students.length, 'учеников');
