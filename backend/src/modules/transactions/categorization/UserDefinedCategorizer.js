import { PrismaClient } from '@prisma/client';

const defaultPrisma = new PrismaClient();

export class UserDefinedCategorizer {
  constructor(prismaClient) {
    this.name = 'user-rule';
    this.prisma = prismaClient || defaultPrisma;
  }

  getMerchantKeyword(note) {
    if (!note) return null;
    const clean = note.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean.length > 2 ? clean : null;
  }

  async categorize(userId, note, allowedCategories) {
    const keyword = this.getMerchantKeyword(note);
    if (!keyword) return null;

    const userRule = await this.prisma.categoryRule.findUnique({
      where: {
        userId_pattern: {
          userId,
          pattern: keyword
        }
      }
    });

    if (userRule && allowedCategories.includes(userRule.category)) {
      return {
        category: userRule.category,
        confidence: 'high',
        strategy: this.name,
        reason: `Matched learned user-defined keyword rule "${keyword}"`
      };
    }

    return null;
  }
}
export default UserDefinedCategorizer;
