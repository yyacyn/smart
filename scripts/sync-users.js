// scripts/sync-users.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function syncClerkUsers() {
  try {
    console.log('Starting Clerk users sync...')
    
    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
    
    // Fetch users langsung dari Clerk API
    const response = await fetch('https://api.clerk.com/v1/users', {
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Clerk API error: ${response.status}`)
    }
    
    const users = await response.json()
    console.log(`Found ${users.length} users in Clerk`)

    // Sync each user to your database
    for (const user of users) {
      const email = user.email_addresses[0]?.email_address
      
      if (email) {
        try {
          await prisma.user.upsert({
            where: { 
              id: user.id  // Gunakan ID dari Clerk sebagai primary key
            },
            update: {
              email: email,
              name: `${user.first_name} ${user.last_name}`.trim(),
              image: user.profile_image_url,
            },
            create: {
              id: user.id,  // ID dari Clerk sebagai PK
              email: email,
              name: `${user.first_name} ${user.last_name}`.trim(),
              image: user.profile_image_url,
            },
          })
          console.log(`✅ Synced user: ${email} (ID: ${user.id})`)
        } catch (userError) {
          console.error(`❌ Error syncing user ${email}:`, userError.message)
        }
      } else {
        console.log(`⚠️  Skipping user ${user.id} - no email found`)
      }
    }
    
    console.log('✅ Successfully synced all users from Clerk!')
  } catch (error) {
    console.error('❌ Error syncing users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

syncClerkUsers()