# ProjectForge

## A simple idea, done seriously

ProjectForge exists for one reason: **to prove that real work actually happened**.
Not productivity. Not motivation. Not vibes.
Just clear, honest proof.


## Why this exists
Everywhere you look, people are asked the same question:

> “Did you really do the work?”

Electricians, freelancers, delivery workers, employees, students, service professionals — everyone runs into this.

Right now, proof usually means screenshots, photos, PDFs, or messages. And everyone knows the truth:
* Screenshots can be edited
* Files can be replaced
* Logs can be deleted
* Claims can be faked

ProjectForge was built to end that ambiguity.

## What ProjectForge actually does
ProjectForge is a web app where:
* You create a task
* You complete real steps
* You upload real proof
* The system locks that proof with cryptographic hashes
* Every action is permanently logged

If anything changes later, it shows.
No hiding. No rewriting history.


## Who this is for
This is for anyone who wants their work to speak for itself:
* Electricians & technicians
* Field workers & service staff
* Freelancers & contractors
* Employees & interns
* Students
* Small businesses
* Individuals

If you can do the work, ProjectForge helps you prove it.



## How tasks work (in plain terms)
A **task** is one piece of work you want to prove.

Each task includes:
* A title
* Clear steps
* Proof files (photos or PDFs)
* A status
* A shareable link

You complete the steps, upload proof, and mark the task done.

That’s it.


## Proof files & tamper detection
When you upload a file:
* The system generates a unique hash
* That hash is stored in the database
* The file becomes verifiable

If the file is ever replaced:
* A new hash is generated
* The old hash is preserved
* The task is automatically **flagged**

The task no longer says “Completed”.
It clearly shows **“Flagged – Requires Attention”**.

Nothing is hidden.



## Audit logs (they don’t disappear)
Every important action is recorded:
* Task creation
* Proof upload
* File replacement
* Status change
* Security changes

Audit logs are:
* Append-only
* Permanent
* Not editable
* Not deletable

Even you can’t erase your own history.

That’s the point.

## Sharing your work
Every completed task generates a link.

By default, it’s **Restricted**.

You can choose:
* **Private** – only you can view
* **Restricted** – anyone with the link (like Google Drive)
* **Public** – anyone

No email whitelists.
No approvals.
Just controlled visibility.

## Templates (for speed, not control)
Predefined templates
ProjectForge includes ready-made templates for common work:
* Electrician jobs
* Client delivery
* Service visits
* Field inspections

They auto-fill steps so you don’t start from scratch.

### Custom templates
If your work is different, you can:
* Create your own template
* Add as many steps as you want
* Reuse it anytime

Nothing is locked.


## AI (used lightly, on purpose)
AI is **not** the product.
It’s only used to:

* Explain templates
* Suggest possible steps
* Help users who don’t know where to start

Model used:
* Gemini Flash 2.5 (free tier)
If AI fails, everything still works.


## Security, without the drama
Authentication
* Email + password
* Google sign-in
* Firebase Authentication

### Two-factor protection
There is only one 2FA method:
* A 6-digit security PIN

No authenticator apps.
No QR codes.

The PIN is:
* Encrypted at rest
* Required at login
* Logged in audit logs


## Deleting your account means deleting everything
When you permanently delete your account:
* All tasks are deleted
* All proof files are deleted
* All audit logs are deleted
* All stats are deleted

Logging in again starts fresh.
No ghosts. No leftovers.


## The dashboard
Your dashboard shows:
* Total tasks
* Completed tasks
* Flagged tasks
* Recent activity

Everything updates in real time.
What you see is always the truth.



## Tech stack (for builders)
* **Frontend:** Next.js, Tailwind CSS, Framer Motion
* **Backend:** Next.js API routes, Node.js
* **Auth:** Firebase Authentication
* **Database:** MongoDB
* **AI:** Gemini Flash 2.5


## What ProjectForge is not
* Not a to-do list
* Not a tracker
* Not social media
* Not a resume builder

It doesn’t tell you to work.
It proves that you did.

## Status
Production-ready MVP.
