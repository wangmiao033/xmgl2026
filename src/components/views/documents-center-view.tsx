export function DocumentsCenterView() {
  const categories = [
    { name: '版号资料', count: 0 },
    { name: '软件著作权', count: 0 },
    { name: 'ICP备案', count: 0 },
    { name: '授权文件', count: 0 },
    { name: '合同文件', count: 0 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">文件资料中心</h1>
        <p className="mt-2 text-muted-foreground">统一管理游戏资质、授权文件、合同及盖章资料。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {categories.map((item) => (
          <div key={item.name} className="rounded-xl border bg-card p-5">
            <div className="font-semibold">{item.name}</div>
            <div className="mt-3 text-2xl font-bold">{item.count}</div>
            <div className="text-sm text-muted-foreground">份文件</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold">后续功能</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• 批量上传文件</li>
          <li>• 关联游戏项目</li>
          <li>• 自动盖章并生成归档文件</li>
          <li>• 查看盖章历史记录</li>
        </ul>
      </div>
    </div>
  )
}
