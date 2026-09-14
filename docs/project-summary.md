# Royal Edit Operations Hub - Project Documentation

### 1. What was built
The **Royal Edit Operations Hub** is a branded, internal web application designed to manage the agency's operational workflows. It serves as a unified dashboard for organizing staff members, managing client relationships, tracking project lifecycles, assigning tasks with strict deadlines, and generating automated project-level reports. 

### 2. The problem it solves
Creative and media teams frequently rely on fragmented tools—spreadsheets, informal messages, and disconnected email threads. This leads to unclear task ownership, missed deadlines, and difficult project reporting. 
This application solves those issues by providing a single source of truth:
*   **Team Capacity:** Tracks staff roles and active/inactive statuses.
*   **Delivery Context:** Links every project directly to a client record and their primary contact.
*   **Accountability:** Provides clear task assignment, reassignment, and automated in-app/email notifications so handoffs are never missed.
*   **Reporting:** Replaces manual updates with an automated, downloadable PDF project report.

### 3. System architecture
The application uses a modern client-server architecture with end-to-end type safety:
*   **Frontend Interface:** React + TypeScript application communicating via remote procedure calls (tRPC) rather than manual REST endpoints.
*   **Backend Server:** An Express Node.js server that handles validation, business logic, and database operations.
*   **Database Layer:** Drizzle ORM interfaces with a Turso (libSQL) database for relational data storage.
*   **Asynchronous Jobs:** The Node server acts as an orchestrator that triggers **Nodemailer** for email delivery and spins up a **Python subprocess** (using ReportLab) to generate PDF reports on demand.

### 4. Technologies used
*   **Frontend:** React 19, TypeScript, Tailwind CSS, Radix UI (for accessible component primitives).
*   **Backend:** Node.js, Express, tRPC (for typed client-server contracts).
*   **Database:** Turso (libSQL) combined with Drizzle ORM.
*   **Authentication:** Custom Turso-backed sessions with `bcryptjs` for password hashing (no third-party OAuth dependency).
*   **Automation & Reporting:** Python 3 + ReportLab (PDF generation), Nodemailer (email delivery).
*   **Package Management:** pnpm.

### 5. How to run/use it
**Setup & Execution:**
1. Configure the environment variables: Provide `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, and SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL`).
2. Run database migrations: Execute `pnpm db:push` to apply the schema to the Turso database.
3. Start the application: Run `pnpm dev` to spin up the local development server. 

**Standard Workflow:**
1. **Onboard:** The Administrator adds a team member; the system automatically emails them a secure setup link.
2. **Setup:** The Admin adds a Client and creates a linked Project.
3. **Execute:** Tasks are created and assigned to team members. The system automatically sends an email and an in-app notification.
4. **Track:** Team members update task statuses (e.g., "Started", "Blocked", "Completed"), triggering notifications back to the Administrator.
5. **Report:** The Admin selects "Download project PDF" to run the Python generator and export the latest project status.

### 6. Challenges encountered
*   **Polyglot Architecture:** Supporting a server-side Python report generator within a primarily Node-based application environment. This required ensuring that the deployment environment (via Docker or serverless Vercel runtimes) correctly bundled Python 3 and ReportLab alongside Node.js.
*   **State Design:** Designing the user interface to look professional and intuitive even when the database is entirely empty. This was solved by implementing guided onboarding sequences and intentional "empty states" rather than relying on fabricated operational records.
*   **Secure Onboarding:** Creating a robust, secure invitation system where users do not have access until they consume a cryptographic token sent via email to set their initial password.

### 7. What I would improve in the next version
*   **File Handling & Storage:** Integrate object storage (like AWS S3 or Cloudflare R2) so project briefs, deliverables, and approval files can be attached directly to projects and tasks.
*   **Enhanced Email Reliability:** Implement delivery retries, bounce handling, and external provider monitoring for the Nodemailer SMTP integration to guarantee assignment delivery.
*   **Richer Project Views:** Add dedicated project detail pages featuring Gantt chart timelines, comment threads, and detailed audit histories for status changes.
*   **Scheduled Reporting:** Evolve the Python PDF generator to automatically compile and email weekly workload analytics and capacity reports to administrators.
*   **Mobile Companion:** Reuse the fully-typed tRPC backend to build a React Native mobile app focused specifically on on-the-go notifications and status updates for team members.
