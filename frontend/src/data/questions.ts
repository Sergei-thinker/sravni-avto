export type QuestionType = 'budget' | 'multi-select' | 'single-select' | 'ranking';

export interface QuestionOption {
  value: string;
  label: string;
  icon?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  subtitle?: string;
  options?: QuestionOption[];
}

export const questions: Question[] = [
  {
    id: 'budget',
    type: 'budget',
    title: 'Какой у вас бюджет?',
    subtitle: 'Укажите диапазон и тип автомобиля',
  },
  {
    id: 'purposes',
    type: 'multi-select',
    title: 'Для чего вам машина?',
    subtitle: 'Можно выбрать несколько вариантов',
    options: [
      { value: 'city', label: 'Город каждый день', icon: '🏙️' },
      { value: 'highway', label: 'Дача и трасса', icon: '🛣️' },
      { value: 'family', label: 'Семья с детьми', icon: '👨‍👩‍👧‍👦' },
      { value: 'work', label: 'Для работы', icon: '💼' },
      { value: 'first_car', label: 'Первая машина', icon: '🎓' },
      { value: 'offroad', label: 'Бездорожье', icon: '🏔️' },
    ],
  },
  {
    id: 'passengers',
    type: 'single-select',
    title: 'Сколько обычно пассажиров?',
    subtitle: 'Включая водителя',
    options: [
      { value: '1-2', label: '1-2 человека', icon: '🧑' },
      { value: '3-4', label: '3-4 человека', icon: '👥' },
      { value: '5+', label: '5 и более', icon: '👨‍👩‍👧‍👦' },
    ],
  },
  {
    id: 'priorities',
    type: 'ranking',
    title: 'Что для вас важнее всего?',
    subtitle: 'Нажимайте по порядку важности (1 = самое важное)',
    options: [
      { value: 'fuel_economy', label: 'Расход топлива', icon: '⛽' },
      { value: 'reliability', label: 'Надёжность', icon: '🔧' },
      { value: 'comfort', label: 'Комфорт', icon: '🛋️' },
      { value: 'safety', label: 'Безопасность', icon: '🛡️' },
      { value: 'looks', label: 'Внешний вид', icon: '✨' },
      { value: 'dynamics', label: 'Динамика', icon: '🏎️' },
    ],
  },
  {
    id: 'experience',
    type: 'single-select',
    title: 'Ваш водительский стаж?',
    options: [
      { value: 'none', label: 'Нет прав', icon: '📋' },
      { value: 'junior', label: 'До 2 лет', icon: '🔰' },
      { value: 'mid', label: '2-5 лет', icon: '🚗' },
      { value: 'senior', label: 'Более 5 лет', icon: '🏆' },
    ],
  },
  {
    id: 'city_size',
    type: 'single-select',
    title: 'Где вы живёте?',
    subtitle: 'Размер вашего города',
    options: [
      { value: 'big', label: 'Город-миллионник', icon: '🏙️' },
      { value: 'medium', label: 'Средний город', icon: '🏘️' },
      { value: 'small', label: 'Малый город / село', icon: '🏡' },
    ],
  },
  {
    id: 'chinese_ok',
    type: 'single-select',
    title: 'Рассматриваете китайские марки?',
    subtitle: 'Haval, Chery, Geely, Omoda и другие',
    options: [
      { value: 'yes', label: 'Да, без ограничений', icon: '✅' },
      { value: 'proven', label: 'Только проверенные', icon: '🔍' },
      { value: 'no', label: 'Нет, не рассматриваю', icon: '❌' },
    ],
  },
];
