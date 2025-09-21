# CommunityConnect Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Database Entity Relationship Diagram](#database-entity-relationship-diagram)
3. [Database Tables and Relationships](#database-tables-and-relationships)
4. [System Architecture](#system-architecture)
5. [Use Case Diagram](#use-case-diagram)
6. [Process Flow Charts](#process-flow-charts)
7. [Component Architecture](#component-architecture)
8. [API Documentation](#api-documentation)
9. [Payment Integration](#payment-integration)
10. [Authentication Flow](#authentication-flow)

---

## Project Overview

CommunityConnect is a comprehensive community platform built with React and Express.js that enables users to participate in community-driven issues and fundraising campaigns. The platform supports role-based access with three user types: Super Users (admins), Community Leaders, and Normal Users.

### Key Features
- **User Management**: Role-based authentication with Firebase
- **Community Management**: Create and manage communities with leaders
- **Issue Reporting**: Users can report and discuss community issues
- **Campaign Management**: Fundraising campaigns with integrated payments
- **Payment Integration**: JazzCash, EasyPaisa, Bank Transfer, and RAAST support
- **Real-time Updates**: Firebase Firestore for live data synchronization

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL (Drizzle ORM) + Firebase Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage
- **Payment**: JazzCash Integration

---

## Database Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        varchar id PK
        text email UK
        text first_name
        text last_name
        text address
        text nic UK
        text phone_number
        text role
        varchar community_id FK
        text profile_image
        timestamp created_at
    }

    COMMUNITIES {
        varchar id PK
        text name
        text description
        text location
        varchar leader_id FK
        integer member_count
        timestamp created_at
    }

    ISSUES {
        varchar id PK
        text title
        text description
        text image
        integer likes
        integer comments
        varchar community_id FK
        varchar author_id FK
        timestamp created_at
    }

    CAMPAIGNS {
        varchar id PK
        text title
        text description
        decimal goal
        decimal raised
        text image
        integer days_left
        varchar community_id FK
        varchar author_id FK
        boolean is_active
        timestamp created_at
    }

    DONATIONS {
        varchar id PK
        varchar campaign_id FK
        varchar donor_id FK
        decimal amount
        text payment_method
        text status
        text transaction_id
        timestamp created_at
    }

    LIKES {
        varchar id PK
        varchar issue_id FK
        varchar user_id FK
        timestamp created_at
    }

    COMMENTS {
        varchar id PK
        varchar issue_id FK
        varchar user_id FK
        text content
        timestamp created_at
    }

    USERS ||--o{ ISSUES : "creates"
    USERS ||--o{ CAMPAIGNS : "creates"
    USERS ||--o{ DONATIONS : "makes"
    USERS ||--o{ LIKES : "gives"
    USERS ||--o{ COMMENTS : "writes"
    USERS ||--o| COMMUNITIES : "leads"
    USERS }o--|| COMMUNITIES : "belongs to"
    
    COMMUNITIES ||--o{ ISSUES : "contains"
    COMMUNITIES ||--o{ CAMPAIGNS : "contains"
    
    ISSUES ||--o{ LIKES : "receives"
    ISSUES ||--o{ COMMENTS : "receives"
    
    CAMPAIGNS ||--o{ DONATIONS : "receives"
```

---

## Database Tables and Relationships

### 1. USERS Table
**Primary Key**: `id` (varchar)
**Unique Keys**: `email`, `nic`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, Default: gen_random_uuid() | Unique user identifier |
| email | text | NOT NULL, UNIQUE | User's email address |
| first_name | text | NOT NULL | User's first name |
| last_name | text | NOT NULL | User's last name |
| address | text | NOT NULL | User's address |
| nic | text | NOT NULL, UNIQUE | National ID Card number |
| phone_number | text | NOT NULL | User's phone number |
| role | text | NOT NULL, Default: 'normal_user' | User role (super_user, community_leader, normal_user) |
| community_id | varchar | FK → COMMUNITIES.id | Associated community |
| profile_image | text | NULL | Profile image URL |
| created_at | timestamp | Default: NOW() | Account creation timestamp |

**Relationships**:
- One-to-Many with ISSUES (author_id)
- One-to-Many with CAMPAIGNS (author_id)
- One-to-Many with DONATIONS (donor_id)
- One-to-Many with LIKES (user_id)
- One-to-Many with COMMENTS (user_id)
- One-to-One with COMMUNITIES (leader_id)
- Many-to-One with COMMUNITIES (community_id)

### 2. COMMUNITIES Table
**Primary Key**: `id` (varchar)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, Default: gen_random_uuid() | Unique community identifier |
| name | text | NOT NULL | Community name |
| description | text | NULL | Community description |
| location | text | NULL | Community location |
| leader_id | varchar | FK → USERS.id | Community leader |
| member_count | integer | Default: 0 | Number of members |
| created_at | timestamp | Default: NOW() | Community creation timestamp |

**Relationships**:
- One-to-Many with USERS (leader_id)
- One-to-Many with ISSUES (community_id)
- One-to-Many with CAMPAIGNS (community_id)

### 3. ISSUES Table
**Primary Key**: `id` (varchar)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, Default: gen_random_uuid() | Unique issue identifier |
| title | text | NOT NULL | Issue title |
| description | text | NOT NULL | Issue description |
| image | text | NULL | Issue image URL |
| likes | integer | Default: 0 | Number of likes |
| comments | integer | Default: 0 | Number of comments |
| community_id | varchar | NOT NULL, FK → COMMUNITIES.id | Associated community |
| author_id | varchar | NOT NULL, FK → USERS.id | Issue author |
| created_at | timestamp | Default: NOW() | Issue creation timestamp |

**Relationships**:
- Many-to-One with COMMUNITIES (community_id)
- Many-to-One with USERS (author_id)
- One-to-Many with LIKES (issue_id)
- One-to-Many with COMMENTS (issue_id)

### 4. CAMPAIGNS Table
**Primary Key**: `id` (varchar)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, Default: gen_random_uuid() | Unique campaign identifier |
| title | text | NOT NULL | Campaign title |
| description | text | NOT NULL | Campaign description |
| goal | decimal(12,2) | NOT NULL | Fundraising goal |
| raised | decimal(12,2) | Default: 0 | Amount raised |
| image | text | NULL | Campaign image URL |
| days_left | integer | NOT NULL | Days remaining |
| community_id | varchar | NOT NULL, FK → COMMUNITIES.id | Associated community |
| author_id | varchar | NOT NULL, FK → USERS.id | Campaign author |
| is_active | boolean | Default: true | Campaign status |
| created_at | timestamp | Default: NOW() | Campaign creation timestamp |

**Relationships**:
- Many-to-One with COMMUNITIES (community_id)
- Many-to-One with USERS (author_id)
- One-to-Many with DONATIONS (campaign_id)

### 5. DONATIONS Table
**Primary Key**: `id` (varchar)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, Default: gen_random_uuid() | Unique donation identifier |
| campaign_id | varchar | NOT NULL, FK → CAMPAIGNS.id | Associated campaign |
| donor_id | varchar | FK → USERS.id | Donor (nullable for anonymous) |
| amount | decimal(12,2) | NOT NULL | Donation amount |
| payment_method | text | NOT NULL | Payment method (jazzcash, easypaisa, bank, raast) |
| status | text | NOT NULL, Default: 'pending' | Payment status |
| transaction_id | text | NULL | External transaction ID |
| created_at | timestamp | Default: NOW() | Donation timestamp |

**Relationships**:
- Many-to-One with CAMPAIGNS (campaign_id)
- Many-to-One with USERS (donor_id)

### 6. LIKES Table
**Primary Key**: `id` (varchar)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, Default: gen_random_uuid() | Unique like identifier |
| issue_id | varchar | NOT NULL, FK → ISSUES.id | Associated issue |
| user_id | varchar | NOT NULL, FK → USERS.id | User who liked |
| created_at | timestamp | Default: NOW() | Like timestamp |

**Relationships**:
- Many-to-One with ISSUES (issue_id)
- Many-to-One with USERS (user_id)

### 7. COMMENTS Table
**Primary Key**: `id` (varchar)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, Default: gen_random_uuid() | Unique comment identifier |
| issue_id | varchar | NOT NULL, FK → ISSUES.id | Associated issue |
| user_id | varchar | NOT NULL, FK → USERS.id | Comment author |
| content | text | NOT NULL | Comment content |
| created_at | timestamp | Default: NOW() | Comment timestamp |

**Relationships**:
- Many-to-One with ISSUES (issue_id)
- Many-to-One with USERS (user_id)

---

## System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React App] --> B[Components]
        B --> C[AuthContext]
        B --> D[ThemeContext]
        A --> E[Pages]
        A --> F[Services]
    end

    subgraph "Backend Layer"
        G[Express Server] --> H[Routes]
        H --> I[Storage Interface]
        I --> J[Firebase Storage]
    end

    subgraph "Database Layer"
        K[PostgreSQL<br/>Drizzle ORM] --> L[Users Table]
        K --> M[Communities Table]
        K --> N[Issues Table]
        K --> O[Campaigns Table]
        K --> P[Donations Table]
        K --> Q[Likes Table]
        K --> R[Comments Table]
    end

    subgraph "Firebase Services"
        S[Firebase Auth] --> T[User Authentication]
        U[Firebase Firestore] --> V[Real-time Data]
        W[Firebase Storage] --> X[File Storage]
    end

    subgraph "Payment Services"
        Y[JazzCash API] --> Z[Payment Processing]
        AA[EasyPaisa API] --> Z
        BB[Bank Transfer] --> Z
        CC[RAAST] --> Z
    end

    subgraph "External Services"
        DD[Cloudinary] --> EE[Image Processing]
        FF[Vite] --> GG[Build Tool]
        HH[Tailwind CSS] --> II[Styling]
    end

    A --> G
    C --> S
    F --> U
    F --> W
    F --> Y
    F --> AA
    F --> BB
    F --> CC
    J --> K
    J --> U
    B --> DD
    A --> FF
    A --> HH
```

### Architecture Components

#### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as build tool for fast development
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** components built on Radix UI
- **Framer Motion** for animations
- **Wouter** for client-side routing
- **TanStack React Query** for server state management

#### Backend Architecture
- **Express.js** server with TypeScript
- **PostgreSQL** database with Drizzle ORM
- **Neon Database** as serverless PostgreSQL provider
- **Firebase** for authentication and real-time data
- RESTful API design with `/api` prefix

#### Database Architecture
- **Hybrid Approach**: PostgreSQL + Firebase Firestore
- **PostgreSQL**: Primary data storage with Drizzle ORM
- **Firebase Firestore**: Real-time synchronization and caching
- **Firebase Storage**: File uploads and media storage

---

## Use Case Diagram

```mermaid
graph TB
    subgraph "Actors"
        SU[Super User]
        CL[Community Leader]
        NU[Normal User]
        GU[Guest User]
    end

    subgraph "User Management"
        UC1[Register Account]
        UC2[Login/Logout]
        UC3[Manage Profile]
        UC4[Assign Roles]
        UC5[Manage Users]
    end

    subgraph "Community Management"
        UC6[Create Community]
        UC7[Join Community]
        UC8[Assign Leader]
        UC9[Remove Leader]
        UC10[Manage Communities]
    end

    subgraph "Issue Management"
        UC11[Create Issue]
        UC12[View Issues]
        UC13[Like Issue]
        UC14[Comment on Issue]
        UC15[Manage Issues]
    end

    subgraph "Campaign Management"
        UC16[Create Campaign]
        UC17[View Campaigns]
        UC18[Donate to Campaign]
        UC19[Manage Campaigns]
        UC20[Track Progress]
    end

    subgraph "Payment Processing"
        UC21[Process Payment]
        UC22[Verify Transaction]
        UC23[Handle Callbacks]
        UC24[Generate Reports]
    end

    subgraph "System Administration"
        UC25[System Monitoring]
        UC26[Database Management]
        UC27[Security Management]
        UC28[Backup & Recovery]
    end

    %% Super User relationships
    SU --> UC1
    SU --> UC2
    SU --> UC3
    SU --> UC4
    SU --> UC5
    SU --> UC6
    SU --> UC7
    SU --> UC8
    SU --> UC9
    SU --> UC10
    SU --> UC11
    SU --> UC12
    SU --> UC13
    SU --> UC14
    SU --> UC15
    SU --> UC16
    SU --> UC17
    SU --> UC18
    SU --> UC19
    SU --> UC20
    SU --> UC21
    SU --> UC22
    SU --> UC23
    SU --> UC24
    SU --> UC25
    SU --> UC26
    SU --> UC27
    SU --> UC28

    %% Community Leader relationships
    CL --> UC1
    CL --> UC2
    CL --> UC3
    CL --> UC6
    CL --> UC7
    CL --> UC11
    CL --> UC12
    CL --> UC13
    CL --> UC14
    CL --> UC15
    CL --> UC16
    CL --> UC17
    CL --> UC18
    CL --> UC19
    CL --> UC20

    %% Normal User relationships
    NU --> UC1
    NU --> UC2
    NU --> UC3
    NU --> UC7
    NU --> UC12
    NU --> UC13
    NU --> UC14
    NU --> UC17
    NU --> UC18

    %% Guest User relationships
    GU --> UC2
    GU --> UC12
    GU --> UC17
```

### Use Case Descriptions

#### Super User Use Cases
- **Full System Access**: Complete administrative control
- **User Management**: Create, update, delete users and assign roles
- **Community Management**: Create and manage all communities
- **Content Moderation**: Manage issues and campaigns across all communities
- **System Administration**: Monitor system performance and security

#### Community Leader Use Cases
- **Community Leadership**: Lead assigned communities
- **Content Creation**: Create and manage issues and campaigns
- **Member Management**: Oversee community members
- **Campaign Management**: Create and track fundraising campaigns
- **Issue Management**: Address community issues

#### Normal User Use Cases
- **Community Participation**: Join communities and participate in discussions
- **Content Interaction**: Like and comment on issues
- **Donation Support**: Contribute to fundraising campaigns
- **Profile Management**: Maintain personal profile and settings

#### Guest User Use Cases
- **Limited Access**: View public content without registration
- **Registration**: Create account to become a normal user

---

## Process Flow Charts

### 1. User Registration Flow

```mermaid
flowchart TD
    A[User visits Registration Page] --> B[Fill Registration Form]
    B --> C{Form Validation}
    C -->|Invalid| D[Show Validation Errors]
    D --> B
    C -->|Valid| E[Check NIC Format]
    E --> F{Valid NIC?}
    F -->|No| G[Show NIC Error]
    G --> B
    F -->|Yes| H[Check Phone Format]
    H --> I{Valid Phone?}
    I -->|No| J[Show Phone Error]
    J --> B
    I -->|Yes| K[Check Email Format]
    K --> L{Valid Email?}
    L -->|No| M[Show Email Error]
    M --> B
    L -->|Yes| N[Check Password Strength]
    N --> O{Strong Password?}
    O -->|No| P[Show Password Error]
    P --> B
    O -->|Yes| Q[Create Firebase Account]
    Q --> R{Firebase Success?}
    R -->|No| S[Show Firebase Error]
    S --> B
    R -->|Yes| T[Create User in Firestore]
    T --> U{Firestore Success?}
    U -->|No| V[Show Firestore Error]
    V --> B
    U -->|Yes| W[Sign Out User]
    W --> X[Show Success Message]
    X --> Y[Redirect to Login]
```

### 2. User Authentication Flow

```mermaid
flowchart TD
    A[User enters Login Page] --> B[Enter Credentials]
    B --> C{Super User?}
    C -->|Yes| D[Check Hardcoded Credentials]
    D --> E{Valid Super User?}
    E -->|Yes| F[Create/Get Super User]
    F --> G[Set User Context]
    G --> H[Redirect to Dashboard]
    E -->|No| I[Show Error]
    I --> B
    C -->|No| J[Firebase Authentication]
    J --> K{Firebase Success?}
    K -->|No| L[Show Auth Error]
    L --> B
    K -->|Yes| M[Query Firestore for User]
    M --> N{User Found?}
    N -->|No| O[Show User Not Found Error]
    O --> B
    N -->|Yes| P[Load User Data]
    P --> Q[Set User Context]
    Q --> R{First Time Login?}
    R -->|Yes| S[Show Role Selection]
    S --> T[User Selects Role]
    T --> U[Update User Role]
    U --> H
    R -->|No| H
```

### 3. Campaign Donation Flow

```mermaid
flowchart TD
    A[User clicks Donate] --> B[Open Donation Modal]
    B --> C[Select Amount]
    C --> D[Choose Payment Method]
    D --> E{Payment Method?}
    E -->|JazzCash| F[Enter Phone Number]
    E -->|EasyPaisa| G[Enter Phone Number]
    E -->|Bank Transfer| H[Enter Bank Details]
    E -->|RAAST| I[Enter Account Details]
    F --> J[Calculate Fees]
    G --> J
    H --> J
    I --> J
    J --> K[Show Total Amount]
    K --> L[User Confirms Payment]
    L --> M[Create Payment Record]
    M --> N[Process Payment]
    N --> O{Payment Success?}
    O -->|No| P[Update Payment Status: Failed]
    P --> Q[Show Error Message]
    Q --> B
    O -->|Yes| R[Update Payment Status: Completed]
    R --> S[Update Campaign Raised Amount]
    S --> T[Send Confirmation]
    T --> U[Close Modal]
    U --> V[Show Success Message]
```

### 4. Issue Creation Flow

```mermaid
flowchart TD
    A[Community Leader opens Create Issue] --> B[Fill Issue Form]
    B --> C[Enter Title]
    C --> D[Enter Description]
    D --> E[Upload Image]
    E --> F[Select Community]
    F --> G{Form Valid?}
    G -->|No| H[Show Validation Errors]
    H --> B
    G -->|Yes| I[Upload Image to Firebase]
    I --> J{Upload Success?}
    J -->|No| K[Show Upload Error]
    K --> B
    J -->|Yes| L[Create Issue Record]
    L --> M{Firestore Success?}
    M -->|No| N[Show Database Error]
    N --> B
    M -->|Yes| O[Update Community Stats]
    O --> P[Send Notification]
    P --> Q[Show Success Message]
    Q --> R[Redirect to Issues List]
```

### 5. Payment Processing Flow (JazzCash)

```mermaid
flowchart TD
    A[Payment Request] --> B[Generate Transaction ID]
    B --> C[Create Payment Data]
    C --> D[Generate Secure Hash]
    D --> E[Send to JazzCash API]
    E --> F{JazzCash Response}
    F -->|Success| G[Verify Response Hash]
    F -->|Error| H[Handle API Error]
    G --> I{Hash Valid?}
    I -->|Yes| J[Update Payment Status]
    I -->|No| K[Mark as Suspicious]
    J --> L[Process Callback]
    L --> M[Update Campaign]
    M --> N[Send Notifications]
    H --> O[Log Error]
    O --> P[Show User Error]
    K --> Q[Investigate Manually]
    N --> R[Payment Complete]
```

---

## Component Architecture

```mermaid
graph TB
    subgraph "App Level"
        APP[App.tsx] --> AUTH[AuthProvider]
        APP --> THEME[ThemeProvider]
        APP --> ROUTER[Router]
    end

    subgraph "Layout Components"
        LAYOUT[Layout] --> SIDEBAR[Sidebar]
        LAYOUT --> MAIN[MainContent]
        LAYOUT --> HEADER[Header]
    end

    subgraph "Page Components"
        MAIN --> DASH[Dashboard]
        MAIN --> FEED[FeedPage]
        MAIN --> ISSUES[IssuesPage]
        MAIN --> CAMPAIGNS[CampaignsList]
        MAIN --> ADMIN[AdminPanel]
        MAIN --> SUPER[SuperUserPanel]
    end

    subgraph "Modal Components"
        MODALS[Modals] --> DONATION[DonationModal]
        MODALS --> CREATE_COMM[CreateCommunityModal]
        MODALS --> LEADER_PROF[CommunityLeaderProfileModal]
        MODALS --> ROLE_CONF[UserRoleConfirmationModal]
    end

    subgraph "UI Components"
        UI[shadcn/ui] --> BUTTON[Button]
        UI --> CARD[Card]
        UI --> DIALOG[Dialog]
        UI --> FORM[Form]
        UI --> INPUT[Input]
        UI --> AVATAR[Avatar]
        UI --> PROGRESS[Progress]
        UI --> TABS[Tabs]
        UI --> TOAST[Toast]
    end

    subgraph "View Components"
        VIEWS[Views] --> ISSUE_CARD[IssueCard]
        VIEWS --> CAMPAIGN_CARD[CampaignCard]
        VIEWS --> NOTIFICATIONS[Notifications]
    end

    subgraph "Context & Hooks"
        CONTEXT[Contexts] --> AUTH_CTX[AuthContext]
        CONTEXT --> THEME_CTX[ThemeContext]
        HOOKS[Hooks] --> FIREBASE[useFirestore]
        HOOKS --> COMMENTS[useComments]
        HOOKS --> TOAST_HOOK[useToast]
    end

    subgraph "Services"
        SERVICES[Services] --> API[api.ts]
        SERVICES --> FIREBASE_SVC[firebase.ts]
        SERVICES --> JAZZCASH[jazzcash.ts]
        SERVICES --> PAYMENT[payment.ts]
        SERVICES --> CLOUDINARY[cloudinary.ts]
    end

    APP --> LAYOUT
    LAYOUT --> MODALS
    MAIN --> VIEWS
    DASH --> UI
    FEED --> UI
    ISSUES --> UI
    CAMPAIGNS --> UI
    ADMIN --> UI
    SUPER --> UI
    MODALS --> UI
    VIEWS --> UI
    CONTEXT --> SERVICES
    HOOKS --> SERVICES
```

### Component Hierarchy

#### 1. App Level Components
- **App.tsx**: Main application component with routing
- **AuthProvider**: Authentication context provider
- **ThemeProvider**: Theme management context

#### 2. Layout Components
- **Sidebar**: Navigation sidebar with role-based menus
- **MainContent**: Main content area router
- **Header**: Application header with user info

#### 3. Page Components
- **Dashboard**: Main dashboard with stats and recent activity
- **FeedPage**: Global feed of issues and campaigns
- **IssuesPage**: Issues listing and management
- **CampaignsList**: Campaigns listing and management
- **AdminPanel**: Community leader admin interface
- **SuperUserPanel**: Super user admin interface

#### 4. Modal Components
- **DonationModal**: Payment processing modal
- **CreateCommunityModal**: Community creation modal
- **CommunityLeaderProfileModal**: Leader profile display
- **UserRoleConfirmationModal**: Role selection modal

#### 5. UI Components (shadcn/ui)
- **Button**: Styled button component
- **Card**: Content card wrapper
- **Dialog**: Modal dialog component
- **Form**: Form wrapper with validation
- **Input**: Styled input fields
- **Avatar**: User avatar display
- **Progress**: Progress bar component
- **Tabs**: Tab navigation component
- **Toast**: Notification toast component

---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
**Description**: User login with email and password
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "normal_user"
  }
}
```

#### POST /api/auth/register
**Description**: User registration
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main St",
  "nic": "12345-1234567-1",
  "phoneNumber": "03001234567",
  "communityId": "community_id"
}
```

### Community Endpoints

#### GET /api/communities
**Description**: Get all communities
**Response**:
```json
[
  {
    "id": "community_id",
    "name": "Community Name",
    "description": "Community description",
    "location": "Location",
    "leaderId": "leader_id",
    "memberCount": 150,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/communities
**Description**: Create new community
**Request Body**:
```json
{
  "name": "New Community",
  "description": "Community description",
  "location": "Location"
}
```

#### PUT /api/communities/:id/assign-leader
**Description**: Assign leader to community
**Request Body**:
```json
{
  "leaderId": "user_id"
}
```

### User Endpoints

#### GET /api/users
**Description**: Get all users
**Response**:
```json
[
  {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "normal_user",
    "communityId": "community_id"
  }
]
```

#### PUT /api/users/:id
**Description**: Update user information
**Request Body**:
```json
{
  "firstName": "Updated Name",
  "role": "community_leader"
}
```

---

## Payment Integration

### JazzCash Integration

#### Configuration
```typescript
const JAZZCASH_CONFIG = {
  merchantId: 'MC12345',
  password: 'password123',
  hashKey: 'hashkey123',
  environment: 'sandbox' // or 'live'
};
```

#### Payment Flow
1. **Payment Request Creation**
   - Generate unique transaction reference
   - Create payment data structure
   - Generate secure hash using SHA256

2. **Hash Generation**
   ```typescript
   const hashString = [
     pp_Version,
     pp_MerchantID,
     pp_Password,
     pp_TxnRefNo,
     pp_Amount,
     pp_TxnCurrency,
     pp_BillReference,
     pp_Description,
     pp_ReturnURL,
     hashKey
   ].join('&');
   ```

3. **Payment Processing**
   - Send payment request to JazzCash API
   - Handle response verification
   - Update payment status in database

4. **Callback Handling**
   - Verify callback hash
   - Update payment status
   - Process campaign updates

#### Supported Payment Methods
- **JazzCash**: Mobile wallet integration
- **EasyPaisa**: Mobile wallet integration
- **Bank Transfer**: Traditional bank transfer
- **RAAST**: Pakistan's instant payment system

### Payment Status Flow
```
pending → processing → completed/failed
```

#### Fee Structure
- **JazzCash**: 1.5% transaction fee
- **EasyPaisa**: 1.5% transaction fee
- **Bank Transfer**: 2% transaction fee
- **RAAST**: 1% transaction fee

---

## Authentication Flow

### Firebase Authentication Integration

#### 1. Registration Process
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant FA as Firebase Auth
    participant FS as Firestore
    participant B as Backend

    U->>F: Submit registration form
    F->>F: Validate form data
    F->>FA: createUserWithEmailAndPassword()
    FA->>F: Return Firebase user
    F->>FS: Create user document
    FS->>F: Confirm creation
    F->>FA: signOut()
    F->>U: Show success message
```

#### 2. Login Process
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant FA as Firebase Auth
    participant FS as Firestore
    participant C as AuthContext

    U->>F: Submit login form
    F->>F: Check for super user
    alt Super User
        F->>C: Set super user context
    else Regular User
        F->>FA: signInWithEmailAndPassword()
        FA->>F: Return Firebase user
        F->>FS: Query user by firebaseUid
        FS->>F: Return user data
        F->>C: Set user context
    end
    F->>U: Redirect to dashboard
```

#### 3. Role-Based Access Control

##### Super User Access
- Full system administration
- User management across all communities
- Community creation and management
- Payment monitoring and reporting

##### Community Leader Access
- Lead assigned communities
- Create and manage issues
- Create and manage campaigns
- View community analytics

##### Normal User Access
- Join communities
- View and interact with content
- Make donations
- Comment and like issues

### Security Features

#### 1. Password Validation
- Minimum 8 characters
- Password confirmation matching
- Strong password requirements

#### 2. NIC Validation
- Pakistani NIC format: `12345-1234567-1`
- Unique NIC enforcement
- Format validation

#### 3. Phone Number Validation
- Pakistani phone number format
- Format: `(+92|0)?3\d{9}`
- Validation on registration

#### 4. Email Validation
- Standard email format validation
- Unique email enforcement
- Domain validation

---

## File Structure

```
CommunityConnect/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   └── views/      # View-specific components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript type definitions
│   ├── index.html
│   └── vite.config.ts
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database interface
│   └── firebase.ts        # Firebase configuration
├── shared/                 # Shared code
│   └── schema.ts          # Database schema
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## Environment Configuration

### Required Environment Variables

#### Frontend (.env)
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_JAZZCASH_MERCHANT_ID=your_merchant_id
VITE_JAZZCASH_PASSWORD=your_password
VITE_JAZZCASH_HASH_KEY=your_hash_key
VITE_JAZZCASH_ENVIRONMENT=sandbox
```

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:port/database
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/service-account.json
NODE_ENV=development
PORT=5000
```

---

## Deployment Guide

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to hosting service (Vercel, Netlify, etc.)
3. Configure environment variables
4. Set up custom domain (optional)

### Backend Deployment
1. Build the server: `npm run build`
2. Deploy to cloud provider (Railway, Heroku, etc.)
3. Set up PostgreSQL database
4. Configure environment variables
5. Run database migrations

### Database Setup
1. Create PostgreSQL database
2. Run schema migration: `npm run db:push`
3. Seed initial data: `npm run seed`
4. Configure Firebase project
5. Set up Firestore security rules

---

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- Service function testing
- Utility function testing

### Integration Testing
- API endpoint testing
- Database integration testing
- Payment flow testing

### End-to-End Testing
- User registration flow
- Authentication flow
- Campaign creation and donation flow
- Issue creation and interaction flow

---

## Performance Optimization

### Frontend Optimizations
- Code splitting with React.lazy()
- Image optimization with Cloudinary
- Memoization with React.memo()
- Virtual scrolling for large lists

### Backend Optimizations
- Database query optimization
- Caching with Redis
- Rate limiting
- Compression middleware

### Database Optimizations
- Proper indexing
- Query optimization
- Connection pooling
- Read replicas for scaling

---

## Security Considerations

### Authentication Security
- Firebase Authentication for secure login
- Role-based access control
- Session management
- Password strength requirements

### Data Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### Payment Security
- Secure hash generation
- Transaction verification
- PCI compliance considerations
- Fraud detection

---

## Monitoring and Logging

### Application Monitoring
- Error tracking with Sentry
- Performance monitoring
- User analytics
- System health checks

### Database Monitoring
- Query performance monitoring
- Connection pool monitoring
- Storage usage tracking
- Backup monitoring

### Payment Monitoring
- Transaction success rates
- Payment method analytics
- Fraud detection alerts
- Revenue tracking

---

## Future Enhancements

### Planned Features
1. **Mobile App**: React Native mobile application
2. **Real-time Chat**: Community chat functionality
3. **Advanced Analytics**: Detailed reporting and analytics
4. **Multi-language Support**: Internationalization
5. **API Rate Limiting**: Enhanced API security
6. **Webhook Support**: Third-party integrations
7. **Advanced Search**: Full-text search capabilities
8. **Notification System**: Push notifications
9. **Social Features**: User following and social interactions
10. **Admin Dashboard**: Enhanced administrative interface

### Technical Improvements
1. **Microservices Architecture**: Break down monolithic backend
2. **GraphQL API**: More flexible API queries
3. **Redis Caching**: Improve performance
4. **Docker Containerization**: Easy deployment
5. **CI/CD Pipeline**: Automated testing and deployment
6. **Load Balancing**: Handle high traffic
7. **CDN Integration**: Faster content delivery
8. **Database Sharding**: Scale database operations

---

## Conclusion

CommunityConnect is a comprehensive community platform that successfully combines modern web technologies with practical community management needs. The system's architecture supports scalability, security, and user experience while providing robust features for community engagement and fundraising.

The hybrid database approach using both PostgreSQL and Firebase provides the benefits of structured data storage with real-time capabilities. The role-based access control ensures proper security and functionality separation, while the integrated payment system enables seamless fundraising campaigns.

The platform is well-positioned for future growth with its modular architecture and comprehensive documentation, making it easy to extend and maintain as requirements evolve.

---

*Documentation Version: 1.0*  
*Last Updated: January 2024*  
*Project: CommunityConnect Platform*
