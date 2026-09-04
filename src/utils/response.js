'use strict';

/** Standar response helper */
const ok   = (res, data = null, message = 'OK', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const fail = (res, message = 'Terjadi kesalahan', statusCode = 400, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

const paginate = (res, data, total, page, limit) =>
  res.json({
    success: true,
    data,
    pagination: {
      total,
      page:       parseInt(page, 10),
      limit:      parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    },
  });

module.exports = { ok, fail, paginate };
