require("dotenv").config();
const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ port: 8080 });
const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;

const liveQuizzes = [
  {
    quizId: 1,
    title: "Node.js Basics",
    currentQuestionId: null,
    questions: [
      {
        id: 1,
        text: "What is Node.js?",
        options: ["Runtime", "Framework", "Library"],
        correctOptionIndex: 0,
      },
    ],
    users: {
      user1: { name: "Rahul", score: 0, answeredCurrent: false, ws: null },
      user2: { name: "Jane", score: 0, answeredCurrent: false, ws: null },
    },
    answers: {
      1: {},
    },
  },
];

wss.on("connection", (ws) => {
  console.log("New client trying to connect!");

  let userAuthenticated = false;
  let User = null;

  ws.on("message", (msg) => {
    try {
      const { type, payload } = JSON.parse(msg);

      if (type === "authenticate") {
        try {
          const token = payload.token;

          if (!token) {
            ws.send(
              JSON.stringify({
                type: "error",
                payload: { error: "Unauthorized" },
              })
            );
            return ws.close();
          }

          const decoded = jwt.verify(token, secret);

          if (!decoded.id || !decoded.email || !decoded.role) {
            ws.send(
              JSON.stringify({
                type: "error",
                payload: { error: "Unauthorized, token missing or invalid" },
              })
            );
            return ws.close();
          }

          User = { id: decoded.id, name: decoded.name, role: decoded.role };

          ws.send(
            JSON.stringify({
              type: "authenticated",
              payload: { success: true, data: User },
            })
          );

          userAuthenticated = true;
          return;
        } catch (e) {
          console.log(e);
          ws.send(
            JSON.stringify({
              type: "error",
              payload: { error: "Invalid token" },
            })
          );
          return ws.close();
        }
      }

      if (!userAuthenticated) {
        ws.send(
          JSON.stringify({
            type: "error",
            payload: { error: "Unauthorized, please authenticate first" },
          })
        );
        return ws.close();
      }

      if (type === "START_QUIZ") {
        if (User.role !== "admin") {
          return ws.send(
            JSON.stringify({
              type: "ERROR",
              success: false,
              message: "Invalid quizId or unauthorized",
            })
          );
        }

        ws.send(
          JSON.stringify({
            type: "QUIZ_STARTED",
            quizId: 1,
            message: "Quiz is now live",
          })
        );

        return;
      }

      if (type === "SHOW_QUESTION") {
        if (User.role !== "admin") {
          return ws.send(
            JSON.stringify({
              type: "ERROR",
              success: false,
              message: "Invalid questionId or unauthorized",
            })
          );
        }

        const { quizId, questionId } = payload;

        const quiz = liveQuizzes.find((q) => q.quizId === quizId);
        if (!quiz) {
          return ws.send(
            JSON.stringify({
              type: "error",
              payload: { error: "Invalid quizId" },
            })
          );
        }

        const question = quiz.questions.find((q) => q.id === questionId);
        if (!question) {
          return ws.send(
            JSON.stringify({
              type: "error",
              payload: { error: "Invalid questionId" },
            })
          );
        }

        quiz.currentQuestionId = questionId;

        broadcastToAllConnectedUsers(quizId, {
          type: "QUESTION",
          quizId,
          questionId,
          text: question.text,
          options: question.options,
        });

        return;
      }

      if (type === "SUBMIT_ANSWER") {
        if (User.role !== "student") {
          return ws.send(
            JSON.stringify({
              type: "error",
              payload: {
                error: "Unauthorized, only students can submit answers",
              },
            })
          );
        }

        const { quizId, questionId, selectedOptionIndex, userId } = payload;
        const quiz = liveQuizzes.find((q) => q.quizId === quizId);

        if (!quiz) {
          return ws.send(
            JSON.stringify({
              type: "error",
              payload: { error: "Invalid quizId" },
            })
          );
        }

        const user = quiz.users[userId];
        if (!user) {
          return ws.send(
            JSON.stringify({
              type: "error",
              payload: { error: "Invalid userId" },
            })
          );
        }

        const question = quiz.questions.find((q) => q.id === questionId);
        if (!question) {
          return ws.send(
            JSON.stringify({
              type: "error",
              payload: { error: "Invalid questionId" },
            })
          );
        }

        if (!quiz.answers[questionId]) {
          quiz.answers[questionId] = {};
        }

        if (user.answeredCurrent) {
          return ws.send(
            JSON.stringify({
              type: "ANSWER_ACK",
              accepted: false,
              reason: "already_answered",
              message: "You already answered this question.",
            })
          );
        }

        quiz.answers[questionId][userId] = selectedOptionIndex;
        user.answeredCurrent = true;

        const correct = question.correctOptionIndex === selectedOptionIndex;
        if (correct) user.score++;

        return ws.send(
          JSON.stringify({
            type: "ANSWER_ACK",
            accepted: true,
            correct,
            yourScore: user.score,
            message: correct ? "Correct answer!" : "Wrong answer!",
          })
        );
      }

      if (type === "SHOW_RESULT") {
        if (User.role !== "admin") {
          return ws.send(
            JSON.stringify({
              type: "error",
              payload: { error: "Unauthorized, only admins can show results" },
            })
          );
        }

        const { quizId, questionId } = payload;

        const quiz = liveQuizzes.find((q) => q.quizId === quizId);
        if (!quiz || quiz.currentQuestionId !== questionId) {
          return ws.send(
            JSON.stringify({
              type: "ERROR",
              success: false,
              message: "Invalid questionId or unauthorized",
            })
          );
        }

        const results = {};
        const answers = quiz.answers[questionId];

        for (let uid in answers) {
          const option = answers[uid];
          if (results[option] === undefined) results[option] = 1;
          else results[option]++;
        }

        return ws.send(
          JSON.stringify({
            type: "RESULTS",
            quizId,
            questionId,
            results,
          })
        );
      }
    } catch (e) {
      console.log("Error: ", e);
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { error: "Invalid message format" },
        })
      );
    }
  });
});

const broadcastToAllConnectedUsers = (quizId, data) => {
  const quiz = liveQuizzes.find((q) => q.quizId === quizId);
  if (!quiz) return;

  const msg = JSON.stringify(data);

  for (let id in quiz.users) {
    const user = quiz.users[id];
    if (user.ws) user.ws.send(msg);
  }
};
