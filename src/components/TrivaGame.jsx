import React, { useState, useEffect } from "react";
import axios from "axios";

const TriviaGame = () => {
  // Main state variables for managing the trivia game
  const [questions, setQuestions] = useState([]); // Stores all trivia questions from API
  const [loading, setLoading] = useState(true); // Tracks loading state during API fetch
  const [error, setError] = useState(null); // Stores any error messages

  // Additional state variables for game functionality
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Tracks which question we're on
  const [selectedAnswer, setSelectedAnswer] = useState(null); // Stores user's selected answer
  const [score, setScore] = useState(0); // Tracks user's score
  const [showResult, setShowResult] = useState(false); // Controls whether to show if answer was correct
  const [gameOver, setGameOver] = useState(false); // Tracks if all questions have been answered

  // useEffect hook to fetch questions when component mounts
  useEffect(() => {
    const fetchQuestions = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);

        // Generate a session token first to avoid rate limiting
        // This helps manage rate limiting by ensuring we don't get duplicate questions
        const tokenResponse = await axios.get(
          "https://opentdb.com/api_token.php?command=request"
        );
        const token = tokenResponse.data.token;

        // Use the token in our questions request
        const response = await axios.get(
          `https://opentdb.com/api.php?amount=10&category=9&type=multiple&token=${token}`
        );

        if (response.data.response_code === 0) {
          setQuestions(response.data.results);
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (err) {
        // If we haven't retried too many times and it's a 429 error, try again
        if (retryCount < 3 && err.response?.status === 429) {
          console.log(`Retrying... Attempt ${retryCount + 1}`);
          // Wait for 2 seconds before retrying
          setTimeout(() => fetchQuestions(retryCount + 1), 2000);
          return;
        }

        setError(
          "Failed to fetch questions. Please try refreshing the page in a few moments."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []); // Empty dependency array means this runs once when component mounts

  // Function to handle when user selects an answer
  const handleAnswerSelect = (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    setSelectedAnswer(answer); // Store user's selection
    setShowResult(true); // Show whether answer was correct

    // Check if answer is correct and update score
    if (answer === currentQuestion.correct_answer) {
      setScore(score + 1);
    }

    // Wait 1.5 seconds before moving to next question
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setGameOver(true); // End game if all questions answered
      }
    }, 1500);
  };

  // Function to restart the game
  const handleRestartGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameOver(false);
  };

  // Show loading state
  if (loading) {
    return <div className="loading">Loading questions...</div>;
  }

  // Show error state if something went wrong
  if (error) {
    return (
      <div className="error" style={{ color: "red" }}>
        {error}
      </div>
    );
  }

  // Show game over screen when all questions are answered
  if (gameOver) {
    return (
      <div className="game-over">
        <h2>Game Over!</h2>
        <p>
          Your final score: {score} out of {questions.length}
        </p>
        <button onClick={handleRestartGame}>Play Again</button>
      </div>
    );
  }

  // Main game display
  if (questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    // Combine and shuffle correct and incorrect answers
    const allAnswers = [
      ...currentQuestion.incorrect_answers,
      currentQuestion.correct_answer,
    ].sort(() => Math.random() - 0.5);

    return (
      <div className="trivia-container">
        <h1>Trivia Questions</h1>
        <div className="score">
          Score: {score}/{questions.length}
        </div>
        <div className="question-container">
          <h3>
            Question {currentQuestionIndex + 1} of {questions.length}
          </h3>
          {/* Use dangerouslySetInnerHTML to properly render HTML entities from API */}
          <h4 dangerouslySetInnerHTML={{ __html: currentQuestion.question }} />

          <div className="answers-container">
            {allAnswers.map((answer, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(answer)}
                disabled={showResult}
                style={{
                  backgroundColor: showResult
                    ? answer === currentQuestion.correct_answer
                      ? "lightgreen"
                      : answer === selectedAnswer
                      ? "lightcoral"
                      : "black"
                    : "black",
                  margin: "5px",
                  padding: "10px",
                  cursor: showResult ? "default" : "pointer",
                }}
                dangerouslySetInnerHTML={{ __html: answer }}
              />
            ))}
          </div>

          {/* Show feedback when answer is selected */}
          {showResult && (
            <div className="feedback">
              {selectedAnswer === currentQuestion.correct_answer
                ? "Correct!"
                : "Incorrect!"}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null; // Return null if no questions loaded yet
};

export default TriviaGame;
