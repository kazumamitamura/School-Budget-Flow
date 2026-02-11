import { BookOpen, LogIn, Shield, Wallet } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Header */}
      <header className="border-b border-blue-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-gray-800">
              School Budget Flow
            </span>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <LogIn className="h-4 w-4" />
            ログイン
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-5xl px-6">
        <section className="flex flex-col items-center py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100">
            <Wallet className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
            School Budget Flow へようこそ
          </h1>
          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-gray-600">
            生徒会予算の申請・承認をデジタル化。
            <br />
            透明性の高い予算管理で、学校運営をもっとスムーズに。
          </p>
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <LogIn className="h-5 w-5" />
            ログインして始める
          </button>
        </section>

        {/* Features Section */}
        <section className="grid gap-6 pb-20 md:grid-cols-3">
          <FeatureCard
            icon={<BookOpen className="h-6 w-6 text-blue-600" />}
            title="予算申請"
            description="部活動やイベントの予算申請をオンラインで簡単に提出できます。"
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6 text-emerald-600" />}
            title="電子決裁"
            description="承認フローをデジタル化し、迅速で透明性の高い意思決定を実現します。"
          />
          <FeatureCard
            icon={<Wallet className="h-6 w-6 text-violet-600" />}
            title="予算管理"
            description="リアルタイムで予算の残高や使用状況を確認できます。"
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-100 bg-white/60">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} School Budget Flow. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-600">{description}</p>
    </div>
  );
}
