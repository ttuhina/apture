# Apture: Appointment Scheduling System

Apture is a sleek and efficient appointment scheduling application designed for service-based businesses like medical clinics, salons, or consultancy services. It provides a seamless interface for clients to book appointments and for service providers to manage their schedules, streamlining the entire booking process from request to confirmation.

---
![client dashboard](https://github.com/ttuhina/apture/blob/main/screenshots/client%20dashboard.png)
## ✨ Features

This application is packed with features to ensure a smooth scheduling experience for both clients and providers.

* **🔐 Secure User Authentication**: Robust, token-based authentication using **JSON Web Tokens (JWT)** for secure signup, login, and session management. All user passwords are encrypted using the industry-standard **bcrypt** hashing algorithm.

* **👤 Role-Based Access Control (RBAC)**: Distinct interfaces and functionalities for **Clients** and **Providers**. The system dynamically serves the appropriate dashboard and permissions based on the user's role.

<p float="left">
  <img src="https://github.com/ttuhina/apture/blob/main/screenshots/login.png" width="48%" />
</p>

* **📅 Interactive Dashboards**:
    * **For Clients**: A clean dashboard to view upcoming appointments, search for providers by various criteria, book new appointments, and manage personal profile information.
    * **For Providers**: A comprehensive dashboard to manage incoming appointment requests, view a calendar of booked slots, set and update their availability, and manage their professional profile.

<p float="left">
  <img src="https://github.com/ttuhina/apture/blob/main/screenshots/client%20dashboard.png" width="48%" />
  <img src="https://github.com/ttuhina/apture/blob/main/screenshots/provider%20dashboard.png" width="48%" />
</p>

* **🔍 Advanced Provider Search**: Clients can easily find providers using a flexible search feature that queries by name, email, or specialization, allowing for quick and efficient matching.

* **🗓️ Comprehensive Appointment Management**:
    * Clients can request appointments based on real-time provider availability.
    * Providers have the ability to **approve** or **reject** incoming requests directly from their dashboard.
    * Full CRUD (Create, Read, Update, Delete) operations for appointments, with clear status tracking (`pending`, `approved`, `rejected`, `booked`).

<p float="left">
  <img src="https://github.com/ttuhina/apture/blob/main/screenshots/client%20search.png" width="48%" />
  <img src="https://github.com/ttuhina/apture/blob/main/screenshots/provider%20requests.png" width="48%" />
</p>

* **⏰ Dynamic Availability Management**: Providers can set their weekly working hours and break times through an intuitive interface. This availability is then reflected on the client-side booking system to prevent scheduling conflicts.

<p float="left">
  <img src="https://github.com/ttuhina/apture/blob/main/screenshots/provider%20timings.png" width="48%" />
  <img src="https://github.com/ttuhina/apture/blob/main/screenshots/provider%20profile.png" width="48%" />
</p>

* **🔔 Real-time Notifications**: The backend is structured to support real-time notifications using **Socket.io** for instant updates on appointment status changes (e.g., when a request is approved or a booking is confirmed).

* **📆 FullCalendar Integration**: A visual, interactive calendar is integrated into both dashboards, providing a clear and organized view of all scheduled appointments.



## 🛠️ Technical Stack

The project is built with a modern, robust, and scalable technology stack:

* **Backend**: Node.js with the Express.js framework for building a fast and scalable RESTful API.
* **Database**: MySQL, a reliable and widely-used relational database management system.
* **Authentication**: JSON Web Tokens (JWT) for stateless and secure user authentication.
* **Password Hashing**: `bcrypt` for securely hashing and salting user passwords.
* **Frontend**: Vanilla HTML5, CSS3, and JavaScript for a lightweight and performant user interface.
* **Calendar**: The powerful and customizable FullCalendar.js library.
* **Environment Management**: `dotenv` for managing environment variables securely.
* **Middleware**: `cors` for enabling Cross-Origin Resource Sharing.

---

## 🗄️ Database Schema

The application's database is designed to logically manage users, their roles, and the entire appointment lifecycle. The schema is centered around the `users` table, with other tables branching out to handle specific functionalities.

![Database ERD](https://github.com/ttuhina/apture/blob/main/screenshots/db.png)

* **`users`**: This is the central table, storing essential user information like `name`, `email`, `phone`, and the `password_hash`. The `role` column (`client` or `provider`) is crucial for distinguishing between user types and implementing RBAC.
* **`providers`**: This table extends the `users` table via a one-to-one relationship on `user_id`. It holds provider-specific details such as `specialization`, `location`, `bio`, and `rating`.
* **`availability`**: Each provider can define their working days and times. This table stores records for each available day of the week (`day_of_week`) along with `start_time`, `end_time`, and optional break times (`break_start`, `break_end`).
* **`appointment_requests`**: When a client requests an appointment, a record is created here. It links a `client_id` and `provider_id` and has a `status` (`pending`, `approved`, `rejected`) to track the request's progress through the approval workflow.
* **`appointments`**: Once a request is approved, it becomes a formal appointment in this table. It links the client and provider and includes the final `appointment_date`, `appointment_time`, and its current status (`booked`, `cancelled`, `completed`).
* **`notifications`**: Designed to store notification messages for users, linked via `user_id`.

---

## ⚙️ API Endpoints

The application's functionality is exposed through a well-defined RESTful API.

| Method | Endpoint                                     | Description                                          |
| :----- | :------------------------------------------- | :--------------------------------------------------- |
| `POST` | `/api/signup`                                | Register a new user (client or provider).            |
| `POST` | `/api/login`                                 | Authenticate a user and receive a JWT.               |
| `GET`  | `/api/user/:userId`                          | Fetch a user's basic profile information.            |
| `PUT`  | `/api/user/:userId`                          | Update a client's profile information.               |
| `GET`  | `/api/providers/search`                      | Search for providers by name, email, or specialty.   |
| `GET`  | `/api/provider-profile/:userId`              | Get a specific provider's detailed profile.          |
| `PUT`  | `/api/provider-profile/:userId`              | Update a provider's professional profile.            |
| `POST` | `/api/provider-availability`                 | Set or update a provider's working hours.            |
| `GET`  | `/api/providers/:userId/availability`        | Fetch a provider's availability schedule.            |
| `POST` | `/api/appointment-requests`                  | Submit an appointment request to a provider.         |
| `GET`  | `/api/appointment-requests/provider/:userId` | Get all pending appointment requests for a provider. |
| `POST` | `/api/appointment-requests/respond`          | Approve or reject a specific appointment request.    |
| `GET`  | `/api/appointments/:userId`                  | Get all booked appointments for a given user.        |

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Node.js installed (v14 or higher recommended)
* NPM (comes with Node.js)
* A running MySQL server instance

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/appointly.git](https://github.com/your-username/appointly.git)
    cd appointly
    ```

2.  **Install backend dependencies:**
    ```sh
    npm install
    ```

3.  **Set up the database:**
    * Create a new database in your MySQL server (e.g., `appointly_db`).
    * Use the provided ERD to create the necessary tables: `users`, `providers`, `availability`, `appointment_requests`, `appointments`, and `notifications`. Ensure all columns, data types, and relationships are set up correctly.

4.  **Configure Environment Variables:**
    * Create a `.env` file in the root directory of the project.
    * Add the following configuration, replacing the placeholder values with your actual database credentials and a secure secret key:
        ```env
        PORT=3000
        DB_HOST=localhost
        DB_USER=your_db_user
        DB_PASSWORD=your_db_password
        DB_NAME=appointly_db
        JWT_SECRET=your_super_secret_jwt_key_that_is_long_and_random
        ```

5.  **Run the server:**
    ```sh
    npm start
    ```
    The server will start, and you can access the application at `http://localhost:3000`.

---

## 📁 Project Structure

This project follows a modular structure, clearly separating frontend files from backend logic for better readability, scalability, and maintenance.

```
/
├── frontend/
│   ├── client_dashboard.html         # Client-side dashboard UI
│   ├── provider_dashboard.html       # Provider-side dashboard UI
│   ├── provider_appointments.html    # Appointment request management UI
│   ├── login.html                    # Login interface
│   ├── styles.css                    # Shared styles for frontend
│   └── script.js                     # Shared JavaScript logic
├── node_modules/                     # Installed dependencies
├── .env                              # Environment variables (excluded from version control)
├── db.js                             # MySQL database connection setup
├── package.json                      # Project metadata and dependencies
├── package-lock.json                 # Exact dependency versions
└── server.js                         # Main Express server file with API routes
```
