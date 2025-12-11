const { z } = require("zod");

const zodSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "student"]),
});

const zodLogin = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const singleQuestionSchema = z.object({
  text: z.string(),
  options: z.array(z.string()).min(2),
  correctOptionIndex: z.number().int().nonnegative()
});

const quizSchema = z.object({
  title: z.string().min(3),
  questions: z
    .array(
      z.object({
        text: z.string().min(3),
        options: z.array(z.string()).min(2),
        correctOptionIndex: z.number().min(0),
      })
    )
    .min(1),
});

module.exports = { zodSchema, singleQuestionSchema, zodLogin, quizSchema };
