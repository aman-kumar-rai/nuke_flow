# Flow to TypeScript Migration Guide

## 🎯 **Migration Strategy Overview**

### **Core Approach: Flow → Zod → TypeScript**
Instead of directly converting Flow types to TypeScript, we use **Zod as a transformation engine**:

1. **Parse Flow types** using JSCodeShift AST
2. **Convert to Zod schemas** using mapping rules
3. **Extract TypeScript types** via `z.infer<typeof schema>`
4. **Replace in code** with generated TypeScript types

### **Why This Approach?**
- **Simpler conversion**: Flow → Zod is more direct than Flow → TypeScript
- **Reliable type generation**: Zod handles complex TypeScript type generation
- **Clean result**: No runtime dependencies left behind
- **Incremental migration**: Can transform files one at a time

## 📊 **ui-server analysis**

### **Codebase Statistics**
- **Total Flow files**: 1000+ files with `// @flow` annotations
- **Type definition files**: 100+ files in `src/types/`
- **Flow-typed dependencies**: 100+ library definitions
- **Build system**: Rspack with Babel Flow strip types
- **Flow version**: 0.182.0

### **Key Directories**
- `src/types/` - Core type definitions
- `src/selectors/` - Redux selectors
- `src/action-creators/` - Redux actions
- `src/components/` - React components
- `src/reducers/` - Redux reducers
- `flow-typed/` - External library types

## 🔍 **Flow features present in codebase**

### **1. Basic Types** ✅
```javascript
string, number, boolean, null, void, any, mixed
```

### **2. Optional Types** ✅
```javascript
?string, ?number, ?boolean, ?Object
```

### **3. Union Types** ✅
```javascript
string | boolean | {...}
'left' | 'right'
'push' | 'overlay'
'APPEND' | 'REPLACE'
```

### **4. Array Types** ✅
```javascript
Array<string>, Array<number>, string[]
$ReadOnlyArray<ConditionValue>
```

### **5. Object Types** ✅
```javascript
{
  id: string,
  name: string,
  age?: number
}
```

### **6. Generic Types** ✅
```javascript
React$StatelessFunctionalComponent<{...}>
Map<string, $Shape<AudienceList>>
Array<$Shape<Message>>
```

### **7. Flow Utility Types** ✅
```javascript
$Shape<T>           // Partial<T> in TypeScript
$ReadOnly<T>        // Readonly<T> in TypeScript  
$ReadOnlyArray<T>   // ReadonlyArray<T> in TypeScript
$Values<T>          // T[keyof T] in TypeScript
$Keys<T>            // keyof T in TypeScript
$Exports<T>         // typeof import in TypeScript
```

### **8. Index Signatures** ✅
```javascript
+[key: string]: mixed,  // Covariant index signature
{[string]: mixed}       // Regular index signature
```

### **9. Exact Object Types** ✅
```javascript
{| id: string, name: string |}  // Exact object type
```

### **10. Function Types** ✅
```javascript
() => mixed
(key: string, value: mixed) => void
(SyntheticEvent<HTMLElement>) => mixed
```

### **11. Import/Export Types** ✅
```javascript
import type { UserType } from './types'
export type Agency = { ... }
```

### **12. Type Aliases** ✅
```javascript
type User = { ... }
type EventType = 'message' | 'sms_message' | 'survey'
```

### **13. Interface-like Types** ✅
```javascript
export type Agency = {
  id: string,
  name: string,
  // ...
}
```

### **14. Spread Types** ✅
```javascript
export type Graph = {
  ...GraphDetails,
  nodes: ConversationNode[],
  // ...
}
```

### **15. React Types** ✅
```javascript
React$StatelessFunctionalComponent<{...}>
React.Node
SyntheticEvent<HTMLElement>
```

### **16. Flow Comments** ✅
```javascript
// $FlowFixMe[nonstrict-import]
// $FlowFixMe[value-as-type]
// $FlowFixMe[incompatible-call]
// $FlowFixMe[incompatible-type]
// $FlowFixMe[untyped-import]
```

