import imgAiComputing from "../assets/images/editorial_ai_computing_1794955233988.jpg";
import imgGlobalMarkets from "../assets/images/editorial_global_markets_1794955236718.jpg";
import imgCultureCinema from "../assets/images/editorial_culture_cinema_1794955237737.jpg";
import imgScienceHorizon from "../assets/images/editorial_science_horizon_1794955238428.jpg";

export type Article = {
  id: string;
  feedId?: string;
  title: string;
  source: string;
  sourceIcon: string;
  author: string;
  date: string;
  dateMs?: number;
  publishedAt?: number;
  readTime: string;
  preview: string;
  content: string;
  image?: string;
  starred: boolean;
  read: boolean;
  category: string;
  tags?: string[];
  link?: string;
  lang?: string;            // "fa" | "ar" | "other" (server-detected)
  titleOriginal?: string;   // original headline before Persian translation
  titleTranslated?: boolean; // true when `title` was AI-translated to Persian
};

export const feeds = [
  { id: 'zoomit', name: 'زومیت', count: 23, icon: '🔷', category: 'فناوری' },
  { id: 'digiato', name: 'دیجیاتو', count: 15, icon: '🟣', category: 'فناوری' },
  { id: 'bbc', name: 'بی‌بی‌سی فارسی', count: 42, icon: '🔴', category: 'اخبار' },
  { id: 'varzesh3', name: 'ورزش سه', count: 8, icon: '🟢', category: 'ورزش' },
  { id: 'tarjomaan', name: 'ترجمان', count: 5, icon: '🟡', category: 'فرهنگ' },
  { id: 'shargh', name: 'روزنامه شرق', count: 12, icon: '⚫', category: 'اخبار' },
  { id: 'hamshahri', name: 'همشهری آنلاین', count: 7, icon: '🔵', category: 'اخبار' },
  { id: 'virgool', name: 'ویرگول', count: 31, icon: '🟠', category: 'وبلاگ' },
];

export const categories = [
  { id: 'tech', name: 'فناوری', count: 38, color: 'bg-blue-500' },
  { id: 'news', name: 'اخبار', count: 61, color: 'bg-red-500' },
  { id: 'sport', name: 'ورزش', count: 8, color: 'bg-green-500' },
  { id: 'culture', name: 'فرهنگ و هنر', count: 5, color: 'bg-yellow-500' },
  { id: 'blog', name: 'وبلاگ‌ها', count: 31, color: 'bg-orange-500' },
];

