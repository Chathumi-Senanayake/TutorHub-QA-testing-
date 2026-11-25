@knownissue
Feature: Class seat capacity (see Testing/Member-4/Defects/Issue-1-Class-Capacity-Not-Enforced)
  As a teacher
  I want TutorHub to stop me from over-filling a class
  So that a class never ends up with more students than maxStudents seats

  Scenario: Approving a student when the class is already full
    Given a class with maxStudents set to 15
    And the class already has 15 approved students
    When the teacher approves one more pending enrollment request
    Then today the request is still approved, because no capacity check exists yet