## 🛠 **Implementation Strategy**

### **Phase 1: Setup & Infrastructure**
```bash
# Install dependencies
yarn add -D typescript @types/node @types/react @types/react-dom @types/jest
yarn add -D @babel/preset-typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin
yarn add -D jscodeshift @babel/parser @babel/traverse
yarn add zod
```

### **Phase 2: JSCodeShift Transform Structure**
```javascript
// transform.js
module.exports = function(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  
  // 1. Find all Flow type annotations
  // 2. Convert to Zod schemas
  // 3. Extract TypeScript types
  // 4. Replace in AST
  
  return root.toSource();
};
```

### **Phase 3: Flow to Zod Mapping Rules**
```javascript
const flowToZodMap = {
  // Basic types
  'StringTypeAnnotation': 'z.string()',
  'NumberTypeAnnotation': 'z.number()',
  'BooleanTypeAnnotation': 'z.boolean()',
  'NullTypeAnnotation': 'z.null()',
  'VoidTypeAnnotation': 'z.void()',
  'AnyTypeAnnotation': 'z.any()',
  'MixedTypeAnnotation': 'z.unknown()',
  
  // Optional types
  'OptionalTypeAnnotation': (inner) => `${inner}.optional()`,
  
  // Union types
  'UnionTypeAnnotation': (types) => `z.union([${types.join(', ')}])`,
  
  // Array types
  'ArrayTypeAnnotation': (elementType) => `z.array(${elementType})`,
  'ReadOnlyArrayTypeAnnotation': (elementType) => `z.array(${elementType})`,
  
  // Object types
  'ObjectTypeAnnotation': (properties) => `z.object({${properties.join(', ')}})`,
  
  // Utility types
  '$Shape': (type) => `${type}.partial()`,
  '$ReadOnly': (type) => `${type}`,
  '$Values': (type) => `z.enum(Object.values(${type}))`,
  '$Keys': (type) => `z.enum(Object.keys(${type}))`,
  
  // Index signatures
  'IndexerTypeAnnotation': (keyType, valueType) => `z.record(${keyType}, ${valueType})`,
};
```

### **Phase 4: Type Extraction Strategy**
```javascript
function extractTypeScriptFromZod(zodSchema) {
  // Method 1: Use TypeScript compiler API
  const typeString = generateTypeScriptType(zodSchema);
  
  // Method 2: Use Zod's internal type inference
  const inferredType = z.infer<typeof zodSchema>;
  
  // Convert to AST node
  return createTypeScriptTypeNode(inferredType);
}
```

## 📝 **Conversion Examples**

### **Example 1: Basic Object Type**
```javascript
// Flow
export type User = {
  id: string,
  name: string,
  age?: number,
  tags: Array<string>
};

// Zod Schema
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().optional(),
  tags: z.array(z.string())
});

// Final TypeScript
export interface User {
  id: string;
  name: string;
  age?: number;
  tags: string[];
}
```

### **Example 2: Union Types**
```javascript
// Flow
export type EventType = 
  | 'message'
  | 'sms_message'
  | 'survey'
  | 'sms_survey';

// Zod Schema
const EventTypeSchema = z.union([
  z.literal('message'),
  z.literal('sms_message'),
  z.literal('survey'),
  z.literal('sms_survey')
]);

// Final TypeScript
export type EventType = 'message' | 'sms_message' | 'survey' | 'sms_survey';
```

### **Example 3: Flow Utility Types**
```javascript
// Flow
export type PartialUser = $Shape<User>;
export type ReadOnlyUser = $ReadOnly<User>;
export type UserKeys = $Keys<User>;

// Zod Schema
const PartialUserSchema = UserSchema.partial();
const ReadOnlyUserSchema = UserSchema;
const UserKeysSchema = z.enum(Object.keys(UserSchema.shape));

// Final TypeScript
export type PartialUser = Partial<User>;
export type ReadOnlyUser = Readonly<User>;
export type UserKeys = keyof User;
```

