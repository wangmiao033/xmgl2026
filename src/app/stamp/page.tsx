"use client";

import { useState } from "react";

export default function StampPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [size, setSize] = useState(260);
  const [opacity, setOpacity] = useState(0.75);
  const [loading, setLoading] = useState(false);

  async function handleStamp() {
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("size", String(size));
    form.append("opacity", String(opacity));

    const res = await fetch("/api/stamp", {
      method: "POST",
      body: form,
    });

    const blob = await res.blob();
    setResult(URL.createObjectURL(blob));
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold">文件盖章中心</h1>
        <p className="text-gray-500 mt-2">广州熊动科技有限公司公章处理</p>

        <div className="mt-6 space-y-4">
          <input type="file" accept="image/png,image/jpeg" onChange={(e)=>setFile(e.target.files?.[0] || null)} />

          <div>
            印章大小：{size}px
            <input className="block w-full" type="range" min="120" max="500" value={size} onChange={(e)=>setSize(Number(e.target.value))}/>
          </div>

          <div>
            透明度：{Math.round(opacity * 100)}%
            <input className="block w-full" type="range" min="0.3" max="1" step="0.05" value={opacity} onChange={(e)=>setOpacity(Number(e.target.value))}/>
          </div>

          <button onClick={handleStamp} disabled={!file || loading} className="px-5 py-2 bg-black text-white rounded disabled:opacity-40">
            {loading ? "处理中..." : "生成盖章文件"}
          </button>
        </div>

        {result && <div className="mt-8">
          <h2 className="font-bold mb-3">预览</h2>
          <img src={result} alt="盖章文件预览" className="max-w-full border" />
          <a href={result} download="熊动盖章版.png" className="inline-block mt-4 underline">下载文件</a>
        </div>}
      </div>
    </main>
  );
}
