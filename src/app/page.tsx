export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 px-4">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            Plataforma APA
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Sistema de seguimiento educativo
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">GlobalIA</span>
          <span>×</span>
          <span className="font-semibold">ONG Adelante</span>
        </div>

        <div className="pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sistema en desarrollo
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
