const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require('zod')
const { user, quiz } = require("./db");
const { zodSchema, singleQuestionSchema, zodLogin, quizSchema } = require("./zod");
const { authMiddleware, adminMiddleware } = require("./middleware");

const secret = process.env.JWT_SECRET;

app.use(express.json());


app.post("/api/auth/signup", async (req, res) => {
  try {
    const parsed = zodSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request schema",
      });
    }
    const data = parsed.data;

    const existingUser = await user.findOne({ email: data.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
        details: { email: "Already Exists" },
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await user.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      error: "Invalid request schema",
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const parsed = zodLogin.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request schema",
      });
    }
    const data = parsed.data;

    const existingUser = await user.findOne({ email: data.email });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        error: "user not found please signup first!",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
      },
      secret
    );

    return res.status(200).json({
      success: true,
      data: { token },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      error: "Invalid request schema",
    });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  try {
    const { id, name, email, role } = req;
    return res.status(200).json({
      success: true,
      data: { _id: id, name, email, role },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      error: "Unauthorized, token missing or invalid",
    });
  }
});


app.post("/api/quiz", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const parsed = quizSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request schema",
      });
    }
    const data = parsed.data;

    const created = await quiz.create({
      title: data.title,
      questions: data.questions.map((q) => ({
        text: q.text,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
      })),
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: created._id,
        title: created.title,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      error: "Invalid request schema",
    });
  }
});

app.post(
  "/api/quiz/:quizId/questions",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const quizId = req.params.quizId;
      const parsed = singleQuestionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid request schema",
        });
      }
      const data = parsed.data;

      const existingQuiz = await quiz.findOne({ _id: quizId });
      if (!existingQuiz) {
        return res
          .status(404)
          .json({ success: false, error: "Quiz not found" });
      }

      existingQuiz.questions.push(data);
      await existingQuiz.save();
      const last = existingQuiz.questions[existingQuiz.questions.length - 1];

      return res.status(201).json({
        success: true,
        data: {
          quizId: existingQuiz._id,
          question: {
            _id: last._id,
            text: last.text,
            options: last.options,
            correctOptionIndex: last.correctOptionIndex,
          },
        },
      });
    } catch (err) {
      console.error(err);
      return res
        .status(400)
        .json({ success: false, error: "Invalid request schema" });
    }
  }
);

app.get(
  "/api/quiz/:quizId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const quizId = req.params.quizId;
      const existingQuiz = await quiz.findOne({ _id: quizId });

      if (!existingQuiz) {
        return res
          .status(404)
          .json({ success: false, error: "Quiz not found" });
      }

      return res.status(200).json({
        success: true,
        data: {
          _id: existingQuiz._id,
          title: existingQuiz.title,
          questions: existingQuiz.questions,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server started running on port ${PORT}`);
});

module.exports = app;
