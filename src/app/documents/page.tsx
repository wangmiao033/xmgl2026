"use client";

export default function DocumentsPage() {
  const categories = [
    "版号资料",
    "软件著作权",
    "ICP备案",
    "批复文件",
    "授权文件",
    "合同文件",
    "其他资料",
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">文件资料中心</h1>
        <p className="mt-2 text-gray-500">统一管理游戏项目资质、授权及合同文件</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {categories.map((item) => (
            <div key={item} className="rounded-lg border p-5 hover:shadow">
              <div className="font-semibold">{item}</div>
              <div className="mt-2 text-sm text-gray-500">支持后续接入上传、归档、盖章流程</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg bg-slate-100 p-5">
          下一步：接入文件上传、批量盖章、盖章记录、项目关联。
        </div>
      </div>
    </main>
  );
}
