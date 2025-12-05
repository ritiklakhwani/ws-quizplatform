const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const { quiz } = require("./db");
const secret = process.env.JWT_SECRET;
const wss = new WebSocketServer({ port: 8080 });

const liveQuizzes = {
  quiz1: {
    quizId: 1,
    title: "Node.js Basics",
    currentQuestionId: null,
    questions: [
      {
        id: 1,
        text: "What is Node.js?",
        options: ["Runtime", "Framework", "Library"],
        correctOptionIndex: 0,
      }
    ],
    users: {
      user1: { ws, name: "Rahul", score: 0, answeredCurrent: false },
      user2: { ws, name: "Jane", score: 0, answeredCurrent: false }
    },
    answers: {
      1: {} // userId -> selectedOptionIndex
    }
  }
};

wss.on("connection", (ws) => {
  console.log("New client trying to connect!");
  ws.on("message", (message) => {
    try {
      const { type, payload } = JSON.parse(message);

      if (type === "authenticate") {
       try {
         const { token } = payload.token;

        if (!token) {
          ws.send(
            JSON.stringify({
              type: "error",
              payload: { error: "Unauthorized" },
            })
          );
          ws.close();
          return;
        }

        const decoded = jwt.verify(token, secret);

        if (!decoded.id || !decoded.email || !decoded.role) {
          ws.send(
            JSON.stringify({
              type: "error",
              payload: { error: "Unauthorized, token missing or invalid" },
            })
          );
          ws.close();
          return;
        }

       } catch (error) {
        
       }
      }

      if (type === "START_QUIZ") {
      } else if (type === "SHOW_QUESTION") {
      } else if (type === "SUBMIT_ANSWER") {
      } else if (type === "SHOW_RESULT") {
      }
    } catch (error) {}
  });

  ws.on("close", () => {});
});

const broadcastToQuiz = (quizId, data) => {};
