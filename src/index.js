const dotenv = require("dotenv");
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const { user, quiz } = require("./db");
const { z, success } = require("zod");
const jwt = require("jsonwebtoken");
const { zodSchema, zodLogin, quizSchema } = require("./zod");
const { authMiddleware, adminMiddleware } = require("./middleware");
const { is } = require("zod/locales");
const secret = process.env.JWT_SECRET;
dotenv.config();

app.use(express.json());

//Auth Routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { success, data } = zodSchema.safeParse(req.body);

    if (!success) {
      return res.status(400).json({ error: "Invalid data" });
    }

    const existingUser = await user.findOne({ email: data.email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
        details: { email: "Already Exists" },
      });
    }

    const hashedPasssword = await bcrypt.hash(data.password, 10);

    const newUser = await user.create({
      name: data.name,
      email: data.email,
      password: hashedPasssword,
      role: data.role,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      error: "Invalid request schema",
      details: { email: "Invalid email format" },
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { success, data } = zodLogin.safeParse(req.body);

    console.log(data);

    if (!success) {
      return res.status(400).json({ error: "Invalid data" });
    }

    const existingUser = await user.findOne({
      email: data.email,
    });

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

    res.status(200).json({
      success: true,
      data: { token: token },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      error: "Invalid request schema",
      details: { email: "Invalid email format" },
    });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  try {
    const { id, name, email, role } = req;
    res.status(200).json({
      success: true,
      data: { _id: id, name: name, email: email, role: role },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      error: "Unauthorized, token missing or invalid",
    });
  }
});

//Quiz Routes
app.use(adminMiddleware);
app.post("/api/quiz", async (req, res) => {
  try {
    const { success, data } = quizSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "Unauthorized, admin access required",
      });
    }
    const Quiz = await quiz.create({
      title: data.title,
      questions: data.questions,
    });
    res.status(201).json({
      success: true,
      data: {
        success: true,
        data: { _id: Quiz._id, title: Quiz.title },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, error: "Invalid request schema" });
  }
});

app.post("/api/quiz/:quizId/questions", async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const { success, data } = quizSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: "Unauthorized, admin access required",
      });
    }

    const existingQuiz = await quiz.findOne({ _id: quizId });

    if (!existingQuiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    existingQuiz.questions.push({
      title: data.questions[0].title,
      options: data.questions[0].options,
      correctOptionIndex: data.questions[0].correctOptionIndex,
    });
    await existingQuiz.save();
    res.status(200).json({
      success: true,
      data: {
        quizId: existingQuiz._id,
        question: {
          _id: existingQuiz.questions[existingQuiz.questions.length - 1]._id,
          title:
            existingQuiz.questions[existingQuiz.questions.length - 1].title,
          options:
            existingQuiz.questions[existingQuiz.questions.length - 1].options,
          correctOptionIndex:
            existingQuiz.questions[existingQuiz.questions.length - 1]
              .correctOptionIndex,
        },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, error: "Invalid request schema" });
  }
});

app.get("/api/quiz/:quizId", async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const existingQuiz = await quiz.findOne({ _id: quizId });

    if (!existingQuiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        quizId: existingQuiz._id,
        title: existingQuiz.title,
        questions: existingQuiz.questions.map((q) => ({
          _id: q._id,
          title: q.title,
          options: q.options,
        })),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      error: "Quiz not found",
    });
  }
});

app.listen(3000, () => {
  console.log("server started running on port 3000");
});
