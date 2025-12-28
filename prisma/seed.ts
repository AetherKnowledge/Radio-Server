import { DEFAULT_EMAIL } from "@/app/constants/defaultEmail";
import { signUp } from "@/lib/auth-client";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🌱 Seeding admin user...");

  await signUp.email(
    {
      email: DEFAULT_EMAIL,
      password: "admin123",
      name: "Admin",
    },
    {
      onError: (ctx) => {
        console.error(`Failed to create admin user: ${ctx.error.message}`);
      },
    }
  );

  await prisma.user.update({
    where: { email: "admin@admin.com" },
    data: { role: "admin" },
  });
}

main()
  .catch((err) => {
    console.error("❌ Error during seeding:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
