# Fitnex — End-to-End User Journeys (USER_FLOW.md)

This document visualizes the complete step-by-step user journeys through Fitnex.

---

## Flow 1: New User Onboarding & Registration

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Browser)
    participant UI as Fitnex Frontend
    participant API as Fitnex Backend
    participant Mail as Mailtrap SMTP
    participant DB as MongoDB

    User->>UI: Lands on Onboarding Page
    User->>UI: Enters Age, Sex, Height, Weight, Activity Level & Goal
    UI->>API: POST /onboarding/calculate
    API-->>UI: Returns BMR, TDEE, Target Calories & Macros
    UI-->>User: Displays Interactive Macro & Calorie Breakdown
    User->>UI: Clicks "Create Account to Save Profile"
    User->>UI: Enters Name, Email, Password
    UI->>API: POST /auth/signup
    API->>DB: Hashes password, saves User (isEmailVerified=false)
    API->>Mail: Dispatches 6-Digit OTP Email
    API-->>UI: Returns 201 Created + JWT Tokens
    UI-->>User: Navigates to 6-Digit Verification Code Screen
    User->>UI: Enters 6-Digit Code
    UI->>API: POST /auth/verify-email
    API->>DB: Marks isEmailVerified=true
    API-->>UI: Returns 200 OK (Account Verified)
    UI->>API: POST /onboarding/save (Attaches profile stats)
    API->>DB: Saves onboarding profile to User
    UI-->>User: Enters Dashboard / Exercises Library
```

---

## Flow 2: Exploring Movements & Building a Workout

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant UI as Exercises UI
    participant API as Backend API

    User->>UI: Visits /exercises
    UI->>API: GET /exercises/facets
    UI->>API: GET /exercises?page=1&limit=24
    API-->>UI: Returns Body Parts, Targets & First 24 Movements
    User->>UI: Filters by "chest" & searches "bench press"
    UI->>API: GET /exercises?bodyPart=chest&search=bench
    API-->>UI: Returns matching movements (sub-20ms)
    User->>UI: Clicks "Add to Workout" on Flat Barbell Bench Press
    UI->>API: POST /workouts/current/items { exerciseId: "0025" }
    API-->>UI: Returns updated workout draft (3 sets added)
    User->>UI: Navigates to Workout Builder
    UI->>API: GET /workouts/current
    API-->>UI: Renders active draft with sets and target weights
```

---

## Flow 3: Enrolling & Progressing in a Training Plan

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant UI as Plans UI
    participant API as Backend API

    User->>UI: Visits /plans
    UI->>API: GET /plans
    API-->>UI: Returns 9 Pre-Built Training Programs
    User->>UI: Selects "Spartan Chest Armor" and clicks "Enroll"
    UI->>API: POST /plans/enroll { planId: "chest-armor", daysPerWeek: 4 }
    API-->>UI: Returns active enrollment (Week 1, Day 0)
    User->>UI: Completes Monday Chest Workout
    UI->>API: POST /plans/active/progress { dayIndex: 0, week: 1 }
    API-->>UI: Advances active plan to Day 1, records completion date
```
