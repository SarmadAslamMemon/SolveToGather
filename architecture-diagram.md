graph TB
    subgraph "🌐 Frontend Layer"
        A["React 18<br/>TypeScript"] --> B["Vite<br/>Build Tool"]
        A --> C["Tailwind CSS<br/>Styling"]
        A --> D["Framer Motion<br/>Animations"]
        A --> E["Radix UI<br/>Components"]
        A --> F["React Query<br/>Data Fetching"]
        A --> G["Wouter<br/>Routing"]
    end
    
    subgraph "⚙️ Backend Layer"
        H["Express Server<br/>Node.js"] --> I["TypeScript<br/>Type Safety"]
        H --> J["Passport<br/>Authentication"]
        H --> K["Session Management<br/>User Login"]
        H --> L["REST API<br/>Routes"]
    end
    
    subgraph "🗄️ Database Layer"
        M["PostgreSQL<br/>Database"] --> N["Drizzle ORM<br/>Type-safe Queries"]
        N --> O["Schema Tables"]
        O --> P["👥 Users"]
        O --> Q["🏘️ Communities"]
        O --> R["📋 Issues"]
        O --> S["💰 Campaigns"]
        O --> T["💳 Donations"]
    end
    
    subgraph "🔌 External Services"
        U["Firebase<br/>Auth & Storage"] --> V["🔐 Authentication"]
        U --> W["📡 Real-time DB"]
        U --> X["📁 File Storage"]
        Y["Cloudinary<br/>Image Service"] --> Z["🖼️ Image Management"]
        AA["JazzCash API<br/>Payments"] --> BB["💸 Payment Processing"]
    end
    
    subgraph "✨ Key Features"
        CC["📱 Community Feed<br/>Social Media Style"] --> DD["📊 Real-time Updates"]
        CC --> EE["📑 Tabbed Interface"]
        CC --> FF["❤️ Like & Comment"]
        GG["👤 User Management<br/>Role-based Access"] --> HH["🔑 Super Admin"]
        GG --> II["👑 Community Leader"]
        GG --> JJ["👥 Normal User"]
        KK["💳 Payment System<br/>Multiple Methods"] --> LL["📱 JazzCash"]
        KK --> MM["🏦 Bank Transfer"]
        KK --> NN["💳 EasyPaisa"]
    end
    
    A --> H
    H --> M
    A --> U
    A --> Y
    H --> AA
    
    style A fill:#61dafb,stroke:#333,stroke-width:2px
    style H fill:#68d391,stroke:#333,stroke-width:2px
    style M fill:#336791,stroke:#333,stroke-width:2px
    style U fill:#ffa726,stroke:#333,stroke-width:2px
    style CC fill:#e91e63,stroke:#333,stroke-width:2px
