import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-white px-4" style={{ background: "linear-gradient(135deg, #003189 0%, #001a4d 100%)" }}>
      <div className="text-center max-w-2xl">
        {/* French tricolour bar */}
        <div className="flex justify-center mb-8 gap-0 rounded-lg overflow-hidden shadow-lg">
          <div className="w-8 h-20" style={{ background: "#003189" }} />
          <div className="w-8 h-20 bg-white" />
          <div className="w-8 h-20" style={{ background: "#EF3340" }} />
        </div>

        <h1 className="text-5xl font-bold mb-3 tracking-tight">Bienvenue</h1>
        <p className="text-xl mb-2" style={{ color: "#a8bce8" }}>Alliance Française — Study Platform</p>
        <p className="mb-10 text-sm leading-relaxed" style={{ color: "#7a9ad4" }}>
          Upload your weekly lesson notes, then let AI create personalised exercises,
          flashcards and quizzes so you can practise every day.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/register"
            className="font-semibold px-8 py-3 rounded-lg transition shadow-md"
            style={{ background: "#EF3340", color: "white" }}
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="border font-semibold px-8 py-3 rounded-lg transition hover:bg-white/10"
            style={{ borderColor: "rgba(255,255,255,0.4)", color: "white" }}
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
            <div key={f.title} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-semibold mb-1">{f.title}</div>
              <div className="text-xs" style={{ color: "#7a9ad4" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
