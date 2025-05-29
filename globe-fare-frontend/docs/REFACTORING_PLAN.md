# Globe Fare Refactoring Plan

## 🎯 Objectives

1. **Organize project structure** for better maintainability
2. **Separate concerns** between UI, logic, and data
3. **Improve type safety** throughout the application
4. **Enhance developer experience** with better tooling
5. **Prepare for scaling** and future features

## 📋 Current State Analysis

### Issues Identified

1. **File Organization**: Mixed concerns in components
2. **Type Definitions**: Scattered across files
3. **Data Utilities**: Single large file handling everything
4. **Static Assets**: No clear organization
5. **Documentation**: Limited and outdated

## 🚀 PHASE 1: IMMEDIATE IMPLEMENTATION (Week 1)

### Step 1.1: Create New Directory Structure

```bash
# Create new organized directories
mkdir -p src/components/ui
mkdir -p src/components/forms
mkdir -p src/components/layout
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/types
mkdir -p src/lib/formatters
mkdir -p src/lib/validators
mkdir -p src/lib/airlines
mkdir -p src/lib/airports
mkdir -p public/data
mkdir -p public/results
mkdir -p docs/api
```

### Step 1.2: Type Definitions (HIGH PRIORITY)

Create comprehensive type system:

**IMMEDIATE ACTION**: Split types into focused modules

- `src/types/flight.ts` - Flight data structures
- `src/types/airline.ts` - Airline information
- `src/types/airport.ts` - Airport data
- `src/types/api.ts` - API response structures

### Step 1.3: Split dataUtils.ts (CRITICAL)

Current `dataUtils.ts` is 400+ lines handling everything. Split into:

**IMMEDIATE SPLITS**:

1. `src/lib/airlines/airlineUtils.ts` - Airline name resolution
2. `src/lib/airports/airportUtils.ts` - Airport/city resolution
3. `src/lib/formatters/timeFormatter.ts` - Time/duration formatting
4. `src/lib/formatters/priceFormatter.ts` - Price formatting
5. `src/lib/validators/flightValidator.ts` - Flight data validation

### Step 1.4: Component Reorganization

**UI Components** (Extract reusable parts):

- `src/components/ui/LoadingSpinner.tsx`
- `src/components/ui/FlightCard.tsx`
- `src/components/ui/DatePicker.tsx`
- `src/components/ui/DestinationDropdown.tsx`

**Form Components**:

- `src/components/forms/FlightSearchForm.tsx` (from FlightSelector)

**Layout Components**:

- `src/components/layout/FlightGrid.tsx` (from FlightListing)

## 🔧 IMPLEMENTATION CHECKLIST

### Week 1 Tasks

- [ ] **Create type definitions**

  - [ ] `src/types/flight.ts`
  - [ ] `src/types/airline.ts`
  - [ ] `src/types/airport.ts`
  - [ ] `src/types/api.ts`

- [ ] **Split dataUtils.ts**

  - [ ] `src/lib/airlines/airlineUtils.ts`
  - [ ] `src/lib/airports/airportUtils.ts`
  - [ ] `src/lib/formatters/timeFormatter.ts`
  - [ ] `src/lib/formatters/priceFormatter.ts`
  - [ ] Update all imports

- [ ] **Move static assets**

  - [ ] `public/airlines.json` → `public/data/airlines.json`
  - [ ] `public/airports.json` → `public/data/airports.json`
  - [ ] Update fetch paths

- [ ] **Extract UI components**

  - [ ] Create `FlightCard.tsx`
  - [ ] Create `LoadingSpinner.tsx`
  - [ ] Extract from existing components

- [ ] **Update imports everywhere**
  - [ ] Fix all import paths
  - [ ] Test functionality
  - [ ] Ensure no breaking changes

### Immediate Benefits After Week 1

1. **Cleaner codebase**: Focused, single-responsibility files
2. **Better IntelliSense**: Improved TypeScript support
3. **Easier maintenance**: Changes affect smaller, focused files
4. **Team collaboration**: Clear separation of concerns

## 📁 NEW PROJECT STRUCTURE (Target)

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── FlightCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── DatePicker.tsx
│   │   └── DestinationDropdown.tsx
│   ├── forms/                 # Form-specific components
│   │   └── FlightSearchForm.tsx
│   ├── layout/                # Layout components
│   │   └── FlightGrid.tsx
│   ├── FlightSelector.tsx     # (refactored)
│   └── FlightListing.tsx      # (refactored)
├── hooks/                     # Custom React hooks
│   ├── useFlights.ts
│   └── useDebounce.ts
├── services/                  # API and external services
│   ├── flightService.ts
│   └── apiClient.ts
├── types/                     # TypeScript definitions
│   ├── flight.ts
│   ├── airline.ts
│   ├── airport.ts
│   └── api.ts
├── lib/                       # Utilities (organized)
│   ├── airlines/
│   │   └── airlineUtils.ts
│   ├── airports/
│   │   └── airportUtils.ts
│   ├── formatters/
│   │   ├── timeFormatter.ts
│   │   ├── priceFormatter.ts
│   │   └── dateFormatter.ts
│   ├── validators/
│   │   └── flightValidator.ts
│   └── constants.ts
└── app/                       # Next.js App Router
    ├── layout.tsx
    ├── page.tsx
    └── globals.css
```

## 🎯 NEXT PHASES (Future Weeks)

### Phase 2: Service Layer & Hooks (Week 2)

- Extract API logic into services
- Create custom hooks for state management
- Implement proper error boundaries

### Phase 3: Component Enhancement (Week 3)

- Add prop types and documentation
- Implement component testing
- Create Storybook stories

### Phase 4: Performance Optimization (Week 4)

- Bundle analysis and optimization
- Implement proper caching strategies
- Add loading states and error handling

## 🚨 CRITICAL SUCCESS FACTORS

1. **Test after each change**: Ensure no functionality breaks
2. **Update imports systematically**: Use IDE refactoring tools
3. **Maintain backwards compatibility**: Keep existing API contracts
4. **Document as you go**: Update README and docs
5. **Small, focused commits**: Easy to review and rollback

## 📊 PROGRESS TRACKING

| Task                  | Status         | Completion Date | Notes |
| --------------------- | -------------- | --------------- | ----- |
| Type definitions      | 🟡 In Progress |                 |       |
| Split dataUtils       | 🔴 Not Started |                 |       |
| Move static assets    | 🔴 Not Started |                 |       |
| Extract UI components | 🔴 Not Started |                 |       |
| Update imports        | 🔴 Not Started |                 |       |

**Legend**: 🟢 Complete | 🟡 In Progress | 🔴 Not Started

---

**NEXT ACTION**: Start with type definitions to establish a solid foundation for all other refactoring work.
