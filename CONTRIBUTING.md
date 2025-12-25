# Contributing to Volcanion Tracking System

Thank you for your interest in contributing to the Volcanion Tracking System! This document provides guidelines and instructions for contributing to the project.

## 🌟 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- .NET 10 SDK
- Node.js 18+ (for admin dashboard)
- PostgreSQL 15+
- Git

### Setting Up Development Environment

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/your-username/volcanion-tracking.git
   cd volcanion-tracking
   ```

2. **Backend Setup**
   ```bash
   # Restore .NET packages
   cd src/VolcanionTracking.Api
   dotnet restore
   
   # Update connection string in appsettings.Development.json
   # Run migrations (automatic on first startup)
   dotnet run
   ```

3. **Frontend Setup (Admin Dashboard)**
   ```bash
   cd admin-dashboard
   
   # Install dependencies
   yarn install
   # or
   npm install
   
   # Copy environment file
   cp .env.local.example .env.local
   
   # Update .env.local with your local API URL
   # Start development server
   yarn dev
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb volcanion_tracking
   
   # Connection string in appsettings.json:
   # "DefaultConnection": "Host=localhost;Database=volcanion_tracking;Username=postgres;Password=your_password"
   ```

## 📁 Project Structure

```
volcanion-tracking/
├── src/
│   ├── VolcanionTracking.Api/          # Backend API (.NET Core)
│   │   ├── Controllers/                # API endpoints
│   │   ├── Services/                   # Business logic
│   │   ├── Data/                       # EF Core, Repositories
│   │   ├── Models/                     # Domain models, DTOs
│   │   └── Middleware/                 # Custom middleware
│   └── VolcanionTracking.Client/       # .NET SDK for clients
│
├── admin-dashboard/                    # Frontend (Next.js + TypeScript)
│   ├── src/
│   │   ├── app/                        # Next.js App Router pages
│   │   ├── components/                 # React components
│   │   ├── lib/                        # Utilities & SDK
│   │   │   └── tracking/               # Tracking SDK
│   │   ├── services/                   # API services
│   │   └── stores/                     # State management (Zustand)
│   └── public/                         # Static assets
│
├── database/                           # Database scripts & docs
├── ARCHITECTURE.md                     # Architecture documentation
└── README.md                           # Main documentation
```

## 🛠️ Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# For new features
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/issue-description

# For documentation
git checkout -b docs/what-you-are-documenting
```

### 2. Make Your Changes

#### Backend (.NET)

- Follow C# coding conventions
- Use async/await for all I/O operations
- Write unit tests for new services
- Add XML documentation comments for public APIs
- Use dependency injection
- Follow Repository + Unit of Work pattern

**Example:**
```csharp
/// <summary>
/// Retrieves a partner by their unique identifier.
/// </summary>
/// <param name="id">The partner's ID</param>
/// <returns>The partner if found, null otherwise</returns>
public async Task<Partner?> GetPartnerByIdAsync(Guid id)
{
    return await _context.Partners
        .Include(p => p.SubSystems)
        .FirstOrDefaultAsync(p => p.Id == id);
}
```

#### Frontend (Next.js + TypeScript)

- Use TypeScript for all files
- Follow React best practices
- Use functional components with hooks
- Keep components small and focused
- Use Material-UI components consistently
- Follow the existing folder structure

**Example:**
```typescript
'use client';
import { useState, useEffect } from 'react';
import { Partner } from '@/types/partner';

export function PartnerList() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch partners
  }, []);

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

#### Tracking SDK

When contributing to the tracking SDK (`admin-dashboard/src/lib/tracking/`):

- Maintain backward compatibility
- Add TypeScript types for all exports
- Update TRACKING_SDK.md documentation
- Test batching and error handling
- Consider performance implications

### 3. Write Tests

#### Backend Tests
```bash
cd src/VolcanionTracking.Api.Tests
dotnet test
```

#### Frontend Tests (Future)
```bash
cd admin-dashboard
yarn test
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <subject>

git commit -m "feat(api): add event type filtering to reports"
git commit -m "fix(dashboard): resolve date picker timezone issue"
git commit -m "docs(sdk): update tracking SDK examples"
git commit -m "refactor(services): optimize partner query performance"
git commit -m "test(api): add tests for tracking event validation"
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub with:
- Clear title following conventional commits format
- Description of what changed and why
- Screenshots (for UI changes)
- Reference to related issues (e.g., "Fixes #123")

