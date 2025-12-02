export default function TrustedBy() {
    const companies = [
        "Acme Corp",
        "Globex",
        "Soylent Corp",
        "Initech",
        "Umbrella Corp",
        "Massive Dynamic",
        "Hooli",
        "Vehement Capital",
    ];

    return (
        <section className="py-12 border-b border-stone-100 dark:border-stone-900">
            <div className="mx-auto max-w-7xl px-6 flex flex-col items-center gap-8">
                <p className="text-sm font-medium text-stone-400 dark:text-stone-600 whitespace-nowrap">
                    Trusted by teams at
                </p>

                <div className="w-full max-w-4xl relative overflow-hidden mask-gradient-x">
                    <div className="animate-marquee whitespace-nowrap flex items-center gap-16 justify-center">
                        {companies.map((company, index) => (
                            <span
                                key={index}
                                className="text-lg font-serif font-bold text-stone-300 dark:text-stone-700 cursor-default select-none"
                            >
                                {company}
                            </span>
                        ))}
                        {/* Duplicate for seamless loop */}
                        {companies.map((company, index) => (
                            <span
                                key={`dup-${index}`}
                                className="text-lg font-serif font-bold text-stone-300 dark:text-stone-700 cursor-default select-none"
                            >
                                {company}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
