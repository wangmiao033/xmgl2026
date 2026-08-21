'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  BadgeCheck,
  CheckCircle2,
  Download,
  FileImage,
  Loader2,
  RotateCcw,
  Stamp,
  UploadCloud,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

type PositionKey = 'bottom-right' | 'bottom-center' | 'middle-right' | 'center'
type ProcessMode = 'stamp' | 'compress' | 'stamp-compress'
type FileStatus = 'ready' | 'processing' | 'done' | 'error'

interface WorkFile {
  id: string
  file: File
  previewUrl: string
  outputUrl?: string
  outputBlob?: Blob
  outputName?: string
  status: FileStatus
  error?: string
}

interface StampOptions {
  position: PositionKey
  opacity: number
  angle: number
}

const targetBytes = 950_000
const oneMegabyte = 1_000_000
const projectStampUrl = '/api/default-stamp'
const stampDiameterMm = 40
const a4PortraitWidthMm = 210
const a4LandscapeWidthMm = 297

const positionLabels: Record<PositionKey, string> = {
  'bottom-right': '右下',
  'bottom-center': '底部居中',
  'middle-right': '右侧居中',
  center: '正中',
}

const positionClasses: Record<PositionKey, string> = {
  'bottom-right': 'items-end justify-end',
  'bottom-center': 'items-end justify-center',
  'middle-right': 'items-center justify-end',
  center: 'items-center justify-center',
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function makeId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`
}

function outputName(fileName: string, suffix: string, extension = 'jpg') {
  const dot = fileName.lastIndexOf('.')
  const base = dot > 0 ? fileName.slice(0, dot) : fileName
  return `${base}_${suffix}.${extension}`
}

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let value = i
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[i] = value >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true)
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true)
}

function getDosDateTime(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time, date: dosDate }
}

async function createZip(files: { name: string; blob: Blob }[]) {
  const encoder = new TextEncoder()
  const parts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  const { time, date } = getDosDateTime()
  let offset = 0

  for (const file of files) {
    const nameBytes = encoder.encode(file.name)
    const content = new Uint8Array(await file.blob.arrayBuffer())
    const checksum = crc32(content)

    const localHeader = new Uint8Array(30 + nameBytes.length)
    const localView = new DataView(localHeader.buffer)
    writeUint32(localView, 0, 0x04034b50)
    writeUint16(localView, 4, 20)
    writeUint16(localView, 6, 0x0800)
    writeUint16(localView, 8, 0)
    writeUint16(localView, 10, time)
    writeUint16(localView, 12, date)
    writeUint32(localView, 14, checksum)
    writeUint32(localView, 18, content.length)
    writeUint32(localView, 22, content.length)
    writeUint16(localView, 26, nameBytes.length)
    localHeader.set(nameBytes, 30)
    parts.push(localHeader, content)

    const centralHeader = new Uint8Array(46 + nameBytes.length)
    const centralView = new DataView(centralHeader.buffer)
    writeUint32(centralView, 0, 0x02014b50)
    writeUint16(centralView, 4, 20)
    writeUint16(centralView, 6, 20)
    writeUint16(centralView, 8, 0x0800)
    writeUint16(centralView, 10, 0)
    writeUint16(centralView, 12, time)
    writeUint16(centralView, 14, date)
    writeUint32(centralView, 16, checksum)
    writeUint32(centralView, 20, content.length)
    writeUint32(centralView, 24, content.length)
    writeUint16(centralView, 28, nameBytes.length)
    writeUint32(centralView, 42, offset)
    centralHeader.set(nameBytes, 46)
    centralParts.push(centralHeader)

    offset += localHeader.length + content.length
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  writeUint32(endView, 0, 0x06054b50)
  writeUint16(endView, 8, files.length)
  writeUint16(endView, 10, files.length)
  writeUint32(endView, 12, centralSize)
  writeUint32(endView, 16, offset)

  const blobParts = [...parts, ...centralParts, end].map((part) => (
    part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) as ArrayBuffer
  ))

  return new Blob(blobParts, { type: 'application/zip' })
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败'))
    }
    image.src = url
  })
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('章图读取失败'))
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('导出图片失败'))
      else resolve(blob)
    }, type, quality)
  })
}

function getStampCenter(width: number, height: number, size: number, position: PositionKey) {
  const margin = Math.max(width * 0.08, size * 0.25)
  if (position === 'bottom-right') return { x: width - margin - size / 2, y: height - margin - size / 2 }
  if (position === 'bottom-center') return { x: width / 2, y: height - margin - size / 2 }
  if (position === 'middle-right') return { x: width - margin - size / 2, y: height * 0.55 }
  return { x: width / 2, y: height / 2 }
}

function drawImageToCanvas(image: HTMLImageElement, maxWidth?: number) {
  const scale = maxWidth && image.width > maxWidth ? maxWidth / image.width : 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('浏览器不支持图片处理')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

async function applyStamp(file: File, stampImage: HTMLImageElement, options: StampOptions) {
  const source = await loadImageFromFile(file)
  const canvas = drawImageToCanvas(source)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('浏览器不支持图片处理')

  const pageWidthMm = canvas.width > canvas.height ? a4LandscapeWidthMm : a4PortraitWidthMm
  const stampSize = Math.round(canvas.width * (stampDiameterMm / pageWidthMm))
  const center = getStampCenter(canvas.width, canvas.height, stampSize, options.position)

  context.save()
  context.globalAlpha = options.opacity / 100
  context.translate(center.x, center.y)
  context.rotate((options.angle * Math.PI) / 180)
  context.drawImage(stampImage, -stampSize / 2, -stampSize / 2, stampSize, stampSize)
  context.restore()

  return canvas
}

async function compressCanvas(canvas: HTMLCanvasElement, target = targetBytes) {
  let currentCanvas = canvas

  for (const quality of [0.92, 0.88, 0.84, 0.8, 0.76, 0.72, 0.68, 0.64, 0.6, 0.56, 0.52, 0.48]) {
    const blob = await canvasToBlob(currentCanvas, 'image/jpeg', quality)
    if (blob.size <= target) return { blob, quality, scale: currentCanvas.width / canvas.width }
  }

  for (const scale of [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6]) {
    const resized = document.createElement('canvas')
    resized.width = Math.max(1, Math.round(canvas.width * scale))
    resized.height = Math.max(1, Math.round(canvas.height * scale))
    const context = resized.getContext('2d')
    if (!context) throw new Error('浏览器不支持图片处理')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, resized.width, resized.height)
    context.drawImage(canvas, 0, 0, resized.width, resized.height)
    currentCanvas = resized

    for (const quality of [0.82, 0.78, 0.74, 0.7, 0.66, 0.62, 0.58, 0.54, 0.5]) {
      const blob = await canvasToBlob(currentCanvas, 'image/jpeg', quality)
      if (blob.size <= target) return { blob, quality, scale }
    }
  }

  const blob = await canvasToBlob(currentCanvas, 'image/jpeg', 0.46)
  return { blob, quality: 0.46, scale: currentCanvas.width / canvas.width }
}

async function compressImage(file: File) {
  const image = await loadImageFromFile(file)
  const canvas = drawImageToCanvas(image)
  return compressCanvas(canvas)
}

export function QualificationToolsView() {
  const inputRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef<WorkFile[]>([])
  const [files, setFiles] = useState<WorkFile[]>([])
  const [mode, setMode] = useState<ProcessMode>('stamp-compress')
  const [options, setOptions] = useState<StampOptions>({
    position: 'bottom-right',
    opacity: 88,
    angle: -8,
  })
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [stampReady, setStampReady] = useState(false)
  const [stampError, setStampError] = useState('')

  const finishedFiles = files.filter((file) => file.status === 'done' && file.outputBlob && file.outputUrl)
  const totalOriginal = files.reduce((sum, item) => sum + item.file.size, 0)
  const totalOutput = finishedFiles.reduce((sum, item) => sum + (item.outputBlob?.size || 0), 0)
  const progress = files.length ? Math.round((finishedFiles.length / files.length) * 100) : 0
  const needsStamp = mode === 'stamp' || mode === 'stamp-compress'

  const stampPreviewStyle = useMemo(() => ({
    width: `${(stampDiameterMm / a4PortraitWidthMm) * 100}%`,
    opacity: options.opacity / 100,
    transform: `rotate(${options.angle}deg)`,
  }), [options.angle, options.opacity])

  useEffect(() => {
    filesRef.current = files
  }, [files])

  useEffect(() => {
    return () => {
      filesRef.current.forEach((file) => {
        URL.revokeObjectURL(file.previewUrl)
        if (file.outputUrl) URL.revokeObjectURL(file.outputUrl)
      })
    }
  }, [])

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const imageFiles = Array.from(incoming).filter((file) => file.type.startsWith('image/'))
    setFiles((current) => [
      ...current,
      ...imageFiles.map((file) => ({
        id: makeId(file),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'ready' as const,
      })),
    ])
  }, [])

  const removeFile = (id: string) => {
    setFiles((current) => {
      const target = current.find((file) => file.id === id)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
        if (target.outputUrl) URL.revokeObjectURL(target.outputUrl)
      }
      return current.filter((file) => file.id !== id)
    })
  }

  const clearFiles = () => {
    files.forEach((file) => {
      URL.revokeObjectURL(file.previewUrl)
      if (file.outputUrl) URL.revokeObjectURL(file.outputUrl)
    })
    setFiles([])
  }

  const updateOptions = (patch: Partial<StampOptions>) => {
    setOptions((current) => ({ ...current, ...patch }))
  }

  const processFiles = async () => {
    if (!files.length || processing) return
    if (needsStamp && !stampReady) return

    setProcessing(true)
    const stampImage = needsStamp ? await loadImageFromUrl(projectStampUrl) : null

    for (const item of files) {
      setFiles((current) => current.map((file) => (
        file.id === item.id ? { ...file, status: 'processing', error: undefined } : file
      )))

      try {
        let blob: Blob
        let finalName: string

        if (mode === 'compress') {
          const result = await compressImage(item.file)
          blob = result.blob
          finalName = outputName(item.file.name, '1M以内')
        } else {
          const stampedCanvas = await applyStamp(item.file, stampImage!, options)
          if (mode === 'stamp-compress') {
            const result = await compressCanvas(stampedCanvas)
            blob = result.blob
            finalName = outputName(item.file.name, '盖章_1M以内')
          } else {
            blob = await canvasToBlob(stampedCanvas, 'image/jpeg', 0.92)
            finalName = outputName(item.file.name, '盖章')
          }
        }

        if (item.outputUrl) URL.revokeObjectURL(item.outputUrl)
        const outputUrl = URL.createObjectURL(blob)
        setFiles((current) => current.map((file) => (
          file.id === item.id
            ? { ...file, outputBlob: blob, outputUrl, outputName: finalName, status: 'done' }
            : file
        )))
      } catch (error) {
        setFiles((current) => current.map((file) => (
          file.id === item.id
            ? { ...file, status: 'error', error: error instanceof Error ? error.message : '处理失败' }
            : file
        )))
      }
    }

    setProcessing(false)
  }

  const downloadFile = (file: WorkFile) => {
    if (!file.outputUrl || !file.outputName) return
    const link = document.createElement('a')
    link.href = file.outputUrl
    link.download = file.outputName
    link.click()
  }

  const downloadAll = async () => {
    if (!finishedFiles.length) return
    const zip = await createZip(finishedFiles.map((file) => ({
      name: file.outputName || outputName(file.file.name, '处理完成'),
      blob: file.outputBlob!,
    })))
    const url = URL.createObjectURL(zip)
    const link = document.createElement('a')
    link.href = url
    link.download = `资质处理_${new Date().toISOString().slice(0, 10)}.zip`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-[linear-gradient(135deg,#064e3b_0%,#047857_54%,#0f766e_100%)] p-6 text-white shadow-elevated lg:p-7">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12px] text-emerald-50/90">
              <BadgeCheck className="h-3.5 w-3.5" />
              资质归档工具
            </div>
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">盖章与 1M 压缩</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-emerald-50/85">
              批量处理资质图片，盖章和压缩都在当前浏览器完成。
            </p>
          </div>
          <div className="grid min-w-[260px] grid-cols-3 gap-2 rounded-xl border border-white/15 bg-white/10 p-2 backdrop-blur">
            <div className="rounded-lg bg-white/10 px-3 py-2">
              <p className="text-[11px] text-emerald-50/70">文件</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{files.length}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-3 py-2">
              <p className="text-[11px] text-emerald-50/70">完成</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{finishedFiles.length}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-3 py-2">
              <p className="text-[11px] text-emerald-50/70">上限</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">1M</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
        <div className="space-y-4">
          <Card className="border-border/40 bg-card/85 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[16px]">
                <Stamp className="h-4 w-4 text-emerald-500" />
                处理方式
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { value: 'stamp-compress', label: '盖章+压缩', icon: BadgeCheck },
                  { value: 'stamp', label: '只盖章', icon: Stamp },
                  { value: 'compress', label: '只压缩', icon: Archive },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMode(item.value as ProcessMode)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors',
                      mode === item.value
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'border-border/50 bg-background hover:bg-muted/60'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>

              {needsStamp && (
                <div className="space-y-4 rounded-xl border border-border/50 bg-background/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Label className="text-[13px] font-semibold">章图</Label>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300">
                          项目默认章
                        </Badge>
                      </div>
                      <p className="mt-1 text-[12px] text-muted-foreground">广州熊动科技有限公司公章 · 固定直径 40mm</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">所有登录用户、所有电脑自动使用</p>
                      {stampError && <p className="mt-1 text-[12px] text-red-500">{stampError}</p>}
                    </div>
                  </div>

                  <div className={cn('flex h-36 rounded-lg border border-dashed border-border/60 bg-muted/30 p-4', positionClasses[options.position])}>
                    {!stampError ? (
                      <img
                        src={projectStampUrl}
                        alt="项目默认章预览"
                        className="max-w-[45%] object-contain"
                        style={stampPreviewStyle}
                        onLoad={() => {
                          setStampReady(true)
                          setStampError('')
                        }}
                        onError={() => {
                          setStampReady(false)
                          setStampError('项目默认章加载失败')
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Stamp className="h-8 w-8" />
                        <span className="text-[12px]">项目默认章暂不可用</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-[12px]">
                      <Label>公章尺寸</Label>
                      <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">固定 40mm</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[12px]">
                        <Label>透明度</Label>
                        <span className="tabular-nums text-muted-foreground">{options.opacity}%</span>
                      </div>
                      <Slider value={[options.opacity]} min={45} max={100} step={1} onValueChange={([value]) => updateOptions({ opacity: value })} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[12px]">
                        <Label>角度</Label>
                        <span className="tabular-nums text-muted-foreground">{options.angle}°</span>
                      </div>
                      <Slider value={[options.angle]} min={-25} max={25} step={1} onValueChange={([value]) => updateOptions({ angle: value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(positionLabels) as PositionKey[]).map((position) => (
                      <button
                        key={position}
                        type="button"
                        onClick={() => updateOptions({ position })}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-[12px] transition-colors',
                          options.position === position
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                            : 'border-border/50 hover:bg-muted/60'
                        )}
                      >
                        {positionLabels[position]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/85 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px]">批量进度</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} />
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">原始大小</p>
                  <p className="mt-1 font-semibold tabular-nums">{formatSize(totalOriginal)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">输出大小</p>
                  <p className="mt-1 font-semibold tabular-nums">{formatSize(totalOutput)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={processFiles} disabled={processing || !files.length || (needsStamp && !stampReady)}>
                  {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                  开始处理
                </Button>
                <Button variant="outline" onClick={downloadAll} disabled={!finishedFiles.length}>
                  <Download className="mr-2 h-4 w-4" />
                  全部
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/40 bg-card/85 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-[16px]">
                <FileImage className="h-4 w-4 text-emerald-500" />
                资质图片
              </CardTitle>
              <p className="mt-1 text-[12px] text-muted-foreground">支持 PNG、JPG、WEBP 等图片格式</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                <UploadCloud className="mr-2 h-4 w-4" />
                选择
              </Button>
              <Button variant="ghost" size="sm" onClick={clearFiles} disabled={!files.length}>
                <RotateCcw className="mr-2 h-4 w-4" />
                清空
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files)
                event.target.value = ''
              }}
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault()
                setDragActive(true)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragActive(false)
                addFiles(event.dataTransfer.files)
              }}
              className={cn(
                'flex min-h-[180px] w-full flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-colors',
                dragActive
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10'
                  : 'border-border/60 bg-background/60 hover:bg-muted/40'
              )}
            >
              <UploadCloud className="mb-3 h-10 w-10 text-emerald-500" />
              <span className="text-[15px] font-semibold">拖入资质图片或点击选择</span>
              <span className="mt-2 text-[12px] text-muted-foreground">处理后的文件默认输出为 JPG，压缩目标小于 1M</span>
            </button>

            {files.length > 0 && (
              <div className="mt-4 space-y-3">
                {files.map((item) => {
                  const overLimit = item.outputBlob ? item.outputBlob.size > oneMegabyte : item.file.size > oneMegabyte
                  return (
                    <div key={item.id} className="grid gap-3 rounded-xl border border-border/40 bg-background/70 p-3 sm:grid-cols-[64px_1fr_auto] sm:items-center">
                      <img src={item.outputUrl || item.previewUrl} alt={item.file.name} className="h-16 w-16 rounded-lg object-cover ring-1 ring-border/40" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[13px] font-semibold">{item.outputName || item.file.name}</p>
                          {item.status === 'done' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="mr-1 h-3 w-3" />完成</Badge>}
                          {item.status === 'processing' && <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" />处理中</Badge>}
                          {item.status === 'error' && <Badge variant="destructive">失败</Badge>}
                          {overLimit && item.status !== 'done' && <Badge variant="outline">需压缩</Badge>}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-[12px] text-muted-foreground">
                          <span>原始 {formatSize(item.file.size)}</span>
                          {item.outputBlob && <span>输出 {formatSize(item.outputBlob.size)}</span>}
                          {item.outputBlob && item.outputBlob.size <= oneMegabyte && <span className="text-emerald-600">小于 1M</span>}
                          {item.error && <span className="text-red-500">{item.error}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadFile(item)} disabled={item.status !== 'done'}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(item.id)} disabled={processing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