## 🎯 Contribution Areas

### High Priority
- [ ] Implement comprehensive unit tests
- [ ] Add integration tests for API endpoints
- [ ] Improve error handling and validation
- [ ] Performance optimization for report generation
- [ ] Add more event types to tracking system
- [ ] Implement real-time dashboard updates (WebSocket/SSE)

### Documentation
- [ ] Add API documentation (Swagger improvements)
- [ ] Create video tutorials
- [ ] Add more code examples
- [ ] Translate documentation to other languages
- [ ] Improve architecture diagrams

### Features
- [ ] Export reports to CSV/Excel
- [ ] Email notifications for important events
- [ ] Role-based access control (RBAC)
- [ ] Audit logs
- [ ] API rate limiting per partner
- [ ] GraphQL API option

### Bug Fixes
- Check [Issues](https://github.com/volcanion-company/tracking-open-source/issues) for open bugs

## 🧪 Testing Guidelines

### Backend Testing

1. **Unit Tests** - Test individual services/methods
   ```csharp
   [Fact]
   public async Task GetPartnerById_ReturnsPartner_WhenExists()
   {
       // Arrange
       var partnerId = Guid.NewGuid();
       
       // Act
       var result = await _service.GetPartnerByIdAsync(partnerId);
       
       // Assert
       Assert.NotNull(result);
   }
   ```

2. **Integration Tests** - Test API endpoints
   ```csharp
   [Fact]
   public async Task GetPartners_ReturnsOk()
   {
       var response = await _client.GetAsync("/api/v1/partners");
       Assert.Equal(HttpStatusCode.OK, response.StatusCode);
   }
   ```

### Frontend Testing

- Component tests with React Testing Library (future)
- E2E tests with Playwright/Cypress (future)
- Manual testing checklist for UI changes

## 📝 Documentation Standards

### Code Comments

- Use XML documentation for public APIs (.NET)
- Use JSDoc for TypeScript functions
- Explain **why**, not **what** (code should be self-explanatory)
- Keep comments up-to-date

### README Updates

When adding new features, update relevant documentation:
- Main README.md
- TRACKING_SDK.md (for SDK changes)
- ARCHITECTURE.md (for architectural changes)
- API documentation (Swagger annotations)

## 🔍 Code Review Process

### For Contributors

- Ensure all tests pass before requesting review
- Keep PRs focused and small (< 400 lines when possible)
- Respond to feedback promptly
- Be open to suggestions

### For Reviewers

- Be constructive and respectful
- Focus on code quality, not style preferences
- Test the changes locally when possible
- Approve when ready, request changes if needed

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description** - Clear description of the issue
2. **Steps to Reproduce** - Detailed steps
3. **Expected Behavior** - What should happen
4. **Actual Behavior** - What actually happens
5. **Environment** - OS, .NET version, browser, etc.
6. **Screenshots** - If applicable
7. **Logs** - Error messages or stack traces

**Template:**
```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Windows 11
- .NET: 10.0
- Browser: Chrome 120
- Database: PostgreSQL 15.5

## Additional Context
Any other relevant information
```

## 💡 Feature Requests

When requesting features, include:

1. **Problem Statement** - What problem does this solve?
2. **Proposed Solution** - How should it work?
3. **Alternatives** - Other solutions considered
4. **Use Cases** - Real-world scenarios
5. **Priority** - How important is this?

## 🔒 Security

If you discover a security vulnerability:

1. **DO NOT** create a public issue
2. Email security@volcanion.com (if available)
3. Provide detailed information
4. Wait for acknowledgment before disclosure

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

## 🙏 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

## 📞 Questions?

- Create a [Discussion](https://github.com/volcanion-company/tracking-open-source/discussions)
- Join our community chat (if available)
- Email: dev@volcanion.com

## 🎓 Learning Resources

### Backend (.NET)
- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core)
- [Entity Framework Core](https://docs.microsoft.com/ef/core)
- [C# Coding Conventions](https://docs.microsoft.com/dotnet/csharp/fundamentals/coding-style/coding-conventions)

### Frontend (Next.js)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Material-UI Components](https://mui.com)

### Database
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [EF Core Best Practices](https://learn.microsoft.com/ef/core/performance)

---

Thank you for contributing to Volcanion Tracking System! 🚀
