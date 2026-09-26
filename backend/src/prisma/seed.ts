import { PrismaClient, ResourceCategory } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Curated wellness activities. These are common, low-risk self-care techniques
 * written by hand; the LLM never generates activity instructions.
 * TODO(content review): have a qualified reviewer check wording, and add
 * Hindi/Telugu/Tamil translations (the `language` column supports them).
 */
const SOURCE = "MitraMind curated (general self-care technique)";

const resources: {
  slug: string;
  title: string;
  description: string;
  category: ResourceCategory;
  duration: number;
  instructions: string[];
}[] = [
  {
    slug: "box-breathing",
    title: "Box breathing",
    description: "A slow, even breathing pattern to help you pause and settle.",
    category: "BREATHING",
    duration: 3,
    instructions: [
      "Sit comfortably and let your shoulders drop.",
      "Breathe in slowly through your nose for a count of 4.",
      "Hold gently for a count of 4.",
      "Breathe out slowly for a count of 4.",
      "Hold for a count of 4, then repeat for about 3 minutes.",
    ],
  },
  {
    slug: "longer-exhale-breathing",
    title: "Longer exhale breathing",
    description: "Breathe out a little longer than you breathe in.",
    category: "STRESS",
    duration: 5,
    instructions: [
      "Sit or lie down somewhere comfortable.",
      "Breathe in through your nose for a count of 4.",
      "Breathe out slowly through your mouth for a count of 6.",
      "Continue for 5 minutes. If you feel dizzy, return to normal breathing.",
    ],
  },
  {
    slug: "five-senses-grounding",
    title: "5-4-3-2-1 grounding",
    description: "Use your senses to bring attention back to the present moment.",
    category: "GROUNDING",
    duration: 5,
    instructions: [
      "Name 5 things you can see.",
      "Name 4 things you can feel or touch.",
      "Name 3 things you can hear.",
      "Name 2 things you can smell.",
      "Name 1 thing you can taste. Take a slow breath.",
    ],
  },
  {
    slug: "progressive-muscle-relaxation",
    title: "Progressive muscle relaxation",
    description: "Tense and release muscle groups one at a time.",
    category: "STRESS",
    duration: 10,
    instructions: [
      "Sit or lie down. Start with your feet.",
      "Tighten the muscles for 5 seconds, then release for 10 seconds.",
      "Move up: calves, thighs, stomach, hands, arms, shoulders, face.",
      "Notice the difference between tension and release.",
    ],
  },
  {
    slug: "wind-down-routine",
    title: "Evening wind-down",
    description: "A short routine to help your mind slow down before bed.",
    category: "SLEEP",
    duration: 10,
    instructions: [
      "Put screens away and dim the lights.",
      "Write down anything on your mind, so you can leave it until tomorrow.",
      "Stretch gently for a couple of minutes.",
      "Take 10 slow breaths, then get into bed.",
    ],
  },
  {
    slug: "body-scan",
    title: "Body scan",
    description: "Slowly notice how each part of your body feels.",
    category: "SLEEP",
    duration: 10,
    instructions: [
      "Lie down and close your eyes if that is comfortable.",
      "Bring attention to your toes, then slowly move up through your body.",
      "Notice sensations without trying to change them.",
      "If your mind wanders, gently return to where you left off.",
    ],
  },
  {
    slug: "focus-sprint",
    title: "25-minute focus sprint",
    description: "One task, one timer, then a proper break.",
    category: "FOCUS",
    duration: 25,
    instructions: [
      "Choose a single task and write it down.",
      "Silence notifications and set a timer for 25 minutes.",
      "Work on only that task until the timer ends.",
      "Take a 5 minute break away from your screen.",
    ],
  },
  {
    slug: "study-worry-list",
    title: "Break down study pressure",
    description: "Turn a heavy study load into small, doable steps.",
    category: "STUDY_PRESSURE",
    duration: 10,
    instructions: [
      "List everything you need to study, without judging.",
      "Pick the three that matter most this week.",
      "Split each into a step you can finish in 30 minutes.",
      "Schedule the first step, then let the rest wait.",
    ],
  },
  {
    slug: "mindful-walk",
    title: "Mindful walk",
    description: "A short walk with attention on what you notice around you.",
    category: "GENERAL_WELLBEING",
    duration: 10,
    instructions: [
      "Step outside, if you can, and walk at an easy pace.",
      "Notice your footsteps and your breathing.",
      "Notice what you can see, hear and smell.",
      "When your mind drifts, bring attention back to your steps.",
    ],
  },
  {
    slug: "three-good-things",
    title: "Three good things",
    description: "Notice small things that went okay today.",
    category: "GENERAL_WELLBEING",
    duration: 5,
    instructions: [
      "Think about your day.",
      "Write down three things that went okay, however small.",
      "Next to each, write why it happened or what it meant to you.",
    ],
  },
];

async function main() {
  for (const r of resources) {
    await prisma.wellnessResource.upsert({
      where: { slug: r.slug },
      update: { ...r, language: "en", source: SOURCE },
      create: { ...r, language: "en", source: SOURCE },
    });
  }
  console.log(`Seeded ${resources.length} wellness resources.`);
}

main().finally(() => prisma.$disconnect());
