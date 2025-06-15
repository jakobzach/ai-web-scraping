# Working Patterns Extracted from Current Codebase

**Source**: Analysis of `tests/manual-debug.ts` and existing implementation  
**Purpose**: Foundation for WP1 - Extract Working Patterns

## ✅ Proven Stagehand Configuration

```typescript
const stagehand = new Stagehand({
  env: "LOCAL",
  modelName: "gpt-4o-mini",
  modelClientOptions: {
    apiKey: process.env.OPENAI_API_KEY,
  },
});
await stagehand.init();
const page = stagehand.page;
```

## ✅ Cookie Banner Handling (WORKS)

```typescript
// 1. Page load wait
await page.waitForTimeout(2000);

// 2. Observe first, act as fallback pattern
let actions = await page.observe("Click the 'Accept All' button");
if (actions && actions.length > 0) {
  await page.act(actions[0]!);
} else {
  await page.act("Click the Accept All button");
}
```

**Key insight**: Observe→Act pattern with direct act fallback handles cookie banners reliably.

## ✅ Career Page Navigation (WORKS)

```typescript
actions = await page.observe("Navigate to the careers page");
if (actions && actions.length > 0) {
  await page.act(actions[0]!);
}
// Add direct act fallback: await page.act("Click careers link");
```

**Multilingual terms to support**: careers, jobs, karriere, stellenangebote

## 🎯 Key Simplifications Needed

### Current Complexity → Target Simplicity
- **Types**: 200 lines → 50 lines (3 interfaces only)
- **CSV Processing**: 238 lines → 20 lines (basic read/write)
- **Multiple Classes**: 1000+ lines → 150 lines (single scraper class)

### Essential Dependencies
- `@browserbasehq/stagehand` - Core scraping
- `csv-parser` - CSV reading  
- `fs-extra` - File operations
- `uuid` - Job ID generation

### Working Pattern Summary
1. **Simple initialization** - minimal config works
2. **Observe→Act pattern** - handles dynamic elements
3. **Direct act fallback** - handles edge cases
4. **2-second page waits** - sufficient for most sites
5. **No complex timeout management** - use Stagehand defaults

---
**Ready for WP1 implementation**: Create simplified `types.ts` and `utils.ts` using these patterns. 