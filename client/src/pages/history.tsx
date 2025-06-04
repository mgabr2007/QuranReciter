import { Link } from "wouter";
import { ListeningHistory } from "@/components/listening-history";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function History() {
  return (
    <div className="min-h-screen bg-[hsl(var(--surface))]">
      {/* Header with navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Practice
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300 mx-3"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Listening History</h1>
                <p className="text-sm text-gray-600">Track your Quran recitation progress</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <ListeningHistory userId={1} />
      </main>
    </div>
  );
}