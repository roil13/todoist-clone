import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function createUser(input: {
  email: string;
  password: string;
  name?: string;
}) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.create({
    data: {
      email,
      name: input.name?.trim() || null,
      passwordHash,
      settings: { create: {} },
      projects: {
        create: {
          name: "Inbox",
          isInbox: true,
          color: "charcoal",
          order: 0,
        },
      },
    },
    include: { settings: true },
  });
}

export type SettingsInput = {
  theme?: string;
  weekStart?: number;
  timeZone?: string;
  dateLanguage?: string;
  dailyGoal?: number;
  weeklyGoal?: number;
  vacationMode?: boolean;
};

export async function getSettings(userId: string) {
  return prisma.userSettings.findUnique({ where: { userId } });
}

export async function updateSettings(userId: string, input: SettingsInput) {
  return prisma.userSettings.update({ where: { userId }, data: input });
}

/** The Inbox project is created for every user and is their default project. */
export async function getInboxProjectId(userId: string): Promise<string> {
  const inbox = await prisma.project.findFirst({
    where: { userId, isInbox: true },
    select: { id: true },
  });
  if (!inbox) throw new Error("Inbox project missing for user " + userId);
  return inbox.id;
}
