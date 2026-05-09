import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'
import { db } from '@/lib/db'

// In-memory verification code store
// email -> { code, expiresAt, sentAt, attempts }
const codeStore = new Map<string, { code: string; expiresAt: number; sentAt: number; attempts: number }>()

const CODE_EXPIRY = 5 * 60 * 1000 // 5 minutes
const CODE_COOLDOWN = 60 * 1000 // 60 seconds between sends
const MAX_ATTEMPTS = 5

export { codeStore }

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: '请输入邮箱地址' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check if user exists in system
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      // Don't reveal whether user exists for security
      return NextResponse.json({ success: true, message: '验证码已发送' })
    }

    // Check cooldown
    const existing = codeStore.get(normalizedEmail)
    if (existing) {
      const elapsed = Date.now() - existing.sentAt
      if (elapsed < CODE_COOLDOWN) {
        const remainingSeconds = Math.ceil((CODE_COOLDOWN - elapsed) / 1000)
        return NextResponse.json({ error: `请${remainingSeconds}秒后重新发送` }, { status: 429 })
      }
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json({ error: '邮件服务未配置' }, { status: 500 })
    }

    // Generate 6-digit code
    const code = String(crypto.randomInt(100000, 1000000))

    // Store code
    codeStore.set(normalizedEmail, {
      code,
      expiresAt: Date.now() + CODE_EXPIRY,
      sentAt: Date.now(),
      attempts: 0,
    })

    // Send email via Resend
    const resend = new Resend(resendApiKey)
    const { error: sendError } = await resend.emails.send({
      from: '项目管理平台 <noreply@dxyx6888.com>',
      to: [normalizedEmail],
      subject: '登录验证码 - 项目管理系统',
      html: `
        <div style="margin:0;padding:0;background-color:#f0f4f8;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:48px 0;background:#f0f4f8;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:560px;max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                  <tr>
                    <td style="padding:0;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg,#0d9488,#059669);">
                        <tr>
                          <td style="padding:32px 36px 28px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                            <div style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.2);margin-bottom:12px;">
                              <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">PM</span>
                            </div>
                            <div style="font-size:14px;line-height:20px;color:rgba(255,255,255,0.8);">企业内部管理系统</div>
                            <div style="margin-top:8px;font-size:28px;line-height:36px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">登录验证码</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 36px 0 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                      <div style="font-size:15px;line-height:26px;color:#475569;">
                        您好，<span style="font-weight:600;color:#0f172a;">${user.name}</span>，您正在进行项目管理平台的登录验证，请在页面中输入以下验证码完成登录。
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 36px 0 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                      <div style="padding:28px 20px;border-radius:12px;background:linear-gradient(135deg,#f0fdf9,#ecfdf5);border:1px solid #bbf7d0;text-align:center;">
                        <div style="font-size:11px;line-height:16px;color:#6b7280;letter-spacing:2px;text-transform:uppercase;">VERIFICATION CODE</div>
                        <div style="margin-top:12px;font-size:42px;line-height:50px;font-weight:800;color:#059669;letter-spacing:14px;font-family:'Courier New',Courier,monospace;">${code}</div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 36px 0 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;">
                        <tr>
                          <td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
                            <span style="font-size:13px;color:#94a3b8;">登录邮箱</span>
                            <span style="float:right;font-size:13px;color:#1e293b;font-weight:500;">${user.email}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
                            <span style="font-size:13px;color:#94a3b8;">有效期</span>
                            <span style="float:right;font-size:13px;color:#1e293b;font-weight:500;">5 分钟</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:14px 18px;">
                            <span style="font-size:13px;color:#94a3b8;">状态</span>
                            <span style="float:right;font-size:13px;color:#059669;font-weight:600;">等待验证</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 36px 0 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                      <div style="padding:12px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
                        <div style="font-size:13px;line-height:22px;color:#92400e;">
                          <strong>安全提示：</strong>请勿向任何人泄露此验证码。如非本人操作，请忽略此邮件，您的账号安全不会受到影响。
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 36px 32px 36px;border-top:1px solid #f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;margin-top:24px;">
                      <div style="font-size:12px;line-height:20px;color:#94a3b8;text-align:center;">此邮件由系统自动发送，请勿直接回复<br/>© 2026 项目管理平台 · dxyx6888.com</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `,
    })

    if (sendError) {
      console.error('Resend error:', sendError)
      return NextResponse.json({ error: '邮件发送失败，请稍后重试' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '验证码已发送' })
  } catch (error) {
    console.error('Send code error:', error)
    return NextResponse.json({ error: '发送验证码失败' }, { status: 500 })
  }
}
