Feature: Quiz auto-grading
  As a student in a TutorHub class
  I want my quiz attempt graded automatically
  So that I see my score immediately instead of waiting for the teacher

  Background:
    Given a published quiz "Algebra Basics" with 4 questions

  Scenario: Answering every question correctly
    When the student submits answers that match every correct option
    Then the recorded score should be 100

  Scenario: Answering half the questions correctly
    When the student submits answers that match exactly 2 of the 4 correct options
    Then the recorded score should be 50

  Scenario: Submitting a second attempt at the same quiz
    Given the student has already attempted "Algebra Basics"
    When the student submits the quiz again
    Then the request should be rejected with status 409

  Scenario: A quiz with no questions never produces a broken score
    Given a published quiz "Empty Quiz" with 0 questions
    When the student submits an empty set of answers
    Then the recorded score should be 0
