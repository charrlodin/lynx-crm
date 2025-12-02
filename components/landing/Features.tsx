import { Search, ArrowRight } from "lucide-react";

export default function Features() {
    const features = [
        {
            title: "Pipeline Management",
            headline: "Move deals, not pixels.",
            description: "A Kanban board that feels physical. Drag and drop with satisfying weight. No lag, no clutter, just your sales process in motion.",
            visual: (
                <div className="w-full h-full bg-stone-50 dark:bg-stone-900 p-6 flex gap-4 overflow-hidden">
                    {/* Column 1 */}
                    <div className="w-48 flex-shrink-0 flex flex-col gap-3 opacity-50">
                        <div className="h-4 w-24 bg-stone-200 dark:bg-stone-800 rounded-full mb-2"></div>
                        <div className="h-24 w-full bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 shadow-sm"></div>
                        <div className="h-24 w-full bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 shadow-sm"></div>
                    </div>
                    {/* Column 2 - Active */}
                    <div className="w-48 flex-shrink-0 flex flex-col gap-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-4 w-20 bg-stone-900 dark:bg-white rounded-full"></div>
                            <div className="h-4 w-6 bg-stone-200 dark:bg-stone-800 rounded-full"></div>
                        </div>
                        <div className="h-28 w-full bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-lg p-3 flex flex-col justify-between transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">AC</div>
                                <div className="space-y-1">
                                    <div className="h-3 w-24 bg-stone-900 dark:bg-white rounded-full"></div>
                                    <div className="h-2 w-16 bg-stone-300 dark:bg-stone-600 rounded-full"></div>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                                <div className="h-full w-3/4 bg-stone-900 dark:bg-white"></div>
                            </div>
                        </div>
                        <div className="h-24 w-full bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 shadow-sm opacity-60"></div>
                    </div>
                    {/* Column 3 */}
                    <div className="w-48 flex-shrink-0 flex flex-col gap-3 opacity-50">
                        <div className="h-4 w-24 bg-stone-200 dark:bg-stone-800 rounded-full mb-2"></div>
                        <div className="h-24 w-full bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 shadow-sm"></div>
                    </div>
                </div>
            )
        },
        {
            title: "Instant Search",
            headline: "Don't click. Just type.",
            description: "Hit '/' to find any lead, deal, or contact in milliseconds. Navigation should never break your flow.",
            visual: (
                <div className="w-full h-full bg-stone-100 dark:bg-stone-900 flex items-center justify-center">
                    <div className="w-3/4 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                        <div className="p-4 border-b border-stone-100 dark:border-stone-700 flex items-center gap-3">
                            <Search className="w-5 h-5 text-stone-400" />
                            <div className="h-4 w-32 bg-stone-200 dark:bg-stone-600 rounded-full"></div>
                        </div>
                        <div className="p-2">
                            <div className="p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">JD</div>
                                    <div>
                                        <div className="h-3 w-24 bg-stone-900 dark:bg-white rounded-full mb-1"></div>
                                        <div className="h-2 w-16 bg-stone-300 dark:bg-stone-500 rounded-full"></div>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-stone-400" />
                            </div>
                            <div className="p-3 flex items-center gap-3 opacity-50">
                                <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-700"></div>
                                <div className="h-3 w-20 bg-stone-200 dark:bg-stone-600 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "High-Signal Analytics",
            headline: "Growth, visualized.",
            description: "We stripped away the vanity metrics. See exactly what matters: conversion rates, velocity, and revenue.",
            visual: (
                <div className="w-full h-full bg-stone-50 dark:bg-stone-900 p-8 flex items-center justify-center">
                    <div className="w-full max-w-sm bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-700 p-6">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <div className="text-sm text-stone-500 mb-1">Monthly Revenue</div>
                                <div className="text-3xl font-serif font-medium text-stone-900 dark:text-white">$124,500</div>
                            </div>
                            <div className="text-emerald-600 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">+12.5%</div>
                        </div>
                        <div className="flex items-end gap-2 h-32">
                            {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                                <div key={i} className="flex-1 bg-stone-100 dark:bg-stone-700 rounded-t-sm relative group">
                                    <div
                                        className="absolute bottom-0 left-0 right-0 bg-stone-900 dark:bg-white rounded-t-sm transition-all duration-500"
                                        style={{ height: `${h}% ` }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <section id="features" className="py-32 px-6">
            <div className="mx-auto max-w-7xl">
                <div className="grid gap-32">
                    {features.map((feature, index) => (
                        <div key={index} className="grid md:grid-cols-2 gap-12 items-center group">
                            <div className={`order - 2 ${index % 2 === 1 ? 'md:order-1' : 'md:order-2'} `}>
                                {/* CSS Mockup Visual */}
                                <div className="aspect-[4/3] bg-stone-100 dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-inner">
                                    {feature.visual}
                                </div>
                            </div>
                            <div className={`order - 1 ${index % 2 === 1 ? 'md:order-2' : 'md:order-1'} `}>
                                <span className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-4 block">
                                    {feature.title}
                                </span>
                                <h2 className="font-serif text-4xl md:text-5xl text-stone-900 dark:text-white mb-6 leading-tight">
                                    {feature.headline}
                                </h2>
                                <p className="text-xl text-stone-500 dark:text-stone-400 leading-relaxed max-w-md">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
