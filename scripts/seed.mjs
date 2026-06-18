import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

function dayISO(offset = 0) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

async function main() {
  const email = "demo@example.com";
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      email,
      name: "Demo",
      passwordHash: await bcrypt.hash("demo1234", 10),
      settings: { create: { dailyGoal: 5, weeklyGoal: 25 } },
      projects: { create: { name: "Inbox", isInbox: true } },
    },
  });
  const userId = user.id;

  const work = await prisma.project.create({
    data: { userId, name: "Work", color: "blue", order: 1, isFavorite: true },
  });
  const home = await prisma.project.create({
    data: { userId, name: "Home", color: "green", order: 2 },
  });

  const todo = await prisma.section.create({ data: { userId, projectId: work.id, name: "To do", order: 0 } });
  const doing = await prisma.section.create({ data: { userId, projectId: work.id, name: "In progress", order: 1 } });

  const urgent = await prisma.label.create({ data: { userId, name: "urgent", color: "red" } });
  await prisma.label.create({ data: { userId, name: "errand", color: "orange", order: 1 } });

  await prisma.task.create({
    data: {
      userId, projectId: work.id, sectionId: todo.id, content: "Write quarterly report",
      priority: 1, dueDate: dayISO(0), order: 0,
      labels: { create: [{ labelId: urgent.id }] },
    },
  });
  await prisma.task.create({
    data: { userId, projectId: work.id, sectionId: doing.id, content: "Review pull requests", priority: 2, dueDate: dayISO(1), order: 0 },
  });
  const standup = await prisma.task.create({
    data: {
      userId, projectId: work.id, sectionId: todo.id, content: "Team standup", priority: 3,
      dueDate: dayISO(0), recurrenceRule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", isRecurring: true,
      dueString: "every weekday", order: 1,
    },
  });
  await prisma.task.create({
    data: { userId, projectId: work.id, parentId: standup.id, content: "Prepare update notes", priority: 4, order: 0 },
  });
  await prisma.task.create({
    data: { userId, projectId: home.id, content: "Buy groceries", priority: 4, dueDate: dayISO(2), order: 0 },
  });

  await prisma.filter.create({ data: { userId, name: "Priority today", query: "today & p1", color: "red", isFavorite: true } });

  console.log(`Seeded demo user: ${email} / demo1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
