# Real-Time Forum

## Overview

The **Real-Time Forum** is a fully functional web application that allows users to register, log in, create posts, comment on posts, and exchange private messages in real-time. This forum is built with a focus on WebSockets for seamless communication and a single-page application (SPA) approach for a smooth user experience.

## Repository

[Project Repository](https://learn.zone01oujda.ma/git/aelhadda/real-time-forum)

## Technologies Used

- **SQLite** - Database management system for data storage
- **Golang** - Backend logic and WebSocket management
- **JavaScript** - Frontend event handling and WebSocket communication
- **HTML** - Structuring the page elements
- **CSS** - Styling the user interface

## Features

### 1. Registration and Login

- Users must register before accessing the forum.
- Required registration fields:
  - Nickname
  - Age
  - Gender
  - First Name
  - Last Name
  - Email
  - Password
- Login can be done using either **nickname** or **email** with a password.
- Users can log out from any page.

### 2. Posts and Comments

- Users can create new posts with categories.
- Posts are displayed in a **feed format**.
- Users can comment on posts.
- Comments are only visible when a user clicks on a post.

### 3. Private Messaging System

- Real-time private messaging using WebSockets.
- A chat section that shows online/offline users.
- Sorting users based on:
  - Last message sent (similar to Discord)
  - Alphabetical order for new users with no messages.
- Chat section always visible.
- Clicking on a user loads previous messages.
- Chat history displays:
  - Last 10 messages initially
  - Additional messages loaded on scroll (Throttle/Debounce applied)
- Messages include:
  - Timestamp
  - Sender's username
- Instant message notifications without refreshing the page.

## Application Structure

```
📂 project-root
 ├── 📁 backend  (Golang WebSockets & API)
 ├── 📁 frontend (JavaScript SPA, HTML, CSS)
 ├── 📁 database (SQLite database)
 ├── README.md  (Project Documentation)
```

## Installation & Setup

### Prerequisites

- **Go** (Latest version)
- **SQLite3**
- **Node.js & npm**

### Steps

1. Clone the repository:
   ```sh
   git clone https://learn.zone01oujda.ma/git/aelhadda/real-time-forum.git
   cd real-time-forum
   ```
2. Run project:
    go mod tidy
    go run .

## Allowed Packages

- **All standard Go packages**
- **Gorilla WebSocket**
- **SQLite3**
- **bcrypt**
- **UUID**

### Restrictions

- Do not use frontend frameworks like React, Angular, or Vue.

## Learning Objectives

This project will help you learn about:

- **Web Fundamentals:**
  - HTML
  - HTTP
  - Sessions and cookies
  - CSS
- **Backend & Frontend:**
  - DOM Manipulation
  - Go Routines & Channels
- **WebSockets:**
  - Go WebSockets
  - JavaScript WebSockets
- **SQL Databases:**
  - SQL language
  - Database manipulation

## Contribution

Feel free to contribute by submitting pull requests or reporting issues.

## License

This project is licensed under the MIT License.

