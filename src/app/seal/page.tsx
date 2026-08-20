export default function SealPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">盖章中心</h1>
        <p className="mt-2 text-gray-600">广州熊动科技有限公司文件盖章管理</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-5">
            <div className="font-semibold">上传文件</div>
            <p className="mt-2 text-sm text-gray-500">支持版号、软著、ICP、授权文件等资料。</p>
          </div>
          <div className="rounded-lg border p-5">
            <div className="font-semibold">选择印章</div>
            <p className="mt-2 text-sm text-gray-500">广州熊动科技有限公司公章。</p>
          </div>
          <div className="rounded-lg border p-5">
            <div className="font-semibold">生成归档</div>
            <p className="mt-2 text-sm text-gray-500">保存原文件、盖章文件和操作记录。</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-dashed p-10 text-center text-gray-500">
          文件上传和自动盖章功能开发中
        </div>
      </div>
    </main>
  );
}