### **Example 4: Complex Types**
```javascript
// Flow
export type Graph = {
  ...GraphDetails,
  nodes: Map<Id, ConversationNode>,
  edges: Map<Id, Edge>,
  root: Id,
};

// Zod Schema
const GraphSchema = GraphDetailsSchema.extend({
  nodes: z.record(z.number(), ConversationNodeSchema),
  edges: z.record(z.number(), EdgeSchema),
  root: z.number()
});

// Final TypeScript
export interface Graph extends GraphDetails {
  nodes: Record<number, ConversationNode>;
  edges: Record<number, Edge>;
  root: number;
}
```

## 🔧 **Technical Implementation Details**

### **JSCodeShift Transform Structure**
```javascript
// transform.js
const { z } = require('zod');

module.exports = function(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  
  // 1. Remove Flow comments
  root.find(j.Comment).forEach(path => {
    if (path.value.value.includes('@flow')) {
      path.prune();
    }
  });
  
  // 2. Convert type imports
  root.find(j.ImportDeclaration).forEach(path => {
    if (path.value.importKind === 'type') {
      path.value.importKind = 'value';
    }
  });
  
  // 3. Convert type exports
  root.find(j.ExportNamedDeclaration).forEach(path => {
    if (path.value.exportKind === 'type') {
      path.value.exportKind = 'value';
    }
  });
  
  // 4. Convert type annotations
  root.find(j.TSTypeAnnotation).forEach(path => {
    const flowType = path.value.typeAnnotation;
    const zodSchema = convertFlowToZod(flowType);
    const tsType = extractTypeScriptFromZod(zodSchema);
    path.value.typeAnnotation = tsType;
  });
  
  return root.toSource();
};
```

### **Flow to Zod Conversion Function**
```javascript
function convertFlowToZod(flowType) {
  switch (flowType.type) {
    case 'StringTypeAnnotation':
      return 'z.string()';
      
    case 'NumberTypeAnnotation':
      return 'z.number()';
      
    case 'BooleanTypeAnnotation':
      return 'z.boolean()';
      
    case 'ArrayTypeAnnotation':
      const elementType = convertFlowToZod(flowType.elementType);
      return `z.array(${elementType})`;
      
    case 'UnionTypeAnnotation':
      const unionTypes = flowType.types.map(convertFlowToZod);
      return `z.union([${unionTypes.join(', ')}])`;
      
    case 'ObjectTypeAnnotation':
      const properties = flowType.properties.map(prop => {
        const key = prop.key.name;
        const value = convertFlowToZod(prop.value);
        const optional = prop.optional ? '.optional()' : '';
        return `${key}: ${value}${optional}`;
      });
      return `z.object({\n  ${properties.join(',\n  ')}\n})`;
      
    case 'GenericTypeAnnotation':
      return handleGenericType(flowType);
      
    case 'OptionalTypeAnnotation':
      const innerType = convertFlowToZod(flowType.typeAnnotation);
      return `${innerType}.optional()`;
      
    default:
      return 'z.any()';
  }
}
```

### **TypeScript Type Extraction**
```javascript
function extractTypeScriptFromZod(zodSchemaString) {
  // Create temporary schema
  const tempSchema = eval(`(${zodSchemaString})`);
  
  // Use TypeScript compiler API or manual mapping
  const tsType = generateTypeScriptType(tempSchema);
  
  return tsType;
}
```

## 🚀 **Migration Execution Plan**

### **Step 1: Setup New Repository**
```bash
# Create new repository for transformation code
mkdir flow-to-ts-migration
cd flow-to-ts-migration

# Initialize package.json
npm init -y

# Install dependencies
npm install --save-dev jscodeshift @babel/parser @babel/traverse zod
npm install --save-dev @types/node typescript
```

### **Step 2: Create Transform Script**
```bash
# Create transform directory
mkdir transforms
touch transforms/flow-to-typescript.js
```

