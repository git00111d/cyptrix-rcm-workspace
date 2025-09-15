# Cyptrix RCM - Medical Coding Platform

A secure medical coding platform with role-based access control for healthcare providers and coding professionals.

## Features

### Role-Based Access Control
- **Providers**: Upload medical documents (PDFs)
- **Employees**: View documents and perform medical coding
- **Auditors**: Review and audit coded documents
- **Admins**: Full system access and user management

### Core Functionality
- Secure PDF document upload and storage
- Medical coding workspace with ICD-10/CPT code assignment
- Document status tracking and workflow management
- Role-based authentication with Supabase

## Setup Instructions

### 1. Supabase Configuration

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. In Lovable, click the green Supabase button to connect your project
4. Run the SQL commands from `database.sql` in your Supabase SQL editor

### 2. Database Setup

Execute the SQL script in `database.sql` to create:
- User profiles table with role-based access
- Documents table for file metadata
- Document codes table for coding data
- Storage bucket for PDF files
- Row Level Security policies
- Required triggers and functions

### 3. User Registration

New users are automatically assigned the "PROVIDER" role by default. To create users with other roles:

1. Register users through the login form
2. Use the SQL editor to update their role:
```sql
UPDATE profiles SET role = 'EMPLOYEE' WHERE email = 'user@example.com';
```

## User Workflows

### Provider Workflow
1. Login to the platform
2. Navigate to "Upload Documents"
3. Drag and drop PDF files or click to browse
4. View uploaded documents and their processing status

### Employee Workflow
1. Login to the platform
2. Navigate to "Documents" to see all uploaded PDFs
3. Click "Start Coding" on any document
4. Use the "Coding Workspace" to assign ICD-10/CPT codes per page

### System Roles

- **PROVIDER**: Can upload documents and view their own uploads
- **EMPLOYEE**: Can view all documents and perform coding
- **AUDITOR**: Can review coded documents and perform quality checks
- **ADMIN**: Full system access including user management

## Security Features

- Row Level Security (RLS) policies ensure data isolation
- Secure file upload with encrypted storage
- Role-based access control for all operations
- Authentication via Supabase Auth

---

## Original Lovable Project Info

**URL**: https://lovable.dev/projects/53c8751a-b668-4ca0-9603-9f101fe60e84

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/53c8751a-b668-4ca0-9603-9f101fe60e84) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/53c8751a-b668-4ca0-9603-9f101fe60e84) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
