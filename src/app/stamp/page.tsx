"use client";

import { useState } from "react";

export default function StampPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleStamp() {
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/stamp", {
      method: "POST",
      body: form,
    });

    const blob = await res.blob();
    setResult(URL.createObjectURL(blob));
    setLoading(false);
  }

  return (
    <main className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-2">盖章中心 V1</h1>
        <p className="text-gray-500 mb-6">广州熊动科技有限公司公章图片盖章测试</p>

        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4"
        />

        <button
          onClick={handleStamp}
          disabled={!file || loading}
          className="px-5 py-2 rounded bg-black text-white disabled:opacity-40"
        >
          {loading ? "处理中..." : "生成盖章图片"}
        </button>

        {result && (
          <div className="mt-8">
            <h2 className="font-semibold mb-3">预览</h2>
            <img src={result} className="max-w-full border" />
            <a href={result} download="熊动盖章版.png" className="inline-block mt-4 underline">
              下载盖章文件
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
