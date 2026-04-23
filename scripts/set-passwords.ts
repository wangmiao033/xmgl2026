import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  // Set initial passwords for existing users
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, password: true } })
  console.log(`Found ${users.length} users`)

  for (const user of users) {
    // Default password: xd2025
    const hashed = await hashPassword('xd2025')
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })
    console.log(`  Set password for ${user.name} (${user.email})`)
  }

  console.log('\nAll users updated! Default password: xd2025')
  console.log('\nLogin credentials:')
  for (const user of users) {
    console.log(`  ${user.email} / xd2025`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
