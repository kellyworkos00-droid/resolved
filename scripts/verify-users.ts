// Quick script to verify database users
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log('\n✅ Database connection successful!');
    console.log(`\n📊 Found ${users.length} users in database:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}`);
      console.log('');
    });

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyUsers();
