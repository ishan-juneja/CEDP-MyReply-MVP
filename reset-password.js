const { PrismaClient } = require('@formbricks/database');

async function resetPassword() {
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'ishanj101@gmail.com' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    const newPasswordHash = '$2b$10$tgQ0BJdcXYMEM59WOFwhw.sgzBnK3b4inch5sUU3JaGZLrNyroBy2';

    await prisma.user.update({
      where: { email: 'ishanj101@gmail.com' },
      data: { password: newPasswordHash }
    });

    console.log('✅ Password successfully reset for ishanj101@gmail.com');
    console.log('🔑 New password: Password123!');

  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();