### **Step 3: Test on Sample Files**
```bash
# Test on a single file
npx jscodeshift -t transforms/flow-to-typescript.js src/types/sense.js

# Test on a directory
npx jscodeshift -t transforms/flow-to-typescript.js src/types/

# Test on entire codebase
npx jscodeshift -t transforms/flow-to-typescript.js src/
```

### **Step 4: Batch Processing**
```bash
# Process all .js files
find src -name "*.js" -exec npx jscodeshift -t transforms/flow-to-typescript.js {} \;
```

## 🧪 **Testing Strategy**

### **Unit Tests for Transform**
```javascript
// test/transform.test.js
const transform = require('../transforms/flow-to-typescript');

describe('Flow to TypeScript Transform', () => {
  it('should convert basic types', () => {
    const input = `
      // @flow strict
      export type User = {
        id: string,
        name: string,
        age?: number
      };
    `;
    
    const output = transform({ source: input }, { jscodeshift: j });
    
    expect(output).toContain('export interface User');
    expect(output).toContain('id: string;');
    expect(output).toContain('age?: number;');
  });
});
```

### **Integration Tests**
```javascript
// test/integration.test.js
describe('Integration Tests', () => {
  it('should handle complex Flow types', () => {
    // Test with real files from the codebase
  });
  
  it('should preserve functionality', () => {
    // Ensure transformed code still works
  });
});
```

## 🚨 **Common Challenges & Solutions**

### **Challenge 1: Complex Generic Types**
```javascript
// Flow
React$StatelessFunctionalComponent<{...}>

// Solution
// Convert to React.FC<{...}> or z.any()
```

### **Challenge 2: Flow-Specific Features**
```javascript
// Flow
+[key: string]: mixed  // Covariant index

// Solution
// Convert to Record<string, any> or z.record(z.string(), z.any())
```

### **Challenge 3: Exact Types**
```javascript
// Flow
{| id: string |}  // Exact object

// Solution
// Use Zod's .strict() method or convert to regular object
```

### **Challenge 4: Flow Comments**
```javascript
// Flow
// $FlowFixMe[nonstrict-import]

// Solution
// Remove or convert to TypeScript comments
// @ts-ignore
```

## 📋 **Migration Checklist**

### **Pre-Migration**
- [ ] Set up new repository for transformation code
- [ ] Install all required dependencies
- [ ] Create basic transform structure
- [ ] Test on sample files

### **During Migration**
- [ ] Convert type definition files first (`src/types/`)
- [ ] Convert utility files (`src/utils/`)
- [ ] Convert selectors (`src/selectors/`)
- [ ] Convert action creators (`src/action-creators/`)
- [ ] Convert components (`src/components/`)
- [ ] Convert reducers (`src/reducers/`)

### **Post-Migration**
- [ ] Remove Flow dependencies
- [ ] Update build configuration
- [ ] Update ESLint configuration
- [ ] Remove Flow configuration files
- [ ] Test entire application
- [ ] Update documentation

## 🔄 **Rollback Strategy**

### **Version Control**
- Use feature branches for migration work
- Commit frequently with descriptive messages
- Keep Flow configuration until migration is complete

### **Incremental Rollback**
```bash
# Rollback specific files
git checkout HEAD~1 -- src/types/user.js

# Rollback entire directory
git checkout HEAD~1 -- src/types/
```

## 📚 **Additional Resources**

### **JSCodeShift Documentation**
- [JSCodeShift API](https://github.com/facebook/jscodeshift#api)
- [AST Explorer](https://astexplorer.net/)

### **Zod Documentation**
- [Zod Schema Types](https://zod.dev/?id=basic-usage)
- [Zod Type Inference](https://zod.dev/?id=type-inference)

### **TypeScript Documentation**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API)

## 🎯 **Success Metrics**

- [ ] All `.js` files converted to `.ts`/`.tsx`
- [ ] TypeScript compilation passes without errors
- [ ] All tests pass
- [ ] Build system works with TypeScript
- [ ] No Flow dependencies remain
- [ ] ESLint passes with TypeScript rules
- [ ] Application functionality preserved

---