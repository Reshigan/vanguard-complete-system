// Mock database for testing without actual database connection
const mockData = {
  users: [],
  tokens: [],
  reports: [],
  rewards: [],
  manufacturers: []
};

// Mock database function that returns query builder
const mockDb = (tableName) => {
  return {
    // Mock select method
    select: (columns = '*') => mockDb(tableName),
    
    // Mock insert method
    insert: (data) => ({
      returning: (columns) => Promise.resolve([{ id: Date.now(), ...data }])
    }),

    // Mock update method
    update: (data) => ({
      where: (conditions) => Promise.resolve(1)
    }),

    // Mock delete method
    del: () => ({
      where: (conditions) => Promise.resolve(1)
    }),

    // Mock where method
    where: (conditions) => ({
      first: () => Promise.resolve(null),
      limit: (count) => Promise.resolve([]),
      orderBy: (column, direction) => Promise.resolve([])
    }),

    // Mock first method
    first: () => Promise.resolve(null),

    // Mock limit method
    limit: (count) => Promise.resolve([]),

    // Mock orderBy method
    orderBy: (column, direction) => Promise.resolve([]),

    // Mock returning method
    returning: (columns) => Promise.resolve([{ id: Date.now() }])
  };
};

// Add static methods to the function
mockDb.select = (columns = '*') => ({
  from: (table) => mockDb(table)
});

mockDb.insert = (data) => ({
  into: (table) => ({
    returning: (columns) => Promise.resolve([{ id: Date.now(), ...data }])
  })
});

mockDb.table = (tableName) => mockDb(tableName);
mockDb.from = (tableName) => mockDb(tableName);

module.exports = mockDb;