
import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <h2 className="text-4xl font-bold mb-4">404 - Page Not Found</h2>
            <p className="mb-8 text-foreground/60">Could not find requested resource</p>
            <Link
                href="/"
                className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
            >
                Return Home
            </Link>
        </div>
    )
}
