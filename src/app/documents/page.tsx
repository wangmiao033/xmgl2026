export default function DocumentsPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">文件中心</h1>
        <p className="mt-2 text-gray-600">管理游戏资质、授权文件和盖章资料。</p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {['版号', '软著', 'ICP', '授权文件'].map((item) => (
            <div key={item} className="rounded-lg border p-5">
              <div className="font-semibold">{item}</div>
              <div className="mt-2 text-sm text-gray-500">待归档文件</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
