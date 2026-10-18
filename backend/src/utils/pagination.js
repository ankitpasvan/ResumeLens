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