export const articles: Article[] = [
  {
    id: '1',
    title: 'نسل تازه مدل‌های استدلال‌گر هوش مصنوعی با معماری حافظه بلندمدت معرفی شد',
    source: 'زومیت',
    sourceIcon: '🔷',
    author: 'علی محمدی',
    date: '۲ ساعت پیش',
    readTime: '۵ دقیقه',
    preview: 'نسل جدید سیستم‌های هوش مصنوعی با بهبود چشمگیر در استدلال چندمرحله‌ای، کدنویسی مهندسی و درک عمیق متون فارسی معرفی شد.',
    content: 'پژوهشگران حوزه هوش مصنوعی امروز از معماری تازه‌ای در مدل‌های زبانی و چندوجهی رونمایی کردند که در مقایسه با نسل‌های پیشین بهبود چشمگیری در توانایی استدلال تحلیلی، مهندسی نرم‌افزار و درک ظرایف زبان طبیعی نشان می‌دهد.\n\nبر اساس گزارش‌های منتشرشده، این معماری در آزمون‌های استاندارد برنامه‌نویسی و تحلیل اسناد علمی امتیاز بالاتری نسبت به نسل‌های قبلی کسب کرده و قادر است پیوستگی معنایی را در متون بسیار طولانی حفظ کند.\n\nاز ویژگی‌های کلیدی این دستاورد می‌توان به حافظه زمینه‌ای پویا، تحلیل دقیق نمودارها و اسناد تصویری و پشتیبانی طبیعی‌تر از زبان فارسی در متون تخصصی و تحریریه اشاره کرد.',
    image: imgAiComputing,
    starred: true,
    read: false,
    category: 'tech',
  },
  {
    id: '2',
    title: 'تحولات تازه بازارهای جهانی و چشم‌انداز سیاست‌های پولی در فصل آینده',
    source: 'بی‌بی‌سی فارسی',
    sourceIcon: '🔴',
    author: 'مریم رضایی',
    date: '۴ ساعت پیش',
    readTime: '۱۰ دقیقه',
    preview: 'بررسی جامع شاخص‌های کلان اقتصادی، واکنش بازارهای مالی بین‌المللی به نرخ‌های بهره و تاثیر آن بر جریان سرمایه و تجارت منطقه‌ای.',
    content: 'در هفته گذشته بازارهای مالی جهانی شاهد بازتنظیم انتظارات تورمی و واکنش محتاطانه سرمایه‌گذاران به گزارش‌های بانک‌های مرکزی بودند.\n\nتحلیلگران اقتصادی معتقدند ثبات نسبی در زنجیره تامین انرژی و کاهش هزینه حمل‌ونقل دریایی می‌تواند در فصل آینده زمینه‌ساز تعادل بهتری در بازار کالاهای اساسی شود.',
    image: imgGlobalMarkets,
    starred: true,
    read: false,
    category: 'news',
  },
  {
    id: '3',
    title: 'تراشه‌های نوری سیلیکونی؛ گام بلند سخت‌افزار به سوی پردازش کم‌مصرف',
    source: 'دیجیاتو',
    sourceIcon: '🟣',
    author: 'سارا احمدی',
    date: '۵ ساعت پیش',
    readTime: '۷ دقیقه',
    preview: 'مهندسان سخت‌افزار با ترکیب فوتونیک سیلیکونی و ترانزیستورهای نسل جدید، پهنای باند انتقال داده میان پردازنده‌ها را چندین برابر افزایش دادند.',
    content: 'استفاده از پرتوهای نوری به جای سیگنال‌های الکتریکی در ارتباطات درون‌تراشه‌ای یکی از مهم‌ترین گلوگاه‌های مراکز داده مدرن را برطرف می‌کند و مصرف انرژی را به شکل چشمگیری کاهش می‌دهد.',
    image: imgAiComputing,
    starred: false,
    read: false,
    category: 'tech',
  },
  {
    id: '4',
    title: 'بازخوانی سینمای مولف معاصر و جایگاه روایت‌های مینیمال در جشنواره‌های جهانی',
    source: 'ترجمان',
    sourceIcon: '🟡',
    author: 'نیما شریفی',
    date: '۸ ساعت پیش',
    readTime: '۱۲ دقیقه',
    preview: 'آثار تحسین‌شده سال جاری نشان می‌دهند که بازگشت به درام‌های انسانی و میزانسن‌های دقیق بار دیگر توجه منتقدان بین‌المللی را برانگیخته است.',
    content: 'در فستیوال‌های سینمایی امسال، فیلم‌سازان مستقل با تکیه بر فیلمنامه‌های چندلایه و پرهیز از جلوه‌های پرزرق‌وبرق، روایتی عمیق از زیست انسان معاصر ارائه دادند که با استقبال گسترده منتقدان روبه‌رو شد.',
    image: imgCultureCinema,
    starred: false,
    read: false,
    category: 'culture',
  },
  {
    id: '5',
    title: 'کشف اکوسیستم ناشناخته در درازگودال‌های عمیق اقیانوس آرام',
    source: 'همشهری آنلاین',
    sourceIcon: '🔵',
    author: 'دکتر احمد نوری',
    date: '۱ روز پیش',
    readTime: '۶ دقیقه',
    preview: 'پژوهشگران اقیانوس‌شناسی با کاوشگرهای بدون سرنشین گونه‌های زیستی تازه‌ای را در اعماق تاریک اقیانوس آرام مستندسازی کردند.',
    content: 'تیمی بین‌المللی از زیست‌شناسان دریایی در جریان ماموریت نقشه‌برداری اعماق اقیانوس آرام موفق به ثبت گونه‌هایی شدند که بدون نور خورشید و بر پایه انرژی زمین‌گرمایی زیست می‌کنند.',
    image: imgScienceHorizon,
    starred: true,
    read: true,
    category: 'news',
  },
  {
    id: '6',
    title: 'معماری تمرکز عمیق؛ چگونه تیم‌های توزیع‌شده بهره‌وری خلاق را حفظ می‌کنند',
    source: 'ویرگول',
    sourceIcon: '🟠',
    author: 'حسین موسوی',
    date: '۱ روز پیش',
    readTime: '۸ دقیقه',
    preview: 'نگاهی تجربی به بازطراحی تقویم کاری، ارتباطات ناهمزمان و کاهش وقفه‌های دیجیتال در سازمان‌های فناوری‌محور.',
    content: 'سازمان‌های پیشرو دریافته‌اند که کیفیت خروجی تیم‌های مهندسی و تحریریه بیش از ساعات حضور آنلاین، به بلوک‌های زمانی بدون وقفه و مستندسازی شفاف وابسته است.',
    image: imgGlobalMarkets,
    starred: false,
    read: false,
    category: 'blog',
  },
  {
    id: '7',
    title: 'فهرست ده اثر خواندنی سال از نگاه منتقدان ادبی و پژوهشگران علوم انسانی',
    source: 'روزنامه شرق',
    sourceIcon: '⚫',
    author: 'فاطمه حسینی',
    date: '۲ روز پیش',
    readTime: '۱۵ دقیقه',
    preview: 'مروری تحلیلی بر مهم‌ترین کتاب‌های منتشرشده در حوزه تاریخ، فلسفه و ادبیات داستانی که در سال جاری بیشترین بحث‌های انتقادی را شکل دادند.',
    content: 'انتشار ترجمه‌های دقیق از متون کلاسیک در کنار رمان‌های تازه نویسندگان فارسی‌زبان، فصل پرباری را برای کتاب‌خوانان و حلقه‌های نقد ادبی رقم زده است.',
    image: imgCultureCinema,
    starred: false,
    read: false,
    category: 'culture',
  },
  {
    id: '8',
    title: 'آماده‌سازی تیم ملی برای رقابت‌های قاره‌ای با تکیه بر نسل جوان بازیکنان',
    source: 'ورزش سه',
    sourceIcon: '🟢',
    author: 'رضا کریمی',
    date: '۲ روز پیش',
    readTime: '۴ دقیقه',
    preview: 'برتری سه بر یک در دیدار تدارکاتی اخیر نشان داد ترکیب بازیکنان باتجربه و استعدادهای جوان هماهنگی تاکتیکی امیدوارکننده‌ای ایجاد کرده است.',
    content: 'در جریان اردوی آماده‌سازی اخیر، کادر فنی با آزمایش آرایش‌های هجومی سریع توانست عملکرد خط میانی و انتقال توپ را به شکل محسوسی ارتقا دهد.',
    image: imgScienceHorizon,
    starred: false,
    read: true,
    category: 'sport',
  },
];
