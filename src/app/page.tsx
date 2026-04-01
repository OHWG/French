import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white px-4">
      <div className="text-center max-w-2xl">
        <div className="flex justify-center mb-8 gap-0">
          <div className="w-4 h-16 bg-blue-600 rounded-l" />
          <div className="w-4 h-16 bg-white" />
          <div className="w-4 h-16 bg-red-600 rounded-r" />
        </div>
        <h1 className="text-5xl font-bold mb-4 tracking-tight">Bienvenue</h1>
        <p className="text-xl text-blue-200 mb-2">Alliance Française Study Platform</p>
        <p className="text-blue-300 mb-10">
          Upload your weekly lesson notes, then let AI create personalised exercises,
          flashcards and quizzes so you can practise every day.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/register"
            className="bg-white text-blue-900 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition"
          >
            Sign in
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          {[
            { icon: "📄", title: "Upload Notes", desc: "PDF lesson notes from your class each week" },
            { icon: "🤖", title: "AI Generates", desc: "Exercises, flashcards & quizzes in seconds" },
            { icon: "📚", title: "Build a Library", desc: "Your full learning history, revisit any time" },
          ].map((f) => (
            <div key={f.title} className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-semibold mb-1">{f.title}</div>
              <div className="text-blue-300 text-xs">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
