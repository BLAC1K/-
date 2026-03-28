import React from 'react';
import AppLogoIcon from './icons/AppLogoIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import SparklesIcon from './icons/SparklesIcon';

interface LandingPageProps {
    onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans selection:bg-brand-light selection:text-white">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 text-brand-dark dark:text-brand-light">
                            <AppLogoIcon />
                        </div>
                        <span className="text-xl font-bold text-brand-dark dark:text-white">المهام اليومية</span>
                    </div>
                    <button 
                        onClick={onLoginClick}
                        className="bg-brand-dark hover:bg-brand-light text-white px-6 py-2 rounded-full font-semibold transition-colors shadow-md"
                    >
                        تسجيل الدخول
                    </button>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative bg-gradient-to-br from-brand-dark to-[#3a7c93] text-white py-20 lg:py-32 overflow-hidden">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-brand-light rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-brand-accent-yellow rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                            أدر تقارير موظفيك <span className="text-brand-accent-yellow">بذكاء وسهولة</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-10 leading-relaxed">
                            تطبيق "المهام اليومية" هو الحل الأمثل لمتابعة إنجازات فريقك، تقييم الأداء، وإدارة التقارير اليومية والأسبوعية في مكان واحد، معزز بتقنيات الذكاء الاصطناعي.
                        </p>
                        <button 
                            onClick={onLoginClick}
                            className="bg-brand-accent-yellow hover:bg-yellow-400 text-brand-dark text-lg font-bold px-8 py-4 rounded-full shadow-lg transition-transform hover:scale-105"
                        >
                            ابدأ الآن - تسجيل الدخول
                        </button>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 bg-white dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-brand-dark dark:text-white mb-4">لماذا تختار تطبيق المهام اليومية؟</h2>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                صُمم التطبيق ليلبي احتياجات الشركات والمؤسسات في متابعة سير العمل اليومي بكل شفافية واحترافية.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
                                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
                                    <DocumentTextIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 dark:text-white">تقارير يومية منظمة</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    يمكن للموظفين كتابة تقاريرهم اليومية بسهولة، وتصنيف المهام المنجزة، قيد التنفيذ، أو المتأخرة مع إمكانية إرفاق الصور.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
                                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-6">
                                    <ChartBarIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 dark:text-white">لوحة تحكم للمدراء</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    نظرة شاملة للمدراء لمتابعة أداء الموظفين، قراءة التقارير، إضافة تعليقات وتوجيهات، وتقييم الأداء الشهري.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
                                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-6">
                                    <SparklesIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 dark:text-white">تحليل ذكي للتقارير</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    استخدام الذكاء الاصطناعي لتحليل تقارير الموظفين، استخراج الإيجابيات، السلبيات، وتقديم توصيات لتحسين بيئة العمل.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* CTA Section */}
                <section className="py-20 bg-gray-50 dark:bg-gray-800">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-bold text-brand-dark dark:text-white mb-6">جاهز لتنظيم عمل فريقك؟</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                            انضم إلى النظام الآن وابدأ في إدارة مهام وتقارير موظفيك بفعالية عالية.
                        </p>
                        <button 
                            onClick={onLoginClick}
                            className="bg-brand-light hover:bg-brand-dark text-white text-lg font-bold px-10 py-4 rounded-full shadow-md transition-colors"
                        >
                            تسجيل الدخول للنظام
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 text-brand-dark dark:text-gray-400">
                            <AppLogoIcon />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 font-semibold">المهام اليومية</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                        © {new Date().getFullYear()} جميع الحقوق محفوظة. تطوير: حسين كاظم
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
