import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import {
  buildInvestmentRecommendations,
  DEFAULT_HORIZON_YEARS,
  DEFAULT_RISK,
  normalizeRisk,
  toNumber,
} from '@/lib/investment-recommendations';

export const dynamic = 'force-dynamic';

const buildProfileFromDb = async (userId) => {
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return null;

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [transactions, accounts] = await Promise.all([
    db.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: ninetyDaysAgo },
      },
    }),
    db.account.findMany({ where: { userId: user.id } }),
  ]);

  const totals = transactions.reduce(
    (acc, tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'INCOME') acc.income += amount;
      if (tx.type === 'EXPENSE') acc.expense += amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const months = 3;
  const monthlyIncome = totals.income / months;
  const monthlyExpenses = totals.expense / months;
  const netMonthly = monthlyIncome - monthlyExpenses;

  const accountBalanceTotal = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const emergencyFundMonths =
    monthlyExpenses > 0 ? accountBalanceTotal / monthlyExpenses : null;

  const savingsRate =
    monthlyIncome > 0 ? netMonthly / monthlyIncome : null;

  return {
    monthlyIncome,
    monthlyExpenses,
    netMonthly,
    savingsRate,
    accountBalanceTotal,
    emergencyFundMonths,
  };
};

const mergeProfile = (computed, override = {}) => {
  const merged = { ...computed, ...override };
  const monthlyIncome = toNumber(merged.monthlyIncome);
  const monthlyExpenses = toNumber(merged.monthlyExpenses);
  const netMonthly = toNumber(merged.netMonthly);

  const normalized = {
    monthlyIncome,
    monthlyExpenses,
    netMonthly: netMonthly ?? (monthlyIncome !== null && monthlyExpenses !== null
      ? monthlyIncome - monthlyExpenses
      : null),
    savingsRate: toNumber(merged.savingsRate),
    accountBalanceTotal: toNumber(merged.accountBalanceTotal),
    emergencyFundMonths: toNumber(merged.emergencyFundMonths),
    currency: merged.currency || 'INR',
  };

  if (normalized.savingsRate === null && normalized.monthlyIncome !== null && normalized.monthlyIncome > 0) {
    normalized.savingsRate = normalized.netMonthly !== null
      ? normalized.netMonthly / normalized.monthlyIncome
      : null;
  }

  if (
    normalized.emergencyFundMonths === null &&
    normalized.accountBalanceTotal !== null &&
    normalized.monthlyExpenses !== null &&
    normalized.monthlyExpenses > 0
  ) {
    normalized.emergencyFundMonths = normalized.accountBalanceTotal / normalized.monthlyExpenses;
  }

  return normalized;
};

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const riskTolerance = normalizeRisk(body?.riskTolerance || DEFAULT_RISK);
    const horizonYears = toNumber(body?.horizonYears) ?? DEFAULT_HORIZON_YEARS;

    const computedProfile = await buildProfileFromDb(userId);
    if (!computedProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const profile = mergeProfile(computedProfile, body?.profile || {});

    const recommendations = await buildInvestmentRecommendations({
      profile,
      riskTolerance,
      horizonYears,
    });

    return NextResponse.json({
      profile,
      recommendations,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const riskTolerance = normalizeRisk(searchParams.get('risk') || DEFAULT_RISK);
    const horizonYears = toNumber(searchParams.get('horizonYears')) ?? DEFAULT_HORIZON_YEARS;

    const computedProfile = await buildProfileFromDb(userId);
    if (!computedProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const profile = mergeProfile(computedProfile, {
      currency: searchParams.get('currency') || 'INR',
    });

    const recommendations = await buildInvestmentRecommendations({
      profile,
      riskTolerance,
      horizonYears,
    });

    return NextResponse.json({
      profile,
      recommendations,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
