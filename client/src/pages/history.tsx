import { ListeningHistory } from "@/components/listening-history";

export default function History() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Listening History
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track your Quran recitation progress and review your learning journey
        </p>
      </div>
      
      <ListeningHistory userId={1} />
    </div>
  );
}