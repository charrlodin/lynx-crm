import Link from "next/link";

export default function Footer() {
    return (
        <footer className="py-12 px-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
            <div className="mx-auto max-w-5xl flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                    <Link href="/" className="font-serif text-xl font-bold tracking-tight mb-2 block">
                        LynxCRM
                    </Link>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                        © {new Date().getFullYear()} LynxCRM. All rights reserved.
                    </p>
                </div>

                <div className="flex items-center gap-8 text-sm font-medium text-stone-600 dark:text-stone-300">
                    <Link href="/privacy" className="hover:text-black dark:hover:text-white transition-colors">
                        Privacy
                    </Link>
                    <Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors">
                        Terms
                    </Link>
                    <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-black dark:hover:text-white transition-colors">
                        Twitter
                    </Link>
                    <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-black dark:hover:text-white transition-colors">
                        GitHub
                    </Link>
                </div>
            </div>
        </footer>
    );
}
