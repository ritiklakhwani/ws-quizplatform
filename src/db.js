const dotenv = require("dotenv");
dotenv.config();
const { mongoose } = require("mongoose");
const { email } = require("zod");
const connect = process.env.CONNECTION_STRING;

mongoose.connect(connect);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "student"], required: true },
});

const quizQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String }],
  correctOptionIndex: { type: Number, required: true },
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: [quizQuestionSchema],
});

const user = mongoose.model("User", userSchema);
const quiz = mongoose.model("Quiz", quizSchema);

module.exports = { user, quiz };
