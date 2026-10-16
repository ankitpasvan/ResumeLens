// Shared DB-side pagination helpers for list endpoints.
//
// getPagination(req.query) -> { page, limit, skip }:
//   - page defaults to 1 (minimum 1)
//   - limit defaults to 20, clamped to 1-100
//   - non-numeric input falls back to the defaults and never throws
//
// runPagedQuery(query, { skip, limit }) applies pagination to a Mongoose
// query. On a real database this chains .skip().limit() so pagination
// happens DB-side. The in-memory model fakes used by the smoke suites only
// implement .sort()/.select(), so when chaining is unavailable the helper
// falls back to slicing the returned rows (test-only path).
//
// countTotal(model, filter) returns the total matching document count,
// falling back to counting find() results for fakes without countDocuments.

function getPagination(query = {}) {
  const rawPage = Number.parseInt(query.page, 10);
  const rawLimit = Number.parseInt(query.limit, 10);

  const page =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1
      ? Math.min(Math.floor(rawLimit), 100)
      : 20;

  return { page, limit, skip: (page - 1) * limit };
}

async function runPagedQuery(query, { skip, limit }) {
  if (
    query &&
    typeof query.skip === "function" &&
    typeof query.limit === "function"
  ) {
    return query.skip(skip).limit(limit);
  }
  const rows = await query;
  return Array.isArray(rows) ? rows.slice(skip, skip + limit) : rows;
}

async function countTotal(model, filter) {
  if (model && typeof model.countDocuments === "function") {
    return model.countDocuments(filter);
  }
  const found = await model.find(filter);
  if (Array.isArray(found)) return found.length;
  if (found && typeof found.sort === "function") {
    const rows = await found.sort({ createdAt: -1 });
    return Array.isArray(rows) ? rows.length : 0;
  }
  return 0;
}

function totalPages(total, limit) {
  return Math.ceil(total / limit);
}

module.exports = { getPagination, runPagedQuery, countTotal, totalPages };
